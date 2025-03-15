import fetch from 'node-fetch';
import readline from 'readline';

// Create interface for reading input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Initialize thread ID for conversation
let threadId = null;

/**
 * Send a message to the assistant and get a response
 * @param {string} message - User message
 * @returns {Promise<object>} - Server response
 */
async function chatWithAssistant(message) {
  try {
    const response = await fetch('http://localhost:3000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, threadId })
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Save thread ID for continuation
    threadId = result.threadId;
    
    return result;
  } catch (error) {
    console.error('Error chatting with assistant:', error);
    return { error: error.message };
  }
}

/**
 * Format and display the assistant's response
 * @param {object} response - Response from the server
 */
function displayResponse(response) {
  if (response.error) {
    console.error('Error:', response.error);
    return;
  }
  
  // Get the assistant's response (first message is the most recent)
  const assistantMessage = response.messages[0];
  
  if (assistantMessage && assistantMessage.role === 'assistant') {
    console.log('\nAssistant:');
    
    // Process content parts
    assistantMessage.content.forEach(content => {
      if (content.type === 'text') {
        console.log(content.text.value);
      }
    });
  } else {
    console.log('\nNo response from assistant');
  }
  
  console.log('\n' + '-'.repeat(50) + '\n');
}

/**
 * Start an interactive chat session
 */
function startChat() {
  console.log('Google Image Search Assistant Chat');
  console.log('Type your messages below. Type "exit" to quit.\n');
  
  askQuestion();
}

/**
 * Ask for user input and process it
 */
function askQuestion() {
  rl.question('You: ', async (input) => {
    if (input.toLowerCase() === 'exit') {
      rl.close();
      return;
    }
    
    const response = await chatWithAssistant(input);
    displayResponse(response);
    
    // Continue the conversation
    askQuestion();
  });
}

// Start the chat
startChat();