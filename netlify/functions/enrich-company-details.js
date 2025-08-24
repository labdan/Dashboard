// netlify/functions/enrich-company-details.js

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Helper to check if a URL exists (returns true for status 200)
const urlExists = (url) => {
  return new Promise((resolve) => {
    const options = { method: 'HEAD', headers: { 'User-Agent': 'Productivity-Dashboard/1.0' } };
    const req = https.request(url, options, (res) => resolve(res.statusCode === 200));
    req.on('error', () => resolve(false));
    req.end();
  });
};

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
  // --- Environment & Input Validation ---
  const { SUPABASE_URL, SUPABASE_ANON_KEY, TWELVE_DATA_API_KEY } = process.env;
  const { ticker, instrumentName } = event.queryStringParameters;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !TWELVE_DATA_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API credentials are not configured.' }) };
  }
  if (!ticker || !instrumentName) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ticker and instrumentName are required.' }) };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const baseTicker = ticker.split('_')[0];

  // --- Tier 1: Check Supabase Cache ---
  let { data: cachedData } = await supabase.from('company_details').select('name, logo_url').eq('ticker', ticker).single();
  
  // If we have a complete record, return it immediately.
  if (cachedData && cachedData.name && cachedData.logo_url) {
    return { statusCode: 200, body: JSON.stringify(cachedData) };
  }

  // --- Progressive Enrichment Logic ---
  
  // If no record exists, create one with the basic info first.
  if (!cachedData) {
    const { data: newData } = await supabase
      .from('company_details')
      .insert({ ticker: ticker, name: instrumentName })
      .select()
      .single();
    cachedData = newData;
  }

  let finalName = cachedData.name || instrumentName;
  let foundLogoUrl = cachedData.logo_url || '';

  // --- Tier 2: Search for Logo (if we don't have one) ---
  if (!foundLogoUrl) {
    // Attempt A: TradingView CDN
    const slug = finalName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const tradingViewUrl = `https://s3-symbol-logo.tradingview.com/${slug}--big.svg`;
    if (await urlExists(tradingViewUrl)) {
      foundLogoUrl = tradingViewUrl;
    }
    
    // Attempt B: Forked GitHub Repo
    if (!foundLogoUrl) {
      const githubUrl = `https://raw.githubusercontent.com/labdan/icons/main/png/${baseTicker}.png`;
      if (await urlExists(githubUrl)) {
        foundLogoUrl = githubUrl;
      }
    }
  }

  // --- Tier 3: Fallback to Twelve Data API (if still no logo) ---
  if (!foundLogoUrl) {
    try {
      const [profileData, logoData] = await Promise.all([
        fetchJson(`https://api.twelvedata.com/profile?symbol=${baseTicker}&apikey=${TWELVE_DATA_API_KEY}`),
        fetchJson(`https://api.twelvedata.com/logo?symbol=${baseTicker}&apikey=${TWELVE_DATA_API_KEY}`)
      ]);
      if (profileData.name) {
        finalName = profileData.name;
      }
      foundLogoUrl = logoData.url || '';
    } catch (error) {
      console.error(`Twelve Data fallback failed for ${ticker}:`, error);
    }
  }

  // --- Tier 4: Update the record in Supabase with the new findings ---
  const { data: updatedData } = await supabase
    .from('company_details')
    .update({ name: finalName, logo_url: foundLogoUrl })
    .eq('ticker', ticker)
    .select()
    .single();

  return { statusCode: 200, body: JSON.stringify(updatedData) };
};
