// netlify/functions/get-list-tweets.js
import fetch from "node-fetch";
import { createClient } from '@supabase/supabase-js';

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export async function handler() {
  const { SUPABASE_URL, SUPABASE_ANON_KEY, TWITTER_BEARER_TOKEN } = process.env;
  const listId = "1959714572497006792";

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !TWITTER_BEARER_TOKEN) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Environment variables are not set.' }) };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // --- 1. Check Supabase Cache ---
  try {
    const { data: cached, error } = await supabase
      .from('x_feed_cache')
      .select('feed_data, cached_at')
      .eq('id', listId)
      .single();

    if (cached && (new Date() - new Date(cached.cached_at) < CACHE_DURATION)) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cached.feed_data),
      };
    }
  } catch (err) {
      // It's okay if this fails (e.g., no row found), we'll just fetch new data.
      console.log("Cache miss or error, fetching fresh data.");
  }

  // --- 2. Fetch from X.com API ---
  try {
    const params = new URLSearchParams({
      max_results: "25",
      expansions: "author_id,attachments.media_keys",
      "tweet.fields": "created_at,public_metrics,entities",
      "user.fields": "name,username,profile_image_url,verified",
      "media.fields": "url,preview_image_url,width,height,type",
    });

    const url = `https://api.x.com/2/lists/${listId}/tweets?${params}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${TWITTER_BEARER_TOKEN}` },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`X API ${response.status}: ${text}`);
    }

    const freshData = await response.json();

    // --- 3. Update Supabase Cache (don't wait for it to finish) ---
    supabase
      .from('x_feed_cache')
      .upsert({ id: listId, feed_data: freshData, cached_at: new Date().toISOString() })
      .then(({ error }) => {
        if (error) console.error('Supabase cache update error:', error);
      });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(freshData),
    };
  } catch (err) {
    console.error("Twitter API Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
