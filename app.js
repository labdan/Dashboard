// app.js

// --- CONFIGURATION ---
if (typeof config === 'undefined') {
    alert("Configuration file (config.js) is missing or not loaded.");
}
const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = config.supabase;
const CACHE_DURATION = 30 * 60 * 1000;
const PORTFOLIO_CACHE_DURATION = 5 * 60 * 1000;
const INSTRUMENT_CACHE_DURATION = 24 * 60 * 60 * 1000;

// --- SUPABASE CLIENT ---
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM ELEMENTS ---
const loginPage = document.getElementById('login-page');
const dashboardContainer = document.getElementById('dashboard-container');
const loginBtn = document.getElementById('login-btn');
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
const themeToggleBtn = document.getElementById('theme-toggle');
const sideNewsContainer = document.getElementById('side-news-container');
const twitterFeedContainer = document.getElementById('twitter-feed-container');
const eventsContainer = document.getElementById('events-container');

// Auth DOM Elements
const userProfileElement = document.getElementById('user-profile');
const userAvatarElement = document.getElementById('user-avatar');
const userNameElement = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const mobileAuthContainer = document.querySelector('.auth-container-mobile');

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

// --- INITIALIZATION ---
async function init() {
    handleAuthCallback();
    await checkLoginStatus();
    setupEventListeners();
}

function setupEventListeners() {
    loginBtn.addEventListener('click', () => window.location.href = '/.netlify/functions/auth-google');
    logoutBtn.addEventListener('click', handleLogout);
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
            localStorage.removeItem('instrumentCache'); 
            loadStockWatchlist();
        }
    });
    todoList.addEventListener('click', handleTodoClick);
    themeToggleBtn.addEventListener('click', toggleTheme);
}

// --- AUTHENTICATION ---
async function checkLoginStatus() {
    const accessToken = localStorage.getItem('google_access_token');
    if (accessToken) {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) {
                if (response.status === 401) {
                    await refreshAccessToken();
                    return; // The refresh function will re-trigger a check
                }
                throw new Error('Failed to fetch user info');
            }
            const user = await response.json();
            showDashboard(user);
        } catch (error) {
            console.error("Login check failed:", error);
            showLoginPage();
        }
    } else {
        showLoginPage();
    }
}

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('google_refresh_token');
    if (!refreshToken) {
        handleLogout();
        return;
    }
    try {
        const response = await fetch(`/.netlify/functions/auth-google-refresh?refresh_token=${refreshToken}`);
        if (!response.ok) throw new Error('Failed to refresh token');
        const data = await response.json();
        localStorage.setItem('google_access_token', data.access_token);
        await checkLoginStatus(); // Re-check status after successful refresh
    } catch (error) {
        console.error("Could not refresh token:", error);
        handleLogout();
    }
}

function showDashboard(user) {
    loginPage.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');

    // Populate user info in both desktop and mobile containers
    userNameElement.textContent = "Dan Labcovsky"; // Hardcoded name
    userAvatarElement.src = user.picture;
    
    // Clone the profile for mobile view
    const mobileProfile = userProfileElement.cloneNode(true);
    mobileProfile.id = 'user-profile-mobile';
    mobileAuthContainer.innerHTML = ''; // Clear previous
    mobileAuthContainer.appendChild(mobileProfile);
    mobileProfile.querySelector('.auth-btn').addEventListener('click', handleLogout);

    loadDashboardContent();
}

function showLoginPage() {
    loginPage.classList.remove('hidden');
    dashboardContainer.classList.add('hidden');
}

function handleLogout() {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_refresh_token');
    showLoginPage();
}

function handleAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
        localStorage.setItem('google_access_token', accessToken);
        localStorage.setItem('google_refresh_token', refreshToken);
        window.history.replaceState({}, document.title, "/");
    }
}

// --- CONTENT LOADING ---
function loadDashboardContent() {
    applySavedTheme();
    updateTimeAndDate();
    setInterval(updateTimeAndDate, 1000);
    updateQuote();
    setInterval(updateQuote, 10000);
    loadQuickLinks();
    getWeather();
    loadStockNews();
    loadStockWatchlist();
    loadSideNews();
    loadXFeed();
    loadTodos();
    subscribeToTodoChanges();
    loadUpcomingEvents();
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

// --- SIDEBAR NEWS (Seeking Alpha + Highlight) ---
async function loadSideNews() {
    // ... (rest of the function is unchanged)
}

// --- X.COM FEED (with Supabase Caching) ---
async function loadXFeed() {
    if (!twitterFeedContainer) return;
    twitterFeedContainer.innerHTML = '<p style="padding: 20px; text-align: center;">Loading Feed...</p>';

    try {
        const response = await fetch(`/.netlify/functions/get-list-tweets`);
        if (!response.ok) throw new Error('Failed to fetch tweets from serverless function.');
        
        const tweetsData = await response.json();
        renderXFeed(tweetsData);

    } catch (error) {
        console.error('Error loading X Feed:', error);
        twitterFeedContainer.innerHTML = '<p style="padding: 20px; text-align: center;">Could not load feed.</p>';
    }
}

function renderXFeed(tweetsData) {
    // ... (rest of the function is unchanged)
}

// --- TO-DO LIST (with Supabase) ---
async function loadTodos() {
    // ... (rest of the function is unchanged)
}
async function handleTodoSubmit(e) {
    // ... (rest of the function is unchanged)
}
async function handleTodoClick(e) {
    // ... (rest of the function is unchanged)
}
function subscribeToTodoChanges() {
    // ... (rest of the function is unchanged)
}

// --- WEATHER ---
async function getWeather() {
    // ... (rest of the function is unchanged)
}

function updateWeatherUI(data) {
    // ... (rest of the function is unchanged)
}

// --- GOOGLE CALENDAR ---
async function loadUpcomingEvents() {
    eventsContainer.innerHTML = '<p>Loading events...</p>';
    try {
        const accessToken = localStorage.getItem('google_access_token');
        if (!accessToken) throw new Error("Not logged in");

        const response = await fetch('/.netlify/functions/get-google-events', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                await refreshAccessToken();
                return; // Refresh will trigger a reload
            }
            throw new Error(`Failed to fetch events: ${response.statusText}`);
        }
        
        const { events, holidays } = await response.json();
        
        const processedEvents = processRecurringEvents([...events, ...holidays]);
        
        renderUpcomingEvents(processedEvents);
        renderMiniCalendar(processedEvents);

    } catch (error) {
        console.error("Error loading calendar events:", error);
        eventsContainer.innerHTML = '<p>Could not load calendar events.</p>';
        renderMiniCalendar();
    }
}

