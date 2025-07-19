import { fetchTracks } from "./api.js";

class CosmicMusicPlayer {
  constructor() {
    this.currentTrackIndex = 0;
    this.isPlaying = false;
    this.audio = document.getElementById("audio-player");
    this.playBtn = document.getElementById("play-btn");
    this.prevBtn = document.getElementById("prev-btn");
    this.nextBtn = document.getElementById("next-btn");
    this.progressFill = document.getElementById("progress-fill");
    this.currentTimeDisplay = document.getElementById("current-time");
    this.totalTimeDisplay = document.getElementById("total-time");
    this.currentTrackName = document.getElementById("current-track-name");
    this.currentTrackArtist = document.getElementById("current-track-artist");
    this.playlist = document.getElementById("playlist");
    this.tracks = [];
  }

  async init() {
    await this.setTracks();
    this.setupEventListeners();
    this.renderPlaylist();
    this.loadTrack(0);
  }

  async setTracks() {
    this.tracks = await fetchTracks();
    console.log("Tracks loaded:", this.tracks);
  }

  setupEventListeners() {
    // Play/Pause button
    this.playBtn.addEventListener("click", () => this.togglePlay());

    // Previous/Next buttons
    this.prevBtn.addEventListener("click", () => this.previousTrack());
    this.nextBtn.addEventListener("click", () => this.nextTrack());

    // Audio events
    this.audio.addEventListener("loadedmetadata", () => this.updateTrackInfo());
    this.audio.addEventListener("timeupdate", () => this.updateProgress());
    this.audio.addEventListener("ended", () => this.nextTrack());
    this.audio.addEventListener("canplay", () => this.onCanPlay());
    this.audio.addEventListener("error", (e) => this.onAudioError(e));
    this.audio.addEventListener("loadstart", () => this.onLoadStart());
    this.audio.addEventListener("waiting", () => this.onWaiting());
    this.audio.addEventListener("playing", () => this.onPlaying());

    // Progress bar click (for seeking)
    document
      .querySelector(".progress-bar")
      .addEventListener("click", (e) => this.seek(e));

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => this.handleKeyboard(e));

