// netlify/functions/get-company-details.js

const https = require('https');
// You need to add '@supabase/supabase-js' to your package.json dependencies
// Run: npm install @supabase/supabase-js
const { createClient } = require('@supabase/supabase-js');

// Helper to fetch JSON data using Node's native https module
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
  // --- Get Environment Variables ---
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;
  const { ticker } = event.queryStringParameters;
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !TWELVE_DATA_API_KEY) {
    console.error('API credentials are not configured in Netlify environment variables.');
    return { statusCode: 500, body: JSON.stringify({ error: 'API credentials are not configured.' }) };
  }
  if (!ticker) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ticker is required.' }) };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const baseTicker = ticker.split('_')[0];

  // --- Tier 1: Check Supabase cache first ---
  try {
    const { data: cachedData } = await supabase
      .from('company_details')
      .select('name, logo_url')
      .eq('ticker', ticker)
      .single();
    
    if (cachedData) {
      // If we found it in the cache, return it immediately.
      return { statusCode: 200, body: JSON.stringify(cachedData) };
    }
  } catch (error) {
      // An error here (like 'PGRST116' for no rows) is expected if the item isn't in the cache.
      // We can safely ignore it and proceed to fetch from the API.
  }

  // --- Tier 2: If not in cache, fetch from Twelve Data ---
  try {
    const [profileData, logoData] = await Promise.all([
      fetchJson(`https://api.twelvedata.com/profile?symbol=${baseTicker}&apikey=${TWELVE_DATA_API_KEY}`),
      fetchJson(`https://api.twelvedata.com/logo?symbol=${baseTicker}&apikey=${TWELVE_DATA_API_KEY}`)
    ]);

    const companyDetails = {
      ticker: ticker, // The full, original ticker is our primary key
      name: profileData.name || baseTicker,
      logo_url: logoData.url || '',
    };
    
    // --- Tier 3: Save the new data back to Supabase for next time ---
    await supabase.from('company_details').upsert(companyDetails);

    // Return the newly fetched details
    return { statusCode: 200, body: JSON.stringify({ name: companyDetails.name, logo_url: companyDetails.logo_url }) };

  } catch (error) {
    console.error(`Failed to fetch from Twelve Data for ${ticker}:`, error);
    // If fetching fails, return a valid structure with the base ticker as the name.
    // This prevents the "Undefined" error on the frontend.
    return { statusCode: 200, body: JSON.stringify({ name: baseTicker, logo_url: '' }) };
  }
};
