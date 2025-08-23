// netlify/functions/get-cash.js

exports.handler = async function(event, context) {
  // This securely uses the environment variable you set in Netlify
  const API_KEY = process.env.TRADING212_API_KEY;
  const API_URL = 'https://live.trading212.com/api/v0/equity/account/cash';

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Trading 212 API key is not configured.' }),
    };
  }

  try {
    // Using node-fetch to make the API request
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(API_URL, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Failed to fetch cash data from Trading 212: ${response.statusText}` }),
      };
    }

    const data = await response.json();
    
    // The API response includes total, free, locked, etc. 'free' is the usable cash.
    return {
      statusCode: 200,
      body: JSON.stringify({ cash: data.free }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `An error occurred while fetching cash data: ${error.message}` }),
    };
  }
};
