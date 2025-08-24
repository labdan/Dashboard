// netlify/functions/get-list-tweets.js
import fetch from "node-fetch";

// --- SIMPLE CACHE ---
let cachedData = null;
let cachedTime = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute cache

export async function handler(event, context) {
  const now = Date.now();

  // ✅ Return cache if still valid
  if (cachedData && (now - cachedTime) < CACHE_DURATION) {
    return {
      statusCode: 200,
      headers: {
        "Cache-Control": "public, max-age=60", // Netlify CDN cache for 1 min
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cachedData),
    };
  }

  try {
    // 🔑 Replace with your actual Twitter API endpoint
    const url = "https://api.x.com/2/your-endpoint-here";
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Twitter API Error: ${response.status}`);
    }

    const data = await response.json();

    // ✅ Save to cache
    cachedData = data;
    cachedTime = now;

    return {
      statusCode: 200,
      headers: {
        "Cache-Control": "public, max-age=60", // Netlify edge caching
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("Twitter API Error:", err);

    // fallback: return last cached data if available
    if (cachedData) {
      return {
        statusCode: 200,
        headers: {
          "Cache-Control": "public, max-age=60",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cachedData),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch tweets" }),
    };
  }
}
