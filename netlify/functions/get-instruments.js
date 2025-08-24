// netlify/functions/get-instruments.js

const https = require('https');

// This function fetches the entire list of tradable instruments from the Trading 212 API.
// This list acts as a master "dictionary" so the dashboard can look up full company names.
exports.handler = async function(event, context) {
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
    path: '/api/v0/equity/metadata/instruments',
    method: 'GET',
    headers: {
      'Authorization': API_KEY,
      'User-Agent': 'Productivity-Dashboard/1.0'
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
            body: data, // Return the raw JSON string
          });
        } else {
          console.error(`Trading 212 Instruments API Error: Status ${res.statusCode}`);
          resolve({
            statusCode: res.statusCode,
            body: JSON.stringify({ error: 'Failed to fetch instruments metadata.' }),
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('An error occurred in the get-instruments function:', error);
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: `An internal function error occurred: ${error.message}` }),
      });
    });

    req.end();
  });
};
