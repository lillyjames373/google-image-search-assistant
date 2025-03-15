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