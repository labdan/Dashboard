// netlify/functions/get-tv-symbol.js

const https = require('https');

// Helper to fetch and parse JSON data
const fetchJson = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Productivity-Dashboard/1.0' } }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`API request failed with status ${res.statusCode}`));
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
            resolve(data ? JSON.parse(data) : {});
        } catch(e) {
            reject(new Error('Failed to parse JSON response.'));
        }
      });
    }).on('error', (err) => reject(err));
  });
};

exports.handler = async function(event, context) {
  const { TWELVE_DATA_API_KEY } = process.env;
  const { ticker } = event.queryStringParameters;

  if (!TWELVE_DATA_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key is not configured.' }) };
  }
  if (!ticker) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ticker is required.' }) };
  }
  
  const url = `https://api.twelvedata.com/symbol_search?symbol=${ticker}`;

  try {
    const searchResult = await fetchJson(url);
    if (searchResult.data && searchResult.data.length > 0) {
      // Find the best match (often the first result is good, prioritizing major exchanges if possible)
      const result = searchResult.data[0];
      const tvSymbol = `${result.exchange}:${result.symbol}`;
      return { statusCode: 200, body: JSON.stringify({ tvSymbol: tvSymbol }) };
    } else {
      // If no result, just return the ticker itself. TradingView might resolve it.
      return { statusCode: 200, body: JSON.stringify({ tvSymbol: ticker }) };
    }
  } catch (error) {
    console.error(`Symbol search failed for ${ticker}:`, error);
    // Fallback if the API call fails
    return { statusCode: 200, body: JSON.stringify({ tvSymbol: ticker }) };
  }
};