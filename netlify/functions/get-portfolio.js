// netlify/functions/get-portfolio.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const API_KEY = process.env.TRADING212_API_KEY;
  const API_URL = 'https://live.trading212.com/api/v0/equity/portfolio';

  if (!API_KEY) {
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
      console.error(`Trading 212 API Error: ${response.status} ${response.statusText}`, errorBody);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Failed to fetch data from Trading 212: ${response.statusText}` }),
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('An error occurred in get-portfolio function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `An error occurred: ${error.message}` }),
    };
  }
};
