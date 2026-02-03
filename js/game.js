// js/game.js

var gamesData = null;
var currentGame = null;
var emulatorLoaded = false;
var rufflePlayer = null;

// Get game ID from URL
function getGameIdFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get('game') || params.get('id');
}

// Escape HTML
function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load games data
async function loadGamesData() {
    try {
        var response = await fetch('data/games.json');
        gamesData = await response.json();
        initializeDropdowns();
        loadGame();
    } catch (error) {
        console.error('Error loading games data:', error);
        showError('Failed to load game data. Please try again later.');
    }
}

// Initialize dropdown menus
function initializeDropdowns() {
    // Games dropdown
    var gamesDropdown = document.getElementById('games-dropdown');
    if (gamesDropdown) {
        gamesDropdown.innerHTML = '';
        
        // All Games link
        var allItem = document.createElement('a');
        allItem.className = 'dropdown-item';
        allItem.textContent = 'All';
        allItem.href = '/';
        gamesDropdown.appendChild(allItem);
        
        // Categories link
        var categoriesItem = document.createElement('a');
        categoriesItem.className = 'dropdown-item';
        categoriesItem.textContent = 'Categories';
        categoriesItem.href = 'categories.html';
        gamesDropdown.appendChild(categoriesItem);
    }
    
    // More dropdown
    var moreDropdown = document.getElementById('more-dropdown');
    if (moreDropdown) {
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
}

// Find game by ID
function findGameById(id) {
    for (var i = 0; i < gamesData.games.length; i++) {
        if (gamesData.games[i].id.toLowerCase() === id.toLowerCase()) {
            return gamesData.games[i];
        }
    }
    return null;
}

// Render game categories
function renderGameCategories(categories) {
    var container = document.getElementById('game-categories');
    if (!container || !categories || categories.length === 0) {
        return;
    }
    
    container.innerHTML = '';
    
    for (var i = 0; i < categories.length; i++) {
        var category = categories[i];
        var tag = document.createElement('a');
        tag.className = 'game-category-tag';
        tag.href = '/?category=' + encodeURIComponent(category);
        tag.title = 'View all ' + category + ' games';
        tag.textContent = category;
        container.appendChild(tag);
    }
}

// Load the game based on URL parameter
function loadGame() {
    var gameId = getGameIdFromUrl();
    
    if (!gameId) {
        showError('No game specified. Please select a game from the homepage.');
        return;
    }
    
    currentGame = findGameById(gameId);
    
    if (!currentGame) {
        showError('Game "' + gameId + '" not found. Please check the URL or select a game from the homepage.');
        return;
    }
    
    // Update page title
    document.title = currentGame.name + ' - moyaimoment';
    
    // Update game info
    document.getElementById('game-title').textContent = currentGame.name;
    document.getElementById('game-description').textContent = currentGame.description || 'No description available.';
    document.getElementById('game-info-icon').src = currentGame.icon;
    document.getElementById('game-info-icon').alt = currentGame.name;
    
    // Render categories
    renderGameCategories(currentGame.categories);
    
    // Hide loading, show game
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('game-wrapper').style.display = 'flex';
    
    // Load appropriate player based on game type
    switch (currentGame.type) {
        case 'flash':
            loadFlashGame(currentGame);
            break;
        case 'gb':
        case 'gbc':
        case 'gba':
        case 'nes':
        case 'snes':
        case 'n64':
        case 'nds':
            loadEmulatorGame(currentGame);
            break;
        case 'html5':
            loadHTML5Game(currentGame);
            break;
        default:
            showError('Unknown game type: ' + currentGame.type);
    }
    
    // Show controls help
    showControlsHelp(currentGame.type);
}

// Load Flash game with Ruffle
function loadFlashGame(game) {
    var container = document.getElementById('flash-container');
    var gameContainer = document.getElementById('game-container');
    var ruffleContainer = document.getElementById('ruffle-player');
    
    container.style.display = 'flex';
    gameContainer.classList.add('flash-aspect');
    
    ruffleContainer.innerHTML = '';
    
    if (typeof window.RufflePlayer === 'undefined') {
        console.error('Ruffle is not loaded');
        showError('Flash player (Ruffle) failed to load. Please refresh the page.');
        return;
    }
    
    setTimeout(function() {
        try {
            var ruffle = window.RufflePlayer.newest();
            var player = ruffle.createPlayer();
            
            player.style.width = '100%';
            player.style.height = '100%';
            
            ruffleContainer.appendChild(player);
            
            player.load({
                url: game.file,
                autoplay: "on",
                unmuteOverlay: "hidden",
                backgroundColor: "#000000",
                letterbox: "on",
                warnOnUnsupportedContent: false,
                contextMenu: "on",
                preloader: true,
                splashScreen: false
            }).then(function() {
                console.log('Flash game loaded successfully');
            }).catch(function(error) {
                console.error('Error loading Flash game:', error);
                showError('Failed to load Flash game. The file may be missing or corrupted.');
            });
            
            rufflePlayer = player;
            
        } catch (error) {
            console.error('Error creating Ruffle player:', error);
            showError('Failed to initialize Flash player. Please try again.');
        }
    }, 100);
}

// Load emulator game with EmulatorJS
function loadEmulatorGame(game) {
    var container = document.getElementById('gameboy-container');
    var gameContainer = document.getElementById('game-container');
    
    container.style.display = 'block';
    
    if (game.type === 'gb' || game.type === 'gbc' || game.type === 'gba') {
        gameContainer.classList.add('gameboy-aspect');
    }
    
    var coreMap = {
        'gb': 'gambatte',
        'gbc': 'gambatte',
        'gba': 'mgba',
        'nes': 'fceumm',
        'snes': 'snes9x',
        'n64': 'mupen64plus_next',
        'nds': 'melonds'
    };
    
    var core = coreMap[game.type] || 'gambatte';
    
    var emulatorContainer = document.getElementById('emulator-container');
    emulatorContainer.innerHTML = '';
    
    window.EJS_player = '#emulator-container';
    window.EJS_core = core;
    window.EJS_gameUrl = game.file;
    window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
    window.EJS_color = '#4a9eff';
    window.EJS_startOnLoaded = true;
    window.EJS_DEBUG_XX = false;
    
    if (!emulatorLoaded) {
        var script = document.createElement('script');
        script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
        script.async = true;
        document.body.appendChild(script);
        emulatorLoaded = true;
    }
}

// Load HTML5 game in iframe
function loadHTML5Game(game) {
    var container = document.getElementById('html5-container');
    var iframe = document.getElementById('html5-frame');
    
    container.style.display = 'block';
    iframe.src = game.file;
    
    iframe.onerror = function() {
        showError('Failed to load HTML5 game. The file may be missing.');
    };
}

// Show controls help based on game type
function showControlsHelp(type) {
    var controlsHelp = document.getElementById('controls-help');
    
    var controlsHTML = '<h3>Controls</h3><div class="controls-grid">';
    
    switch (type) {
        case 'flash':
            controlsHTML += '<div class="control-item"><span class="key">Mouse</span><span>Interact</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">Click</span><span>Select / Action</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">Arrows</span><span>Move (if applicable)</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">Space</span><span>Action (if applicable)</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">Right Click</span><span>Ruffle Menu</span></div>';
            break;
        case 'gb':
        case 'gbc':
            controlsHTML += '<div class="control-item"><span class="key">Arrow Keys</span><span>D-Pad</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">Z</span><span>A Button</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">X</span><span>B Button</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">Enter</span><span>Start</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">Shift</span><span>Select</span></div>';
            break;
        case 'gba':
            controlsHTML += '<div class="control-item"><span class="key">Arrow Keys</span><span>D-Pad</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">Z</span><span>A Button</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">X</span><span>B Button</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">A</span><span>L Button</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">S</span><span>R Button</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">Enter</span><span>Start</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">Shift</span><span>Select</span></div>';
            break;
        case 'nes':
            controlsHTML += '<div class="control-item"><span class="key">Arrow Keys</span><span>D-Pad</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">Z</span><span>A Button</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">X</span><span>B Button</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">Enter</span><span>Start</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">Shift</span><span>Select</span></div>';
            break;
        case 'snes':
            controlsHTML += '<div class="control-item"><span class="key">Arrow Keys</span><span>D-Pad</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">Z</span><span>A Button</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">X</span><span>B Button</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">A</span><span>Y Button</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">S</span><span>X Button</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">Q</span><span>L Button</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">W</span><span>R Button</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">Enter</span><span>Start</span></div>';
            break;
        case 'n64':
            controlsHTML += '<div class="control-item"><span class="key">Arrow Keys</span><span>D-Pad</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">I/J/K/L</span><span>C Buttons</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">Z</span><span>A Button</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">X</span><span>B Button</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">C</span><span>Z Trigger</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">Enter</span><span>Start</span></div>';
            break;
        case 'html5':
            controlsHTML += '<div class="control-item"><span class="key">Varies</span><span>Controls depend on the game</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">Arrow Keys</span><span>Usually movement</span></div>';
            controlsHTML += '<div class="control-item"><span class="key">Space</span><span>Usually jump/action</span></div>';
            break;
        default:
            controlsHTML += '<div class="control-item"><span class="key">Varies</span><span>See in-game instructions</span></div>';
    }
    
    controlsHTML += '</div>';
    controlsHelp.innerHTML = controlsHTML;
}

// Show error screen
function showError(message) {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('game-wrapper').style.display = 'none';
    document.getElementById('error-screen').style.display = 'flex';
    document.getElementById('error-message').textContent = message;
}

// Fullscreen functionality
function toggleFullscreen() {
    var container = document.getElementById('game-container');
    
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        } else if (container.msRequestFullscreen) {
            container.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

// Go to random game
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

// Cleanup when leaving page
function cleanup() {
    if (rufflePlayer) {
        try {
            rufflePlayer.remove();
        } catch (e) {
            console.log('Cleanup error:', e);
        }
        rufflePlayer = null;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadGamesData();
    
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
    document.getElementById('random-btn').addEventListener('click', goToRandomGame);
});

// Handle page unload
window.addEventListener('beforeunload', cleanup);
window.addEventListener('pagehide', cleanup);

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

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
    }
});