function processRecurringEvents(items) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const processed = items.map(event => {
        // If it's a recurring event (no year in date string, typical for birthdays)
        if (event.start.date && event.start.date.length === 10 && event.recurrence) {
            const [year, month, day] = event.start.date.split('-').map(Number);
            
            let nextOccurrence = new Date(today.getFullYear(), month - 1, day);
            
            // If this year's occurrence has already passed, set it to next year
            if (nextOccurrence < today) {
                nextOccurrence.setFullYear(today.getFullYear() + 1);
            }
            
            return {
                ...event,
                sortDate: nextOccurrence
            };
        }
        // For regular, non-recurring events
        return {
            ...event,
            sortDate: new Date(event.start.dateTime || event.start.date)
        };
    });

    // Sort all events by their actual or calculated next occurrence date
    return processed.sort((a, b) => a.sortDate - b.sortDate);
}


function renderUpcomingEvents(events) {
    if (!events || events.length === 0) {
        eventsContainer.innerHTML = '<p>No upcoming events found.</p>';
        return;
    }

    // Display only the next 5 events
    let eventsHTML = '';
    events.slice(0, 5).forEach(event => {
        const start = event.start.dateTime || event.start.date;
        const eventDate = new Date(start);
        const timeString = event.start.dateTime ? eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All-day';
        
        eventsHTML += `
            <div class="event-item">
                <div class="event-title">${event.summary}</div>
                <div class="event-time">${eventDate.toLocaleDateString()} - ${timeString}</div>
            </div>
        `;
    });
    eventsContainer.innerHTML = eventsHTML;
}

// --- OTHER UI FUNCTIONS ---
function updateTimeAndDate() {
    // ... (rest of the function is unchanged)
}

function renderMiniCalendar(events = []) {
    // ... (rest of the function is unchanged)
}

function updateQuote() {
    // ... (rest of the function is unchanged)
}

function handleSearch() {
    // ... (rest of the function is unchanged)
}

function setSearchEngine(engine) {
    // ... (rest of the function is unchanged)
}

async function loadQuickLinks() {
    const { data, error } = await supabaseClient.from('quick_links').select('*').order('sort_order');

    if (error) {
        console.error('Error fetching quick links:', error);
        quickLinksContainer.innerHTML = 'Could not load quick links.';
        return;
    }

    const links = data.filter(link => !link.parent_id);
    const subLinks = data.filter(link => link.parent_id);

    quickLinksContainer.innerHTML = '';

    links.forEach(link => {
        const linkItemWrapper = document.createElement('div');
        linkItemWrapper.className = 'link-item';
        
        const iconHTML = link.icon_url.startsWith('fas') || link.icon_url.startsWith('fab')
            ? `<i class="${link.icon_url}"></i>`
            : `<img src="${link.icon_url}" alt="${link.name} icon" onerror="this.src='https://www.google.com/favicon.ico'">`;

        const childLinks = subLinks.filter(sub => sub.parent_id === link.id);

        if (childLinks.length > 0) {
            const subLinksHTML = childLinks.map(sub => {
                const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(sub.url).hostname}&sz=32`;
                return `<a href="${sub.url}" class="link-item" target="_blank" title="${sub.name}"><div class="link-icon"><img src="${faviconUrl}" alt="${sub.name} icon" onerror="this.src='https://www.google.com/favicon.ico'"></div><span class="link-name">${sub.name}</span></a>`;
            }).join('');
            linkItemWrapper.innerHTML = `<div class="link-icon">${iconHTML}</div><span class="link-name">${link.name}</span><div class="popup-menu">${subLinksHTML}</div>`;
        } else {
            // FIX: Create an anchor tag and append it
            const anchor = document.createElement('a');
            anchor.href = link.url;
            anchor.target = "_blank";
            anchor.title = link.name;
            // The anchor itself doesn't get the link-item class, its parent does.
            anchor.innerHTML = `<div class="link-icon">${iconHTML}</div><span class="link-name">${link.name}</span>`;
            linkItemWrapper.appendChild(anchor);
        }
        quickLinksContainer.appendChild(linkItemWrapper);
    });
}

function loadStockNews() {
    // ... (rest of the function is unchanged)
}

// --- STOCK WATCHLIST ---
async function getInstrumentDictionary() {
    // ... (rest of the function is unchanged)
}

async function loadStockWatchlist() {
    // ... (rest of the function is unchanged)
}

function renderPortfolio(data, error = null) {
    // ... (rest of the function is unchanged)
}

// --- START THE APP ---
init();
