class CosmicMusicPlayer {
  constructor() {
    this.currentTrackIndex = 0;
    this.isPlaying = false;
    this.audio = document.getElementById("audio-player");
    this.playBtn = document.getElementById("play-btn");
    this.prevBtn = document.getElementById("prev-btn");
    this.nextBtn = document.getElementById("next-btn");
    this.volumeSlider = document.getElementById("volume-slider");
    this.progressFill = document.getElementById("progress-fill");
    this.currentTimeDisplay = document.getElementById("current-time");
    this.totalTimeDisplay = document.getElementById("total-time");
    this.currentTrackName = document.getElementById("current-track-name");
    this.currentTrackDuration = document.getElementById(
      "current-track-duration",
    );
    this.playlist = document.getElementById("playlist");

    // Space-themed playlist with local MP3 files
    this.tracks = [
      {
        name: "No Time for Caution",
        artist: "Hans Zimmer (Interstellar OST)",
        duration: "4:05",
        durationSeconds: 245,
        url: "tracks/Hans Zimmer - No Time For Caution.mp3",
      },
      {
        name: "Cornfield Chase",
        artist: "Hans Zimmer (Interstellar OST)",
        duration: "2:06",
        durationSeconds: 126,
        url: "tracks/cornfield-chase.mp3",
      },
      {
        name: "Space Exploration",
        artist: "Stellaris OST",
        duration: "3:42",
        durationSeconds: 222,
        url: "tracks/space-exploration.mp3",
      },
      {
        name: "Deus Ex Machina",
        artist: "Stellaris OST",
        duration: "4:18",
        durationSeconds: 258,
        url: "tracks/deus-ex-machina.mp3",
      },
      {
        name: "Also sprach Zarathustra",
        artist: "Richard Strauss (2001: A Space Odyssey)",
        duration: "8:45",
        durationSeconds: 525,
        url: "tracks/also-sprach-zarathustra.mp3",
      },
      {
        name: "Blue Danube",
        artist: "Johann Strauss II (2001: A Space Odyssey)",
        duration: "6:30",
        durationSeconds: 390,
        url: "tracks/blue-danube.mp3",
      },
      {
        name: "Adagio for Strings",
        artist: "Samuel Barber (Platoon/Space Movies)",
        duration: "7:25",
        durationSeconds: 445,
        url: "tracks/adagio-for-strings.mp3",
      },
      {
        name: "Binary Sunset",
        artist: "John Williams (Star Wars)",
        duration: "2:55",
        durationSeconds: 175,
        url: "tracks/binary-sunset.mp3",
      },
      {
        name: "Imperial March",
        artist: "John Williams (Star Wars)",
        duration: "3:02",
        durationSeconds: 182,
        url: "tracks/imperial-march.mp3",
      },
      {
        name: "Duel of the Fates",
        artist: "John Williams (Star Wars)",
        duration: "4:14",
        durationSeconds: 254,
        url: "tracks/duel-of-the-fates.mp3",
      },
      {
        name: "Across the Stars",
        artist: "John Williams (Star Wars)",
        duration: "5:33",
        durationSeconds: 333,
        url: "tracks/across-the-stars.mp3",
      },
      {
        name: "Horizon",
        artist: "Stellaris OST",
        duration: "3:28",
        durationSeconds: 208,
        url: "tracks/horizon.mp3",
      },
      {
        name: "Into the Void",
        artist: "Mass Effect OST",
        duration: "4:45",
        durationSeconds: 285,
        url: "tracks/into-the-void.mp3",
      },
      {
        name: "Leaving Earth",
        artist: "Mass Effect 3 OST",
        duration: "3:15",
        durationSeconds: 195,
        url: "tracks/leaving-earth.mp3",
      },
      {
        name: "Shepard's Theme",
        artist: "Mass Effect OST",
        duration: "2:38",
        durationSeconds: 158,
        url: "tracks/shepards-theme.mp3",
      },
    ];

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.renderPlaylist();
    this.loadTrack(0);
    this.updateVolumeDisplay();
  }

  setupEventListeners() {
    // Play/Pause button
    this.playBtn.addEventListener("click", () => this.togglePlay());

    // Previous/Next buttons
    this.prevBtn.addEventListener("click", () => this.previousTrack());
    this.nextBtn.addEventListener("click", () => this.nextTrack());

    // Volume slider
    this.volumeSlider.addEventListener("input", (e) =>
      this.setVolume(e.target.value),
    );

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
  }

  renderPlaylist() {
    this.playlist.innerHTML = "";

    this.tracks.forEach((track, index) => {
      const playlistItem = document.createElement("div");
      playlistItem.className = "playlist-item";
      playlistItem.dataset.index = index;

      playlistItem.innerHTML = `
                <div class="song-info">
                    <div class="song-name">${track.name}</div>
                    <div class="song-artist">${track.artist}</div>
                </div>
                <div class="song-duration">${track.duration}</div>
            `;

      playlistItem.addEventListener("click", () => this.selectTrack(index));
      this.playlist.appendChild(playlistItem);
    });
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
    const track = this.tracks[index];
    this.currentTrackName.textContent = track.name;
    this.currentTrackDuration.textContent = track.duration;

    // Check if the MP3 file exists and load it
    this.audio.src = track.url;
    this.audio.load(); // Force reload of the audio element

    // Reset progress display
    this.progressFill.style.width = "0%";
    this.currentTimeDisplay.textContent = "0:00";
    this.totalTimeDisplay.textContent = track.duration;

    this.updateActiveTrack();
  }

  updateActiveTrack() {
    // Remove active class from all items
    document.querySelectorAll(".playlist-item").forEach((item) => {
      item.classList.remove("active");
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
      this.play();
    }
  }

  nextTrack() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    this.loadTrack(this.currentTrackIndex);

    if (this.isPlaying) {
      this.play();
    }
  }

  setVolume(value) {
    this.audio.volume = value / 100;
    this.updateVolumeDisplay();
  }

  updateVolumeDisplay() {
    const volume = this.volumeSlider.value;
    this.volumeSlider.style.background = `linear-gradient(to right, #ff0096 0%, #00ffff ${volume}%, rgba(255,255,255,0.1) ${volume}%)`;
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
    console.log("File not found. Using simulation mode.");
    // Fallback to simulation on error
    this.startProgressSimulation();
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
      case "ArrowUp":
        e.preventDefault();
        this.volumeSlider.value = Math.min(
          100,
          parseInt(this.volumeSlider.value) + 10,
        );
        this.setVolume(this.volumeSlider.value);
        break;
      case "ArrowDown":
        e.preventDefault();
        this.volumeSlider.value = Math.max(
          0,
          parseInt(this.volumeSlider.value) - 10,
        );
        this.setVolume(this.volumeSlider.value);
        break;
    }
  }
}

// Initialize the music player when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new CosmicMusicPlayer();
});

// Add some visual effects for enhanced experience
document.addEventListener("DOMContentLoaded", () => {
  // Add floating particles effect
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
