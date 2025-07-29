// server/utils/webSearch.js
const axios = require('axios');

// Use the new environment variable for LangSearch
const LANGSEARCH_API_KEY = process.env.LANGSEARCH_API_KEY;

if (!LANGSEARCH_API_KEY) {
  console.warn('WARNING: LANGSEARCH_API_KEY is not set in environment variables.');
}

/**
 * Searches the web using the LangSearch API.
 * @param {string} topic - The search query.
 * @param {number} [pageSize=5] - The number of results to return.
 * @returns {Promise<{articles: Array, totalResults: number}>} - A promise resolving to search results.
 */
const searchWeb = async (topic, pageSize = 5) => {
  if (!LANGSEARCH_API_KEY) {
    throw new Error('LANGSEARCH_API_KEY is not configured on the server.');
  }

  // Define the request options for LangSearch
  const options = {
    method: 'POST',
    url: 'https://api.langsearch.com/v1/web-search', // Ensure correct URL
    headers: {
      'Authorization': `Bearer ${LANGSEARCH_API_KEY}`,
      'Content-Type': 'application/json'
    },
    data: {
      query: topic,
      freshness: 'week', // Options: 'day', 'week', 'month', 'year', 'all'
      summary: true, // Request summaries
      count: pageSize
    }
  };

  try {
    console.log(`[LangSearch] Searching for topic: "${topic}" with options:`, {
      url: options.url,
      data: { ...options.data, query: '<query>' } // Log structure without the actual query
    });

    const response = await axios.request(options);

    console.log(`[LangSearch] Success. Response status: ${response.status}`);
    // console.log(`[LangSearch] Full response data keys:`, Object.keys(response.data)); // Uncomment for debugging structure

    let articles = [];

    // --- Crucially, parse the LangSearch Response ---
    // You MUST inspect the actual response structure from LangSearch and adjust this.
    // The example curl response was not provided, so this is a common pattern guess.
    // You need to replace `item.title`, `item.url`, etc. with the actual field names.

    // Common structure assumption: { results: [ { ... }, ... ] }
    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      articles = response.data.results.slice(0, pageSize).map((item, index) => {
        // --- ADJUST THESE FIELD NAMES BASED ON LANGSEARCH'S ACTUAL RESPONSE ---
        return {
          id: item.id || item.url || `langsearch-result-${index}`, // Prefer an ID if available
          title: item.title || 'No Title',
          description: item.snippet || item.summary || item.description || 'No Description',
          url: item.url || item.link || '',
          image: item.image || item.thumbnail || null, // Adjust if provided
          source: item.source || 'LangSearch Result',
          publishedAt: item.published_date || item.date || item.timestamp || null // Adjust date field
        };
      });
      console.log(`[LangSearch] Parsed ${articles.length} articles from response.results.`);
    }
    // Alternative structure assumption: response.data is the array directly
    else if (response.data && Array.isArray(response.data)) {
       articles = response.data.slice(0, pageSize).map((item, index) => {
         // --- ADJUST THESE FIELD NAMES ---
         return {
           id: item.id || item.url || `langsearch-result-${index}`,
           title: item.title || 'No Title',
           description: item.snippet || item.summary || item.description || 'No Description',
           url: item.url || item.link || '',
           image: item.image || item.thumbnail || null,
           source: item.source || 'LangSearch Result',
           publishedAt: item.published_date || item.date || item.timestamp || null
         };
       });
       console.log(`[LangSearch] Parsed ${articles.length} articles from response array.`);
    }
    else {
      // Handle unexpected structure or empty results gracefully
      console.warn(`[LangSearch] Unexpected response structure. Expected 'results' array. Keys found:`,
          response.data ? Object.keys(response.data) : 'response.data missing');
      // Optionally log a small part of the response for debugging
      // console.warn(`[LangSearch] Response snippet:`, JSON.stringify(response.data, null, 2).substring(0, 500));
      articles = [];
    }

    return { articles, totalResults: articles.length };
  } catch (error) {
    console.error(`[LangSearch] Error fetching results for topic "${topic}":`, error.response?.data || error.message || error);

    let userMessage = `Failed to fetch results for "${topic}".`;
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        userMessage = 'Search service authentication failed. Please check the API key.';
        console.error('[LangSearch] Authentication Error (401/403)');
      } else if (error.response.status === 429) {
        userMessage = 'Search service rate limit exceeded. Please try again later.';
        console.error('[LangSearch] Rate Limit Error (429)');
      } else if (error.response.status === 400) {
         userMessage = 'Search query was invalid.';
         console.error('[LangSearch] Bad Request (400)');
      } else if (error.response.status === 404) {
         userMessage = 'Search service endpoint not found.';
         console.error('[LangSearch] Endpoint Not Found (404)');
      } else if (error.response.status >= 500) {
         userMessage = 'Search service is temporarily unavailable. Please try again later.';
         console.error(`[LangSearch] Server Error (${error.response.status})`);
      } else {
        userMessage = `Search service error (${error.response.status}). Please try again later.`;
        console.error(`[LangSearch] HTTP Error ${error.response.status}`);
      }
      // Log the specific error response body if available for debugging
      if (error.response.data) {
          console.error(`[LangSearch] Error response body:`, JSON.stringify(error.response.data, null, 2));
      }
    } else if (error.request) {
      userMessage = 'Unable to reach search service. Please check your internet connection and try again.';
      console.error('[LangSearch] No response received (network issue?)');
    } else {
      userMessage = 'An unexpected error occurred while searching. Please try again.';
      console.error('[LangSearch] Request setup error:', error.message);
    }

    // Throw the user-friendly error message
    throw new Error(userMessage);
  }
};

module.exports = { searchWeb };
