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
const benzingaFeedContainer = document.getElementById('benzinga-feed-container');
const eventsContainer = document.getElementById('events-container');

// Main Layout Elements
const mainDashboard = document.getElementById('main-dashboard');
const loginPageContainer = document.querySelector('.login-page-container');

// Auth DOM Elements
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userProfileElement = document.getElementById('user-profile');
const userAvatarElement = document.getElementById('user-avatar');
const userNameElement = document.getElementById('user-name');
const settingsIcon = document.querySelector('.settings-icon');

// Settings Modal DOM Elements
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const saveQuickLinksBtn = document.getElementById('save-quick-links-btn');
const quickLinksEditor = document.getElementById('quick-links-editor');
const addQuickLinkBtn = document.getElementById('add-quick-link-btn');

// Editor DOM Elements
const saveNoteBtn = document.getElementById('save-note-btn');
const saveStatus = document.getElementById('save-status');


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
let calendarDisplayDate = new Date();
let allUserEvents = []; // Cache for calendar events to prevent re-fetching
const USER_ID = '12345678-12321-1234-1234567890ab'; 
let linkIdsToDelete = []; // For settings editor
let quillEditor; // To hold the editor instance
let saveTimeout; // To manage auto-saving

// --- INITIALIZATION ---
async function init() {
    applySavedTheme();
    updateClock();
    setInterval(updateClock, 1000);
    updateDateDisplay(); // Renders calendar for the current month
    updateQuote();
    setInterval(updateQuote, 10000);
    
    setupEventListeners();
    await checkLoginStatus();
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
    prevMonthBtn.addEventListener('click', () => {
        calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() - 1);
        updateDateDisplay();
    });
    nextMonthBtn.addEventListener('click', () => {
        calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() + 1);
        updateDateDisplay();
    });
    // Settings Modal Listeners
    if (settingsIcon) settingsIcon.addEventListener('click', openQuickLinksEditor);
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
    if (settingsModal) settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) settingsModal.classList.add('hidden'); });
    if (saveQuickLinksBtn) saveQuickLinksBtn.addEventListener('click', saveQuickLinks);
    if (addQuickLinkBtn) addQuickLinkBtn.addEventListener('click', () => addQuickLinkRow());

    // Editor Listener
    if(saveNoteBtn) saveNoteBtn.addEventListener('click', saveNote);
}

// --- AUTHENTICATION ---
async function checkLoginStatus() {
    const accessToken = localStorage.getItem('google_access_token');
    if (!accessToken) {
        showLoginPage();
        return;
    }

    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (response.ok) {
            const user = await response.json();
            showUserProfile(user);
            loadLoggedInContent();
        } else if (response.status === 401) {
            await refreshAccessToken();
            await checkLoginStatus(); 
        } else {
            throw new Error('Failed to fetch user info');
        }
    } catch (error) {
        console.error("Login check failed:", error);
        handleLogout();
    }
}


async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('google_refresh_token');
    if (!refreshToken) {
        throw new Error("No refresh token available.");
    }
    try {
        const response = await fetch(`/.netlify/functions/auth-google-refresh?refresh_token=${refreshToken}`);
        if (!response.ok) throw new Error('Failed to refresh token');
        const data = await response.json();
        localStorage.setItem('google_access_token', data.access_token);
    } catch (error) {
        console.error("Could not refresh token:", error);
        throw error;
    }
}


function showUserProfile(user) {
    userNameElement.textContent = user.name;
    userAvatarElement.src = user.picture;
    mainDashboard.classList.remove('hidden');
    loginPageContainer.classList.add('hidden');
}

function showLoginPage() {
    mainDashboard.classList.add('hidden');
    loginPageContainer.classList.remove('hidden');
    if(eventsContainer) eventsContainer.innerHTML = '';
    if(watchlistContainer) watchlistContainer.innerHTML = '';
    if(sideNewsContainer) sideNewsContainer.innerHTML = '';
    if(benzingaFeedContainer) benzingaFeedContainer.innerHTML = '';
    if(todoList) todoList.innerHTML = '';
}

function handleLogout() {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_refresh_token');
    showLoginPage();
}

