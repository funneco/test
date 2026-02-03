// js/script.js

let gamesData = null;
let currentCategory = 'All';

// Get category from URL if present
function getCategoryFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('category') || 'All';
}

// Fetch games data from JSON
async function loadGamesData() {
    try {
        const response = await fetch('data/games.json');
        gamesData = await response.json();
        initializeDropdowns();
        
        // Check for category in URL
        const urlCategory = getCategoryFromUrl();
        if (gamesData.categories.includes(urlCategory)) {
            renderGames(urlCategory);
        } else {
            renderGames('All');
        }
    } catch (error) {
        console.error('Error loading games data:', error);
        document.getElementById('games-grid').innerHTML = 
            '<div class="no-games">Error loading games. Please try again later.</div>';
    }
}

// Initialize dropdown menus from JSON data
function initializeDropdowns() {
    // Games dropdown
    const gamesDropdown = document.getElementById('games-dropdown');
    gamesDropdown.innerHTML = '';
    
    gamesData.categories.forEach(category => {
        const item = document.createElement('button');
        item.className = 'dropdown-item';
        item.textContent = category;
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            filterByCategory(category);
        });
        gamesDropdown.appendChild(item);
    });
    
    // More dropdown
    const moreDropdown = document.getElementById('more-dropdown');
    moreDropdown.innerHTML = '';
    
    gamesData.moreLinks.forEach(link => {
        const item = document.createElement('a');
        item.className = 'dropdown-item';
        item.textContent = link.name;
        item.href = link.url;
        if (link.url.startsWith('http')) {
            item.target = '_blank';
            item.rel = 'noopener noreferrer';
        }
        moreDropdown.appendChild(item);
    });
}

// Reset all dropdown states
function resetDropdowns() {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.style.opacity = '';
        menu.style.visibility = '';
        menu.style.transform = '';
    });
    
    document.querySelectorAll('.dropdown .arrow').forEach(arrow => {
        arrow.style.transform = '';
    });
}

// Render games to the grid
function renderGames(category) {
    currentCategory = category;
    const grid = document.getElementById('games-grid');
    const categoryDisplay = document.getElementById('current-category');
    
    // Update category display
    categoryDisplay.textContent = category === 'All' ? 'All Games' : category + ' Games';
    
    // Update URL without reload
    const newUrl = category === 'All' 
        ? window.location.pathname 
        : `${window.location.pathname}?category=${encodeURIComponent(category)}`;
    window.history.replaceState({}, '', newUrl);
    
    // Filter games by category
    let filteredGames = gamesData.games;
    if (category !== 'All') {
        filteredGames = gamesData.games.filter(game => 
            game.categories.includes(category)
        );
    }
    
    // Check if no games found
    if (filteredGames.length === 0) {
        grid.innerHTML = '<div class="no-games">No games found in this category.</div>';
        return;
    }
    
    // Render game cards
    grid.innerHTML = filteredGames.map(game => `
        <a href="game.html?game=${game.id}" class="game-card" title="${game.name}">
            <img 
                src="${game.icon}" 
                alt="${game.name}" 
                class="game-icon"
                loading="lazy"
                onerror="this.src='images/placeholder.png'"
            >
            <div class="game-overlay">
                <span class="game-name">${game.name}</span>
            </div>
        </a>
    `).join('');
}

// Filter games by category
function filterByCategory(category) {
    renderGames(category);
    resetDropdowns();
    document.activeElement.blur();
}

// Random game button
function goToRandomGame() {
    if (!gamesData || gamesData.games.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * gamesData.games.length);
    const randomGame = gamesData.games[randomIndex];
    window.location.href = `game.html?game=${randomGame.id}`;
}

// Initialize the page
function initializePage() {
    // Reset any stuck states
    resetDropdowns();
    
    // Load data if not already loaded
    if (!gamesData) {
        loadGamesData();
    } else {
        // Data already loaded, just re-render based on URL
        const urlCategory = getCategoryFromUrl();
        if (gamesData.categories.includes(urlCategory)) {
            renderGames(urlCategory);
        } else {
            renderGames('All');
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    
    // Random button
    document.getElementById('random-btn').addEventListener('click', goToRandomGame);
});

// Handle back/forward button (bfcache restoration)
window.addEventListener('pageshow', (event) => {
    // If page is restored from bfcache
    if (event.persisted) {
        console.log('Page restored from bfcache');
        resetDropdowns();
        
        // Re-initialize if needed
        if (gamesData) {
            const urlCategory = getCategoryFromUrl();
            if (gamesData.categories.includes(urlCategory)) {
                renderGames(urlCategory);
            } else {
                renderGames('All');
            }
        } else {
            loadGamesData();
        }
    }
});

// Also handle popstate for SPA-like navigation
window.addEventListener('popstate', () => {
    resetDropdowns();
    if (gamesData) {
        const urlCategory = getCategoryFromUrl();
        if (gamesData.categories.includes(urlCategory)) {
            renderGames(urlCategory);
        } else {
            renderGames('All');
        }
    }
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
        resetDropdowns();
    }
});

// Handle visibility change (tab switching)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        resetDropdowns();
    }
});