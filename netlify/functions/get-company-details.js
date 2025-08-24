// netlify/functions/get-company-details.js

const https = require('https');

/**
 * Checks if a URL points to an existing resource without downloading the whole file.
 * @param {string} url - The URL to check.
 * @returns {Promise<boolean>} A promise that resolves to true if the URL is valid (status 200), false otherwise.
 */
const urlExists = (url) => {
  return new Promise((resolve) => {
    const options = { method: 'HEAD' }; // Use HEAD request to only get headers
    const req = https.request(url, options, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
};

/**
 * Fetches data from a given URL and returns it as a JSON object.
 * @param {string} url - The URL to fetch from.
 * @returns {Promise<object>} A promise that resolves to the parsed JSON data.
 */
const fetchJson = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`API request failed with status ${res.statusCode}`));
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          // Handle cases where the response might be empty but successful
          resolve(data ? JSON.parse(data) : {});
        } catch (e) {
          reject(new Error('Failed to parse JSON response.'));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};


exports.handler = async function(event, context) {
  const API_KEY = process.env.TWELVE_DATA_API_KEY;
  const { ticker, instrumentName } = event.queryStringParameters;

  if (!ticker || !instrumentName) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ticker and instrumentName are required.' }) };
  }
  if (!API_KEY) {
    console.error('CRITICAL: TWELVE_DATA_API_KEY is not set.');
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured.' }) };
  }

  // --- Tier 1: Attempt to find logo on TradingView CDN ---
  const slug = instrumentName
    .toLowerCase()
    .replace(/\s*\(.*\)\s*/g, '') // Remove content in parentheses e.g. (Acc)
    .replace(/(\s+inc|\s+ltd|\s+group|\s+nv|\s+plc|\s+co|\s+technologies|\s+corp|\s+corporation)$/i, '') // Remove common suffixes
    .replace(/\s*&\s*/g, ' ') // Replace & with space
    .replace(/[.,]/g, '') // Remove periods and commas
    .replace(/[^a-z0-9\s-]+/g, '') // Remove remaining special characters
    .trim()
    .replace(/\s+/g, '-'); // Replace spaces with hyphens
  
  const tradingViewUrl = `https://s3-symbol-logo.tradingview.com/${slug}--big.svg`;

  if (await urlExists(tradingViewUrl)) {
    // If TradingView logo exists, we've succeeded. Return it and don't use the paid API.
    return {
      statusCode: 200,
      body: JSON.stringify({ name: instrumentName, logoUrl: tradingViewUrl }),
    };
  }

  // --- Tier 2: Fallback to Twelve Data API if TradingView fails ---
  try {
    const baseTicker = ticker.split('_')[0];
    const [profileData, logoData] = await Promise.all([
      fetchJson(`https://api.twelvedata.com/profile?symbol=${baseTicker}&apikey=${API_KEY}`),
      fetchJson(`https://api.twelvedata.com/logo?symbol=${baseTicker}&apikey=${API_KEY}`)
    ]);

    const companyDetails = {
      name: profileData.name || instrumentName, // Prefer official name, fallback to instrumentName
      logoUrl: logoData.url || '', // Use the logo from the API
    };

    return {
      statusCode: 200,
      body: JSON.stringify(companyDetails),
    };

  } catch (error) {
    console.error(`Error with Twelve Data for ${ticker}:`, error);
    // If all else fails, return the basic info without a logo.
    return {
      statusCode: 200, // Still a success from the function's perspective
      body: JSON.stringify({ name: instrumentName, logoUrl: '' }),
    };
  }
};
