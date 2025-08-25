// netlify/functions/get-google-events.js
const { google } = require('googleapis');

exports.handler = async function(event, context) {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALENDAR_ID, GOOGLE_HOLIDAY_CALENDAR_ID } = process.env;
    const accessToken = event.headers.authorization.split(' ')[1];

    if (!accessToken) {
        return { statusCode: 401, body: 'Unauthorized' };
    }

    const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
        const now = new Date();
        const timeMin = now.toISOString();
        const timeMax = new Date(now.setDate(now.getDate() + 30)).toISOString(); // Next 30 days

        // Fetch primary calendar events
        const eventsRes = await calendar.events.list({
            calendarId: GOOGLE_CALENDAR_ID || 'primary',
            timeMin: timeMin,
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });

        // Fetch holiday calendar events
        const holidaysRes = await calendar.events.list({
            calendarId: GOOGLE_HOLIDAY_CALENDAR_ID || 'en.german#holiday@group.v.calendar.google.com',
            timeMin: timeMin,
            timeMax: timeMax,
            singleEvents: true,
            orderBy: 'startTime',
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                events: eventsRes.data.items,
                holidays: holidaysRes.data.items
            }),
        };
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        // A 401 here likely means the access token is expired.
        // The frontend will handle refreshing it.
        if (error.code === 401) {
             return { statusCode: 401, body: 'Token expired' };
        }
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch calendar data.' }),
        };
    }
};