// --- CONTENT LOADING (for logged-in users) ---
function loadLoggedInContent() {
    loadQuickLinks();
    getWeather();
    loadStockWatchlist();
    loadSideNews();
    loadBenzingaFeed();
    loadTodos();
    subscribeToTodoChanges();
    loadUpcomingEvents(); // Fetches events and renders calendar
    initializeEditor(); // Initialize the new editor
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

// --- NEWS FEEDS ---
async function loadSideNews() {
    if (!sideNewsContainer) return;
    try {
        const response = await fetch('/.netlify/functions/get-stock-news');
        if (!response.ok) throw new Error(`News function failed: ${response.statusText}`);
        const data = await response.json();
        if(!data.articles || data.articles.length === 0) {
            sideNewsContainer.innerHTML = `<p style="padding: 20px;">No news available.</p>`;
            return;
        }
        sideNewsContainer.innerHTML = data.articles.map(article => `
            <div class="news-item">
                <a href="${article.link}" class="news-title" target="_blank" rel="noopener noreferrer">${article.title}</a>
                <div class="news-date">${new Date(article.pubDate).toLocaleString()}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching side news:', error.message);
        sideNewsContainer.innerHTML = `<div class="error-message" style="padding: 20px;">Could not load news.</div>`;
    }
}

async function loadBenzingaFeed() {
    if (!benzingaFeedContainer) return;
    try {
        const response = await fetch('/.netlify/functions/get-benzinga-news');
        if (!response.ok) throw new Error(`Benzinga function failed: ${response.statusText}`);
        const data = await response.json();
        if(!data.articles || data.articles.length === 0) {
            benzingaFeedContainer.innerHTML = `<p style="padding: 20px;">No news available.</p>`;
            return;
        }
        benzingaFeedContainer.innerHTML = data.articles.map(article => `
            <div class="news-item">
                <a href="${article.link}" class="news-title" target="_blank" rel="noopener noreferrer">${article.title}</a>
                <div class="news-date">${new Date(article.pubDate).toLocaleString()}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching Benzinga news:', error.message);
        benzingaFeedContainer.innerHTML = `<div class="error-message" style="padding: 20px;">Could not load news.</div>`;
    }
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
    if (data.aiAssistant && data.aiAssistant.answer) {
        chanceOfRainElement.textContent = data.aiAssistant.answer;
    } else {
        chanceOfRainElement.textContent = "AI weather assistant unavailable.";
    }
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
                await loadUpcomingEvents();
                return;
            }
            throw new Error(`Failed to fetch events: ${response.statusText}`);
        }
        const { events, holidays } = await response.json();
        allUserEvents = [...events, ...holidays]; // Cache the events
        renderUpcomingEvents(allUserEvents);
        renderMiniCalendar(allUserEvents, calendarDisplayDate);
    } catch (error) {
        console.error("Error loading calendar events:", error);
        allUserEvents = [];
        renderUpcomingEvents([]);
        renderMiniCalendar([], calendarDisplayDate);
    }
}

function renderUpcomingEvents(events) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureEvents = events
        .map(event => {
            const start = new Date(event.start.dateTime || event.start.date);
            if (event.start.date) {
                start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
            }
            return { ...event, startDate: start };
        })
        .filter(event => event.startDate >= today)
        .sort((a, b) => a.startDate - b.startDate);
    
    if (futureEvents.length === 0) {
        eventsContainer.innerHTML = '<p>No upcoming events found.</p>';
    } else {
        eventsContainer.innerHTML = futureEvents.map(event => {
            const timeString = event.start.dateTime 
                ? event.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                : 'All-day';
            return `
                <div class="event-item">
                    <div class="event-title">${event.summary}</div>
                    <div class="event-time">${event.startDate.toLocaleDateString()} - ${timeString}</div>
                </div>
            `;
        }).join('');
    }
}

