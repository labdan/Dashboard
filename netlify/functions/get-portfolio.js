// netlify/functions/get-portfolio.js
// Using dynamic import for node-fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async function(event, context) {
  const API_KEY = process.env.TRADING212_API_KEY;
  const API_URL = 'https://live.trading212.com/api/v0/equity/portfolio';

  if (!API_KEY) {
    console.error('CRITICAL: TRADING212_API_KEY environment variable is not set in Netlify.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Trading 212 API key is not configured.' }),
    };
  }

  // SECURE DEBUGGING LOG: Let's see what the function is actually getting.
  const apiKeyPreview = `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}`;
  console.log(`Attempting to use API Key ending in: ${apiKeyPreview}`);

  try {
    const response = await fetch(API_URL, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Trading 212 API Error: Status ${response.status} ${response.statusText}`);
      console.error('Error Body from API:', errorBody);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: `Failed to fetch data from Trading 212. Check function logs on Netlify for details.` 
        }),
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('An error occurred in the get-portfolio function execution:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `An internal function error occurred: ${error.message}` }),
    };
  }
};
