// netlify/functions/get-portfolio.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const API_KEY = process.env.TRADING212_API_KEY;
  // Using the DEMO (practice) URL for safer debugging. 
  // Change to 'live' when you are sure the key is correct.
  const API_URL = 'https://demo.trading212.com/api/v0/equity/portfolio';

  if (!API_KEY) {
    console.error('CRITICAL: TRADING212_API_KEY environment variable is not set in Netlify.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Trading 212 API key is not configured.' }),
    };
  }

  try {
    const response = await fetch(API_URL, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    // If the response is NOT okay, log the detailed error from the API
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Trading 212 API Error: Status ${response.status} ${response.statusText}`);
      console.error('Error Body from API:', errorBody); // This is the crucial log
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
