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
        if (urlCategory === 'All' || gamesData.categories.includes(urlCategory)) {
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
    // Games dropdown - Now just has All and Categories
    const gamesDropdown = document.getElementById('games-dropdown');
    gamesDropdown.innerHTML = '';
    
    // All Games link
    const allItem = document.createElement('a');
    allItem.className = 'dropdown-item';
    allItem.textContent = 'All';
    allItem.href = '/';
    allItem.addEventListener('click', function(e) {
        e.preventDefault();
        filterByCategory('All');
    });
    gamesDropdown.appendChild(allItem);
    
    // Categories link
    const categoriesItem = document.createElement('a');
    categoriesItem.className = 'dropdown-item';
    categoriesItem.textContent = 'Categories';
    categoriesItem.href = 'categories.html';
    gamesDropdown.appendChild(categoriesItem);
    
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
        : window.location.pathname + '?category=' + encodeURIComponent(category);
    window.history.replaceState({}, '', newUrl);
    
    // Filter games by category
    let filteredGames = gamesData.games;
    if (category !== 'All') {
        filteredGames = gamesData.games.filter(function(game) {
            return game.categories.includes(category);
        });
    }
    
    // Check if no games found
    if (filteredGames.length === 0) {
        grid.innerHTML = '<div class="no-games">No games found in this category.</div>';
        return;
    }
    
    // Render game cards
    let html = '';
    for (let i = 0; i < filteredGames.length; i++) {
        const game = filteredGames[i];
        html += '<a href="game.html?game=' + game.id + '" class="game-card" title="' + escapeHtml(game.name) + '">';
        html += '<img src="' + escapeHtml(game.icon) + '" alt="' + escapeHtml(game.name) + '" class="game-icon" loading="lazy" onerror="this.src=\'images/placeholder.png\'">';
        html += '<div class="game-overlay">';
        html += '<span class="game-name">' + escapeHtml(game.name) + '</span>';
        html += '</div>';
        html += '</a>';
    }
    grid.innerHTML = html;
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
    window.location.href = 'game.html?game=' + randomGame.id;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize the page
function initializePage() {
    resetDropdowns();
    
    if (!gamesData) {
        loadGamesData();
    } else {
        const urlCategory = getCategoryFromUrl();
        if (urlCategory === 'All' || gamesData.categories.includes(urlCategory)) {
            renderGames(urlCategory);
        } else {
            renderGames('All');
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    
    document.getElementById('random-btn').addEventListener('click', goToRandomGame);
});

// Handle back/forward button (bfcache restoration)
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        resetDropdowns();
        
        if (gamesData) {
            const urlCategory = getCategoryFromUrl();
            if (urlCategory === 'All' || gamesData.categories.includes(urlCategory)) {
                renderGames(urlCategory);
            } else {
                renderGames('All');
            }
        } else {
            loadGamesData();
        }
    }
});

// Handle popstate for navigation
window.addEventListener('popstate', function() {
    resetDropdowns();
    if (gamesData) {
        const urlCategory = getCategoryFromUrl();
        if (urlCategory === 'All' || gamesData.categories.includes(urlCategory)) {
            renderGames(urlCategory);
        } else {
            renderGames('All');
        }
    }
});

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown')) {
        resetDropdowns();
    }
});

// Handle visibility change
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        resetDropdowns();
    }
});