// netlify/functions/get-cash.js
const https = require('https');

exports.handler = async function(event, context) {
  // Using a new environment variable name to bypass potential caching issues.
  const API_KEY = process.env.T212_API_KEY;

  // Added a check to ensure the key is a string, which helps debug configuration issues.
  if (!API_KEY || typeof API_KEY !== 'string') {
    console.error(`CRITICAL: T212_API_KEY is not set or is not a string. Type: ${typeof API_KEY}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Trading 212 API key is not configured correctly.' }),
    };
  }

  const options = {
    hostname: 'live.trading212.com',
    path: '/api/v0/equity/account/cash',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'User-Agent': 'Productivity Dashboard/1.0' // Added a User-Agent header
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
          try {
            const parsedData = JSON.parse(data);
            resolve({
              statusCode: 200,
              body: JSON.stringify({ cash: parsedData.free }),
            });
          } catch (e) {
             console.error('Error parsing JSON from cash API:', e);
             resolve({
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to parse response from cash API.' }),
             });
          }
        } else {
          console.error(`Trading 212 Cash API Error: Status ${res.statusCode}`);
          console.error('Error Body from Cash API:', data);
          resolve({
            statusCode: res.statusCode,
            body: JSON.stringify({ error: 'Failed to fetch cash data from Trading 212.' }),
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('An error occurred in the get-cash function execution:', error);
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: `An internal function error occurred: ${error.message}` }),
      });
    });

    req.end();
  });
};
