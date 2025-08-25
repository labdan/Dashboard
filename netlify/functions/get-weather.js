// This is your new serverless function that will run on Netlify's servers.

exports.handler = async function(event, context) {
    // Get the API key from the secure environment variables
    const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
    
    // Coordinates for Berlin, Germany. You can change these if needed.
    const LAT = 52.2943;
    const LON = 13.1713;

    // *** FIX: Removed 'hourly' from the exclude list to get graph data ***
    const API_URL = `https://api.openweathermap.org/data/3.0/onecall?lat=${LAT}&lon=${LON}&exclude=minutely,alerts&appid=${API_KEY}&units=metric`;
    const AI_API_URL = `https://api.openweathermap.org/data/3.0/onecall/assistant?lat=${LAT}&lon=${LON}&appid=${API_KEY}&q=will it rain today?`;


    try {
        // Fetch both the standard weather data and the AI assistant data
        const [weatherResponse, aiResponse] = await Promise.all([
            fetch(API_URL),
            fetch(AI_API_URL)
        ]);

        const weatherData = await weatherResponse.json();
        const aiData = await aiResponse.json();

        // Combine the relevant parts of both responses
        const combinedData = {
            ...weatherData,
            aiAssistant: aiData
        };

        // If the API call was successful, send the data back to the browser
        return {
            statusCode: 200,
            body: JSON.stringify(combinedData)
        };
    } catch (error) {
        // If there was an error, send back an error message
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch weather data' })
        };
    }
};