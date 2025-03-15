# Google Image Search Assistant

This project implements an AI assistant that can search for images on the web using Google's Custom Search API. The assistant is built using the OpenAI Assistants API and can respond to user queries by searching for relevant images.

## Features

- Search Google Images using natural language queries
- Integrate with OpenAI's Assistants API for conversational interactions
- Maintain conversation context across multiple interactions
- Return image search results with titles, thumbnails, and source information

## Setup

### Prerequisites

- Node.js (v14 or higher)
- OpenAI API key
- Google Custom Search API key (already provided)
- Google Custom Search Engine ID (already provided)

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/google-image-search-assistant.git
   cd google-image-search-assistant
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example` template:
   ```
   cp .env.example .env
   ```

4. Add your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Running the Server

```
npm start
```

For development with auto-restart:
```
npm run dev
```

## API Usage

The server exposes an endpoint for interacting with the assistant:

### POST /chat

Send a message to the assistant and get a response.

**Request Body:**
```json
{
  "message": "Show me pictures of golden retrievers",
  "threadId": "optional_thread_id_for_continuing_conversation"
}
```

**Response:**
```json
{
  "threadId": "thread_abc123",
  "messages": [...],
  "response": [...]
}
```

## Example Client

You can create a simple client to interact with this server using JavaScript and fetch. Here's a basic example:

```javascript
async function chatWithAssistant(message, threadId = null) {
  const response = await fetch('http://localhost:3000/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message, threadId })
  });
  
  return await response.json();
}

// Example usage
let threadId;
async function example() {
  const result = await chatWithAssistant('Show me pictures of golden retrievers');
  threadId = result.threadId;
  console.log(result.response);
  
  // Continue the conversation
  const followUp = await chatWithAssistant('Now show me some puppies', threadId);
  console.log(followUp.response);
}

example();
```

## License

MIT