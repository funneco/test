// js/categories.js

var gamesData = null;

// Fetch games data from JSON
async function loadGamesData() {
    try {
        var response = await fetch('data/games.json');
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
    var gamesDropdown = document.getElementById('games-dropdown');
    gamesDropdown.innerHTML = '';
    
    // All Games link
    var allItem = document.createElement('a');
    allItem.className = 'dropdown-item';
    allItem.textContent = 'All';
    allItem.href = '/';
    gamesDropdown.appendChild(allItem);
    
    // Categories link (current page)
    var categoriesItem = document.createElement('a');
    categoriesItem.className = 'dropdown-item';
    categoriesItem.textContent = 'Categories';
    categoriesItem.href = 'categories.html';
    categoriesItem.style.backgroundColor = 'var(--accent)';
    gamesDropdown.appendChild(categoriesItem);
    
    // More dropdown
    var moreDropdown = document.getElementById('more-dropdown');
    moreDropdown.innerHTML = '';
    
    for (var i = 0; i < gamesData.moreLinks.length; i++) {
        var link = gamesData.moreLinks[i];
        var item = document.createElement('a');
        item.className = 'dropdown-item';
        item.textContent = link.name;
        item.href = link.url;
        if (link.url.indexOf('http') === 0) {
            item.target = '_blank';
            item.rel = 'noopener noreferrer';
        }
        moreDropdown.appendChild(item);
    }
}

// Get games count for a category
function getGamesCount(category) {
    if (category === 'All') {
        return gamesData.games.length;
    }
    var count = 0;
    for (var i = 0; i < gamesData.games.length; i++) {
        if (gamesData.games[i].categories.indexOf(category) !== -1) {
            count++;
        }
    }
    return count;
}

// Get preview games for a category (first 4 games)
function getPreviewGames(category) {
    var games = [];
    if (category === 'All') {
        games = gamesData.games;
    } else {
        for (var i = 0; i < gamesData.games.length; i++) {
            if (gamesData.games[i].categories.indexOf(category) !== -1) {
                games.push(gamesData.games[i]);
            }
        }
    }
    return games.slice(0, 4);
}

// Escape HTML
function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Render categories to the grid
function renderCategories() {
    var grid = document.getElementById('categories-grid');
    
    // Filter out "All" from categories since we'll add it manually
    var categories = [];
    for (var i = 0; i < gamesData.categories.length; i++) {
        if (gamesData.categories[i] !== 'All') {
            categories.push(gamesData.categories[i]);
        }
    }
    
    // Check if no categories
    if (categories.length === 0) {
        grid.innerHTML = '<div class="no-categories">No categories found.</div>';
        return;
    }
    
    var html = '';
    
    // Add "All Games" card first
    var allCount = gamesData.games.length;
    var allPreview = getPreviewGames('All');
    
    html += '<a href="/" class="category-card">';
    html += '<div class="category-name">All Games</div>';
    html += '<div class="category-count">' + allCount + ' game' + (allCount !== 1 ? 's' : '') + '</div>';
    
    html += '</div>';
    html += '</a>';
    
    // Add each category
    for (var i = 0; i < categories.length; i++) {
        var category = categories[i];
        var count = getGamesCount(category);
        var previewGames = getPreviewGames(category);
        
        // Skip categories with no games
        if (count === 0) continue;
        
        html += '<a href="/?category=' + encodeURIComponent(category) + '" class="category-card">';
        html += '<div class="category-name">' + escapeHtml(category) + '</div>';
        html += '<div class="category-count">' + count + ' game' + (count !== 1 ? 's' : '') + '</div>';
        
        html += '</div>';
        html += '</a>';
    }
    
    grid.innerHTML = html;
}

// Random game button
function goToRandomGame() {
    if (!gamesData || gamesData.games.length === 0) return;
    
    var randomIndex = Math.floor(Math.random() * gamesData.games.length);
    var randomGame = gamesData.games[randomIndex];
    window.location.href = 'game.html?game=' + randomGame.id;
}

// Reset dropdowns
function resetDropdowns() {
    var menus = document.querySelectorAll('.dropdown-menu');
    for (var i = 0; i < menus.length; i++) {
        menus[i].style.opacity = '';
        menus[i].style.visibility = '';
        menus[i].style.transform = '';
    }
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