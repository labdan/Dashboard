// app.js

// --- CONFIGURATION ---
if (typeof config === 'undefined') {
    alert("Configuration file (config.js) is missing or not loaded.");
}
const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = config.supabase;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for weather cache

// --- SUPABASE CLIENT ---
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
const weatherIconImg = document.getElementById('weather-icon-img');
const weatherTemp = document.querySelector('.weather-temperature');
const weatherDesc = document.querySelector('.weather-description');
const sunriseElement = document.getElementById('sunrise-time');
const sunsetElement = document.getElementById('sunset-time');
const uvIndexElement = document.getElementById('uv-index');
const refreshWeatherBtn = document.getElementById('refresh-weather');

// --- STATE ---
let currentSearchEngine = 'google';
// For now, we'll use a hardcoded user ID.
// In a real app, this would come from Supabase Auth: supabase.auth.user().id
const USER_ID = '12345678-1234-1234-1234-1234567890ab'; 

// --- INITIALIZATION ---
async function init() {
    if (!SUPABASE_URL || SUPABASE_URL.includes('YOUR_SUPABASE_URL')) {
        alert("Supabase URL is not set in config.js. To-Do list will not work.");
    }

    // UI Updates
    updateTimeAndDate();
    setInterval(updateTimeAndDate, 1000);
    updateQuote();
    setInterval(updateQuote, 10000);
    renderMiniCalendar();
    
    // Load Content
    loadQuickLinks();
    getWeather();
    loadStockNews();
    loadStockWatchlist();
    renderCalendar();
    
    // Load and subscribe to To-Do list changes
    await loadTodos();
    subscribeToTodoChanges();

    // Event Listeners
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
    todoList.addEventListener('click', handleTodoClick);
}

// --- TO-DO LIST (with Supabase) ---

async function loadTodos() {
    const { data: todos, error } = await supabase
        .from('todos')
        .select('*')
        //.eq('user_id', USER_ID) // Uncomment this line when you have user auth
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching todos:', error);
        return;
    }

    todoList.innerHTML = ''; // Clear current list
    todos.forEach(todo => {
        const todoItem = document.createElement('li');
        todoItem.className = 'todo-item';
        todoItem.dataset.id = todo.id;
        todoItem.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.is_complete ? 'checked' : ''}>
            <span class="todo-text ${todo.is_complete ? 'todo-completed' : ''}">${todo.task}</span>
            <button class="delete-btn"><i class="fas fa-times"></i></button>
        `;
        todoList.appendChild(todoItem);
    });
}

async function handleTodoSubmit(e) {
    e.preventDefault();
    const taskText = todoInput.value.trim();
    if (taskText) {
        const { error } = await supabase
            .from('todos')
            .insert({ task: taskText, user_id: USER_ID });
        
        if (error) {
            console.error('Error adding todo:', error);
        } else {
            todoInput.value = '';
        }
    }
}

async function handleTodoClick(e) {
    const item = e.target.closest('.todo-item');
    if (!item) return;

    const todoId = item.dataset.id;
    const isComplete = item.querySelector('.todo-checkbox').checked;

    // Toggle completion status
    if (e.target.matches('.todo-checkbox, .todo-text')) {
        await supabase
            .from('todos')
            .update({ is_complete: isComplete })
            .eq('id', todoId);
    }

    // Delete task
    if (e.target.closest('.delete-btn')) {
        await supabase
            .from('todos')
            .delete()
            .eq('id', todoId);
    }
}

function subscribeToTodoChanges() {
    supabase.channel('todos')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, payload => {
            loadTodos(); // Reload the list on any change
        })
        .subscribe();
}


// --- OTHER FUNCTIONS ---

function loadQuickLinks() { /* Same as before */ }
async function getWeather() { /* Same as before */ }
function updateWeatherUI(data) { /* Same as before */ }
function updateTimeAndDate() { /* Same as before */ }
function renderMiniCalendar() { /* Same as before */ }
function updateQuote() { /* Same as before */ }
function handleSearch() { /* Same as before */ }
function setSearchEngine(engine) { /* Same as before */ }
function loadStockNews() { /* Same as before */ }
function loadStockWatchlist() { /* Same as before */ }
function renderCalendar() { /* Same as before */ }

// Re-add the placeholder functions that were removed
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
    ];
    watchlistContainer.innerHTML = stockData.map(stock => {
        const isPositive = stock.change >= 0;
        return `
            <div class="stock-item">
                <div class="stock-info"><div class="stock-symbol">${stock.symbol}</div></div>
                <div class="stock-pricing">
                    <div class="stock-price">$${stock.price.toFixed(2)}</div>
                    <div class="stock-change ${isPositive ? 'positive' : 'negative'}">${isPositive ? '+' : ''}${stock.change.toFixed(2)}</div>
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
