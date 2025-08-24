// app.js

// --- CONFIGURATION ---
if (typeof config === 'undefined') {
    alert("Configuration file (config.js) is missing or not loaded.");
}
const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = config.supabase;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for weather
const PORTFOLIO_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for portfolio
const COMPANY_DETAILS_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days for company details

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
const USER_ID = '12345678-12321-1234-1234567890ab'; 

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

function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });
    todoForm.addEventListener('submit', handleTodoSubmit);
    searchEngineIcons.forEach(icon => {
        icon.addEventListener('click', (e) => setSearchEngine(e.currentTarget.dataset.engine));
    });
    refreshWeatherBtn.addEventListener('click', () => {
        localStorage.removeItem('weatherCache');
        getWeather();
    });
    watchlistContainer.addEventListener('click', (e) => {
        if (e.target.closest('#refresh-portfolio')) {
            localStorage.removeItem('portfolioCache');
            localStorage.removeItem('companyDetailsCache'); // Also clear company details
            loadStockWatchlist();
        }
    });
    todoList.addEventListener('click', handleTodoClick);
    themeToggleBtn.addEventListener('click', toggleTheme);
}

// --- THEME ---
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    themeToggleBtn.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggleBtn.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// --- TO-DO LIST (with Supabase) ---
async function loadTodos() {
    const { data: todos, error } = await supabaseClient.from('todos').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error('Error fetching todos:', error);
        return;
    }
    todoList.innerHTML = '';
    todos.forEach(todo => {
        const todoItem = document.createElement('li');
        todoItem.className = 'todo-item';
        todoItem.dataset.id = todo.id;
        todoItem.innerHTML = `<input type="checkbox" class="todo-checkbox" ${todo.is_complete ? 'checked' : ''}><span class="todo-text ${todo.is_complete ? 'todo-completed' : ''}">${todo.task}</span><button class="delete-btn"><i class="fas fa-times"></i></button>`;
        todoList.appendChild(todoItem);
    });
}

async function handleTodoSubmit(e) {
    e.preventDefault();
    const taskText = todoInput.value.trim();
    if (taskText) {
        const { error } = await supabaseClient.from('todos').insert({ task: taskText, user_id: USER_ID });
        if (error) {
            console.error('Error adding todo:', error);
            alert('Could not add task. See console for details.');
        } else {
            todoInput.value = '';
        }
    }
}

async function handleTodoClick(e) {
    const item = e.target.closest('.todo-item');
    if (!item) return;
    const todoId = item.dataset.id;
    if (e.target.matches('.todo-checkbox, .todo-text')) {
        const isComplete = item.querySelector('.todo-checkbox').checked;
        await supabaseClient.from('todos').update({ is_complete: isComplete }).eq('id', todoId);
    }
    if (e.target.closest('.delete-btn')) {
        await supabaseClient.from('todos').delete().eq('id', todoId);
    }
}

function subscribeToTodoChanges() {
    supabaseClient.channel('todos').on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, loadTodos).subscribe();
}

// --- WEATHER ---
async function getWeather() {
    const cachedData = JSON.parse(localStorage.getItem('weatherCache'));
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
        updateWeatherUI(cachedData.data);
        return;
    }
    try {
        const response = await fetch('/.netlify/functions/get-weather');
        if (!response.ok) throw new Error(`Netlify function failed: ${response.statusText}`);
        const data = await response.json();
        localStorage.setItem('weatherCache', JSON.stringify({ timestamp: Date.now(), data: data }));
        updateWeatherUI(data);
    } catch (error) {
        console.error('Error fetching weather:', error.message);
        weatherDesc.textContent = 'Weather unavailable';
    }
}

