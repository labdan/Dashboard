// demo.js

// --- CONFIGURATION ---
if (typeof config === 'undefined') {
    alert("Configuration file (config.js) is missing or not loaded.");
}
const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = config.supabase;
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM ELEMENTS ---
const timeElement = document.getElementById('time');
const dateElement = document.getElementById('date');
const miniCalendarContainer = document.getElementById('mini-calendar');
const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');
const quoteElement = document.getElementById('quote');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchEngineIcons = document.querySelectorAll('.search-engine-icon');
const quickLinksContainer = document.getElementById('quick-links');
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const watchlistContainer = document.getElementById('watchlist-container');
const themeToggleBtn = document.getElementById('theme-toggle');
const sideNewsContainer = document.getElementById('side-news-container');
const eventsContainer = document.getElementById('events-container');

// Main Layout Elements
const mainDashboard = document.getElementById('main-dashboard');

// Settings & Center Panel
const centerPanelNavLinks = document.querySelectorAll('.center-panel-nav-link');
const centerPanelItems = document.querySelectorAll('.center-panel-item');
const themeSelectBtn = document.getElementById('theme-select-btn');
const themeOptionsContainer = document.getElementById('theme-options-container');
const setNormalThemeBtn = document.getElementById('set-normal-theme-btn');
const setDynamicThemeBtn = document.getElementById('set-dynamic-theme-btn');
const setRoyalEpicThemeBtn = document.getElementById('set-royal-epic-theme-btn');
const setGoldenRedThemeBtn = document.getElementById('set-golden-red-theme-btn'); 

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

// --- STATE ---
let calendarDisplayDate = new Date();
let demoData = {};

// --- INITIALIZATION ---
async function init() {
    await fetch('demo-data.json')
        .then(response => response.json())
        .then(data => {
            demoData = data;
            applySavedTheme();
            updateClock();
            setInterval(updateClock, 1000);
            updateDateDisplay();
            updateQuote();
            setInterval(updateQuote, 10000);
            document.getElementById('notes-panel').style.display = 'flex';
            setupEventListeners();
            loadDemoContent();
        })
        .catch(error => console.error('Error loading demo data:', error));
}

function setupEventListeners() {
    searchBtn.addEventListener('click', () => {
        if (searchInput.value.trim()) {
            alert(`Search functionality is disabled in the demo.`);
        }
    });
    searchInput.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter' && searchInput.value.trim()) {
            alert(`Search functionality is disabled in the demo.`);
        }
    });

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Todo functionality is disabled in the demo.');
    });

    searchEngineIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            const engine = e.currentTarget.dataset.engine;
            searchEngineIcons.forEach(i => i.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });

    watchlistContainer.addEventListener('click', (e) => {
        const stockItem = e.target.closest('.stock-item-new');
        if (stockItem && stockItem.dataset.ticker) {
            const ticker = stockItem.dataset.ticker;
            showStockDetails(ticker);
        }
    });

    themeToggleBtn.addEventListener('click', toggleTheme);
    prevMonthBtn.addEventListener('click', () => {
        calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() - 1);
        updateDateDisplay();
    });
    nextMonthBtn.addEventListener('click', () => {
        calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() + 1);
        updateDateDisplay();
    });

    centerPanelNavLinks.forEach(link => {
        link.addEventListener('click', () => switchCenterPanel(link.dataset.panel));
    });

    if (themeSelectBtn) themeSelectBtn.addEventListener('click', () => themeOptionsContainer.classList.toggle('visible'));
    if (setNormalThemeBtn) setNormalThemeBtn.addEventListener('click', () => { applyTheme({ type: 'normal' }); themeOptionsContainer.classList.remove('visible'); });
    if (setDynamicThemeBtn) setDynamicThemeBtn.addEventListener('click', () => { applyTheme({ type: 'dynamic' }); themeOptionsContainer.classList.remove('visible'); });
    if (setRoyalEpicThemeBtn) setRoyalEpicThemeBtn.addEventListener('click', () => { applyTheme({ type: 'royal-epic' }); themeOptionsContainer.classList.remove('visible'); });
    if (setGoldenRedThemeBtn) setGoldenRedThemeBtn.addEventListener('click', () => { applyTheme({ type: 'golden-red' }); themeOptionsContainer.classList.remove('visible'); });
}