    // Playlist scroll event when is overflowing
    document
      .querySelector(".playlist-section")
      .addEventListener("scroll", () => {
        const activeItem = this.playlist.querySelector(".playlist-item.active");
        if (!activeItem) return;

        const playlistSection = document.querySelector(".playlist-section");
        const playlistSectionRect = playlistSection.getBoundingClientRect();
        const activeRect = activeItem.getBoundingClientRect();

        // Determine if the active item is in the top or bottom half of the playlist
        const activeIndex = parseInt(activeItem.dataset.index);
        const totalTracks = this.tracks.length;
        const isBottomHalf = activeIndex >= Math.floor(totalTracks / 2);

        if (isBottomHalf) {
          // Bottom sticky behavior for items in the lower half
          if (activeRect.bottom >= playlistSectionRect.bottom - 5) {
            activeItem.classList.add("sticky-active-bottom");
            activeItem.classList.remove("sticky-active");
          } else if (activeRect.bottom < playlistSectionRect.bottom - 20) {
            activeItem.classList.remove("sticky-active-bottom");
          }
        } else {
          // Top sticky behavior for items in the upper half
          if (activeRect.top <= playlistSectionRect.top + 5) {
            activeItem.classList.add("sticky-active");
            activeItem.classList.remove("sticky-active-bottom");
          } else if (activeRect.top > playlistSectionRect.top + 20) {
            activeItem.classList.remove("sticky-active");
          }
        }
      });
  }

  renderPlaylist() {
    this.playlist.innerHTML = "";

    if (Array.isArray(this.tracks) && this.tracks.length > 0) {
      this.tracks.forEach((track, index) => {
        const playlistItem = document.createElement("div");
        playlistItem.className = "playlist-item";
        playlistItem.dataset.index = index;

        playlistItem.innerHTML = `
                  <div class="song-info">
                      <div class="song-name">${track.name.slice(0, -4)}</div>
                      <div class="song-artist">${track.artist}</div>
                  </div>
                  <div class="song-duration">${track.duration}</div>
              `;

        playlistItem.addEventListener("click", () => this.selectTrack(index));
        this.playlist.appendChild(playlistItem);
      });
    }
  }

  selectTrack(index) {
    this.currentTrackIndex = index;
    this.loadTrack(index);
    this.updateActiveTrack();

    // Auto-play when selecting a track
    if (this.isPlaying) {
      this.play();
    }
  }

  loadTrack(index) {
    if (Array.isArray(this.tracks) && this.tracks.length > 0) {
      const track = this.tracks[index];
      this.currentTrackName.textContent = track.name.slice(0, -4);
      this.currentTrackArtist.textContent = track.artist;

      // Check if the MP3 file exists and load it
      this.audio.src = track.url;
      this.audio.load(); // Force reload of the audio element

      // Reset progress display
      this.progressFill.style.width = "0%";
      this.currentTimeDisplay.textContent = "0:00";
      this.totalTimeDisplay.textContent = track.duration;

      this.updateActiveTrack();
    }
  }

  updateActiveTrack() {
    // Remove active and sticky-active class from all items
    document.querySelectorAll(".playlist-item").forEach((item) => {
      item.classList.remove("active");
      item.classList.remove("sticky-active");
      item.classList.remove("sticky-active-bottom");
    });

    // Add active class to current track
    const activeItem = document.querySelector(
      `.playlist-item[data-index="${this.currentTrackIndex}"]`,
    );
    if (activeItem) {
      activeItem.classList.add("active");
      activeItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.audio.play().catch((error) => {
      console.error("Error playing audio:", error);
      console.log("Make sure the MP3 file exists in the tracks folder");
      // Fallback to simulation if audio file doesn't exist
      this.startProgressSimulation();
    });

    this.isPlaying = true;
    this.playBtn.textContent = "⏸";
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.playBtn.textContent = "▶";
    this.stopProgressSimulation();
  }

  previousTrack() {
    this.currentTrackIndex =
      (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
    this.loadTrack(this.currentTrackIndex);

    if (this.isPlaying) {
      this.stopProgressSimulation();
      this.play();
    }
  }

  nextTrack() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    this.loadTrack(this.currentTrackIndex);

    if (this.isPlaying) {
      this.stopProgressSimulation();
      this.play();
    }
  }

  seek(e) {
    const progressBar = e.currentTarget;
    const clickX = e.offsetX;
    const width = progressBar.offsetWidth;
    const percentage = (clickX / width) * 100;

    if (this.audio.duration) {
      const newTime = (percentage / 100) * this.audio.duration;
      this.audio.currentTime = newTime;
    } else {
      // Fallback for simulation mode
      this.progressFill.style.width = percentage + "%";
    }
  }

  updateProgress() {
    if (this.audio.duration) {
      const percentage = (this.audio.currentTime / this.audio.duration) * 100;
      this.progressFill.style.width = percentage + "%";
      this.currentTimeDisplay.textContent = this.formatTime(
        this.audio.currentTime,
      );
    }
  }

  updateTrackInfo() {
    if (this.audio.duration) {
      this.totalTimeDisplay.textContent = this.formatTime(this.audio.duration);
    }
  }

  // Fallback progress simulation for missing audio files
  startProgressSimulation() {
    const track = this.tracks[this.currentTrackIndex];
    let currentTime = 0;

    this.progressInterval = setInterval(() => {
      if (currentTime >= track.durationSeconds) {
        this.nextTrack();
        return;
      }

      currentTime += 1;
      const percentage = (currentTime / track.durationSeconds) * 100;
      this.progressFill.style.width = percentage + "%";
      this.currentTimeDisplay.textContent = this.formatTime(currentTime);
    }, 1000);
  }

  stopProgressSimulation() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }

  onCanPlay() {
    console.log("Audio file loaded successfully");
    this.stopProgressSimulation(); // Stop simulation when real audio loads
  }

  onAudioError(e) {
    console.error("Audio error:", e);
  }

  onLoadStart() {
    console.log("Loading audio file...");
  }

  onWaiting() {
    console.log("Audio is buffering...");
  }

  onPlaying() {
    console.log("Audio is playing");
    this.stopProgressSimulation(); // Stop simulation when real audio starts
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  handleKeyboard(e) {
    switch (e.code) {
      case "Space":
        e.preventDefault();
        this.togglePlay();
        break;
      case "ArrowLeft":
        e.preventDefault();
        this.previousTrack();
        break;
      case "ArrowRight":
        e.preventDefault();
        this.nextTrack();
        break;
    }
  }
}

// Initialize the music player when the page loads
document.addEventListener("DOMContentLoaded", async () => {
  const player = new CosmicMusicPlayer();
  await player.init();
});

document.addEventListener("DOMContentLoaded", () => {
  createFloatingParticles();

  // Add mouse move effect for subtle interactivity
  document.addEventListener("mousemove", (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    document.body.style.background = `
            linear-gradient(135deg,
                #0a0a0a 0%,
                #1a1a2e 50%,
                #16213e 100%),
            radial-gradient(circle at ${x * 100}% ${y * 100}%,
                rgba(255, 0, 150, 0.1) 0%,
                transparent 50%),
            radial-gradient(circle at ${(1 - x) * 100}% ${(1 - y) * 100}%,
                rgba(0, 255, 255, 0.1) 0%,
                transparent 50%)
        `;
  });
});

function createFloatingParticles() {
  const particleCount = 50;
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.style.position = "fixed";
    particle.style.width = "2px";
    particle.style.height = "2px";
    particle.style.background = Math.random() > 0.5 ? "#ff0096" : "#00ffff";
    particle.style.borderRadius = "50%";
    particle.style.pointerEvents = "none";
    particle.style.zIndex = "-1";
    particle.style.opacity = "0.3";
    particle.style.boxShadow = `0 0 6px ${particle.style.background}`;

    document.body.appendChild(particle);
    particles.push({
      element: particle,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    });
  }

  function animateParticles() {
    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0 || particle.x > window.innerWidth) particle.vx *= -1;
      if (particle.y < 0 || particle.y > window.innerHeight) particle.vy *= -1;

      particle.element.style.left = particle.x + "px";
      particle.element.style.top = particle.y + "px";
    });

    requestAnimationFrame(animateParticles);
  }

  animateParticles();
}