function updateWeatherUI(data) {
    const todayForecast = data.daily[0];
    weatherTemp.textContent = `${Math.round(data.current.temp)}°C`;
    weatherDesc.textContent = data.current.weather[0].description;
    weatherIconImg.src = `https://openweathermap.org/img/wn/${data.current.weather[0].icon}@2x.png`;
    
    weatherHigh.textContent = `H: ${Math.round(todayForecast.temp.max)}°`;
    weatherLow.textContent = `L: ${Math.round(todayForecast.temp.min)}°`;
    
    chanceOfRainElement.textContent = getRainPrediction(data.hourly, todayForecast);
    
    sunriseElement.textContent = new Date(data.current.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    sunsetElement.textContent = new Date(data.current.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    uvIndexElement.textContent = Math.round(data.current.uvi);
    aqiIndexElement.textContent = 'N/A';

    const forecastContainer = document.getElementById('weather-forecast');
    forecastContainer.innerHTML = '';
    data.daily.slice(1, 8).forEach(day => {
        const dayName = new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `<div class="forecast-day">${dayName}</div><img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}"><div class="forecast-temp">${Math.round(day.temp.max)}°</div>`;
        forecastContainer.appendChild(forecastItem);
    });
}

function getRainPrediction(hourlyData, todayForecast) {
    const nextRainHour = hourlyData.find(hour => hour.pop > 0.3);
    if (nextRainHour) {
        const rainTime = new Date(nextRainHour.dt * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        return `Rain likely around ${rainTime}`;
    }
    return `${Math.round(todayForecast.pop * 100)}% chance of rain today`;
}

// --- OTHER UI FUNCTIONS ---
function updateTimeAndDate() {
    const now = new Date();
    timeElement.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    dateElement.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function renderMiniCalendar() {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDay = (firstDayOfMonth.getDay() + 6) % 7;
    let calendarHTML = '';
    const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    dayNames.forEach(day => { calendarHTML += `<div class="mini-calendar-cell mini-calendar-day-name">${day}</div>`; });
    for (let i = 0; i < startingDay; i++) { calendarHTML += `<div class="mini-calendar-cell"></div>`; }
    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = i === today.getDate() ? 'current' : '';
        calendarHTML += `<div class="mini-calendar-cell mini-calendar-day-number ${isToday}">${i}</div>`;
    }
    miniCalendarContainer.innerHTML = calendarHTML;
}

function updateQuote() {
    const inspirationalQuotes = ["The only way to do great work is to love what you do.", "The best way to predict the future is to create it.", "Success is not final, failure is not fatal: it is the courage to continue that counts."];
    const randomIndex = Math.floor(Math.random() * inspirationalQuotes.length);
    quoteElement.style.opacity = 0;
    setTimeout(() => {
        quoteElement.textContent = `"${inspirationalQuotes[randomIndex]}"`;
        quoteElement.style.opacity = 1;
    }, 500);
}

function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        const searchUrls = {
            google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            brave: `https://search.brave.com/search?q=${encodeURIComponent(query)}`
        };
        window.open(searchUrls[currentSearchEngine], '_blank');
    }
}

function setSearchEngine(engine) {
    currentSearchEngine = engine;
    searchEngineIcons.forEach(icon => {
        icon.classList.toggle('active', icon.dataset.engine === engine);
    });
}

function loadQuickLinks() {
    const quickLinksData = [
        { name: "Gmail", url: "https://mail.google.com", icon: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico" },
        { name: "Drive", url: "https://drive.google.com", icon: "https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png" },
        { name: "Udemy", url: "https://www.udemy.com", icon: "https://www.udemy.com/favicon.ico" },
        { name: "FMHY", url: "https://fmhy.net", icon: "https://fmhy.net/favicon.ico" },
        {
            name: "Media",
            icon: "fas fa-tv",
            subLinks: [
                { name: "YouTube", url: "https://youtube.com" },
                { name: "Cineby", url: "https://www.cineby.app/" },
                { name: "MMA Full", url: "https://watchmmafull.com/" },
                { name: "NBA Streams", url: "https://top.rnbastreams.com/" },
                { name: "1337x", url: "https://1337x.to/" }
            ]
        },
        { name: "Trading212", url: "https://app.trading212.com/", icon: "https://www.trading212.com/favicon.ico" },
        { name: "X.com", url: "https://x.com", icon: "https://abs.twimg.com/favicons/twitter.ico" },
        {
            name: "AI",
            icon: "fas fa-robot",
            subLinks: [
                { name: "Gemini", url: "https://gemini.google.com/" },
                { name: "ChatGPT", url: "https://chat.openai.com/" },
                { name: "DeepSeek", url: "https://chat.deepseek.com/" },
                { name: "Perplexity", url: "https://www.perplexity.ai/" }
            ]
        },
        { name: "Reddit", url: "https://www.reddit.com", icon: "https://www.reddit.com/favicon.ico" }
    ];
    quickLinksContainer.innerHTML = '';
    quickLinksData.forEach(link => {
        const linkItemWrapper = document.createElement('div');
        linkItemWrapper.className = 'link-item';
        const iconHTML = link.icon.startsWith('fas') || link.icon.startsWith('fab')
            ? `<i class="${link.icon}"></i>`
            : `<img src="${link.icon}" alt="${link.name} icon" onerror="this.src='https://www.google.com/favicon.ico'">`;
        if (link.subLinks) {
            const subLinksHTML = link.subLinks.map(sub => {
                const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(sub.url).hostname}&sz=32`;
                return `<a href="${sub.url}" class="link-item" target="_blank" title="${sub.name}"><div class="link-icon"><img src="${faviconUrl}" alt="${sub.name} icon" onerror="this.src='https://www.google.com/favicon.ico'"></div><span class="link-name">${sub.name}</span></a>`;
            }).join('');
            linkItemWrapper.innerHTML = `<div class="link-icon">${iconHTML}</div><span class="link-name">${link.name}</span><div class="popup-menu">${subLinksHTML}</div>`;
        } else {
            linkItemWrapper.innerHTML = `<a href="${link.url}" target="_blank" title="${link.name}"><div class="link-icon">${iconHTML}</div><span class="link-name">${link.name}</span></a>`;
            linkItemWrapper.querySelector('a').classList.add('link-item');
        }
        quickLinksContainer.appendChild(linkItemWrapper);
    });
}

function loadStockNews() {
    const newsData = [
        { title: "Markets Rally on Lower Than Expected Inflation Data", date: "2h ago" },
        { title: "Tech Giants Report Strong Quarterly Earnings", date: "4h ago" },
        { title: "Fed Holds Interest Rates Steady, Signals Cuts", date: "6h ago" }
    ];
    newsContainer.innerHTML = newsData.map(news => `
        <div class="news-item">
            <a href="#" class="news-title">${news.title}</a>
            <div class="news-date">${news.date}</div>
        </div>
    `).join('');
}

// --- STOCK WATCHLIST ---

/**
 * Your "Local Folder" - Fetches and caches company details.
 * @param {string} ticker - The stock ticker from Trading 212 (e.g., 'AMD_US_EQ').
 * @param {string} instrumentName - The full name of the instrument from Trading 212.
 * @returns {Promise<object>} A promise that resolves to { name, logoUrl }.
 */
async function getCompanyDetails(ticker, instrumentName) {
    let companyDetailsCache = JSON.parse(localStorage.getItem('companyDetailsCache')) || {};
    const cachedItem = companyDetailsCache[ticker];

    // Tier 1: Check the local cache first.
    if (cachedItem && (Date.now() - cachedItem.timestamp < COMPANY_DETAILS_CACHE_DURATION)) {
        return cachedItem.data;
    }

    try {
        // If not in cache, call our Netlify function which handles the multi-tiered logic.
        const response = await fetch(`/.netlify/functions/get-company-details?ticker=${encodeURIComponent(ticker)}&instrumentName=${encodeURIComponent(instrumentName)}`);
        if (!response.ok) {
            console.error(`Failed to get details for ${ticker}`);
            return { name: instrumentName, logoUrl: '' }; // Fallback
        }
        const details = await response.json();

        // Save the result to our local cache for next time.
        companyDetailsCache[ticker] = {
            timestamp: Date.now(),
            data: details,
        };
        localStorage.setItem('companyDetailsCache', JSON.stringify(companyDetailsCache));

        return details;
    } catch (error) {
        console.error(`Error fetching company details for ${ticker}:`, error);
        return { name: instrumentName, logoUrl: '' }; // Fallback
    }
}

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

        if (!portfolioRes.ok) throw new Error(`Portfolio API Error: ${portfolioRes.statusText}`);
        if (!cashRes.ok) throw new Error(`Cash API Error: ${cashRes.statusText}`);

        const portfolioData = await portfolioRes.json();
        const cashData = await cashRes.json();

        const enrichedPortfolio = await Promise.all(portfolioData.map(async (stock) => {
            // Pass both the ticker and the instrument name to our smart fetcher.
            const details = await getCompanyDetails(stock.ticker, stock.instrumentName);
            return {
                ...stock,
                companyName: details.name,
                logoUrl: details.logoUrl,
            };
        }));
        
        const fullPortfolioData = { portfolio: enrichedPortfolio, cash: cashData };

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
    const cashValue = cashData.free || 0;
    const investmentValue = cashData.invested || 0;
    const totalPortfolioValue = cashData.total || 0;

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
            const baseTicker = stock.ticker.split('_')[0];
            const companyName = stock.companyName; // Use the name from our enriched data
            const iconUrl = stock.logoUrl; // Use the logo URL from our enriched data
            
            const currentValue = stock.currentPrice * stock.quantity;
            const changeAmount = stock.ppl;
            const initialValue = currentValue - changeAmount;
            const changePercent = initialValue === 0 ? 0 : (changeAmount / initialValue) * 100;
            const isPositive = changeAmount >= 0;

            watchlistHTML += `
                <div class="stock-item-new">
                    <div class="stock-icon-new">
                        <img src="${iconUrl}" alt="${companyName}" onerror="this.src='https://placehold.co/40x40/EFEFEF/AAAAAA?text=${baseTicker}'; this.onerror=null;">
                    </div>
                    <div class="stock-info-new">
                        <div class="stock-name-new">${companyName}</div>
                        <div class="stock-shares">${stock.quantity.toFixed(2)} SHARES</div>
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

function renderCalendar() {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let calendarHTML = `<div class="calendar-header"><div class="calendar-month">${monthNames[month]} ${year}</div></div><div class="calendar-grid">`;
    const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
    weekdays.forEach(day => { calendarHTML += `<div class="calendar-day calendar-weekday">${day}</div>`; });
    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = i === today.getDate() ? 'current-date' : '';
        calendarHTML += `<div class="calendar-day"><div class="calendar-date ${isToday}">${i}</div></div>`;
    }
    calendarHTML += '</div>';
    calendarContainer.innerHTML = calendarHTML;
}

// --- START THE APP ---
init();
