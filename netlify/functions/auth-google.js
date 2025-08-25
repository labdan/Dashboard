// netlify/functions/auth-google.js
const { google } = require('googleapis');

exports.handler = async function(event, context) {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NETLIFY_URL } = process.env;

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    `${NETLIFY_URL}/.netlify/functions/auth-google-callback`
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes
  });

  return {
    statusCode: 302,
    headers: {
      Location: url,
      'Cache-Control': 'no-cache'
    },
    body: ''
  };
};
