// app.js

// --- CONFIGURATION ---
// We no longer need the API key here. It's now handled by the Netlify Function.
const LAT = 52.2742;
const LON = 13.1713;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

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

// Weather DOM Elements
const weatherIconImg = document.getElementById('weather-icon-img');
const weatherTemp = document.querySelector('.weather-temperature');
const weatherDesc = document.querySelector('.weather-description');
const sunriseElement = document.getElementById('sunrise-time');
const sunsetElement = document.getElementById('sunset-time');
const uvIndexElement = document.getElementById('uv-index');
const refreshWeatherBtn = document.getElementById('refresh-weather');

// --- STATE ---
let currentSearchEngine = 'google';

// --- INITIALIZATION ---
function init() {
    // Regular UI Updates
    updateTimeAndDate();
    setInterval(updateTimeAndDate, 1000);
    updateQuote();
    setInterval(updateQuote, 10000);

    // Load static and dynamic content
    renderMiniCalendar();
    loadQuickLinks();
    loadTodos();
    loadStockNews();
    loadStockWatchlist();
    renderCalendar();
    getWeather();

    // Event Listeners
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    todoForm.addEventListener('submit', handleTodoSubmit);
    searchEngineIcons.forEach(icon => {
        icon.addEventListener('click', (e) => setSearchEngine(e.currentTarget.dataset.engine));
    });
    refreshWeatherBtn.addEventListener('click', () => {
        localStorage.removeItem('weatherCache');
        getWeather();
    });
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
        
        if (!response.ok) {
            throw new Error(`Netlify function failed with status ${response.status}`);
        }
        
        const data = await response.json();

        const cache = {
            timestamp: Date.now(),
            data: data
        };
        localStorage.setItem('weatherCache', JSON.stringify(cache));

        updateWeatherUI(data);

    } catch (error) {
        console.error('Error fetching weather:', error.message);
        weatherDesc.textContent = 'Weather unavailable';
    }
}

function updateWeatherUI(data) {
    weatherTemp.textContent = `${Math.round(data.current.temp)}°C`;
    weatherDesc.textContent = data.current.weather[0].description;
    weatherIconImg.src = `https://openweathermap.org/img/wn/${data.current.weather[0].icon}@2x.png`;
    weatherIconImg.alt = data.current.weather[0].description;
    sunriseElement.textContent = new Date(data.current.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    sunsetElement.textContent = new Date(data.current.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    uvIndexElement.textContent = Math.round(data.current.uvi);
    const forecastContainer = document.getElementById('weather-forecast');
    forecastContainer.innerHTML = '';
    data.daily.slice(1, 8).forEach(day => {
        const dayName = new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}">
            <div class="forecast-temp">${Math.round(day.temp.max)}°</div>
        `;
        forecastContainer.appendChild(forecastItem);
    });
}

// --- OTHER FUNCTIONS ---

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
    dayNames.forEach(day => {
        calendarHTML += `<div class="mini-calendar-cell mini-calendar-day-name">${day}</div>`;
    });

    for (let i = 0; i < startingDay; i++) {
        calendarHTML += `<div class="mini-calendar-cell"></div>`;
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = i === today.getDate() ? 'current' : '';
        calendarHTML += `<div class="mini-calendar-cell mini-calendar-day-number ${isToday}">${i}</div>`;
    }
    miniCalendarContainer.innerHTML = calendarHTML;
}

function updateQuote() {
    const inspirationalQuotes = ["The only way to do great work is to love what you do.", "The best way to predict the future is to create it.", "Success is not final, failure is not fatal: it is the courage to continue that counts."];
    const quoteElement = document.getElementById('quote');
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
            brave: `https://search.brave.com/search?q=${encodeURIComponent(query)}`,
            bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
            yahoo: `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`
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
    const defaultLinks = [
        { name: "Gmail", url: "https://mail.google.com", icon: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico" },
        { name: "Drive", url: "https://drive.google.com", icon: "https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png" },
        { name: "YouTube", url: "https://youtube.com", icon: "https://www.youtube.com/s/desktop/014dbbed/img/favicon_48x48.png" }
    ];
    let links = JSON.parse(localStorage.getItem('quickLinks')) || defaultLinks;
    quickLinksContainer.innerHTML = links.map(link => `
        <a href="${link.url}" class="link-item" target="_blank" title="${link.name}">
            <div class="link-icon"><img src="${link.icon}" alt="${link.name} icon" onerror="this.src='https://www.google.com/favicon.ico'"></div>
            <span class="link-name">${link.name}</span>
        </a>
    `).join('');
}

function loadTodos() {
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    todoList.innerHTML = '';
    todos.forEach((todo, index) => {
        const todoItem = document.createElement('li');
        todoItem.className = 'todo-item';
        todoItem.innerHTML = `<input type="checkbox" data-index="${index}" ${todo.completed ? 'checked' : ''}><span class="todo-text ${todo.completed ? 'todo-completed' : ''}">${todo.text}</span><button class="delete-btn" data-index="${index}"><i class="fas fa-times"></i></button>`;
        todoList.appendChild(todoItem);
    });
}

function handleTodoSubmit(e) {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (text) {
        let todos = JSON.parse(localStorage.getItem('todos')) || [];
        todos.push({ text, completed: false });
        localStorage.setItem('todos', JSON.stringify(todos));
        todoInput.value = '';
        loadTodos();
    }
}

todoList.addEventListener('click', (e) => {
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    const index = e.target.dataset.index;
    if (e.target.type === 'checkbox') {
        todos[index].completed = e.target.checked;
    }
    if (e.target.classList.contains('delete-btn') || e.target.parentElement.classList.contains('delete-btn')) {
        todos.splice(index, 1);
    }
    localStorage.setItem('todos', JSON.stringify(todos));
    loadTodos();
});

// *** FIXED: Restored simulated data functions ***
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

function loadStockWatchlist() {
    const stockData = [
        { symbol: "AAPL", price: 176.55, change: 2.35 },
        { symbol: "MSFT", price: 337.69, change: -1.24 },
        { symbol: "GOOGL", price: 130.73, change: 0.85 },
        { symbol: "AMZN", price: 139.97, change: 3.21 },
        { symbol: "TSLA", price: 240.45, change: -7.63 }
    ];
    watchlistContainer.innerHTML = stockData.map(stock => {
        const isPositive = stock.change >= 0;
        return `
            <div class="stock-item">
                <div class="stock-info">
                    <div class="stock-symbol">${stock.symbol}</div>
                </div>
                <div class="stock-pricing">
                    <div class="stock-price">$${stock.price.toFixed(2)}</div>
                    <div class="stock-change ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '+' : ''}${stock.change.toFixed(2)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderCalendar() {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    let calendarHTML = `
        <div class="calendar-header">
            <div class="calendar-month">${monthNames[month]} ${year}</div>
        </div>
        <div class="calendar-grid">
    `;
    const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
    weekdays.forEach(day => {
        calendarHTML += `<div class="calendar-day calendar-weekday">${day}</div>`;
    });

    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = i === today.getDate() ? 'current-date' : '';
        calendarHTML += `<div class="calendar-day"><div class="calendar-date ${isToday}">${i}</div></div>`;
    }

    calendarHTML += '</div>';
    calendarContainer.innerHTML = calendarHTML;
}

// --- START THE APP ---
init();
