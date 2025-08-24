// netlify/functions/get-list-tweets.js
import fetch from "node-fetch";

let cachedData = null;
let cachedTime = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute

export async function handler() {
  const now = Date.now();

  // ✅ Serve from cache if still valid
  if (cachedData && now - cachedTime < CACHE_DURATION) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cachedData),
    };
  }

  try {
    const token = process.env.TWITTER_BEARER_TOKEN;
    const listId = "1959714572497006792"; // your list ID

    if (!token) {
      throw new Error("Missing env var: TWITTER_BEARER_TOKEN");
    }

    const params = new URLSearchParams({
      max_results: "25",
      expansions: "author_id,attachments.media_keys",
      "tweet.fields": "created_at,public_metrics,entities",
      "user.fields": "name,username,profile_image_url,verified",
      "media.fields": "url,preview_image_url,width,height,type",
    });

    const url = `https://api.x.com/2/lists/${listId}/tweets?${params}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`X API ${response.status}: ${text}`);
    }

    const data = await response.json();

    // ✅ Save to cache
    cachedData = data;
    cachedTime = now;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("Twitter API Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
