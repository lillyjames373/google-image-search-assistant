import fetch from 'node-fetch';

// Google Custom Search API credentials
const API_KEY = 'AIzaSyBDMXNniaGtiDQyXMpoEZ6L_c3VfUnq7TE'; // Use from environment in production
const SEARCH_ENGINE_ID = '446354042ed5b4f0b'; // Use from environment in production

/**
 * Search Google Images using the Custom Search API
 * @param {string} query - The search query
 * @param {number} num - Number of results to return (max 10)
 * @returns {Promise<Array>} - Array of image results
 */
export async function searchGoogleImages(query, num = 5) {
  try {
    // Validate and limit number of results
    const count = Math.min(Math.max(1, num), 10);
    
    // Build the API URL
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.append('key', API_KEY);
    url.searchParams.append('cx', SEARCH_ENGINE_ID);
    url.searchParams.append('q', query);
    url.searchParams.append('searchType', 'image');
    url.searchParams.append('num', count);
    
    // Make the request to Google API
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API error:', errorText);
      throw new Error(`Google API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process and return the results
    if (data.items && data.items.length > 0) {
      return data.items.map(item => ({
        title: item.title,
        link: item.link,
        thumbnail: item.image.thumbnailLink,
        context: item.image.contextLink,
        size: `${item.image.width} x ${item.image.height}`,
        source: item.displayLink
      }));
    } else {
      return [];
    }
    
  } catch (error) {
    console.error('Error searching Google Images:', error);
    throw error;
  }
}