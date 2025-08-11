function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function createSnow() {
  const snowContainer = document.createElement('div');
  snowContainer.classList.add('snow-container');
  document.body.appendChild(snowContainer);

  function createSnowflake() {
    const snowflake = document.createElement('div');
    snowflake.classList.add('snowflake');
    
    const startX = Math.random() * window.innerWidth;
    const delay = Math.random() * 10;
    const size = Math.random() * 3 + 1;
    
    snowflake.style.left = `${startX}px`;
    snowflake.style.width = `${size}px`;
    snowflake.style.height = `${size}px`;
    snowflake.style.animationDuration = `${randomBetween(10, 20)}s`;
    snowflake.style.animationDelay = `-${delay}s`;
    
    snowContainer.appendChild(snowflake);
    
    snowflake.addEventListener('animationiteration', () => {
      snowflake.remove();
      createSnowflake();
    });
  }

  const snowflakeCount = window.innerWidth < 768 ? 50 : 100;
  for (let i = 0; i < snowflakeCount; i++) {
    createSnowflake();
  }
}

function animate() {
  const container = document.querySelector('.floating-container');
  let currentY = 0;
  let currentRotation = 0;
  
  function updatePosition() {
    const nextY = (Math.random() < 0.5) ? randomBetween(-30, -10) : randomBetween(10, 30);
    const nextRotation = (Math.random() < 0.5) ? randomBetween(-10, -2) : randomBetween(2, 10);
    
    container.animate([
      { transform: `translateY(${currentY}px) rotate(${currentRotation}deg)` },
      { transform: `translateY(${nextY}px) rotate(${nextRotation}deg)` },
      { transform: 'translateY(0px) rotate(0deg)' }
    ], {
      duration: 3000,
      easing: 'ease-in-out',
      fill: 'forwards'
    }).onfinish = () => {
      currentY = 0;
      currentRotation = 0;
      setTimeout(updatePosition, 100); 
    };
  }
  
  updatePosition();
}

let audioContext;
let currentTrackIndex = 0;
let tracks = [];
let currentSource = null;
let isPlaying = false;
let currentTrackDuration = 0;
let playbackStartTime = 0;
let animationFrameId = null;
let currentPlaybackPosition = 0;

const playPauseBtn = document.getElementById('play-pause-btn');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');
const trackTitleElement = document.getElementById('track-title');
const progressBarContainer = document.getElementById('progress-bar-container');
const progressBarFill = document.getElementById('progress-bar-fill');
const currentTimeElement = document.getElementById('current-time');
const totalTimeElement = document.getElementById('total-time'); 

const audioPlayerContainer = document.getElementById('audio-player-container');
const audioSymbol = document.getElementById('audio-symbol');
const audioContent = document.getElementById('audio-content');

async function initializeAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