// --- TIME, DATE, & CALENDAR UI ---
function updateClock() {
    const now = new Date();
    timeElement.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function updateDateDisplay() {
    dateElement.textContent = calendarDisplayDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    renderMiniCalendar(allUserEvents, calendarDisplayDate); // Re-render calendar with new date using cached events
}

function renderMiniCalendar(events = [], displayDate) {
    const today = new Date();
    const month = displayDate.getMonth();
    const year = displayDate.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDay = (firstDayOfMonth.getDay() + 6) % 7;

    const eventDays = new Set(events.map(event => {
        const eventDate = new Date(event.start.date || event.start.dateTime);
        if (eventDate.getMonth() === month && eventDate.getFullYear() === year) {
            return eventDate.getDate();
        }
        return null;
    }).filter(Boolean));

    let calendarHTML = '';
    const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    dayNames.forEach(day => { calendarHTML += `<div class="mini-calendar-cell mini-calendar-day-name">${day}</div>`; });
    for (let i = 0; i < startingDay; i++) { calendarHTML += `<div class="mini-calendar-cell"></div>`; }
    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear() ? 'current' : '';
        const hasEvent = eventDays.has(i) ? 'has-event' : '';
        calendarHTML += `<div class="mini-calendar-cell mini-calendar-day-number ${isToday} ${hasEvent}">${i}</div>`;
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

// --- QUICK LINKS ---
async function loadQuickLinks() {
    const { data, error } = await supabaseClient.from('quick_links').select('*').order('sort_order');
    
    if (error) {
        console.error('Error fetching quick links:', error.message);
        quickLinksContainer.innerHTML = `<p style="font-size: 0.8rem; opacity: 0.7;">Error: ${error.message}</p>`;
        return;
    }
    if (!data || data.length === 0) {
        quickLinksContainer.innerHTML = '<p style="font-size: 0.8rem; opacity: 0.7;">No quick links configured.</p>';
        return;
    }
    
    const links = data.filter(link => !link.parent_id);
    const subLinks = data.filter(link => link.parent_id);
    quickLinksContainer.innerHTML = '';

    links.forEach(link => {
        try {
            let iconSrc;
            const fallbackSrc = 'nostockimg.png';

            // If it's a parent link (no URL), use the local icon convention.
            if (!link.url) {
                const iconName = link.name.toLowerCase().replace(/\s+/g, '');
                iconSrc = `${iconName}.ico`;
            } 
            // Otherwise, it's a child link, so fetch its favicon.
            else {
                try {
                    const hostname = new URL(link.url).hostname;
                    iconSrc = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
                } catch (e) {
                    iconSrc = fallbackSrc; // Use fallback if URL is invalid
                }
            }

            const iconHTML = `<img src="${iconSrc}" alt="${link.name} icon" onerror="this.onerror=null; this.src='${fallbackSrc}'">`;
            
            const childLinks = subLinks.filter(sub => sub.parent_id === link.id);

            if (childLinks.length > 0) {
                const linkItemWrapper = document.createElement('div');
                linkItemWrapper.className = 'link-item';
                const subLinksHTML = childLinks.map(sub => {
                    let faviconUrl = fallbackSrc;
                    try {
                        const hostname = new URL(sub.url).hostname;
                        faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
                    } catch (e) { console.error(`Invalid URL for sub-link '${sub.name}': ${sub.url}`); }
                    
                    return `<a href="${sub.url}" class="link-item" target="_blank" rel="noopener noreferrer" title="${sub.name}"><div class="link-icon"><img src="${faviconUrl}" alt="${sub.name} icon" onerror="this.onerror=null;this.src='${fallbackSrc}';"></div><span class="link-name">${sub.name}</span></a>`;
                }).join('');
                linkItemWrapper.innerHTML = `<div class="link-icon">${iconHTML}</div><span class="link-name">${link.name}</span><div class="popup-menu">${subLinksHTML}</div>`;
                quickLinksContainer.appendChild(linkItemWrapper);
            } 
            else {
                const anchor = document.createElement('a');
                anchor.className = 'link-item';
                anchor.href = link.url;
                anchor.target = "_blank";
                anchor.rel = "noopener noreferrer";
                anchor.title = link.name;
                anchor.innerHTML = `<div class="link-icon">${iconHTML}</div><span class="link-name">${link.name}</span>`;
                quickLinksContainer.appendChild(anchor);
            }
        } catch (e) {
            console.error(`Failed to render quick link '${link.name}'. Please check its data in the database.`, e);
        }
    });
}

// --- QUICK LINKS EDITOR ---
async function openQuickLinksEditor() {
    const { data, error } = await supabaseClient.from('quick_links').select('*').order('sort_order');
    if (error) {
        alert('Could not load links for editing. See console for details.');
        console.error(error);
        return;
    }

    linkIdsToDelete = [];
    quickLinksEditor.innerHTML = '';
    data.forEach(link => addQuickLinkRow(link));
    settingsModal.classList.remove('hidden');
}

function addQuickLinkRow(link = {}) {
    const row = document.createElement('div');
    row.className = 'quick-link-edit-row';
    row.dataset.id = link.id || `new-${Date.now()}`;
    
    row.innerHTML = `
        <input type="text" class="ql-input" data-field="name" placeholder="Name" value="${link.name || ''}">
        <input type="text" class="ql-input" data-field="url" placeholder="URL (optional for parent)" value="${link.url || ''}">
        <input type="number" class="ql-input ql-input-small" data-field="sort_order" placeholder="Order" value="${link.sort_order || '0'}">
        <button class="delete-link-btn"><i class="fas fa-trash"></i></button>
    `;

    row.querySelector('.delete-link-btn').addEventListener('click', () => {
        if (link.id) {
            linkIdsToDelete.push(link.id);
        }
        row.remove();
    });

    quickLinksEditor.appendChild(row);
}

async function saveQuickLinks() {
    saveQuickLinksBtn.textContent = 'Saving...';
    saveQuickLinksBtn.disabled = true;

    // First, handle deletions
    if (linkIdsToDelete.length > 0) {
        const { error: deleteError } = await supabaseClient
            .from('quick_links')
            .delete()
            .in('id', linkIdsToDelete);
        
        if (deleteError) {
            alert('Error deleting links. See console for details.');
            console.error(deleteError);
            saveQuickLinksBtn.textContent = 'Save Changes';
            saveQuickLinksBtn.disabled = false;
            return;
        }
    }

    // Next, separate items to be updated from items to be inserted
    const rows = quickLinksEditor.querySelectorAll('.quick-link-edit-row');
    const updateData = [];
    const insertData = [];

    rows.forEach(row => {
        const id = row.dataset.id;
        const linkData = {
            name: row.querySelector('[data-field="name"]').value,
            url: row.querySelector('[data-field="url"]').value || null,
            sort_order: parseInt(row.querySelector('[data-field="sort_order"]').value) || 0,
        };
        
        if (id.startsWith('new-')) {
            insertData.push(linkData);
        } else {
            linkData.id = parseInt(id);
            updateData.push(linkData);
        }
    });

    // Perform the database operations
    try {
        if (updateData.length > 0) {
            const { error } = await supabaseClient.from('quick_links').update(updateData).in('id', updateData.map(d => d.id));
            if (error) throw error;
        }
        if (insertData.length > 0) {
            const { error } = await supabaseClient.from('quick_links').insert(insertData);
            if (error) throw error;
        }
    } catch (upsertError) {
        alert('Error saving links. See console for details.');
        console.error(upsertError);
        saveQuickLinksBtn.textContent = 'Save Changes';
        saveQuickLinksBtn.disabled = false;
        return;
    }

    saveQuickLinksBtn.textContent = 'Save Changes';
    saveQuickLinksBtn.disabled = false;
    settingsModal.classList.add('hidden');
    await loadQuickLinks();
}


// --- EDITOR ---
async function initializeEditor() {
    const toolbarOptions = [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'clean']
    ];

    quillEditor = new Quill('#editor-container', {
        modules: {
            toolbar: toolbarOptions
        },
        theme: 'snow'
    });

    // Load existing note from database
    const { data, error } = await supabaseClient
        .from('notes')
        .select('content')
        .eq('user_id', USER_ID)
        .single();

    if (error && error.code !== 'PGRST116') { // Ignore "no rows found" error
        console.error('Error loading note:', error);
    }
    if (data) {
        quillEditor.root.innerHTML = data.content;
    }

    // Auto-save on text change
    quillEditor.on('text-change', () => {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveStatus.textContent = 'Typing...';
        saveTimeout = setTimeout(() => {
            saveNote();
        }, 2000); // Auto-save after 2 seconds of inactivity
    });
}

async function saveNote() {
    if (!quillEditor) return;

    const content = quillEditor.root.innerHTML;
    saveStatus.textContent = 'Saving...';

    const { error } = await supabaseClient
        .from('notes')
        .upsert({
            id: 1, // Using a fixed ID for simplicity, assuming one note per user
            user_id: USER_ID,
            content: content,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error('Error saving note:', error);
        saveStatus.textContent = 'Error!';
    } else {
        saveStatus.textContent = `Saved at ${new Date().toLocaleTimeString()}`;
    }
}


// --- STOCK WATCHLIST ---
async function getInstrumentDictionary() {
    const cachedInstruments = JSON.parse(localStorage.getItem('instrumentCache'));
    if (cachedInstruments && (Date.now() - cachedInstruments.timestamp < INSTRUMENT_CACHE_DURATION)) {
        return new Map(cachedInstruments.data);
    }
    try {
        const response = await fetch('/.netlify/functions/get-instruments');
        if (!response.ok) throw new Error('Failed to fetch instrument metadata');
        const instrumentList = await response.json();
        const instrumentMap = new Map(instrumentList.map(item => [item.ticker, item]));
        localStorage.setItem('instrumentCache', JSON.stringify({
            timestamp: Date.now(),
            data: Array.from(instrumentMap.entries())
        }));
        return instrumentMap;
    } catch (error) {
        console.error("Could not load instrument dictionary:", error);
        return new Map();
    }
}


async function loadStockWatchlist() {
    watchlistContainer.innerHTML = '<div style="padding: 20px;">Loading portfolio...</div>';
    try {
        const [instrumentDictionary, portfolioRes, cashRes] = await Promise.all([
            getInstrumentDictionary(),
            fetch('/.netlify/functions/get-portfolio'),
            fetch('/.netlify/functions/get-cash')
        ]);
        if (!portfolioRes.ok) throw new Error(`Portfolio API Error: ${portfolioRes.statusText}`);
        if (!cashRes.ok) throw new Error(`Cash API Error: ${cashRes.statusText}`);
        const portfolioData = await portfolioRes.json();
        const cashData = await cashRes.json();
        const enrichedPortfolio = await Promise.all(portfolioData.map(async (stock) => {
            const instrumentDetails = instrumentDictionary.get(stock.ticker);
            const instrumentName = instrumentDetails ? instrumentDetails.name : stock.ticker;
            const response = await fetch(`/.netlify/functions/enrich-company-details?ticker=${encodeURIComponent(stock.ticker)}&instrumentName=${encodeURIComponent(instrumentName)}`);
            const details = await response.json();
            return { ...stock, companyName: details.name, logoUrl: details.logo_url };
        }));
        const fullPortfolioData = { portfolio: enrichedPortfolio, cash: cashData };
        renderPortfolio(fullPortfolioData);
    } catch (error) {
        console.error('Error fetching stock watchlist:', error);
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
                </div>
            </div>
            <div class="error-message" style="padding: 20px;">
                Could not load portfolio data. <small>Reason: ${error}</small>
            </div>`;
        return;
    }
    if (!data || !data.cash) {
        renderPortfolio(null, "Invalid data structure received from API.");
        return;
    }
    let portfolioData = data.portfolio || [];
    const cashData = data.cash;
    const cashValue = cashData.free || 0;
    const investmentValue = cashData.invested || 0;
    const totalPortfolioValue = cashData.total || 0;
    portfolioData.sort((a, b) => (b.currentPrice * b.quantity) - (a.currentPrice * a.quantity));
    const goals = [
        { label: '25k', value: 25000 },
        { label: '250k', value: 250000 },
        { label: '1M', value: 1000000 }
    ];
    const progressBarsHTML = goals.map(goal => {
        const percentage = Math.min((totalPortfolioValue / goal.value) * 100, 100);
        return `
            <div class="progress-goal">
                <span class="progress-label">${goal.label}</span>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${percentage}%;"></div>
                </div>
            </div>`;
    }).join('');
    let watchlistHTML = `
        <div class="portfolio-header">
             <button class="refresh-btn" id="refresh-portfolio" title="Refresh Portfolio"><i class="fas fa-sync-alt"></i></button>
             <div class="portfolio-title-bar">
                <div class="portfolio-value">
                    <div class="value-title">Value</div>
                    <div class="value-amount">€${totalPortfolioValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div class="portfolio-goals">${progressBarsHTML}</div>
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
            const companyName = stock.companyName;
            const iconUrl = stock.logoUrl;
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
                </div>`;
        });
    }
    watchlistContainer.innerHTML = watchlistHTML;
}

// --- Handle Auth Callback ---
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

// --- START THE APP ---
handleAuthCallback();
init();