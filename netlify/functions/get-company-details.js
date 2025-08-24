// netlify/functions/get-company-details.js

// This function uses the native Node.js 'https' module for making API requests.
// This is a more stable approach that avoids potential bundling issues with external libraries
// and is consistent with your other working Netlify functions.
const https = require('https');

/**
 * A helper function to perform an HTTPS GET request and return the JSON response.
 * This is wrapped in a Promise to work with async/await.
 * @param {string} url - The URL to fetch data from.
 * @returns {Promise<object>} A promise that resolves to the parsed JSON data.
 */
const fetchJson = (url) => {
  // Set request options, including a User-Agent which is good practice.
  const options = {
    method: 'GET',
    headers: {
      'User-Agent': 'Productivity-Dashboard/1.0'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        // Check for successful status codes
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            // If the response is empty, resolve with an empty object.
            resolve(data ? JSON.parse(data) : {});
          } catch (e) {
            reject(new Error('Failed to parse JSON response.'));
          }
        } else {
          // If the status code is an error, reject the promise.
          reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    // Handle network errors
    req.on('error', (err) => {
      reject(err);
    });

    // Finalize the request
    req.end();
  });
};

exports.handler = async function(event, context) {
  const API_KEY = process.env.TWELVE_DATA_API_KEY;
  const rawTicker = event.queryStringParameters.ticker;

  // --- Input Validation ---
  if (!API_KEY) {
    console.error('CRITICAL: TWELVE_DATA_API_KEY is not set.');
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured.' }) };
  }
  if (!rawTicker) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ticker symbol is required.' }) };
  }

  // Clean the ticker from Trading 212 format (e.g., 'AMD_US_EQ') to a standard format ('AMD').
  const ticker = rawTicker.split('_')[0];

  try {
    // --- Parallel API Calls ---
    const [profileData, logoData] = await Promise.all([
      fetchJson(`https://api.twelvedata.com/profile?symbol=${ticker}&apikey=${API_KEY}`),
      fetchJson(`https://api.twelvedata.com/logo?symbol=${ticker}&apikey=${API_KEY}`)
    ]);

    // --- Data Consolidation ---
    const companyDetails = {
      name: profileData.name || rawTicker, // Fallback to the original ticker
      logoUrl: logoData.url || '', // Fallback to an empty string
    };

    // --- Successful Response ---
    return {
      statusCode: 200,
      body: JSON.stringify(companyDetails),
    };

  } catch (error) {
    console.error(`An error in get-company-details for ${rawTicker}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
