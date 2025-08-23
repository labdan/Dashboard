// config.js

// IMPORTANT:
// 1. Replace 'YOUR_OPENWEATHERMAP_API_KEY' with your actual key from OpenWeatherMap.
// 2. This file should be listed in your .gitignore file to prevent your API keys from being published to GitHub.

const config = {
    openweathermap: {
        apiKey: '18624c9c35aaac6a1f322ec4c37f4b70',
        // Coordinates for Berlin, Germany. You can change these to your location.
        lat: 52.5200,
        lon: 13.4050 
    },
    supabase: {
        url: 'YOUR_SUPABASE_URL',
        anonKey: 'YOUR_SUPABASE_ANON_KEY'
    }
};
