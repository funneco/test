// js/categories.js

let gamesData = null;

// Category icons mapping
const categoryIcons = {
    'All': '🎮',
    'HTML5': '🌐',
    'Flash': '⚡',
    'Gameboy': '🎮',
    'Riddle School': '🏫',
    'NES': '👾',
    'SNES': '🕹️',
    'N64': '🎯',
    'NDS': '📱',
    'GBA': '📟',
    'default': '🎲'
};

// Get icon for category
function getCategoryIcon(category) {
    return categoryIcons[category] || categoryIcons['default'];
}

// Fetch games data from JSON
async function loadGamesData() {
    try {
        const response = await fetch('data/games.json');
        gamesData = await response.json();
        initializeDropdowns();
        renderCategories();
    } catch (error) {
        console.error('Error loading games data:', error);
        document.getElementById('categories-grid').innerHTML = 
            '<div class="no-categories">Error loading categories. Please try again later.</div>';
    }
}

// Initialize dropdown menus
function initializeDropdowns() {
    // Games dropdown
    const gamesDropdown = document.getElementById('games-dropdown');
    gamesDropdown.innerHTML = '';
    
    // All Games link
    const allItem = document.createElement('a');
    allItem.className = 'dropdown-item';
    allItem.textContent = 'All';
    allItem.href = '/';
    gamesDropdown.appendChild(allItem);
    
    // Categories link (current page)
    const categoriesItem = document.createElement('a');
    categoriesItem.className = 'dropdown-item';
    categoriesItem.textContent = 'Categories';
    categoriesItem.href = 'categories.html';
    categoriesItem.style.backgroundColor = 'var(--accent)';
    gamesDropdown.appendChild(categoriesItem);
    
    // More dropdown
    const moreDropdown = document.getElementById('more-dropdown');
    moreDropdown.innerHTML = '';
    
    gamesData.moreLinks.forEach(function(link) {
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

// Get games count for a category
function getGamesCount(category) {
    if (category === 'All') {
        return gamesData.games.length;
    }
    return gamesData.games.filter(function(game) {
        return game.categories.includes(category);
    }).length;
}

// Get preview games for a category (first 4 games)
function getPreviewGames(category) {
    let games;
    if (category === 'All') {
        games = gamesData.games;
    } else {
        games = gamesData.games.filter(function(game) {
            return game.categories.includes(category);
        });
    }
    return games.slice(0, 4);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Render categories to the grid
function renderCategories() {
    const grid = document.getElementById('categories-grid');
    
    // Filter out "All" from categories since we'll add it manually
    const categories = gamesData.categories.filter(function(cat) {
        return cat !== 'All';
    });
    
    // Check if no categories
    if (categories.length === 0) {
        grid.innerHTML = '<div class="no-categories">No categories found.</div>';
        return;
    }
    
    let html = '';
    
    // Add "All Games" card first
    const allCount = gamesData.games.length;
    const allPreview = getPreviewGames('All');
    
    html += '<a href="/" class="category-card">';
    html += '<div class="category-icon">' + getCategoryIcon('All') + '</div>';
    html += '<div class="category-name">All Games</div>';
    html += '<div class="category-count">' + allCount + ' game' + (allCount !== 1 ? 's' : '') + '</div>';
    html += '<div class="category-preview">';
    
    for (let j = 0; j < Math.min(allPreview.length, 4); j++) {
        const game = allPreview[j];
        html += '<img src="' + escapeHtml(game.icon) + '" alt="' + escapeHtml(game.name) + '" class="category-preview-icon" onerror="this.style.display=\'none\'">';
    }
    
    if (allCount > 4) {
        html += '<div class="category-preview-more">+' + (allCount - 4) + '</div>';
    }
    
    html += '</div>';
    html += '</a>';
    
    // Add each category
    for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        const count = getGamesCount(category);
        const previewGames = getPreviewGames(category);
        
        // Skip categories with no games
        if (count === 0) continue;
        
        html += '<a href="/?category=' + encodeURIComponent(category) + '" class="category-card">';
        html += '<div class="category-icon">' + getCategoryIcon(category) + '</div>';
        html += '<div class="category-name">' + escapeHtml(category) + '</div>';
        html += '<div class="category-count">' + count + ' game' + (count !== 1 ? 's' : '') + '</div>';
        html += '<div class="category-preview">';
        
        for (let j = 0; j < Math.min(previewGames.length, 4); j++) {
            const game = previewGames[j];
            html += '<img src="' + escapeHtml(game.icon) + '" alt="' + escapeHtml(game.name) + '" class="category-preview-icon" onerror="this.style.display=\'none\'">';
        }
        
        if (count > 4) {
            html += '<div class="category-preview-more">+' + (count - 4) + '</div>';
        }
        
        html += '</div>';
        html += '</a>';
    }
    
    grid.innerHTML = html;
}

// Random game button
function goToRandomGame() {
    if (!gamesData || gamesData.games.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * gamesData.games.length);
    const randomGame = gamesData.games[randomIndex];
    window.location.href = 'game.html?game=' + randomGame.id;
}

// Reset dropdowns
function resetDropdowns() {
    document.querySelectorAll('.dropdown-menu').forEach(function(menu) {
        menu.style.opacity = '';
        menu.style.visibility = '';
        menu.style.transform = '';
    });
    
    document.querySelectorAll('.dropdown .arrow').forEach(function(arrow) {
        arrow.style.transform = '';
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    loadGamesData();
    
    document.getElementById('random-btn').addEventListener('click', goToRandomGame);
});

// Handle back/forward
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        resetDropdowns();
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