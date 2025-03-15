import { OpenAI } from 'openai';
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { searchGoogleImages } from './googleImageSearch.js';

dotenv.config();

const app = express();
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Create or get the assistant
async function getOrCreateAssistant() {
  try {
    // Check if we have an existing assistant
    const assistants = await openai.beta.assistants.list();
    const existingAssistant = assistants.data.find(a => a.name === 'Google Image Search Assistant');
    
    if (existingAssistant) {
      console.log('Using existing assistant:', existingAssistant.id);
      return existingAssistant;
    }
    
    // Create a new assistant
    const assistant = await openai.beta.assistants.create({
      name: 'Google Image Search Assistant',
      instructions: 'You are an assistant that can search for images on the web using Google Custom Search. When a user asks for images, use the search_google_images function to find relevant images. Be helpful and provide context about the images you find.',
      model: 'gpt-4o',
      tools: [{
        type: 'function',
        function: {
          name: 'search_google_images',
          description: 'Search Google Images for the provided query',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query for finding images'
              },
              num: {
                type: 'integer',
                description: 'Number of images to return (max 10)',
                default: 5
              }
            },
            required: ['query']
          }
        }
      }]
    });
    
    console.log('Created new assistant:', assistant.id);
    return assistant;
  } catch (error) {
    console.error('Error creating/getting assistant:', error);
    throw error;
  }
}

// Handle function calls from the assistant
async function handleToolCalls(toolCalls) {
  const toolResults = [];
  
  for (const toolCall of toolCalls) {
    if (toolCall.function.name === 'search_google_images') {
      const args = JSON.parse(toolCall.function.arguments);
      try {
        const searchResults = await searchGoogleImages(args.query, args.num || 5);
        toolResults.push({
          tool_call_id: toolCall.id,
          output: JSON.stringify(searchResults)
        });
      } catch (error) {
        console.error('Error searching images:', error);
        toolResults.push({
          tool_call_id: toolCall.id,
          output: JSON.stringify({ error: 'Failed to search for images' })
        });
      }
    }
  }
  
  return toolResults;
}

// Routes
app.post('/chat', async (req, res) => {
  try {
    const { message, threadId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const assistant = await getOrCreateAssistant();
    
    // Create or retrieve thread
    let thread;
    if (threadId) {
      // Use existing thread
      thread = { id: threadId };
    } else {
      // Create a new thread
      thread = await openai.beta.threads.create();
    }
    
    // Add user message to thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: message
    });
    
    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id
    });
    
    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    while (runStatus.status !== 'completed' && 
           runStatus.status !== 'failed' && 
           runStatus.status !== 'cancelled') {
      
      // Handle tool calls if needed
      if (runStatus.status === 'requires_action') {
        const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs = await handleToolCalls(toolCalls);
        
        // Submit the outputs back to the assistant
        runStatus = await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, {
          tool_outputs: toolOutputs
        });
      } else {
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }
    }
    
    // Get the latest messages
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    // Return the assistant's response and thread ID for continuation
    return res.json({
      threadId: thread.id,
      messages: messages.data,
      response: messages.data[0].content
    });
    
  } catch (error) {
    console.error('Error processing chat:', error);
    res.status(500).json({ error: 'An error occurred processing your request' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});