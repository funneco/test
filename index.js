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
let initialInteractionHandled = false;

let playPauseBtn;
let nextBtn;
let prevBtn;
let trackTitleElement;
let progressBarContainer;
let progressBarFill;
let currentTimeElement;
let totalTimeElement;
let audioPlayerContainer;
let audioSymbol;
let audioContent;

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
      // Randomly pick an initial track
      currentTrackIndex = Math.floor(Math.random() * tracks.length);
      // Set initial message for the user to trigger playback
      updateTrackTitle("Click to Play");
      updateTimeDisplay(0, 0); // Initialize time display
      // Ensure buttons are enabled if tracks exist, even if not playing yet
      if (playPauseBtn) playPauseBtn.disabled = false;
      if (nextBtn) nextBtn.disabled = false;
      if (prevBtn) prevBtn.disabled = false;
    } else {
      updateTrackTitle("No tracks available");
      updateTimeDisplay(0, 0); // Reset time display
      if (playPauseBtn) playPauseBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      if (prevBtn) prevBtn.disabled = true;
    }
  } catch (error) {
    console.error('Failed to load audio list:', error);
    updateTrackTitle("Error loading tracks");
    updateTimeDisplay(0, 0); // Reset time display
    if (playPauseBtn) playPauseBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    if (prevBtn) prevBtn.disabled = true;
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;
  return `${minutes}:${formattedSeconds}`;
}

function updateTimeDisplay(currentTime, totalDuration) {
  if (currentTimeElement) currentTimeElement.textContent = formatTime(currentTime);
  if (totalTimeElement) totalTimeElement.textContent = formatTime(totalDuration);
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
  currentPlaybackPosition = elapsed; // Update current playback position

  const progress = Math.min(1, elapsed / currentTrackDuration); // Ensure progress doesn't exceed 1

  if (progressBarFill) progressBarFill.style.width = `${progress * 100}%`;
  updateTimeDisplay(elapsed, currentTrackDuration); // Update time display

  if (progress < 1) {
    animationFrameId = requestAnimationFrame(updateProgressBar);
  } else {
    // Track finished playing naturally
    if (progressBarFill) progressBarFill.style.width = '100%';
    updateTimeDisplay(currentTrackDuration, currentTrackDuration); // Set to full duration
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    isPlaying = false;
    if (playPauseBtn) playPauseBtn.textContent = '►'; // Change to Play symbol
    if (progressBarFill) progressBarFill.style.width = '0%'; // Reset bar
    currentTrackDuration = 0;
    playbackStartTime = 0;
    currentPlaybackPosition = 0;
    // Advance to next track automatically
    nextTrack();
  }
}

async function playTrack(index, startTime = 0) {
  if (tracks.length === 0) return;

  await initializeAudioContext(); // Ensure context is initialized

  // Attempt to resume audio context if suspended. This is crucial for autoplay policies.
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
      console.log("AudioContext resumed during playTrack call.");
    } catch (e) {
      console.warn("Failed to resume AudioContext. User interaction might still be needed.", e);
      // If resume fails, it means no valid user gesture yet.
      // Do not proceed with playback and keep UI in a paused/waiting state.
      isPlaying = false;
      if (playPauseBtn) playPauseBtn.textContent = '►';
      updateTrackTitle("Click to Play"); // Revert or ensure message
      return;
    }
  }

  // If we reach here, context is running. Mark initial interaction as handled.
  initialInteractionHandled = true;
  const track = tracks[index];
  updateTrackTitle(track.title); // Now update to the actual track title.

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

  try {
    const response = await fetch(track.url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    currentTrackDuration = audioBuffer.duration; // Store duration
    playbackStartTime = audioContext.currentTime - startTime; // Calculate actual start time in context
    currentPlaybackPosition = startTime; // Set current position for display

    currentSource = audioContext.createBufferSource();
    currentSource.buffer = audioBuffer;
    currentSource.connect(audioContext.destination);
    currentSource.start(0, startTime);

    isPlaying = true;
    if (playPauseBtn) playPauseBtn.textContent = '❚❚'; // Change to Pause symbol

    // Start progress bar and time update
    updateProgressBar();

    currentSource.onended = () => {
      // This `onended` fires when the track naturally finishes, or is stopped explicitly.
      // We check if it ended naturally to avoid double-handling or resetting prematurely.
      if (audioContext.currentTime - playbackStartTime >= currentTrackDuration - 0.1 && isPlaying) {
        // If it ended naturally, updateProgressBar would have already handled state.
        // This 'if' prevents resetting if it was manually stopped or a new track started.
      } else if (!isPlaying) { // If it was stopped manually (e.g., by play/pause or changing track)
        if (progressBarFill) progressBarFill.style.width = '0%'; // Reset bar
        currentTrackDuration = 0;
        playbackStartTime = 0;
        currentPlaybackPosition = 0;
        updateTimeDisplay(0,0);
      }
    };

  } catch (error) {
    console.error('Error playing track:', track.url, error);
    isPlaying = false;
    if (playPauseBtn) playPauseBtn.textContent = '►'; // Change to Play symbol
    updateTrackTitle("Error: " + track.title);
    if (progressBarFill) progressBarFill.style.width = '0%'; // Reset bar on error
    currentTrackDuration = 0;
    playbackStartTime = 0;
    currentPlaybackPosition = 0;
    updateTimeDisplay(0,0);
  }
}

