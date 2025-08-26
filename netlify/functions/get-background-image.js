// netlify/functions/get-background-image.js

exports.handler = async function(event, context) {
    const { UNSPLASH_ACCESS_KEY } = process.env;
    const { query } = event.queryStringParameters;

    if (!UNSPLASH_ACCESS_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Unsplash Access Key is not configured." })
        };
    }

    const apiUrl = `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Unsplash API responded with status: ${response.status}`);
        }
        const data = await response.json();
        
        // Return the most suitable image URL
        const imageUrl = data.urls.regular || data.urls.full;

        return {
            statusCode: 200,
            body: JSON.stringify({ imageUrl: imageUrl }),
        };
    } catch (error) {
        console.error("Unsplash fetch error:", error);
        return {
            statusCode: 502,
            body: JSON.stringify({ error: "Failed to fetch image from Unsplash." }),
        };
    }
};