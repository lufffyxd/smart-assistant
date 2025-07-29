// server/utils/rapidApi.js
const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

if (!RAPIDAPI_KEY) {
  console.warn('WARNING: RAPIDAPI_KEY is not set in environment variables.');
}

const searchNews = async (topic) => {
  if (!RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY is not configured on the server.');
  }

  const options = {
    method: 'GET',
    url: 'https://contextualwebsearch-websearch-v1.p.rapidapi.com/api/Search/NewsSearchAPI',
    params: {
      q: topic,
      pageNumber: '1',
      pageSize: '10', // Adjust as needed
      autoCorrect: 'true',
      safeSearch: 'false', // Or 'true' based on your needs
      withThumbnails: 'true' // Get image thumbnails
    },
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'contextualwebsearch-websearch-v1.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    // Transform the response to match frontend expectations
    const articles = response.data.value.map(item => ({
      title: item.title,
      description: item.description,
      url: item.url,
      image: item.image?.thumbnail, // Use thumbnail if available
      source: item.provider?.name || 'Unknown Source',
      publishedAt: item.datePublished
    }));
    return { articles };
  } catch (error) {
    console.error('Error fetching news from RapidAPI:', error.response?.data || error.message);
    throw new Error('Failed to fetch news from external API');
  }
};

module.exports = { searchNews };