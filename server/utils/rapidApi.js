// server/utils/rapidApi.js
const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

if (!RAPIDAPI_KEY) {
  console.warn('WARNING: RAPIDAPI_KEY is not set in environment variables.');
}

// Updated function to search using the new Bing Search API
const searchNews = async (topic, pageSize = 5) => {
  if (!RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY is not configured on the server.');
  }

  // Using the endpoint structure suggested by your test response
  // The exact endpoint name might vary, please verify on RapidAPI
  const options = {
    method: 'GET',
    // --- UPDATE THIS URL TO THE CORRECT ENDPOINT FROM RAPIDAPI DOCS ---
    // Based on your curl example and the response, it might be something like:
    url: 'https://bing-search-apis.p.rapidapi.com/api/rapid/web_search?keyword=how-to-use-excel-for-free&page=0&size=30', // <-- VERIFY THIS
    // Or if there's a specific news endpoint: 
    // url: 'https://bing-search-apis.p.rapidapi.com/api/rapid/news_search', // <-- VERIFY THIS TOO
    params: {
      keyword: topic, // Use 'keyword' as per your test response
      page: '0',      // Start from page 0
      size: pageSize.toString() // Number of results (API expects string?)
    },
    headers: {
      // Note the lowercase header names as per your curl example
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': 'bing-search-apis.p.rapidapi.com'
    }
  };

  try {
    console.log(`[Bing RapidAPI] Searching for topic: "${topic}" with options:`, {
      url: options.url,
      params: options.params,
      // Don't log the key!
    });
    
    const response = await axios.request(options);
    
    console.log(`[Bing RapidAPI] Success. Response data keys:`, Object.keys(response.data));
    // console.log(`[Bing RapidAPI] Full response `, JSON.stringify(response.data, null, 2)); // Uncomment for detailed logging

    // --- PARSE THE RESPONSE BASED ON THE TEST STRUCTURE ---
    let articles = [];
    
    // Check if response.data exists and has the expected structure
    if (response.data && response.data.data && Array.isArray(response.data.data.items)) {
        articles = response.data.data.items.slice(0, pageSize).map((item, index) => ({
            id: item.link || index.toString(), // Use link as ID if available
            title: item.title || 'No Title',
            description: item.description || 'No Description',
            url: item.link ? item.link.trim() : '', // Trim whitespace/newlines
            image: null, // The test response didn't include images, add if available later
            source: 'Bing Search Result', // Generic source
            publishedAt: null // The test response didn't include dates
        }));
        console.log(`[Bing RapidAPI] Parsed ${articles.length} articles.`);
    } else {
        console.warn(`[Bing RapidAPI] Unexpected response structure. Expected response.data.data.items. Keys found:`, 
            response.data ? (response.data.data ? Object.keys(response.data.data) : 'data missing') : 'response.data missing');
        // Handle unexpected structure or empty results
        articles = [];
    }

    return { articles, totalResults: articles.length }; 
  } catch (error) {
    console.error(`[Bing RapidAPI] Error fetching results for topic "${topic}":`, error.response?.data || error.message || error);
    
    // Provide a more user-friendly error structure
    let userMessage = `Failed to fetch results for "${topic}".`;
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        userMessage = 'Search service authentication failed. Please contact support.';
        console.error('[Bing RapidAPI] Authentication Error (401/403)');
      } else if (error.response.status === 429) {
        userMessage = 'Search service rate limit exceeded. Please try again later.';
        console.error('[Bing RapidAPI] Rate Limit Error (429)');
      } else if (error.response.status === 404) {
         // This might happen if the endpoint URL is wrong
         userMessage = 'Search service endpoint not found. Please check API configuration.';
         console.error('[Bing RapidAPI] Endpoint Not Found (404)');
      } else {
        userMessage = `Search service error (${error.response.status}). Please try again later.`;
        console.error(`[Bing RapidAPI] HTTP Error ${error.response.status}`);
      }
    } else if (error.request) {
      userMessage = 'Unable to reach search service. Please check your internet connection and try again.';
      console.error('[Bing RapidAPI] No response received');
    } else {
      userMessage = 'An unexpected error occurred while searching. Please try again.';
      console.error('[Bing RapidAPI] Request setup error');
    }
    
    throw new Error(userMessage);
  }
};

module.exports = { searchNews };