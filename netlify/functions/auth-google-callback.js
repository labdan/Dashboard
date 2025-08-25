// netlify/functions/auth-google-callback.js
const { google } = require('googleapis');

exports.handler = async function(event, context) {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NETLIFY_URL } = process.env;
  const code = event.queryStringParameters.code;

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    `${NETLIFY_URL}/.netlify/functions/auth-google-callback`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token } = tokens;

    // Redirect back to the main page with tokens as query params
    const redirectUrl = `${NETLIFY_URL}?access_token=${access_token}&refresh_token=${refresh_token}`;
    
    return {
      statusCode: 302,
      headers: {
        Location: redirectUrl,
        'Cache-Control': 'no-cache'
      },
      body: ''
    };
  } catch (error) {
    console.error('Error getting tokens', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve auth tokens.' })
    };
  }
};
