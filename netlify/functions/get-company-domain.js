// netlify/functions/get-company-domain.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Get the ticker from the query string, e.g., ?ticker=AAPL
  const ticker = event.queryStringParameters.ticker;

  if (!ticker) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Ticker symbol is required.' }),
    };
  }

  // Using a free search API to find the company's website
  const searchUrl = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${ticker}`;

  try {
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch company data from Clearbit');
    }
    const data = await response.json();

    // Find the best match (often the first result)
    if (data && data.length > 0) {
      // Return the first domain found
      return {
        statusCode: 200,
        body: JSON.stringify({ domain: data[0].domain }),
      };
    } else {
      // If no domain is found, return null
      return {
        statusCode: 404,
        body: JSON.stringify({ domain: null }),
      };
    }
  } catch (error) {
    console.error('Error in get-company-domain function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
