// netlify/functions/get-portfolio.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const API_KEY = process.env.T212_API_KEY;

  if (!API_KEY) {
    console.error('CRITICAL: T212_API_KEY environment variable is not set in Netlify.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Trading 212 API key is not configured.' }),
    };
  }

  try {
    const response = await fetch('https://live.trading212.com/api/v0/equity/portfolio', {
      method: 'GET',
      headers: {
        // CORRECTED: Sending only the key, without the "Bearer " prefix.
        'Authorization': API_KEY
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Trading 212 Portfolio API Error: Status ${response.status}`);
      console.error('Error Body from Portfolio API:', errorBody);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Failed to fetch portfolio data from Trading 212.' }),
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
