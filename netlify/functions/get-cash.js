// netlify/functions/get-cash.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const API_KEY = process.env.TRADING212_API_KEY;
  // Using the DEMO (practice) URL for safer debugging.
  const API_URL = 'https://demo.trading212.com/api/v0/equity/account/cash';

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

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Trading 212 Cash API Error: Status ${response.status} ${response.statusText}`);
      console.error('Error Body from Cash API:', errorBody); // This is the crucial log
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
            error: `Failed to fetch cash data. Check function logs on Netlify for details.` 
        }),
      };
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ cash: data.free }),
    };
  } catch (error) {
    console.error('An error occurred in the get-cash function execution:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `An internal function error occurred: ${error.message}` }),
    };
  }
};
