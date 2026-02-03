// js/script.js

let gamesData = null;
let currentCategory = 'All';

// Fetch games data from JSON
async function loadGamesData() {
    try {
        const response = await fetch('data/games.json');
        gamesData = await response.json();
        initializeDropdowns();
        renderGames('All');
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
        item.addEventListener('click', () => filterByCategory(category));
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

// Render games to the grid
function renderGames(category) {
    currentCategory = category;
    const grid = document.getElementById('games-grid');
    const categoryDisplay = document.getElementById('current-category');
    
    // Update category display
    categoryDisplay.textContent = category === 'All' ? 'All Games' : category + ' Games';
    
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
        <a href="${game.url}" class="game-card" title="${game.name}">
            <img 
                src="${game.icon}" 
                alt="${game.name}" 
                class="game-icon"
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
    // Close dropdown by removing focus
    document.activeElement.blur();
}

// Random game button
function goToRandomGame() {
    if (!gamesData || gamesData.games.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * gamesData.games.length);
    const randomGame = gamesData.games[randomIndex];
    window.location.href = randomGame.url;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadGamesData();
    
    // Random button
    document.getElementById('random-btn').addEventListener('click', goToRandomGame);
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.style.opacity = '0';
            menu.style.visibility = 'hidden';
        });
    }
});