// netlify/functions/get-company-details.js

// This function fetches company profile information (like the full name) and a logo
// from the Twelve Data API. Using a dedicated financial data API is more reliable
// than trying to guess company names or logo URLs.

// We are using 'node-fetch' for making HTTP requests in this Node.js environment.
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Retrieve the Twelve Data API key from secure environment variables.
  const API_KEY = process.env.TWELVE_DATA_API_KEY;
  // Get the stock ticker from the query string parameter (e.g., ?ticker=AAPL).
  const ticker = event.queryStringParameters.ticker;

  // If the API key is not set in Netlify, return a critical error.
  if (!API_KEY) {
    console.error('CRITICAL: TWELVE_DATA_API_KEY is not set in Netlify environment variables.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Financial data API key is not configured.' }),
    };
  }

  // If the ticker symbol is missing from the request, return a client error.
  if (!ticker) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Ticker symbol is required.' }),
    };
  }

  try {
    // Construct the API URL for the '/profile' endpoint.
    const profileApiUrl = `https://api.twelvedata.com/profile?symbol=${ticker}&apikey=${API_KEY}`;
    
    // Fetch the profile data.
    const profileResponse = await fetch(profileApiUrl);
    if (!profileResponse.ok) {
        // If the API returns an error, log it and throw to be caught below.
        console.error(`Twelve Data Profile API Error: Status ${profileResponse.status}`);
        throw new Error(`Failed to fetch profile for ${ticker}.`);
    }
    const profileData = await profileResponse.json();

    // Construct the API URL for the '/logo' endpoint.
    const logoApiUrl = `https://api.twelvedata.com/logo?symbol=${ticker}&apikey=${API_KEY}`;
    
    // Fetch the logo data.
    const logoResponse = await fetch(logoApiUrl);
     if (!logoResponse.ok) {
        // If the API returns an error, log it and throw to be caught below.
        console.error(`Twelve Data Logo API Error: Status ${logoResponse.status}`);
        throw new Error(`Failed to fetch logo for ${ticker}.`);
    }
    const logoData = await logoResponse.json();

    // Combine the relevant data into a single object.
    // We prioritize the name from the profile data. The logo URL comes from the logo endpoint.
    const companyDetails = {
      name: profileData.name || ticker, // Fallback to ticker if name is not available
      logoUrl: logoData.url || '', // Fallback to an empty string if no logo
    };

    // Return the combined data successfully.
    return {
      statusCode: 200,
      body: JSON.stringify(companyDetails),
    };

  } catch (error) {
    // Catch any errors from the fetch process or API failures.
    console.error('An error occurred in the get-company-details function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `An internal function error occurred: ${error.message}` }),
    };
  }
};
