// netlify/functions/enrich-watchlist-item.js
const { createClient } = require('@supabase/supabase-js');

// Helper function to fetch JSON
const fetchJson = async (url) => {
    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'Productivity-Dashboard/1.0' } });
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error(`Fetch error for ${url}:`, error);
        return null;
    }
};

exports.handler = async function(event, context) {
    const { SUPABASE_URL, SUPABASE_ANON_KEY, TWELVE_DATA_API_KEY } = process.env;
    const { id, ticker, market } = event.queryStringParameters;

    if (!id || !ticker || !market) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing required parameters: id, ticker, market' }) };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    let foundLogoUrl = '';

    try {
        // --- Tier 1: Twelve Data API Logo Endpoint ---
        const logoData = await fetchJson(`https://api.twelvedata.com/logo?symbol=${ticker}&exchange=${market}&apikey=${TWELVE_DATA_API_KEY}`);
        if (logoData && logoData.url) {
            foundLogoUrl = logoData.url;
        }

        // --- Tier 2: Fallback to Profile Endpoint if no logo from logo endpoint ---
        if (!foundLogoUrl) {
            const profileData = await fetchJson(`https://api.twelvedata.com/profile?symbol=${ticker}&exchange=${market}&apikey=${TWELVE_DATA_API_KEY}`);
            if (profileData && profileData.logo) {
                foundLogoUrl = profileData.logo;
            }
        }

        // If a logo was found, update the database record
        if (foundLogoUrl) {
            const { error } = await supabase
                .from('watchlist')
                .update({ logo_url: foundLogoUrl })
                .eq('id', id);

            if (error) {
                console.error('Supabase update error:', error);
                // Don't throw, just log it. Still return the found URL.
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ logo_url: foundLogoUrl }),
        };

    } catch (error) {
        console.error(`Error enriching watchlist item ${ticker}:`, error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to enrich watchlist item.' }),
        };
    }
};