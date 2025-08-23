// Default quick links
const defaultLinks = [
    { name: "Gmail", url: "https://mail.google.com", icon: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico" },
    { name: "Drive", url: "https://drive.google.com", icon: "https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png" },
    { name: "Calendar", url: "https://calendar.google.com", icon: "https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_3_2x.png" },
    { name: "YouTube", url: "https://youtube.com", icon: "https://www.youtube.com/s/desktop/014dbbed/img/favicon_48x48.png" },
    { name: "GitHub", url: "https://github.com", icon: "https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png" },
    { name: "Twitter", url: "https://twitter.com", icon: "https://abs.twimg.com/favicons/twitter.ico" }
];

// Inspirational quotes
const inspirationalQuotes = [
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Innovation distinguishes between a leader and a follower. - Steve Jobs",
    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
    "The way to get started is to quit talking and begin doing. - Walt Disney"
];

// DOM Elements
const timeElement = document.getElementById('time');
const dateElement = document.getElementById('date');
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
const uvIndexElement = document.getElementById('uv-index');
const aqiIndexElement = document.getElementById('aqi-index');
const forecastContainer = document.getElementById('weather-forecast');


// Current search engine
let currentSearchEngine = 'google';

// Initialize
function init() {
    updateTimeAndDate();
    setInterval(updateTimeAndDate, 1000);
    loadQuickLinks();
    loadTodos();
    loadStockNews();
    loadStockWatchlist();
    renderCalendar();
    getWeather();
    updateQuote();
    setInterval(updateQuote, 10000); // Change quote every 10 seconds
    
    // Event listeners
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    todoForm.addEventListener('submit', handleTodoSubmit);
    
    searchEngineIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            setSearchEngine(e.currentTarget.dataset.engine);
        });
    });
}

// Set search engine
function setSearchEngine(engine) {
    currentSearchEngine = engine;
    searchEngineIcons.forEach(icon => {
        icon.classList.toggle('active', icon.dataset.engine === engine);
    });
}

// Update inspirational quote
function updateQuote() {
    const randomIndex = Math.floor(Math.random() * inspirationalQuotes.length);
    quoteElement.style.opacity = 0;
    setTimeout(() => {
        quoteElement.textContent = `"${inspirationalQuotes[randomIndex]}"`;
        quoteElement.style.opacity = 1;
    }, 500);
}

// Time and Date
function updateTimeAndDate() {
    const now = new Date();
    timeElement.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    dateElement.textContent = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Weather API using WeatherAPI.com
async function getWeather() {
    try {
        const API_KEY = 'a8738626a12544bd91d100412252308';
        const LOCATION = 'Berlin';
        // Use the forecast endpoint to get more data
        const response = await fetch(
            `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(LOCATION)}&days=4&aqi=yes&alerts=no`
        );
        
        if (!response.ok) throw new Error('Weather API response was not ok');
        
        const data = await response.json();
        
        // Update Current Weather
        weatherTemp.textContent = `${Math.round(data.current.temp_c)}°C`;
        weatherDesc.textContent = data.current.condition.text;
        weatherIconImg.src = `https:${data.current.condition.icon}`;
        weatherIconImg.alt = data.current.condition.text;

        // Update Extra Info
        uvIndexElement.textContent = data.current.uv;
        aqiIndexElement.textContent = Math.round(data.current.air_quality.pm2_5);

        // Update Forecast
        forecastContainer.innerHTML = ''; // Clear previous forecast
        data.forecast.forecastday.slice(1).forEach(day => { // slice(1) to get next 3 days
            const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <div class="forecast-day">${dayName}</div>
                <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
                <div class="forecast-temp">${Math.round(day.day.maxtemp_c)}°</div>
            `;
            forecastContainer.appendChild(forecastItem);
        });

    } catch (error) {
        console.error('Error getting weather:', error);
        weatherDesc.textContent = 'Weather unavailable';
    }
}

// Search functionality
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

// Quick Links
function loadQuickLinks() {
    let links = JSON.parse(localStorage.getItem('quickLinks')) || defaultLinks;
    quickLinksContainer.innerHTML = links.map(link => `
        <a href="${link.url}" class="link-item" target="_blank" title="${link.name}">
            <div class="link-icon">
                <img src="${link.icon}" alt="${link.name} icon" onerror="this.src='https://www.google.com/favicon.ico'">
            </div>
            <span class="link-name">${link.name}</span>
        </a>
    `).join('');
}

// To-Do List
function loadTodos() {
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    todoList.innerHTML = '';
    todos.forEach((todo, index) => {
        const todoItem = document.createElement('li');
        todoItem.className = 'todo-item';
        todoItem.innerHTML = `
            <input type="checkbox" data-index="${index}" ${todo.completed ? 'checked' : ''}>
            <span class="todo-text ${todo.completed ? 'todo-completed' : ''}">${todo.text}</span>
            <button class="delete-btn" data-index="${index}"><i class="fas fa-times"></i></button>
        `;
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

// Stock News (Simulated)
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

// Stock Watchlist (Simulated)
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

// Calendar (Simulated)
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

// Initialize the dashboard
init();
