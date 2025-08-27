// netlify/functions/get-watchlist.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Supabase credentials are not configured.' }) };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .order('id');

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch watchlist data.' }),
    };
  }
};