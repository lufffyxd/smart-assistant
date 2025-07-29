// server/utils/openRouter.js
const axios = require('axios');

const callOpenRouter = async (messages, searchResults = []) => {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  
  if (!OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY is not set');
    return 'AI service is currently unavailable. Please contact support.';
  }

  try {
    // Add search results to context if available
    let context = [...messages];
    if (searchResults.length > 0) {
      const searchContext = {
        role: 'system',
        content: `Here are some recent search results that might be relevant:\n\n${searchResults.map((result, index) => 
          `${index + 1}. ${result.title}\n${result.description}\nSource: ${result.url}`
        ).join('\n\n')}`
      };
      context = [searchContext, ...context];
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
        messages: context,
        temperature: 0.7
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

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    
    // Provide a more user-friendly error message
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 401) {
        return 'AI service authentication failed. Please contact support.';
      } else if (error.response.status === 429) {
        return 'AI service is currently busy. Please wait a moment and try again.';
      } else {
        return `AI service encountered an error (${error.response.status}). Please try again later.`;
      }
    } else if (error.request) {
      // The request was made but no response was received
      return 'Unable to reach AI service. Please check your internet connection and try again.';
    } else {
      // Something happened in setting up the request that triggered an Error
      return 'An unexpected error occurred while processing your request. Please try again.';
    }
  }
};

module.exports = { callOpenRouter };