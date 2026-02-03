// js/game.js

let gamesData = null;
let currentGame = null;
let emulatorLoaded = false;

// Get game ID from URL
function getGameIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('game') || params.get('id');
}

// Load games data
async function loadGamesData() {
    try {
        const response = await fetch('data/games.json');
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
    const gamesDropdown = document.getElementById('games-dropdown');
    if (gamesDropdown) {
        gamesDropdown.innerHTML = '';
        gamesData.categories.forEach(category => {
            const item = document.createElement('a');
            item.className = 'dropdown-item';
            item.textContent = category;
            item.href = `/?category=${encodeURIComponent(category)}`;
            gamesDropdown.appendChild(item);
        });
    }
    
    // More dropdown
    const moreDropdown = document.getElementById('more-dropdown');
    if (moreDropdown) {
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
}

// Find game by ID
function findGameById(id) {
    return gamesData.games.find(game => game.id.toLowerCase() === id.toLowerCase());
}

// Load the game based on URL parameter
function loadGame() {
    const gameId = getGameIdFromUrl();
    
    if (!gameId) {
        showError('No game specified. Please select a game from the homepage.');
        return;
    }
    
    currentGame = findGameById(gameId);
    
    if (!currentGame) {
        showError(`Game "${gameId}" not found. Please check the URL or select a game from the homepage.`);
        return;
    }
    
    // Update page title
    document.title = `${currentGame.name} - moyaimoment`;
    
    // Update game info
    document.getElementById('game-title').textContent = currentGame.name;
    document.getElementById('game-description').textContent = currentGame.description || '';
    document.getElementById('game-info-icon').src = currentGame.icon;
    document.getElementById('game-info-icon').alt = currentGame.name;
    
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
            showError(`Unknown game type: ${currentGame.type}`);
    }
    
    // Show controls help
    showControlsHelp(currentGame.type);
}

// Load Flash game with Ruffle
function loadFlashGame(game) {
    const container = document.getElementById('flash-container');
    const gameContainer = document.getElementById('game-container');
    const rufflePlayer = document.getElementById('ruffle-player');
    
    container.style.display = 'block';
    gameContainer.classList.add('flash-aspect');
    
    // Wait for Ruffle to be ready
    const ruffle = window.RufflePlayer.newest();
    const player = ruffle.createPlayer();
    
    player.style.width = '100%';
    player.style.height = '100%';
    
    rufflePlayer.appendChild(player);
    
    player.load(game.file).catch(error => {
        console.error('Error loading Flash game:', error);
        showError('Failed to load Flash game. The file may be missing or corrupted.');
    });
}

// Load emulator game with EmulatorJS
function loadEmulatorGame(game) {
    const container = document.getElementById('gameboy-container');
    const gameContainer = document.getElementById('game-container');
    
    container.style.display = 'block';
    
    // Set aspect ratio based on system
    if (['gb', 'gbc', 'gba'].includes(game.type)) {
        gameContainer.classList.add('gameboy-aspect');
    }
    
    // Map game type to EmulatorJS core
    const coreMap = {
        'gb': 'gambatte',
        'gbc': 'gambatte',
        'gba': 'mgba',
        'nes': 'fceumm',
        'snes': 'snes9x',
        'n64': 'mupen64plus_next',
        'nds': 'melonds'
    };
    
    const core = coreMap[game.type] || 'gambatte';
    
    // Create EmulatorJS configuration
    const emulatorContainer = document.getElementById('emulator-container');
    emulatorContainer.innerHTML = ''; // Clear any existing content
    
    // Set up EmulatorJS
    window.EJS_player = '#emulator-container';
    window.EJS_core = core;
    window.EJS_gameUrl = game.file;
    window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
    window.EJS_color = '#4a9eff';
    window.EJS_startOnLoaded = true;
    window.EJS_DEBUG_XX = false;
    
    // Load EmulatorJS script dynamically
    if (!emulatorLoaded) {
        const script = document.createElement('script');
        script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
        script.async = true;
        document.body.appendChild(script);
        emulatorLoaded = true;
    }
}

// Load HTML5 game in iframe
function loadHTML5Game(game) {
    const container = document.getElementById('html5-container');
    const iframe = document.getElementById('html5-frame');
    
    container.style.display = 'block';
    iframe.src = game.file;
    
    // Handle iframe load errors
    iframe.onerror = () => {
        showError('Failed to load HTML5 game. The file may be missing.');
    };
}

// Show controls help based on game type
function showControlsHelp(type) {
    const controlsHelp = document.getElementById('controls-help');
    
    let controlsHTML = '<h3>Controls</h3><div class="controls-grid">';
    
    switch (type) {
        case 'flash':
            controlsHTML += `
                <div class="control-item"><span class="key">Mouse</span><span>Interact</span></div>
                <div class="control-item"><span class="key">Click</span><span>Select / Action</span></div>
                <div class="control-item"><span class="key">Arrows</span><span>Move (if applicable)</span></div>
                <div class="control-item"><span class="key">Space</span><span>Action (if applicable)</span></div>
            `;
            break;
        case 'gb':
        case 'gbc':
            controlsHTML += `
                <div class="control-item"><span class="key">Arrow Keys</span><span>D-Pad</span></div>
                <div class="control-item"><span class="key">Z</span><span>A Button</span></div>
                <div class="control-item"><span class="key">X</span><span>B Button</span></div>
                <div class="control-item"><span class="key">Enter</span><span>Start</span></div>
                <div class="control-item"><span class="key">Shift</span><span>Select</span></div>
                <div class="control-item"><span class="key">F11</span><span>Fullscreen</span></div>
            `;
            break;
        case 'gba':
            controlsHTML += `
                <div class="control-item"><span class="key">Arrow Keys</span><span>D-Pad</span></div>
                <div class="control-item"><span class="key">Z</span><span>A Button</span></div>
                <div class="control-item"><span class="key">X</span><span>B Button</span></div>
                <div class="control-item"><span class="key">A</span><span>L Button</span></div>
                <div class="control-item"><span class="key">S</span><span>R Button</span></div>
                <div class="control-item"><span class="key">Enter</span><span>Start</span></div>
                <div class="control-item"><span class="key">Shift</span><span>Select</span></div>
            `;
            break;
        case 'nes':
            controlsHTML += `
                <div class="control-item"><span class="key">Arrow Keys</span><span>D-Pad</span></div>
                <div class="control-item"><span class="key">Z</span><span>A Button</span></div>
                <div class="control-item"><span class="key">X</span><span>B Button</span></div>
                <div class="control-item"><span class="key">Enter</span><span>Start</span></div>
                <div class="control-item"><span class="key">Shift</span><span>Select</span></div>
            `;
            break;
        case 'snes':
            controlsHTML += `
                <div class="control-item"><span class="key">Arrow Keys</span><span>D-Pad</span></div>
                <div class="control-item"><span class="key">Z</span><span>A Button</span></div>
                <div class="control-item"><span class="key">X</span><span>B Button</span></div>
                <div class="control-item"><span class="key">A</span><span>Y Button</span></div>
                <div class="control-item"><span class="key">S</span><span>X Button</span></div>
                <div class="control-item"><span class="key">Q</span><span>L Button</span></div>
                <div class="control-item"><span class="key">W</span><span>R Button</span></div>
                <div class="control-item"><span class="key">Enter</span><span>Start</span></div>
            `;
            break;
        case 'n64':
            controlsHTML += `
                <div class="control-item"><span class="key">Arrow Keys</span><span>D-Pad</span></div>
                <div class="control-item"><span class="key">I/J/K/L</span><span>C Buttons</span></div>
                <div class="control-item"><span class="key">Z</span><span>A Button</span></div>
                <div class="control-item"><span class="key">X</span><span>B Button</span></div>
                <div class="control-item"><span class="key">C</span><span>Z Trigger</span></div>
                <div class="control-item"><span class="key">Enter</span><span>Start</span></div>
            `;
            break;
        case 'html5':
            controlsHTML += `
                <div class="control-item"><span class="key">Varies</span><span>Controls depend on the game</span></div>
                <div class="control-item"><span class="key">Arrow Keys</span><span>Usually movement</span></div>
                <div class="control-item"><span class="key">Space</span><span>Usually jump/action</span></div>
            `;
            break;
        default:
            controlsHTML += `
                <div class="control-item"><span class="key">Varies</span><span>See in-game instructions</span></div>
            `;
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
    const container = document.getElementById('game-container');
    
    if (!document.fullscreenElement) {
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
    
    const randomIndex = Math.floor(Math.random() * gamesData.games.length);
    const randomGame = gamesData.games[randomIndex];
    window.location.href = `game.html?game=${randomGame.id}`;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadGamesData();
    
    // Fullscreen button
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
    
    // Random button
    document.getElementById('random-btn').addEventListener('click', goToRandomGame);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // F11 for fullscreen
    if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
    }
});