import { fetchTracks } from "./api";
import { MediaStoreService } from "./music.service";
import { DebugPanel } from "./debugPanel";

interface Track {
  name: string;
  artist: string;
  url: string;
  duration: string;
  durationSeconds: number;
}

interface Particle {
  element: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export class CosmicMusicPlayer {
  private currentTrackIndex: number = 0;
  private isPlaying: boolean = false;
  private tracks: Track[] = [];
  private progressInterval?: number;
  private audio: HTMLAudioElement;
  private playerSection: HTMLElement;
  private playBtn: HTMLElement;
  private playStopIcon: HTMLImageElement;
  private prevBtn: HTMLElement;
  private nextBtn: HTMLElement;
  private progressFill: HTMLElement;
  private currentTimeDisplay: HTMLElement;
  private totalTimeDisplay: HTMLElement;
  private currentTrackName: HTMLElement;
  private currentTrackArtist: HTMLElement;
  private playlist: HTMLElement;
  private playlistSection: HTMLElement;
  private debugPanel: DebugPanel;

  constructor() {
    this.audio = document.getElementById("audio-player") as HTMLAudioElement;
    this.playerSection = document.querySelector(
      ".player-section",
    ) as HTMLElement;
    this.playBtn = document.getElementById("play-btn") as HTMLElement;
    this.playStopIcon = document.querySelector(
      "#play-stop-icon",
    ) as HTMLImageElement;
    this.prevBtn = document.getElementById("prev-btn") as HTMLElement;
    this.nextBtn = document.getElementById("next-btn") as HTMLElement;
    this.progressFill = document.getElementById("progress-fill") as HTMLElement;
    this.currentTimeDisplay = document.getElementById(
      "current-time",
    ) as HTMLElement;
    this.totalTimeDisplay = document.getElementById(
      "total-time",
    ) as HTMLElement;
    this.currentTrackName = document.getElementById(
      "current-track-name",
    ) as HTMLElement;
    this.currentTrackArtist = document.getElementById(
      "current-track-artist",
    ) as HTMLElement;
    this.playlist = document.getElementById("playlist") as HTMLElement;
    this.playlistSection = document.querySelector(
      ".playlist-section",
    ) as HTMLElement;
    this.debugPanel = new DebugPanel();
  }

  async init(): Promise<void> {
    await this.setTracks();
    this.setupEventListeners();
    this.renderPlaylist();

    if (this.tracks.length > 0) {
      void this.loadTrack(0);
    } else {
      this.currentTrackName.textContent = "No music found";
      this.currentTrackArtist.textContent = "Add MP3 files to your device";
    }
  }

  private async setTracks(): Promise<void> {
    this.tracks = await fetchTracks();
    console.log("Tracks loaded:", this.tracks);
    this.debugPanel.addLog(`✅ Loaded ${this.tracks.length} tracks`);
  }

  private setupEventListeners(): void {
    this.playBtn.addEventListener("click", () => this.togglePlay());
    this.prevBtn.addEventListener("click", () => this.previousTrack());
    this.nextBtn.addEventListener("click", () => this.nextTrack());

    this.audio.addEventListener("loadedmetadata", () => this.updateTrackInfo());
    this.audio.addEventListener("timeupdate", () => this.updateProgress());
    this.audio.addEventListener("ended", () => this.nextTrack());
    this.audio.addEventListener("canplay", () => this.onCanPlay());
    this.audio.addEventListener("error", (e) => this.onAudioError(e));
    this.audio.addEventListener("loadstart", () => this.onLoadStart());
    this.audio.addEventListener("waiting", () => this.onWaiting());
    this.audio.addEventListener("playing", () => this.onPlaying());

    document
      .querySelector(".progress-bar")!
      .addEventListener("click", (e) => this.seek(e as MouseEvent));

    document.addEventListener("keydown", (e) => this.handleKeyboard(e));

    this.playlistSection.addEventListener("scroll", () =>
      this.handleStickyActiveTrack(),
    );
  }

  private handleStickyActiveTrack(): void {
    const activeItem = this.playlist.querySelector(
      ".playlist-item.active",
    ) as HTMLElement;
    if (!activeItem) return;

    const containerRect = this.playlistSection.getBoundingClientRect();
    const activeRect = activeItem.getBoundingClientRect();
    const STICKY_THRESHOLD = 30;

    const isExitingTop = activeRect.top < containerRect.top + STICKY_THRESHOLD;
    const isExitingBottom =
      activeRect.bottom > containerRect.bottom - STICKY_THRESHOLD;

    activeItem.classList.remove("sticky-active", "sticky-active-bottom");

    if (isExitingTop) {
      activeItem.classList.add("sticky-active");
    } else if (isExitingBottom) {
      activeItem.classList.add("sticky-active-bottom");
    }
  }

  private renderPlaylist(): void {
    this.playlist.innerHTML = "";

    if (this.tracks.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.style.cssText = `
        padding: 20px;
        text-align: center;
        color: #00ffff;
        font-size: 1.2em;
      `;
      emptyMessage.innerHTML = `
        <p>No music files found 🎵</p>
        <p style="font-size: 0.8em; margin-top: 10px; color: #cccccc;">
          Add MP3 files to your Music folder
        </p>
      `;
      this.playlist.appendChild(emptyMessage);
      return;
    }

    this.tracks.forEach((track, index) => {
      const playlistItem = document.createElement("div");
      playlistItem.className = "playlist-item";
      playlistItem.dataset.index = index.toString();

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

  private selectTrack(index: number): void {
    this.currentTrackIndex = index;
    void this.loadTrack(index);
    this.updateActiveTrack();

    if (this.isPlaying) {
      this.play();
    }
  }

  private async loadTrack(index: number): Promise<void> {
    if (this.tracks.length === 0) return;

    const track = this.tracks[index];
    console.log(`Loading: ${track.name}`);
    this.debugPanel.addLog(`🎵 Loading: ${track.name}`);

    this.currentTrackName.textContent = track.name;
    this.currentTrackArtist.textContent = track.artist;

    let playableUrl;

    try {
      playableUrl = await MediaStoreService.getPlayableUrl(track.url);
      console.log(`Playable URL: ${playableUrl}`);
      this.debugPanel.addLog(`✅ Playable URL ready`);
    } catch (error) {
      console.error(`Failed to load track: ${error}`);
      this.debugPanel.addLog(`❌ Failed to load track: ${error}`);
      return;
    }

    this.audio.src = playableUrl;
    this.audio.load();

    this.progressFill.style.width = "0%";
    this.currentTimeDisplay.textContent = "0:00";
    this.totalTimeDisplay.textContent = track.duration;

    this.updateActiveTrack();
  }

  private updateActiveTrack(): void {
    document.querySelectorAll(".playlist-item").forEach((item) => {
      item.classList.remove("active", "sticky-active", "sticky-active-bottom");
    });

    const activeItem = document.querySelector(
      `.playlist-item[data-index="${this.currentTrackIndex}"]`,
    ) as HTMLElement;

    if (activeItem) {
      activeItem.classList.add("active");
      activeItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  private togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  private play(): void {
    console.log("Attempting to play...");
    this.debugPanel.addLog("▶️ Play requested");

    this.audio
      .play()
      .then(() => {
        console.log("Playback started");
        this.debugPanel.addLog("✅ Playback started");
        this.isPlaying = true;
        this.playerSection.classList.add("playing");
        this.updatePlayIcon();
      })
      .catch((error) => {
        console.error("Playback error:", error);
        this.debugPanel.addLog(`❌ Playback error: ${error.message}`);
        this.startProgressSimulation();
        this.isPlaying = true;
        this.playerSection.classList.add("playing");
        this.updatePlayIcon();
      });
  }

  private pause(): void {
    this.audio.pause();
    this.isPlaying = false;
    this.playerSection.classList.remove("playing");
    this.updatePlayIcon();
    this.stopProgressSimulation();
    this.debugPanel.addLog("⏸️ Paused");
  }

  private updatePlayIcon(): void {
    // Usar una ruta absoluta o relativa consistente
    if (this.isPlaying) {
      this.playStopIcon.src = "./assets/stop.svg";
      this.playStopIcon.alt = "Stop";
    } else {
      this.playStopIcon.src = "./assets/play.svg";
      this.playStopIcon.alt = "Play";
    }
  }

  private previousTrack(): void {
    this.currentTrackIndex =
      (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;

    const wasPlaying = this.isPlaying;

    this.stopProgressSimulation();
    void this.loadTrack(this.currentTrackIndex).then(() => {
      if (wasPlaying) {
        this.play();
      }
    });

    this.debugPanel.addLog(
      `⏮️ Previous track: ${this.tracks[this.currentTrackIndex].name}`,
    );
  }

  private nextTrack(): void {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;

    const wasPlaying = this.isPlaying;

    this.stopProgressSimulation();
    void this.loadTrack(this.currentTrackIndex).then(() => {
      if (wasPlaying) {
        this.play();
      }
    });

    this.debugPanel.addLog(
      `⏭️ Next track: ${this.tracks[this.currentTrackIndex].name}`,
    );
  }

  private seek(e: MouseEvent): void {
    const progressBar = e.currentTarget as HTMLElement;
    const clickX = e.offsetX;
    const width = progressBar.offsetWidth;
    const percentage = (clickX / width) * 100;

    if (this.audio.duration) {
      const newTime = (percentage / 100) * this.audio.duration;
      this.audio.currentTime = newTime;
      this.debugPanel.addLog(`⏩ Seek to ${this.formatTime(newTime)}`);
    } else {
      this.progressFill.style.width = percentage + "%";
    }
  }

  private updateProgress(): void {
    if (this.audio.duration) {
      const percentage = (this.audio.currentTime / this.audio.duration) * 100;
      this.progressFill.style.width = percentage + "%";
      this.currentTimeDisplay.textContent = this.formatTime(
        this.audio.currentTime,
      );
    }
  }

  private updateTrackInfo(): void {
    if (this.audio.duration) {
      this.totalTimeDisplay.textContent = this.formatTime(this.audio.duration);
      console.log(
        `Metadata loaded - Duration: ${this.formatTime(this.audio.duration)}`,
      );
      this.debugPanel.addLog(
        `📊 Duration: ${this.formatTime(this.audio.duration)}`,
      );
    }
  }

  private startProgressSimulation(): void {
    const track = this.tracks[this.currentTrackIndex];
    let currentTime = 0;

    this.debugPanel.addLog("⚠️ Using progress simulation (fallback mode)");

    this.progressInterval = window.setInterval(() => {
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

  private stopProgressSimulation(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = undefined;
    }
  }

  private onCanPlay(): void {
    console.log("Audio ready to play");
    this.debugPanel.addLog("✅ Audio ready");
    this.stopProgressSimulation();
  }

  private onAudioError(e: Event): void {
    console.error("Audio error:", e);
    const target = e.target as HTMLAudioElement;
    if (target.error) {
      const errorMsg = `Error code: ${target.error.code}, message: ${target.error.message}`;
      console.error(errorMsg);
      this.debugPanel.addLog(`❌ Audio error: ${errorMsg}`);
    }
  }

  private onLoadStart(): void {
    console.log("Loading audio...");
    this.debugPanel.addLog("⏳ Loading audio...");
  }

  private onWaiting(): void {
    console.log("Buffering...");
    this.debugPanel.addLog("⏳ Buffering...");
  }

  private onPlaying(): void {
    console.log("Playing");
    this.debugPanel.addLog("▶️ Playing");
    this.stopProgressSimulation();
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  private handleKeyboard(e: KeyboardEvent): void {
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

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 DOM Loaded");
  const debugPanel = new DebugPanel();
  (window as any).debugPanel = debugPanel;

  try {
    // Initialize music player
    if (await MediaStoreService.requestPermissions()) {
      const player = new CosmicMusicPlayer();
      await player.init();
    }
  } catch (error) {
    console.error("Player initialization error:", error);
  }
});

// Background effects
document.addEventListener("DOMContentLoaded", () => {
  createFloatingParticles();

  document.addEventListener("mousemove", (e: MouseEvent) => {
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

function createFloatingParticles(): void {
  const particleCount = 50;
  const particles: Particle[] = [];

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    const color = Math.random() > 0.5 ? "#ff0096" : "#00ffff";

    particle.style.position = "fixed";
    particle.style.width = "2px";
    particle.style.height = "2px";
    particle.style.background = color;
    particle.style.borderRadius = "50%";
    particle.style.pointerEvents = "none";
    particle.style.zIndex = "-1";
    particle.style.opacity = "0.3";
    particle.style.boxShadow = `0 0 6px ${color}`;

    document.body.appendChild(particle);
    particles.push({
      element: particle,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    });
  }

  function animateParticles(): void {
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
