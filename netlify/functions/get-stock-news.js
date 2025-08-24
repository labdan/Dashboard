// netlify/functions/get-stock-news.js

const https = require('https');

// This function fetches the latest business and technology news headlines.
exports.handler = async function(event, context) {
  const API_KEY = process.env.NEWS_API_KEY;

  if (!API_KEY) {
    console.error('CRITICAL: NEWS_API_KEY environment variable is not set in Netlify.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'News API key is not configured.' }),
    };
  }

  // Fetch top headlines from business and technology in the US.
  // NewsAPI.org requires a User-Agent header for all server-side requests.
  const options = {
    hostname: 'newsapi.org',
    path: '/v2/top-headlines?country=us&category=business&category=technology&pageSize=20',
    method: 'GET',
    headers: {
      'User-Agent': 'Productivity-Dashboard/1.0',
      'X-Api-Key': API_KEY
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            statusCode: 200,
            body: data,
          });
        } else {
          console.error(`News API Error: Status ${res.statusCode}`);
          resolve({
            statusCode: res.statusCode,
            body: JSON.stringify({ error: 'Failed to fetch news from NewsAPI.' }),
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('An error occurred in the get-stock-news function execution:', error);
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: `An internal function error occurred: ${error.message}` }),
      });
    });

    req.end();
  });
};
