// netlify/functions/get-symbol-info.js
const fetch = require('node-fetch');

exports.handler = async function(event) {
  const { symbol } = event.queryStringParameters;
  if (!symbol) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Symbol parameter is required' }) };
  }

  try {
    // This API endpoint searches for symbols on TradingView
    const response = await fetch(`https://symbol-search.tradingview.com/symbol_search/?text=${encodeURIComponent(symbol)}&hl=1`);
    if (!response.ok) {
      throw new Error(`TradingView API failed with status: ${response.status}`);
    }
    const results = await response.json();
    
    if (results.length === 0) {
       return { statusCode: 404, body: JSON.stringify({ error: 'Symbol not found' }) };
    }
    
    // We take the first and most relevant result
    const info = results[0];
    const tvSymbol = `${info.exchange}:${info.symbol}`;
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
          tvSymbol, 
          type: info.type || 'stock', // Default to 'stock' if type is missing
          description: info.description 
      }),
    };
  } catch (error) {
    console.error('Error fetching symbol info:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch symbol info' }) };
  }
};