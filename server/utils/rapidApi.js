// server/utils/rapidApi.js
const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

if (!RAPIDAPI_KEY) {
  console.warn('WARNING: RAPIDAPI_KEY is not set in environment variables.');
}

const searchNews = async (topic, pageSize = 5) => {
  if (!RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY is not configured on the server.');
  }

  const options = {
    method: 'GET',
    url: 'https://contextualwebsearch-websearch-v1.p.rapidapi.com/api/Search/NewsSearchAPI',
    params: {
      q: topic,
      pageNumber: '1',
      pageSize: pageSize.toString(),
      autoCorrect: 'true',
      safeSearch: 'false',
      withThumbnails: 'true'
    },
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'contextualwebsearch-websearch-v1.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    const articles = response.data.value.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      url: item.url,
      image: item.image?.thumbnail,
      source: item.provider?.name || 'Unknown Source',
      publishedAt: item.datePublished
    }));
    return { articles, totalResults: response.data.totalResults };
  } catch (error) {
    console.error(`Error fetching news for topic "${topic}":`, error.response?.data || error.message);
    // Return a more user-friendly error structure
    throw new Error(`Failed to fetch news for "${topic}". Please try again later.`);
  }
};

module.exports = { searchNews };