function loadDemoContent() {
    loadQuickLinks();
    updateWeatherUI(demoData.weather);
    renderPortfolio(demoData.portfolio);
    loadCombinedNews(demoData.news);
    loadTodos(demoData.todos);
    renderUpcomingEvents(demoData.events);
    initializeEditor(demoData.noteContent);
    initializeTradingViewWidgets();
    loadCustomWatchlist();
}

// --- CENTER PANEL ---
function switchCenterPanel(panelId) {
    if (panelId === 'settings') {
        alert("Editing settings is disabled in the demo.");
        return;
    }
    centerPanelItems.forEach(panel => panel.style.display = 'none');
    const targetPanel = document.getElementById(`${panelId}-panel`);
    if (targetPanel) targetPanel.style.display = 'flex';
    
    centerPanelNavLinks.forEach(link => link.classList.remove('active'));
    const targetLink = document.querySelector(`.center-panel-nav-link[data-panel="${panelId}"]`);
    if (targetLink) targetLink.classList.add('active');
}


// --- THEME ---
function applySavedTheme() {
    const savedTheme = JSON.parse(localStorage.getItem('themeConfig')) || { type: 'normal', mode: 'light' };
    applyTheme(savedTheme, true);
}

function applyTheme(config, isInitialLoad = false) {
    const currentConfig = JSON.parse(localStorage.getItem('themeConfig')) || { type: 'normal', mode: 'light' };
    const newConfig = { ...currentConfig, ...config };
    localStorage.setItem('themeConfig', JSON.stringify(newConfig));
    document.body.setAttribute('data-theme', newConfig.mode);
    
    document.body.classList.remove('dynamic-theme', 'royal-epic-theme', 'golden-red-theme');
    document.body.style.backgroundImage = 'none';

    if (newConfig.type === 'dynamic') {
        document.body.classList.add('dynamic-theme');
        document.body.style.backgroundImage = `url(${newConfig.mode === 'dark' ? 'royal/background1.png' : 'royal/background.png'})`;
    } else if (newConfig.type === 'royal-epic') {
        document.body.classList.add('royal-epic-theme');
    } else if (newConfig.type === 'golden-red') {
        document.body.classList.add('golden-red-theme');
    }

    if (!isInitialLoad) {
        initializeTradingViewWidgets();
        loadCustomWatchlist();
        loadQuickLinks();
    }
}

function toggleTheme() {
    const currentConfig = JSON.parse(localStorage.getItem('themeConfig')) || { type: 'normal', mode: 'light' };
    currentConfig.mode = currentConfig.mode === 'dark' ? 'light' : 'dark';
    applyTheme(currentConfig);
}

// --- NEWS FEEDS ---
function loadCombinedNews(news) {
    if (!sideNewsContainer) return;
    sideNewsContainer.innerHTML = news.map(article => `
        <div class="news-item">
            <a href="#" class="news-title" onclick="return false;">${article.title}</a>
            <div class="news-date">${new Date(article.pubDate).toLocaleString()}</div>
        </div>
    `).join('');
}

// --- TO-DO LIST ---
function loadTodos(todos) {
    todoList.innerHTML = '';
    todos.forEach(todo => {
        const todoItem = document.createElement('li');
        todoItem.className = 'todo-item';
        todoItem.innerHTML = `<input type="checkbox" class="todo-checkbox" ${todo.is_complete ? 'checked' : ''}><span class="todo-text ${todo.is_complete ? 'todo-completed' : ''}">${todo.task}</span><button class="delete-btn"><i class="fas fa-times"></i></button>`;
        todoList.appendChild(todoItem);
    });
}

