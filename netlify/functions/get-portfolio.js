// netlify/functions/get-portfolio.js
const https = require('https');

exports.handler = async function(event, context) {
  // CORRECTED: Using the new environment variable name to match get-cash.js
  const API_KEY = process.env.T212_API_KEY;

  if (!API_KEY) {
    console.error('CRITICAL: T212_API_KEY environment variable is not set in Netlify.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Trading 212 API key is not configured.' }),
    };
  }

  const options = {
    hostname: 'live.trading212.com',
    path: '/api/v0/equity/portfolio',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'User-Agent': 'Productivity Dashboard/1.0'
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            statusCode: 200,
            body: data,
          });
        } else {
          console.error(`Trading 212 Portfolio API Error: Status ${res.statusCode}`);
          console.error('Error Body from Portfolio API:', data);
          resolve({
            statusCode: res.statusCode,
            body: JSON.stringify({ error: 'Failed to fetch portfolio data from Trading 212.' }),
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('An error occurred in the get-portfolio function execution:', error);
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: `An internal function error occurred: ${error.message}` }),
      });
    });

    req.end();
  });
};
