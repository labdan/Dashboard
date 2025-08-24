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
      res.on('end', () => resolve(JSON.parse(data)));
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
  const { data: cachedData } = await supabase.from('company_details').select('name, logo_url').eq('ticker', ticker).single();
  if (cachedData && cachedData.logo_url) { // Return if we have a complete record
    return { statusCode: 200, body: JSON.stringify(cachedData) };
  }

  // --- If not in cache or incomplete, start the enrichment process ---
  let finalName = instrumentName;
  let foundLogoUrl = '';

  // --- Tier 2: Search for Logos ---
  // Attempt A: TradingView CDN
  const slug = instrumentName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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

  // --- Tier 3: Fallback to Twelve Data API (only if no logo was found) ---
  if (!foundLogoUrl) {
    try {
      const [profileData, logoData] = await Promise.all([
        fetchJson(`https://api.twelvedata.com/profile?symbol=${baseTicker}&apikey=${TWELVE_DATA_API_KEY}`),
        fetchJson(`https://api.twelvedata.com/logo?symbol=${baseTicker}&apikey=${TWELVE_DATA_API_KEY}`)
      ]);
      finalName = profileData.name || instrumentName;
      foundLogoUrl = logoData.url || '';
    } catch (error) {
      console.error(`Twelve Data fallback failed for ${ticker}:`, error);
    }
  }

  // --- Tier 4: Save the result to Supabase Cache ---
  const detailsToCache = {
    ticker: ticker,
    name: finalName,
    logo_url: foundLogoUrl,
  };
  await supabase.from('company_details').upsert(detailsToCache);

  return { statusCode: 200, body: JSON.stringify({ name: finalName, logo_url: foundLogoUrl }) };
};
