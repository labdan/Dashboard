// netlify/functions/get-list-tweets.js
const { TwitterApi } = require('twitter-api-v2');

exports.handler = async function (event, context) {
  // 1. Get your List ID from the query string
  const { listId } = event.queryStringParameters;

  if (!listId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'List ID is required.' }),
    };
  }

  // 2. Initialize Twitter client with your Bearer Token from environment variables
  const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

  try {
    // 3. Fetch the most recent tweets from the specified list
    const tweets = await client.v2.listTweets(listId, {
      expansions: ['author_id', 'attachments.media_keys'],
      'tweet.fields': ['created_at', 'public_metrics', 'entities'],
      'user.fields': ['name', 'username', 'profile_image_url'],
      'media.fields': ['preview_image_url', 'url', 'alt_text', 'type'],
      max_results: 30, // Fetch the last 30 tweets
    });

    // 4. Return the complete tweet data to the frontend
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tweets),
    };
  } catch (error) {
    console.error('Twitter API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch tweets' }),
    };
  }
};
