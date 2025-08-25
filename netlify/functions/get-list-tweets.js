// netlify/functions/get-list-tweets.js
import fetch from "node-fetch";
import { createClient } from '@supabase/supabase-js';

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export async function handler(event, context) {
  const { SUPABASE_URL, SUPABASE_ANON_KEY, TWITTER_BEARER_TOKEN } = process.env;
  const listId = "1959714572497006792"; // Hardcoded as before

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !TWITTER_BEARER_TOKEN) {
    console.error('Environment variables are not set.');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error.' }) };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // --- 1. Check Supabase Cache ---
  let cachedData = null;
  try {
    const { data, error } = await supabase
      .from('x_feed_cache')
      .select('feed_data, cached_at')
      .eq('id', listId)
      .single();

    // PGRST116 means no rows were found, which is a valid cache miss scenario.
    if (error && error.code !== 'PGRST116') { 
        throw error;
    }

    // If we have fresh cache, serve it immediately.
    if (data && (new Date() - new Date(data.cached_at) < CACHE_DURATION)) {
      console.log("Serving fresh data from Supabase cache.");
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.feed_data),
      };
    }
    
    // If cache is stale, keep it as a fallback in case the API fails.
    if (data) {
        cachedData = data.feed_data;
    }
  } catch (err) {
      console.error("Supabase cache read error:", err);
      // Don't block execution; proceed to fetch fresh data.
  }

  // --- 2. Fetch from X.com API ---
  try {
    console.log("Fetching fresh data from X API.");
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
      throw new Error(`X API Error ${response.status}: ${text}`);
    }

    const freshData = await response.json();

    // --- 3. Asynchronously update Supabase Cache ---
    supabase
      .from('x_feed_cache')
      .upsert({ id: listId, feed_data: freshData, cached_at: new Date().toISOString() })
      .then(({ error }) => {
        if (error) console.error('Supabase cache update error:', error);
        else console.log("Supabase cache updated successfully.");
      });

    // Return the fresh data to the user immediately.
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(freshData),
    };
  } catch (err) {
    console.error("X API Fetch Error:", err.message);
    
    // If the API fails but we have stale cache, serve the stale data.
    if (cachedData) {
        console.warn("API failed, serving stale cache as a fallback.");
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cachedData),
        };
    }
    
    // If there's no cache and the API fails, return an error.
    return {
      statusCode: 502, // Bad Gateway
      body: JSON.stringify({ error: "Could not fetch data from X.com and no cache is available." }),
    };
  }
}