async function loadAudioList() {
  try {
    const response = await fetch('/audio_list.json');
    tracks = await response.json();
    if (tracks.length > 0) {
      updateTrackTitle(tracks[currentTrackIndex].title);
      updateTimeDisplay(0, 0);
    } else {
      updateTrackTitle("No tracks available");
      updateTimeDisplay(0, 0);
      playPauseBtn.disabled = true;
      nextBtn.disabled = true;
      prevBtn.disabled = true;
    }
  } catch (error) {
    console.error('Failed to load audio list:', error);
    updateTrackTitle("Error loading tracks");
    updateTimeDisplay(0, 0);
    playPauseBtn.disabled = true;
    nextBtn.disabled = true;
    prevBtn.disabled = true;
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;
  return `${minutes}:${formattedSeconds}`;
}

function updateTimeDisplay(currentTime, totalDuration) {
  currentTimeElement.textContent = formatTime(currentTime);
  totalTimeElement.textContent = formatTime(totalDuration);
}

function updateProgressBar() {
  if (!isPlaying || !audioContext || audioContext.state === 'suspended' || currentTrackDuration === 0) {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    return;
  }

  const elapsed = audioContext.currentTime - playbackStartTime;
  currentPlaybackPosition = elapsed;

  const progress = Math.min(1, elapsed / currentTrackDuration);

  progressBarFill.style.width = `${progress * 100}%`;
  updateTimeDisplay(elapsed, currentTrackDuration);

  if (progress < 1) {
    animationFrameId = requestAnimationFrame(updateProgressBar);
  } else {
    // Track finished playing naturally
    progressBarFill.style.width = '100%';
    updateTimeDisplay(currentTrackDuration, currentTrackDuration);
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    isPlaying = false;
    playPauseBtn.textContent = '►';
    progressBarFill.style.width = '0%';
    currentTrackDuration = 0;
    playbackStartTime = 0;
    currentPlaybackPosition = 0;
    nextTrack();
  }
}

async function playTrack(index, startTime = 0) {
  if (tracks.length === 0) return;

  await initializeAudioContext(); 

  // If context is suspended, try to resume it
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  if (currentSource) {
    currentSource.stop();
    currentSource.disconnect();
    currentSource = null;
  }

  // Cancel any ongoing progress bar animation
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  const track = tracks[index];
  updateTrackTitle(track.title);

  try {
    const response = await fetch(track.url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    currentTrackDuration = audioBuffer.duration;
    playbackStartTime = audioContext.currentTime - startTime;
    currentPlaybackPosition = startTime; 

    currentSource = audioContext.createBufferSource();
    currentSource.buffer = audioBuffer;
    currentSource.connect(audioContext.destination);
    currentSource.start(0, startTime); 

    isPlaying = true;
    playPauseBtn.textContent = '❚❚';
    
    updateProgressBar();

    currentSource.onended = () => {
      // This `onended` fires when the track naturally finishes, or is stopped explicitly.
      // We check if it ended naturally to avoid double-handling or resetting prematurely.
      if (audioContext.currentTime - playbackStartTime >= currentTrackDuration - 0.1 && isPlaying) {
        // If it ended naturally, updateProgressBar would have already handled state.
        // This 'if' prevents resetting if it was manually stopped or a new track started.
      } else if (!isPlaying) { 
        progressBarFill.style.width = '0%';
        currentTrackDuration = 0;
        playbackStartTime = 0;
        currentPlaybackPosition = 0;
        updateTimeDisplay(0,0);
      }
    };

  } catch (error) {
    console.error('Error playing track:', track.url, error);
    isPlaying = false;
    playPauseBtn.textContent = '►';
    updateTrackTitle("Error: " + track.title);
    progressBarFill.style.width = '0%';
    currentTrackDuration = 0;
    playbackStartTime = 0;
    currentPlaybackPosition = 0;
    updateTimeDisplay(0,0);
  }
}

function togglePlayPause() {
  if (isPlaying) {
    if (currentSource) {
      currentSource.stop();
      currentSource.disconnect();
      currentSource = null;
    }
    isPlaying = false;
    playPauseBtn.textContent = '►';
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  } else {
    // If resuming after a pause, restart from the currentPlaybackPosition
    playTrack(currentTrackIndex, currentPlaybackPosition); 
  }
}

function nextTrack() {
  currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
  playTrack(currentTrackIndex);
}

function prevTrack() {
  currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
  playTrack(currentTrackIndex);
}

function updateTrackTitle(title) {
  trackTitleElement.textContent = title;
}

window.addEventListener('load', async () => {
  animate();
  //createSnow();

  // Initialize audio player
  await loadAudioList();
  
  // Autoplay the first track if available
  if (tracks.length > 0) {
    playTrack(currentTrackIndex);
  }

  // Auto-expand on load, then condense after a delay
  audioPlayerContainer.classList.add('expanded');
  setTimeout(() => {
    audioPlayerContainer.classList.remove('expanded');
  }, 3000);

  // Add event listeners for hover to toggle player expansion
  audioPlayerContainer.addEventListener('mouseenter', () => {
    audioPlayerContainer.classList.add('expanded');
  });

  audioPlayerContainer.addEventListener('mouseleave', () => {
    audioPlayerContainer.classList.remove('expanded');
  });

  playPauseBtn.addEventListener('click', togglePlayPause);
  nextBtn.addEventListener('click', nextTrack);
  prevBtn.addEventListener('click', prevTrack);
});

//window.addEventListener('load', () => {
//  animate();
  //createSnow();
//});
