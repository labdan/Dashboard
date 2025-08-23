// app.js

// --- CONFIGURATION ---
if (typeof config === 'undefined') {
    alert("Configuration file (config.js) is missing or not loaded.");
}
const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = config.supabase;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for weather
const PORTFOLIO_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for portfolio

// --- SUPABASE CLIENT ---
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM ELEMENTS ---
const timeElement = document.getElementById('time');
const dateElement = document.getElementById('date');
const miniCalendarContainer = document.getElementById('mini-calendar');
const quoteElement = document.getElementById('quote');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchEngineIcons = document.querySelectorAll('.search-engine-icon');
const quickLinksContainer = document.getElementById('quick-links');
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const newsContainer = document.getElementById('news-container');
const watchlistContainer = document.getElementById('watchlist-container');
const calendarContainer = document.getElementById('calendar-container');
const themeToggleBtn = document.getElementById('theme-toggle');

// Weather DOM Elements
const weatherIconImg = document.getElementById('weather-icon-img');
const weatherTemp = document.querySelector('.weather-temperature');
const weatherDesc = document.querySelector('.weather-description');
const weatherHigh = document.getElementById('weather-high');
const weatherLow = document.getElementById('weather-low');
const chanceOfRainElement = document.getElementById('chance-of-rain');
const sunriseElement = document.getElementById('sunrise-time');
const sunsetElement = document.getElementById('sunset-time');
const uvIndexElement = document.getElementById('uv-index');
const aqiIndexElement = document.getElementById('aqi-index');
const refreshWeatherBtn = document.getElementById('refresh-weather');

// --- STATE ---
let currentSearchEngine = 'google';
const USER_ID = '12345678-1234-1234-1234-1234567890ab'; 

// --- INITIALIZATION ---
async function init() {
    if (!SUPABASE_URL || SUPABASE_URL.includes('YOUR_SUPABASE_URL')) {
        alert("Supabase URL is not set in config.js. To-Do list will not work.");
    }
    
    applySavedTheme();
    updateTimeAndDate();
    setInterval(updateTimeAndDate, 1000);
    updateQuote();
    setInterval(updateQuote, 10000);
    renderMiniCalendar();
    loadQuickLinks();
    getWeather();
    loadStockNews();
    loadStockWatchlist();
    renderCalendar();
    await loadTodos();
    subscribeToTodoChanges();
    setupEventListeners();
}

// --- STOCK WATCHLIST (with Caching) ---
async function loadStockWatchlist() {
    const cachedPortfolio = JSON.parse(localStorage.getItem('portfolioCache'));
    if (cachedPortfolio && (Date.now() - cachedPortfolio.timestamp < PORTFOLIO_CACHE_DURATION)) {
        renderPortfolio(cachedPortfolio.data);
        return;
    }
    watchlistContainer.innerHTML = '<div style="padding: 20px;">Loading portfolio...</div>';
    try {
        const [portfolioRes, cashRes] = await Promise.all([
            fetch('/.netlify/functions/get-portfolio'),
            fetch('/.netlify/functions/get-cash')
        ]);
        if (!portfolioRes.ok) {
            const errorJson = await portfolioRes.json();
            throw new Error(`Portfolio API Error: ${errorJson.error || portfolioRes.statusText}`);
        }
        if (!cashRes.ok) {
            const errorJson = await cashRes.json();
            throw new Error(`Cash API Error: ${errorJson.error || cashRes.statusText}`);
        }
        const portfolioData = await portfolioRes.json();
        const cashData = await cashRes.json();

        console.log('Received Cash Data:', cashData);
        console.log('Received Portfolio Data:', portfolioData);

        const fullPortfolioData = { portfolio: portfolioData, cash: cashData };
        localStorage.setItem('portfolioCache', JSON.stringify({ timestamp: Date.now(), data: fullPortfolioData }));
        renderPortfolio(fullPortfolioData);
    } catch (error) {
        console.error('Error fetching stock watchlist:', error);
        localStorage.removeItem('portfolioCache');
        renderPortfolio(null, error.message);
    }
}

function renderPortfolio(data, error = null) {
    if (error) {
        watchlistContainer.innerHTML = `
            <div class="portfolio-header">
                 <div class="portfolio-title-bar">
                    <div class="portfolio-value">
                        <div class="value-title">Value</div>
                        <div class="value-amount">€--.--</div>
                    </div>
                    <button class="refresh-btn" id="refresh-portfolio" title="Refresh Portfolio"><i class="fas fa-sync-alt"></i></button>
                </div>
            </div>
            <div class="error-message" style="padding: 20px;">
                Could not load portfolio data.
                <small>Reason: ${error}</small>
            </div>`;
        return;
    }

    if (!data || !data.cash) {
        renderPortfolio(null, "Invalid data structure received from API.");
        return;
    }

    const portfolioData = data.portfolio || [];
    const cashData = data.cash;

    // FIX: Adapt to your API field names
    const cashValue = cashData.cash || cashData.free || 0;
    const investmentValue = cashData.investments || cashData.invested || 0;
    const totalPortfolioValue = cashData.total || (cashValue + investmentValue);

    let watchlistHTML = `
        <div class="portfolio-header">
            <div class="portfolio-title-bar">
                <div class="portfolio-value">
                    <div class="value-title">Value</div>
                    <div class="value-amount">€${totalPortfolioValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <button class="refresh-btn" id="refresh-portfolio" title="Refresh Portfolio"><i class="fas fa-sync-alt"></i></button>
            </div>
            <div class="portfolio-details">
                <div class="detail-item">
                    <div class="detail-title">Cash</div>
                    <div class="detail-amount">€${cashValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-title">Investments</div>
                    <div class="detail-amount">€${investmentValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
            </div>
        </div>`;
    
    if (portfolioData.length === 0) {
        watchlistHTML += `<div class="no-investments">You have no investments yet.</div>`;
    } else {
        portfolioData.forEach(stock => {
            const baseTicker = stock.ticker.split('_')[0].toLowerCase();

            // FIX: Use TradingView logo CDN
            const iconUrl = `https://s3-symbol-logo.tradingview.com/${baseTicker}.svg`;

            const currentValue = stock.currentPrice * stock.quantity;
            const changeAmount = stock.ppl;
            const initialValue = currentValue - changeAmount;
            const changePercent = initialValue === 0 ? 0 : (changeAmount / initialValue) * 100;
            const isPositive = changeAmount >= 0;

            watchlistHTML += `
                <div class="stock-item-new">
                    <div class="stock-icon-new">
                        <img src="${iconUrl}" alt="${stock.ticker}" onerror="this.src='nostockimg.png'; this.onerror=null;">
                    </div>
                    <div class="stock-info-new">
                        <div class="stock-name-new">${stock.ticker.replace(/_/g, ' ')}</div>
                        <div class="stock-shares">${stock.quantity} SHARES</div>
                    </div>
                    <div class="stock-pricing-new">
                        <div class="stock-value">€${currentValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div class="stock-change-new ${isPositive ? 'positive' : 'negative'}">
                            ${isPositive ? '+' : ''}€${changeAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${changePercent.toFixed(2)}%)
                        </div>
                    </div>
                </div>
            `;
        });
    }

    watchlistContainer.innerHTML = watchlistHTML;
}

// --- START THE APP ---
init();
