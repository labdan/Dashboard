// This is your new serverless function that will run on Netlify's servers.

exports.handler = async function(event, context) {
    // Get the API key from the secure environment variables
    const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
    
    // Coordinates for Berlin, Germany. You can change these if needed.
    const LAT = 52.5200;
    const LON = 13.4050;

    const API_URL = `https://api.openweathermap.org/data/3.0/onecall?lat=${LAT}&lon=${LON}&exclude=minutely,hourly,alerts&appid=${API_KEY}&units=metric`;

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        // If the API call was successful, send the data back to the browser
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        // If there was an error, send back an error message
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch weather data' })
        };
    }
};
