// netlify/functions/get-company-details.js

// Using 'node-fetch' for making HTTP requests in this Node.js environment.
// Make sure 'node-fetch' is included in your package.json dependencies.
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Retrieve the Twelve Data API key from secure environment variables.
  const API_KEY = process.env.TWELVE_DATA_API_KEY;
  // Get the stock ticker from the query string parameter (e.g., ?ticker=AMD).
  const rawTicker = event.queryStringParameters.ticker;

  // --- Input Validation ---
  if (!API_KEY) {
    console.error('CRITICAL: TWELVE_DATA_API_KEY is not set in Netlify environment variables.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Financial data API key is not configured.' }),
    };
  }
  if (!rawTicker) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Ticker symbol is required.' }),
    };
  }

  // --- Ticker Normalization ---
  // Clean the ticker from Trading 212 format (e.g., 'AMD_US_EQ') to a standard format ('AMD').
  const ticker = rawTicker.split('_')[0];

  try {
    // --- Parallel API Calls ---
    // Fetch both profile and logo data simultaneously for better performance.
    const [profileResponse, logoResponse] = await Promise.all([
      fetch(`https://api.twelvedata.com/profile?symbol=${ticker}&apikey=${API_KEY}`),
      fetch(`https://api.twelvedata.com/logo?symbol=${ticker}&apikey=${API_KEY}`)
    ]);

    // --- Error Handling for API Responses ---
    if (!profileResponse.ok) {
      console.error(`Twelve Data Profile API Error for ${ticker}: Status ${profileResponse.status}`);
      // Even if one fails, we can try to proceed with what we have.
    }
    if (!logoResponse.ok) {
      console.error(`Twelve Data Logo API Error for ${ticker}: Status ${logoResponse.status}`);
    }
    
    // --- Data Parsing ---
    // We use a fallback of an empty object to prevent errors if a fetch fails.
    const profileData = profileResponse.ok ? await profileResponse.json() : {};
    const logoData = logoResponse.ok ? await logoResponse.json() : {};

    // --- Data Consolidation ---
    // Combine the results, providing sensible fallbacks.
    const companyDetails = {
      // Prioritize the fetched name, but fall back to the original ticker if unavailable.
      name: profileData.name || rawTicker, 
      // Use the fetched logo URL, or an empty string if it's not found.
      logoUrl: logoData.url || '', 
    };

    // --- Successful Response ---
    return {
      statusCode: 200,
      body: JSON.stringify(companyDetails),
    };

  } catch (error) {
    // --- General Error Handling ---
    console.error(`An error occurred in get-company-details for ticker ${rawTicker}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `An internal function error occurred: ${error.message}` }),
    };
  }
};
