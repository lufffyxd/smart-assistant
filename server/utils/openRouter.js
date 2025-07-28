const axios = require('axios');

const callOpenRouter = async (messages, searchResults = []) => {
  try {
    // Add search results to context if available
    let context = [...messages];
    if (searchResults.length > 0) {
      const searchContext = {
        role: 'system',
        content: `Here are some recent search results that might be relevant:\n\n${searchResults.map((result, index) => 
          `${index + 1}. ${result.title}\n${result.snippet}\nSource: ${result.url}`
        ).join('\n\n')}`
      };
      context = [searchContext, ...context];
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mistral-7b-instruct',
        messages: context,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3000', // Your site URL
          'X-Title': 'Smart Assistant'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    return 'Sorry, I encountered an error processing your request.';
  }
};

module.exports = { callOpenRouter };