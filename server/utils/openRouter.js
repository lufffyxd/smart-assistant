// server/utils/openRouter.js
const axios = require('axios');

// Use the environment variable for the API key
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.warn('WARNING: OPENROUTER_API_KEY is not set in environment variables.');
}

/**
 * Calls the OpenRouter API to generate a response.
 * @param {Array} messages - The conversation history [{role: 'user/assistant', content: '...'}].
 * @param {Array} searchResults - Optional array of search results to include in context.
 * @returns {Promise<string>} - The AI's response text.
 */
const callOpenRouter = async (messages, searchResults = []) => {
  if (!OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY is not set');
    // Return a clear message to the user
    throw new Error('AI service is currently unavailable (API key missing). Please contact support.');
  }

  try {
    // Add search results to context if available and not empty
    let context = [...messages];
    if (searchResults.length > 0) {
      // Format search results into a single string for the system prompt
      const searchContextString = `Here are some recent search results that might be relevant to the user's query:\n\n` +
        searchResults.map((result, index) =>
          `Result ${index + 1}:\nTitle: ${result.title}\nDescription: ${result.description}\nURL: ${result.url}\n`
        ).join('\n---\n') +
        `\n\nPlease use these results to inform your answer if they are relevant.`;

      // Prepend the search context as a system message
      context = [
        { role: 'system', content: searchContextString },
        ...context
      ];
    }

    console.log(`[OpenRouter] Calling API with ${context.length} messages in context.`);
    // Log the last user message for debugging (avoid logging full context if sensitive)
    if (context.length > 0) {
        const lastUserMsg = context.filter(m => m.role === 'user').pop();
        if (lastUserMsg) {
            console.log(`[OpenRouter] Last user message: "${lastUserMsg.content.substring(0, 50)}..."`);
        }
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        // Use your preferred model
        model: 'deepseek/deepseek-r1-0528-qwen3-8b:free', // Or your chosen model
        messages: context,
        temperature: 0.7 // Adjust as needed
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000', // Your site URL
          'X-Title': 'Smart Assistant'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    console.log(`[OpenRouter] Received response (${aiResponse.length} chars).`);
    return aiResponse;

  } catch (error) {
    console.error('[OpenRouter] API error:', error.response?.data || error.message);

    // Provide a more user-friendly error message based on the type of error
    if (error.response) {
      // The request was made and the server responded with a status code
      if (error.response.status === 401) {
        throw new Error('AI service authentication failed. Please contact support.');
      } else if (error.response.status === 402) {
         // As you experienced before
         throw new Error('AI service payment required. Please contact support or check account.');
      } else if (error.response.status === 429) {
        throw new Error('AI service is currently busy (rate limit). Please wait a moment and try again.');
      } else if (error.response.status >= 500) {
        throw new Error(`AI service is temporarily unavailable (${error.response.status}). Please try again later.`);
      } else {
        // Other 4xx errors
        throw new Error(`AI service error (${error.response.status}). Please try again.`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[OpenRouter] No response received (network issue?)');
      throw new Error('Unable to reach AI service. Please check your internet connection and try again.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('[OpenRouter] Request setup error:', error.message);
      throw new Error('An unexpected error occurred while contacting the AI service. Please try again.');
    }
  }
};

module.exports = { callOpenRouter };