// --- WEATHER ---
function updateWeatherUI(data) {
    const todayForecast = data.daily[0];
    weatherTemp.textContent = `${Math.round(data.current.temp)}°C`;
    weatherDesc.textContent = data.current.weather[0].description;
    weatherIconImg.src = `https://openweathermap.org/img/wn/${data.current.weather[0].icon}@2x.png`;
    weatherHigh.textContent = `H: ${Math.round(todayForecast.temp.max)}°`;
    weatherLow.textContent = `L: ${Math.round(todayForecast.temp.min)}°`;
    chanceOfRainElement.textContent = "AI weather assistant unavailable.";
    sunriseElement.textContent = new Date(data.current.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    sunsetElement.textContent = new Date(data.current.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    uvIndexElement.textContent = Math.round(data.current.uvi);
    aqiIndexElement.textContent = 'N/A';
    const forecastContainer = document.getElementById('weather-forecast');
    forecastContainer.innerHTML = '';
    data.daily.slice(1, 8).forEach(day => {
        const dayName = new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
        forecastContainer.innerHTML += `<div class="forecast-item"><div class="forecast-day">${dayName}</div><img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}"><div class="forecast-temp">${Math.round(day.temp.max)}°</div></div>`;
    });
}

// --- GOOGLE CALENDAR ---
function renderUpcomingEvents(events) {
    eventsContainer.innerHTML = events.map(event => `
        <div class="event-item">
            <div class="event-title">${event.summary}</div>
            <div class="event-time">${new Date(event.start.dateTime).toLocaleDateString()} - ${new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
    `).join('');
}

// --- TIME, DATE, & CALENDAR UI ---
function updateClock() {
    timeElement.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function updateDateDisplay() {
    dateElement.textContent = calendarDisplayDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    renderMiniCalendar(demoData.events, calendarDisplayDate);
}

function renderMiniCalendar(events = [], displayDate) {
    const today = new Date();
    const month = displayDate.getMonth();
    const year = displayDate.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDay = (firstDayOfMonth.getDay() + 6) % 7;
    let calendarHTML = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(day => `<div class="mini-calendar-cell mini-calendar-day-name">${day}</div>`).join('');
    calendarHTML += Array(startingDay).fill('<div class="mini-calendar-cell"></div>').join('');
    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear() ? 'current' : '';
        calendarHTML += `<div class="mini-calendar-cell mini-calendar-day-number ${isToday}">${i}</div>`;
    }
    miniCalendarContainer.innerHTML = calendarHTML;
}

function updateQuote() {
    const inspirationalQuotes = ["The only way to do great work is to love what you do.", "The best way to predict the future is to create it.", "Success is not final, failure is not fatal: it is the courage to continue that counts."];
    const randomIndex = Math.floor(Math.random() * inspirationalQuotes.length);
    quoteElement.style.opacity = 0;
    setTimeout(() => { quoteElement.textContent = `"${inspirationalQuotes[randomIndex]}"`; quoteElement.style.opacity = 1; }, 500);
}

// --- QUICK LINKS ---
async function loadQuickLinks() {
    const { data, error } = await supabaseClient.from('quick_links').select('*').order('sort_order');
    if (error) { console.error('Error fetching quick links:', error.message); return; }
    if (!data || data.length === 0) { quickLinksContainer.innerHTML = '<p style="font-size: 0.8rem; opacity: 0.7;">No quick links.</p>'; return; }
    
    const links = data.filter(link => !link.parent_id);
    const subLinks = data.filter(link => link.parent_id);
    quickLinksContainer.innerHTML = '';
    links.forEach(link => {
        const fallbackSrc = 'nostockimg.png';
        let iconSrc = fallbackSrc;
        if (link.url) try { iconSrc = `https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=32`; } catch (e) {}
        else { const iconName = link.name.toLowerCase().replace(/\s+/g, ''); iconSrc = `${iconName}.ico`; }
        const iconHTML = `<img src="${iconSrc}" alt="${link.name} icon" onerror="this.onerror=null; this.src='${fallbackSrc}'">`;
        const childLinks = subLinks.filter(sub => sub.parent_id === link.id);
        if (childLinks.length > 0) {
            const subLinksHTML = childLinks.map(sub => {
                let faviconUrl = fallbackSrc;
                try { faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(sub.url).hostname}&sz=32`; } catch (e) {}
                return `<a href="#" class="link-item" onclick="return false;" title="${sub.name}"><div class="link-icon"><img src="${faviconUrl}" alt="${sub.name} icon" onerror="this.onerror=null;this.src='${fallbackSrc}';"></div><span class="link-name">${sub.name}</span></a>`;
            }).join('');
            quickLinksContainer.innerHTML += `<div class="link-item"><div class="link-icon">${iconHTML}</div><span class="link-name">${link.name}</span><div class="popup-menu">${subLinksHTML}</div></div>`;
        } else {
            quickLinksContainer.innerHTML += `<a href="#" class="link-item" onclick="return false;" title="${link.name}"><div class="link-icon">${iconHTML}</div><span class="link-name">${link.name}</span></a>`;
        }
    });
}

// --- EDITOR ---
function initializeEditor(content) {
    const quill = new Quill('#editor-container', {
        modules: { toolbar: true },
        theme: 'snow'
    });
    quill.root.innerHTML = content;
    quill.disable(); // Make it read-only
}

// --- STOCK WIDGETS ---
function initializeTradingViewWidgets() {
    const theme = document.body.getAttribute('data-theme') || 'light';
    const container = document.getElementById('tv-market-overview-widget-container');
    container.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-hotlists.js';
    script.async = true;
    script.innerHTML = JSON.stringify({ "exchange": "US", "colorTheme": theme, "dateRange": "12M", "showChart": false, "locale": "en", "isTransparent": true, "showSymbolLogo": true, "showFloatingTooltip": true, "width": "100%", "height": "100%" });
    container.appendChild(script);
    showStockDetails("NASDAQ:AAPL", true);
}

function showStockDetails(symbol, isInitialLoad = false) {
    const theme = document.body.getAttribute('data-theme') || 'light';
    const symbolInfoContainer = document.getElementById('tv-widget-symbol-info');
    if (symbolInfoContainer) {
        symbolInfoContainer.innerHTML = ''; 
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js';
        script.innerHTML = JSON.stringify({ "symbol": symbol, "colorTheme": theme, "isTransparent": true, "locale": "en", "width": "100%" });
        symbolInfoContainer.appendChild(script);
    }
    const techAnalysisContainer = document.getElementById('tv-widget-technical-analysis');
    if (techAnalysisContainer) {
        techAnalysisContainer.innerHTML = '';
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
        script.innerHTML = JSON.stringify({ "symbol": symbol, "colorTheme": theme, "isTransparent": true, "locale": "en", "width": "100%", "height": "100%", "interval": "1M" });
        techAnalysisContainer.appendChild(script);
    }
    const financialsContainer = document.getElementById('tv-widget-financials');
    if (financialsContainer) {
        financialsContainer.innerHTML = '';
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-financials.js';
        script.innerHTML = JSON.stringify({ "symbol": symbol, "colorTheme": theme, "displayMode": "adaptive", "isTransparent": true, "locale": "en", "width": "100%", "height": "100%" });
        financialsContainer.appendChild(script);
    }
    const advancedChartContainer = document.getElementById('tv-widget-advanced-chart');
    if (advancedChartContainer) {
        advancedChartContainer.innerHTML = '';
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
        script.innerHTML = JSON.stringify({ "symbol": symbol, "theme": theme, "allow_symbol_change": true, "hide_side_toolbar": true, "isTransparent": true, "locale": "en", "width": "100%", "height": "100%" });
        advancedChartContainer.appendChild(script);
    }
    if (!isInitialLoad) switchCenterPanel('stock-details');
}

async function loadCustomWatchlist() {
    const container = document.getElementById('custom-watchlist-container');
    container.innerHTML = `<div id="custom-watchlist-header"><button class="settings-btn" id="edit-watchlist-btn" title="Edit Watchlist"><i class="fas fa-cog"></i></button></div><div id="custom-watchlist-body"><p style="padding: 10px 0;">Loading...</p></div>`;
    
    document.getElementById('edit-watchlist-btn').addEventListener('click', () => {
        alert("Editing the watchlist is disabled in the demo.");
    });
    
    const bodyContainer = document.getElementById('custom-watchlist-body');
    try {
        const { data, error } = await supabaseClient.from('watchlist').select('*').order('sort_order');
        if (error) throw new Error('Failed to fetch custom watchlist');

        bodyContainer.innerHTML = '';
        data.forEach(stock => {
            const tvSymbol = `${stock.market}:${stock.ticker}`;
            const widgetWrapper = document.createElement('div');
            widgetWrapper.className = 'single-ticker-widget-wrapper';
            widgetWrapper.setAttribute('data-ticker', tvSymbol);

            const targetOverlay = document.createElement('div');
            targetOverlay.className = 'target-price-overlay';
            targetOverlay.textContent = stock.target ? stock.target.toLocaleString() : '';
            widgetWrapper.appendChild(targetOverlay);

            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js';
            script.innerHTML = JSON.stringify({ "symbol": tvSymbol, "colorTheme": document.body.getAttribute('data-theme') || 'light', "isTransparent": true, "locale": "en", "width": "100%" });
            widgetWrapper.appendChild(script);
            bodyContainer.appendChild(widgetWrapper);
        });
        bodyContainer.addEventListener('click', (e) => {
            const widget = e.target.closest('.single-ticker-widget-wrapper');
            if (widget && widget.dataset.ticker) showStockDetails(widget.dataset.ticker);
        });
    } catch (error) {
        console.error("Error loading custom watchlist:", error);
        bodyContainer.innerHTML = '<div class="error-message" style="padding: 10px 0;">Could not load.</div>';
    }
}

function renderPortfolio(data) {
    let portfolioData = data.portfolio || [];
    const { free: cashValue, invested: investmentValue, total: totalPortfolioValue } = data.cash;
    
    let watchlistHTML = `<div class="portfolio-header"><div class="portfolio-title-bar"><div class="portfolio-value"><div class="value-title">Value</div><div class="value-amount">€${totalPortfolioValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div></div><div class="portfolio-details"><div class="detail-item"><div class="detail-title">Cash</div><div class="detail-amount">€${cashValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div><div class="detail-item"><div class="detail-title">Investments</div><div class="detail-amount">€${investmentValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div></div></div>`;
    
    portfolioData.forEach(stock => {
        const currentValue = stock.currentPrice * stock.quantity;
        const changeAmount = stock.ppl;
        const initialValue = currentValue - changeAmount;
        const changePercent = initialValue === 0 ? 0 : (changeAmount / initialValue) * 100;
        watchlistHTML += `<div class="stock-item-new" data-ticker="${stock.ticker}"><div class="stock-icon-new"><img src="${stock.logoUrl}" alt="${stock.companyName}"></div><div class="stock-info-new"><div class="stock-name-new">${stock.companyName}</div><div class="stock-shares">${stock.quantity.toFixed(2)} SHARES</div></div><div class="stock-pricing-new"><div class="stock-value">€${currentValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div><div class="stock-change-new ${changeAmount >= 0 ? 'positive' : 'negative'}">${changeAmount >= 0 ? '+' : ''}€${changeAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${changePercent.toFixed(2)}%)</div></div></div>`;
    });
    watchlistContainer.innerHTML = watchlistHTML;
}

// --- START THE APP ---
init();