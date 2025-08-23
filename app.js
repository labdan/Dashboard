
 
        // Default quick links
        const defaultLinks = [
            { name: "Gmail", url: "https://mail.google.com", icon: "https://www.google.com/favicon.ico" },
            { name: "Drive", url: "https://drive.google.com", icon: "https://www.google.com/favicon.ico" },
            { name: "Calendar", url: "https://calendar.google.com", icon: "https://www.google.com/favicon.ico" },
            { name: "YouTube", url: "https://youtube.com", icon: "https://www.youtube.com/favicon.ico" },
            { name: "GitHub", url: "https://github.com", icon: "https://github.com/favicon.ico" },
            { name: "Twitter", url: "https://twitter.com", icon: "https://abs.twimg.com/favicons/twitter.ico" }
        ];

        // Default stock watchlist
        const defaultStocks = [
            { symbol: "AAPL", name: "Apple Inc." },
            { symbol: "MSFT", name: "Microsoft Corporation" },
            { symbol: "GOOGL", name: "Alphabet Inc." },
            { symbol: "AMZN", name: "Amazon.com Inc." },
            { symbol: "TSLA", name: "Tesla, Inc." }
        ];

        // Sample calendar events
        const sampleEvents = [
            { title: "Team Meeting", time: "10:00 AM", date: new Date().getDate() },
            { title: "Lunch with Client", time: "12:30 PM", date: new Date().getDate() + 1 },
            { title: "Project Deadline", time: "3:00 PM", date: new Date().getDate() + 3 }
        ];

        // Inspirational quotes
        const inspirationalQuotes = [
            "The only way to do great work is to love what you do. - Steve Jobs",
            "Innovation distinguishes between a leader and a follower. - Steve Jobs",
            "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
            "The way to get started is to quit talking and begin doing. - Walt Disney",
            "Your time is limited, so don't waste it living someone else's life. - Steve Jobs",
            "If life were predictable it would cease to be life, and be without flavor. - Eleanor Roosevelt",
            "Life is what happens when you're busy making other plans. - John Lennon",
            "Spread love everywhere you go. - Mother Teresa",
            "When you reach the end of your rope, tie a knot in it and hang on. - Franklin D. Roosevelt",
            "Always remember that you are absolutely unique. Just like everyone else. - Margaret Mead"
        ];

        // Weather icon mapping
        const weatherIconMap = {
            // Clear
            1000: { day: "clear-day.svg", night: "clear-night.svg" },
            // Partly cloudy
            1003: { day: "partly-cloudy-day.svg", night: "partly-cloudy-night.svg" },
            // Cloudy
            1006: "cloudy.svg",
            1009: "cloudy.svg",
            // Overcast
            1030: "overcast.svg",
            1135: "overcast.svg",
            1147: "overcast.svg",
            // Fog
            1063: "fog.svg",
            1072: "fog.svg",
            1150: "fog.svg",
            1153: "fog.svg",
            1168: "fog.svg",
            1171: "fog.svg",
            1180: "fog.svg",
            1183: "fog.svg",
            1186: "fog.svg",
            1189: "fog.svg",
            1192: "fog.svg",
            1195: "fog.svg",
            1198: "fog.svg",
            1201: "fog.svg",
            // Rain
            1240: "rain.svg",
            1243: "rain.svg",
            1246: "rain.svg",
            1249: "rain.svg",
            1252: "rain.svg",
            // Snow
            1066: "snow.svg",
            1069: "snow.svg",
            1114: "snow.svg",
            1117: "snow.svg",
            1204: "snow.svg",
            1207: "snow.svg",
            1210: "snow.svg",
            1213: "snow.svg",
            1216: "snow.svg",
            1219: "snow.svg",
            1222: "snow.svg",
            1225: "snow.svg",
            1237: "snow.svg",
            1255: "snow.svg",
            1258: "snow.svg",
            1261: "snow.svg",
            1264: "snow.svg",
            // Thunderstorm
            1087: "thunderstorm.svg",
            1273: "thunderstorm.svg",
            1276: "thunderstorm.svg",
            1279: "thunderstorm.svg",
            1282: "thunderstorm.svg"
        };

        // DOM Elements
        const timeElement = document.getElementById('time');
        const dateElement = document.getElementById('date');
        const weatherElement = document.getElementById('weather');
        const weatherIconBgElement = document.getElementById('weather-icon-bg');
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
        const refreshNewsBtn = document.getElementById('refresh-news');
        const refreshStocksBtn = document.getElementById('refresh-stocks');
        const themeToggle = document.getElementById('theme-toggle');

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
            
            // Check for saved theme preference
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                document.body.setAttribute('data-theme', 'dark');
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            } else {
                document.body.removeAttribute('data-theme');
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            }
            
            // Event listeners
            refreshNewsBtn.addEventListener('click', loadStockNews);
            refreshStocksBtn.addEventListener('click', loadStockWatchlist);
            searchBtn.addEventListener('click', handleSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSearch();
            });
            todoForm.addEventListener('submit', handleTodoSubmit);
            themeToggle.addEventListener('click', toggleTheme);
            
            // Search engine icon click handlers
            searchEngineIcons.forEach(icon => {
                icon.addEventListener('click', (e) => {
                    setSearchEngine(e.target.dataset.engine);
                });
            });
        }

        // Toggle theme
        function toggleTheme() {
            if (document.body.getAttribute('data-theme') === 'dark') {
                document.body.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            } else {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            }
        }

        // Set search engine
        function setSearchEngine(engine) {
            currentSearchEngine = engine;
            
            // Update active state
            searchEngineIcons.forEach(icon => {
                if (icon.dataset.engine === engine) {
                    icon.classList.add('active');
                } else {
                    icon.classList.remove('active');
                }
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
            const time = now.toLocaleTimeString();
            const date = now.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            timeElement.textContent = time;
            dateElement.textContent = date;
        }

        // Weather API using WeatherAPI.com
        async function getWeather() {
            try {
                const API_KEY = 'a8738626a12544bd91d100412252308';
                const LOCATION = 'Berlin';
                
                const response = await fetch(
                    `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(LOCATION)}&aqi=no`
                );
                
                if (!response.ok) {
                    throw new Error('Weather API response was not ok');
                }
                
                const data = await response.json();
                
                if (data.current) {
                    const temperature = Math.round(data.current.temp_c);
                    const description = data.current.condition.text;
                    
                    // Get appropriate icon based on condition code
                    const iconFilename = getWeatherIconFilename(data.current.condition.code, data.current.is_day);
                    
                    // Update the weather widget
                    document.querySelector('.weather-temperature').textContent = `${temperature}°C`;
                    document.querySelector('.weather-description').textContent = description;
                    
                    // Update the weather icon background
                    const iconUrl = `weather_icons/svg/${iconFilename}`;
                    weatherIconBgElement.innerHTML = `<img src="${iconUrl}" alt="Weather icon background">`;
                    
                    // Determine if we should use light or dark text based on the weather condition
                    // For simplicity, we'll use light text for night/cloudy conditions and dark for clear day
                    const isDay = data.current.is_day;
                    const conditionCode = data.current.condition.code;
                    
                    if (isDay && (conditionCode === 1000 || conditionCode === 1003)) {
                        weatherElement.classList.remove('light-text');
                        weatherElement.classList.add('dark-text');
                    } else {
                        weatherElement.classList.remove('dark-text');
                        weatherElement.classList.add('light-text');
                    }
                }
            } catch (error) {
                console.error('Error getting weather:', error);
                document.querySelector('.weather-temperature').textContent = '--°C';
                document.querySelector('.weather-description').textContent = 'Weather unavailable';
                weatherIconBgElement.innerHTML = '<img src="weather_icons/svg/clear-day.svg" alt="Weather unavailable">';
                weatherElement.classList.remove('dark-text');
                weatherElement.classList.add('light-text');
            }
        }

        // Helper function to get weather icon filename
        function getWeatherIconFilename(code, isDay) {
            const mapping = weatherIconMap[code];
            
            if (!mapping) {
                return isDay ? "clear-day.svg" : "clear-night.svg";
            }
            
            if (typeof mapping === 'string') {
                return mapping;
            }
            
            return isDay ? mapping.day : mapping.night;
        }

        // Search functionality
        function handleSearch() {
            const query = searchInput.value.trim();
            if (query) {
                let searchUrl;
                
                switch(currentSearchEngine) {
                    case 'google':
                        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                        break;
                    case 'duckduckgo':
                        searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
                        break;
                    case 'brave':
                        searchUrl = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
                        break;
                    case 'bing':
                        searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
                        break;
                    case 'yahoo':
                        searchUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
                        break;
                    default:
                        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                }
                
                window.open(searchUrl, '_blank');
            }
        }

        // Quick Links
        function loadQuickLinks() {
            let links = JSON.parse(localStorage.getItem('quickLinks')) || defaultLinks;
            
            quickLinksContainer.innerHTML = '';
            
            links.forEach(link => {
                const linkElement = document.createElement('a');
                linkElement.href = link.url;
                linkElement.className = 'link-item';
                linkElement.target = '_blank';
                linkElement.title = link.name;
                linkElement.innerHTML = `
                    <div class="link-icon">
                        <img src="${link.icon}" alt="${link.name} icon">
                    </div>
                    <span class="link-name">${link.name}</span>
                `;
                
                quickLinksContainer.appendChild(linkElement);
            });
        }

        // To-Do List
        function loadTodos() {
            let todos = JSON.parse(localStorage.getItem('todos')) || [];
            
            todoList.innerHTML = '';
            
            todos.forEach((todo, index) => {
                const todoItem = document.createElement('li');
                todoItem.className = 'todo-item';
                todoItem.innerHTML = `
                    <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                    <span class="todo-text ${todo.completed ? 'todo-completed' : ''}">${todo.text}</span>
                    <button class="delete-btn">×</button>
                `;
                
                const checkbox = todoItem.querySelector('input');
                const deleteBtn = todoItem.querySelector('.delete-btn');
                const todoText = todoItem.querySelector('.todo-text');
                
                checkbox.addEventListener('change', () => {
                    todos[index].completed = checkbox.checked;
                    localStorage.setItem('todos', JSON.stringify(todos));
                    todoText.classList.toggle('todo-completed', checkbox.checked);
                });
                
                deleteBtn.addEventListener('click', () => {
                    todos.splice(index, 1);
                    localStorage.setItem('todos', JSON.stringify(todos));
                    loadTodos();
                });
                
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

        // Stock News
        function loadStockNews() {
            // Simulating news data
            const newsData = [
                { title: "Stock Markets Rally as Inflation Data Comes in Lower Than Expected", date: "2 hours ago" },
                { title: "Tech Giants Report Strong Quarterly Earnings Despite Economic Headwinds", date: "4 hours ago" },
                { title: "Federal Reserve Holds Interest Rates Steady, Signals Potential Cuts Later This Year", date: "6 hours ago" },
                { title: "Oil Prices Jump After OPEC+ Announces Production Cuts", date: "Yesterday" },
                { title: "New Legislation Aims to Boost Renewable Energy Investments", date: "Yesterday" },
                { title: "Global Chip Shortage Easing, But Auto Industry Still Feeling Effects", date: "2 days ago" },
                { title: "Retail Sales Surge as Consumers Remain Resilient", date: "2 days ago" }
            ];
            
            newsContainer.innerHTML = '';
            
            newsData.forEach(news => {
                const newsItem = document.createElement('div');
                newsItem.className = 'news-item';
                newsItem.innerHTML = `
                    <a href="#" class="news-title">${news.title}</a>
                    <div class="news-date">${news.date}</div>
                `;
                
                newsContainer.appendChild(newsItem);
            });
        }

        // Stock Watchlist
        function loadStockWatchlist() {
            // Simulating stock data
            const stockData = [
                { symbol: "AAPL", name: "Apple Inc.", price: 176.55, change: 2.35, changePercent: 1.35 },
                { symbol: "MSFT", name: "Microsoft Corporation", price: 337.69, change: -1.24, changePercent: -0.37 },
                { symbol: "GOOGL", name: "Alphabet Inc.", price: 130.73, change: 0.85, changePercent: 0.65 },
                { symbol: "AMZN", name: "Amazon.com Inc.", price: 139.97, change: 3.21, changePercent: 2.35 },
                { symbol: "TSLA", name: "Tesla, Inc.", price: 240.45, change: -7.63, changePercent: -3.08 }
            ];
            
            watchlistContainer.innerHTML = '';
            
            stockData.forEach(stock => {
                const isPositive = stock.change >= 0;
                const stockItem = document.createElement('div');
                stockItem.className = 'stock-item';
                stockItem.innerHTML = `
                    <div class="stock-info">
                        <div class="stock-symbol">${stock.symbol}</div>
                        <div class="stock-name">${stock.name}</div>
                    </div>
                    <div class="stock-pricing">
                        <div class="stock-price">$${stock.price.toFixed(2)}</div>
                        <div class="stock-change ${isPositive ? 'positive' : 'negative'}">
                            ${isPositive ? '+' : ''}${stock.change.toFixed(2)} (${isPositive ? '+' : ''}${stock.changePercent.toFixed(2)}%)
                        </div>
                    </div>
                `;
                
                watchlistContainer.appendChild(stockItem);
            });
        }

        // Calendar
        function renderCalendar() {
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            const currentDate = today.getDate();
            
            // Get first day of month and number of days in month
            const firstDay = new Date(currentYear, currentMonth, 1).getDay();
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            
            // Month and year for display
            const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            
            // Create calendar header
            const calendarHeader = document.createElement('div');
            calendarHeader.className = 'calendar-header';
            calendarHeader.innerHTML = `
                <div class="calendar-nav">
                    <button class="calendar-nav-btn"><i class="fas fa-chevron-left"></i></button>
                    <button class="calendar-nav-btn"><i class="fas fa-chevron-right"></i></button>
                </div>
                <div class="calendar-month">${monthNames[currentMonth]} ${currentYear}</div>
                <div></div>
            `;
            
            // Create calendar grid
            const calendarGrid = document.createElement('div');
            calendarGrid.className = 'calendar-grid';
            
            // Add weekday headers
            const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            weekdays.forEach(day => {
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day calendar-weekday';
                dayElement.textContent = day;
                calendarGrid.append(dayElement);
            });
            
            // Add empty cells for days before the first day of the month
            for (let i = 0; i < firstDay; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'calendar-day';
                calendarGrid.appendChild(emptyDay);
            }
            
            // Add days of the month
            for (let i = 1; i <= daysInMonth; i++) {
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                
                const dateElement = document.createElement('div');
                dateElement.className = 'calendar-date';
                dateElement.textContent = i;
                
                // Highlight current date
                if (i === currentDate) {
                    dateElement.classList.add('current-date');
                }
                
                // Mark days with events
                if (sampleEvents.some(event => event.date === i)) {
                    dateElement.classList.add('has-event');
                }
                
                dayElement.appendChild(dateElement);
                calendarGrid.appendChild(dayElement);
            }
            
            // Create events list
            const eventsList = document.createElement('div');
            eventsList.className = 'calendar-events';
            
            // Filter events for today
            const todaysEvents = sampleEvents.filter(event => event.date === currentDate);
            
            if (todaysEvents.length > 0) {
                todaysEvents.forEach(event => {
                    const eventItem = document.createElement('div');
                    eventItem.className = 'event-item';
                    eventItem.innerHTML = `
                        <div class="event-time">${event.time}</div>
                        <div class="event-title">${event.title}</div>
                    `;
                    eventsList.appendChild(eventItem);
                });
            } else {
                eventsList.innerHTML = '<div class="event-item">No events scheduled for today</div>';
            }
            
            // Assemble calendar
            calendarContainer.innerHTML = '';
            calendarContainer.appendChild(calendarHeader);
            calendarContainer.appendChild(calendarGrid);
            calendarContainer.appendChild(eventsList);
        }

        // Initialize the dashboard
        init();