function togglePlayPause() {
  if (tracks.length === 0) return; // Prevent action if no tracks loaded

  if (!initialInteractionHandled) {
    // If user clicks play/pause button first, trigger the initial interaction handler
    handleFirstInteraction();
    return;
  }

  if (isPlaying) {
    if (currentSource) {
      currentSource.stop(); // Stop current playback
      currentSource.disconnect();
      currentSource = null;
    }
    isPlaying = false;
    if (playPauseBtn) playPauseBtn.textContent = '►'; // Change to Play symbol
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
  if (tracks.length === 0) return;
  currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
  // If not yet playing (due to autoplay policy), this still counts as interaction
  // and should initiate play.
  playTrack(currentTrackIndex);
}

function prevTrack() {
  if (tracks.length === 0) return;
  currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
  // If not yet playing (due to autoplay policy), this still counts as interaction
  // and should initiate play.
  playTrack(currentTrackIndex);
}

function updateTrackTitle(title) {
  if (trackTitleElement) { // Add a check to ensure the element exists
    trackTitleElement.textContent = title;
  }
}

// Function to handle the very first user interaction that allows audio to play
// This listens for any click or keydown on the document.
async function handleFirstInteraction() {
  if (initialInteractionHandled) return; // Ensure this only runs once

  console.log("First user interaction detected.");

  await initializeAudioContext(); // Ensure audioContext exists

  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
      console.log("AudioContext resumed by global interaction.");
    } catch (e) {
      console.error("Failed to resume AudioContext on first interaction:", e);
      // If resume still fails (e.g., due to strict security settings),
      // we might not be able to play audio automatically.
      return; // Do not proceed if context couldn't be resumed
    }
  }

  // Once audio context is running, proceed to play the track
  if (tracks.length > 0) {
    playTrack(currentTrackIndex);
  } else {
    console.warn("No tracks loaded after first interaction.");
  }

  // Mark that the initial interaction has been handled
  initialInteractionHandled = true;

  // Remove the one-time event listeners
  document.removeEventListener('click', handleFirstInteraction);
  document.removeEventListener('keydown', handleFirstInteraction);
}

window.addEventListener('load', async () => {
  // Assign DOM elements once the page is fully loaded
  playPauseBtn = document.getElementById('play-pause-btn');
  nextBtn = document.getElementById('next-btn');
  prevBtn = document.getElementById('prev-btn');
  trackTitleElement = document.getElementById('track-title');
  progressBarContainer = document.getElementById('progress-bar-container');
  progressBarFill = document.getElementById('progress-bar-fill');
  currentTimeElement = document.getElementById('current-time');
  totalTimeElement = document.getElementById('total-time');
  audioPlayerContainer = document.getElementById('audio-player-container');
  audioSymbol = document.getElementById('audio-symbol');
  audioContent = document.getElementById('audio-content');

  
  animate();
  //createSnow();

  // Initialize audio player
  await loadAudioList();

  // Initially ensure play button shows play symbol and isPlaying is false
  if (playPauseBtn) playPauseBtn.textContent = '►';
  isPlaying = false;

  // Auto-expand on load, then condense after a delay
  if (audioPlayerContainer) {
    audioPlayerContainer.classList.add('expanded');
    setTimeout(() => {
      audioPlayerContainer.classList.remove('expanded');
    }, 2000);

    // Add event listeners for hover to toggle player expansion
    audioPlayerContainer.addEventListener('mouseenter', () => {
      audioPlayerContainer.classList.add('expanded');
    });

    audioPlayerContainer.addEventListener('mouseleave', () => {
      audioPlayerContainer.classList.remove('expanded');
    });
  }

  // Add event listeners for controls. These will now trigger handleFirstInteraction
  // if initialInteractionHandled is false.
  if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
  if (nextBtn) nextBtn.addEventListener('click', nextTrack);
  if (prevBtn) prevBtn.addEventListener('click', prevTrack);

  // Add global event listeners for any initial user interaction
  // These will call handleFirstInteraction ONLY ONCE to enable audio.
  document.addEventListener('click', handleFirstInteraction, { once: true });
  document.addEventListener('keydown', handleFirstInteraction, { once: true });
});

//window.addEventListener('load', () => {
//  animate();
  //createSnow();
//});
