import { MediaStoreService } from "./music.service";
import { DebugPanel } from "./debugPanel";
import { CapacitorMediaStore } from "@odion-cloud/capacitor-mediastore";
import { App } from "@capacitor/app";
import { createFloatingParticles } from "./background";
import { Track } from "./types";

let trackList: Track[] = [];

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
  private headerOptSongs: HTMLElement;
  private headerOptAlbum: HTMLElement;
  private headerOptArtist: HTMLElement;
  private headerOptPlaylists: HTMLElement;
  private headerButtons!: NodeListOf<HTMLButtonElement>;
  private debugPanel: DebugPanel | null = null;

  // Nuevas propiedades para las vistas
  private currentView:
    | "songs"
    | "artists"
    | "artist-detail"
    | "albums"
    | "album-detail" = "songs";
  private selectedArtist: string | null = null;
  private selectedAlbum: string | null = null;

  private readonly playIconUrl: string;
  private readonly stopIconUrl: string;

  constructor(debugPanel: DebugPanel) {
    this.debugPanel = debugPanel;

    try {
      this.playIconUrl = new URL("./assets/play.svg", import.meta.url).href;
      this.stopIconUrl = new URL("./assets/stop.svg", import.meta.url).href;
    } catch (error) {
      this.playIconUrl = "/assets/play.svg";
      this.stopIconUrl = "/assets/stop.svg";
    }

    this.audio = document.getElementById("audio-player") as HTMLAudioElement;
    this.playerSection = document.querySelector(
      ".player-section"
    ) as HTMLElement;
    this.playBtn = document.getElementById("play-btn") as HTMLElement;
    this.playStopIcon = document.querySelector(
      "#play-stop-icon"
    ) as HTMLImageElement;
    this.prevBtn = document.getElementById("prev-btn") as HTMLElement;
    this.nextBtn = document.getElementById("next-btn") as HTMLElement;
    this.progressFill = document.getElementById("progress-fill") as HTMLElement;
    this.currentTimeDisplay = document.getElementById(
      "current-time"
    ) as HTMLElement;
    this.totalTimeDisplay = document.getElementById(
      "total-time"
    ) as HTMLElement;
    this.currentTrackName = document.getElementById(
      "current-track-name"
    ) as HTMLElement;
    this.currentTrackArtist = document.getElementById(
      "current-track-artist"
    ) as HTMLElement;
    this.playlist = document.getElementById("playlist") as HTMLElement;
    this.playlistSection = document.querySelector(
      ".playlist-section"
    ) as HTMLElement;
    this.headerOptSongs = document.getElementById(
      "header-opt-playlist"
    ) as HTMLElement;
    this.headerOptAlbum = document.getElementById(
      "header-opt-album"
    ) as HTMLElement;
    this.headerOptArtist = document.getElementById(
      "header-opt-artist"
    ) as HTMLElement;
    this.headerOptPlaylists = document.getElementById(
      "header-opt-playlists"
    ) as HTMLElement;
    this.headerButtons = document.querySelectorAll(".header-option");
  }

  async init(): Promise<void> {
    this.debugPanel?.addLog("🎵 Initializing player...");
    this.debugPanel?.addLog("⏳ Waiting for MediaStore...");

    this.tracks = [...trackList];
    this.debugPanel?.addLog(
      `🎵 MediaStore ready (${this.tracks.length} tracks)`
    );

    this.setupEventListeners();
    this.renderPlaylist();

    const intentInfo = await App.getLaunchUrl();

    if (intentInfo?.url) {
      this.debugPanel?.addLog(`📎 Opened with file: ${intentInfo.url}`);
      await this.loadFromUri(intentInfo.url);
    } else {
      this.debugPanel?.addLog("ℹ️ File not found - select a track to play");
      this.currentTrackName.textContent = "Select a track";
    }

    this.debugPanel?.addLog("✅ Player ready");
  }

  private decodeFileNameFromUrl(url: string): string {
    const fileName = url.split("/").pop() ?? url;
    const decoded = decodeURIComponent(fileName);
    return decoded.replace(/\.[^/.]+$/, "");
  }

  private async loadFromUri(uri: string): Promise<void> {
    this.debugPanel?.addLog(`🔍 Searching for: ${uri}`);

    const filename = this.decodeFileNameFromUrl(uri);
    this.debugPanel?.addLog(`🔎 Cleaned filename: ${filename}`);

    const trackIndex = this.tracks.findIndex((track) =>
      track.uri.includes(filename)
    );

    if (trackIndex !== -1) {
      this.debugPanel?.addLog(
        `✅ Found: ${this.tracks[trackIndex].displayName}`
      );
      this.currentTrackIndex = trackIndex;
      await this.loadTrack(trackIndex).then(() => this.play());
    } else {
      this.debugPanel?.addLog("⚠️ File not in library, loading directly...");
    }
  }

  private setupEventListeners(): void {
    this.displayActiveOption();

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
    this.playlistSection.addEventListener("scroll", () =>
      this.handleStickyActiveTrack()
    );

    App.addListener("appUrlOpen", (data) => {
      this.debugPanel?.addLog(`🔄 New file opened: ${data.url}`);
      void this.loadFromUri(data.url);
    });

    this.debugPanel?.addLog("✅ Event listeners ready");
  }

  private handleStickyActiveTrack(): void {
    const activeItem = this.playlist.querySelector(
      ".playlist-item.active"
    ) as HTMLElement;
    if (!activeItem) return;

    const containerRect = this.playlistSection.getBoundingClientRect();
    const activeRect = activeItem.getBoundingClientRect();
    const STICKY_THRESHOLD = 30;

    activeItem.classList.remove("sticky-active", "sticky-active-bottom");

    if (activeRect.top < containerRect.top + STICKY_THRESHOLD) {
      activeItem.classList.add("sticky-active");
    } else if (activeRect.bottom > containerRect.bottom - STICKY_THRESHOLD) {
      activeItem.classList.add("sticky-active-bottom");
    }
  }

  private renderPlaylist(): void {
    this.playlist.innerHTML = "";

    if (this.tracks.length === 0) {
      this.playlist.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #00ffff; font-size: 1.2em;">
          <p>No music files found 🎵</p>
          <p style="font-size: 0.8em; margin-top: 10px; color: #cccccc;">
            Add MP3 files to your Music folder
          </p>
        </div>
      `;
      return;
    }

    this.tracks.forEach((track, index) => {
      this.debugPanel?.addLog(`🎵 Track ${index + 1}: ${track.duration}`);

      const item = document.createElement("div");
      item.className = "playlist-item";
      item.dataset.index = index.toString();
      item.innerHTML = `
        <div class="song-info">
          <div class="song-name"><span id="current-track-name">${
            track.displayName
          }</span></div>
          <div class="song-artist">${track.artist}</div>
        </div>
        <div class="song-duration">${track.duration.toString()}</div>
      `;
      item.addEventListener("click", () => this.selectTrack(index));
      this.playlist.appendChild(item);
    });

    this.debugPanel?.addLog(`📋 Playlist: ${this.tracks.length} tracks`);
  }

  // ==================== ARTISTS VIEW ====================

  private renderArtistsList(): void {
    this.playlist.innerHTML = "";

    if (this.tracks.length === 0) {
      this.playlist.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #00ffff; font-size: 1.2em;">
          <p>No artists found 🎤</p>
        </div>
      `;
      return;
    }

    const artistsMap = new Map<string, Track[]>();

    this.tracks.forEach((track) => {
      const artist = track.artist || "Unknown Artist";
      if (!artistsMap.has(artist)) {
        artistsMap.set(artist, []);
      }
      artistsMap.get(artist)!.push(track);
    });

    const sortedArtists = Array.from(artistsMap.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );

    this.debugPanel?.addLog(`🎤 ${sortedArtists.length} artists found`);

    sortedArtists.forEach(([artistName, tracks]) => {
      const totalDuration = tracks.reduce(
        (sum, track) => sum + track.durationSeconds,
        0
      );

      const item = document.createElement("div");
      item.className = "playlist-item artist-item";
      item.innerHTML = `
        <div class="song-info">
          <div class="song-name">
            <span style="font-size: 1.1em;">🎤 ${artistName}</span>
          </div>
          <div class="song-artist" style="color: #888;">
            ${tracks.length} song${
        tracks.length !== 1 ? "s" : ""
      } • ${this.formatTime(totalDuration)}
          </div>
        </div>
        <div class="song-duration" style="font-size: 1.5em;">›</div>
      `;

      item.addEventListener("click", () => this.showArtistDetail(artistName));
      this.playlist.appendChild(item);
    });
  }

  private showArtistDetail(artistName: string): void {
    this.selectedArtist = artistName;
    this.currentView = "artist-detail";
    this.playlist.innerHTML = "";

    const backBtn = document.createElement("div");
    backBtn.className = "playlist-item";
    backBtn.style.cssText =
      "background: #1a1a2e; position: sticky; top: 0; z-index: 10; cursor: pointer;";
    backBtn.innerHTML = `
      <div class="song-info">
        <div class="song-name">
          <span style="font-size: 1.1em;">‹ Back to Artists</span>
        </div>
      </div>
    `;
    backBtn.addEventListener("click", () => this.renderArtistsList());
    this.playlist.appendChild(backBtn);

    const header = document.createElement("div");
    header.style.cssText =
      "padding: 20px; text-align: center; color: #00ffff; font-size: 1.3em; border-bottom: 2px solid #333;";
    header.innerHTML = `
      <div style="font-size: 1.5em; margin-bottom: 10px;">🎤 ${artistName}</div>
    `;
    this.playlist.appendChild(header);

    const artistTracks = this.tracks.filter(
      (track) => (track.artist || "Unknown Artist") === artistName
    );

    artistTracks.forEach((track) => {
      const originalIndex = this.tracks.indexOf(track);

      const item = document.createElement("div");
      item.className = "playlist-item";
      item.dataset.index = originalIndex.toString();
      item.innerHTML = `
        <div class="song-info">
          <div class="song-name">${track.displayName}</div>
          <div class="song-artist">${track.album || "Unknown Album"}</div>
        </div>
        <div class="song-duration">${this.formatTime(
          track.durationSeconds
        )}</div>
      `;

      item.addEventListener("click", () => this.selectTrack(originalIndex));
      this.playlist.appendChild(item);
    });

    this.debugPanel?.addLog(
      `🎤 Showing ${artistTracks.length} songs by ${artistName}`
    );
  }

  // ==================== ALBUMS VIEW ====================

  private renderAlbumsList(): void {
    this.playlist.innerHTML = "";

    if (this.tracks.length === 0) {
      this.playlist.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #00ffff; font-size: 1.2em;">
          <p>No albums found 💿</p>
        </div>
      `;
      return;
    }

    const albumsMap = new Map<string, Track[]>();

    this.tracks.forEach((track) => {
      const album = track.album || "Unknown Album";
      if (!albumsMap.has(album)) {
        albumsMap.set(album, []);
      }
      albumsMap.get(album)!.push(track);
    });

    const sortedAlbums = Array.from(albumsMap.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );

    this.debugPanel?.addLog(`💿 ${sortedAlbums.length} albums found`);

    sortedAlbums.forEach(([albumName, tracks]) => {
      const totalDuration = tracks.reduce(
        (sum, track) => sum + track.durationSeconds,
        0
      );
      const artistName = tracks[0].artist || "Unknown Artist";

      const item = document.createElement("div");
      item.className = "playlist-item album-item";
      item.innerHTML = `
        <div class="song-info">
          <div class="song-name">
            <span style="font-size: 1.1em;">💿 ${albumName}</span>
          </div>
          <div class="song-artist" style="color: #888;">
            ${artistName} • ${tracks.length} song${
        tracks.length !== 1 ? "s" : ""
      } • ${this.formatTime(totalDuration)}
          </div>
        </div>
        <div class="song-duration" style="font-size: 1.5em;">›</div>
      `;

      item.addEventListener("click", () => this.showAlbumDetail(albumName));
      this.playlist.appendChild(item);
    });
  }

  private showAlbumDetail(albumName: string): void {
    this.selectedAlbum = albumName;
    this.currentView = "album-detail";
    this.playlist.innerHTML = "";

    const backBtn = document.createElement("div");
    backBtn.className = "playlist-item";
    backBtn.style.cssText =
      "background: #1a1a2e; position: sticky; top: 0; z-index: 10; cursor: pointer;";
    backBtn.innerHTML = `
      <div class="song-info">
        <div class="song-name">
          <span style="font-size: 1.1em;">‹ Back to Albums</span>
        </div>
      </div>
    `;
    backBtn.addEventListener("click", () => this.renderAlbumsList());
    this.playlist.appendChild(backBtn);

    const albumTracks = this.tracks.filter(
      (track) => (track.album || "Unknown Album") === albumName
    );

    albumTracks.sort((a, b) => {
      if (a.track && b.track) return a.track - b.track;
      return a.displayName.localeCompare(b.displayName);
    });

    const artistName = albumTracks[0]?.artist || "Unknown Artist";

    const header = document.createElement("div");
    header.style.cssText =
      "padding: 20px; text-align: center; color: #00ffff; font-size: 1.3em; border-bottom: 2px solid #333;";
    header.innerHTML = `
      <div style="font-size: 1.5em; margin-bottom: 5px;">💿 ${albumName}</div>
      <div style="font-size: 0.9em; color: #888; margin-top: 5px;">by ${artistName}</div>
    `;
    this.playlist.appendChild(header);

    albumTracks.forEach((track) => {
      const originalIndex = this.tracks.indexOf(track);

      const item = document.createElement("div");
      item.className = "playlist-item";
      item.dataset.index = originalIndex.toString();
      item.innerHTML = `
        <div class="song-info">
          <div class="song-name">
            ${
              track.track
                ? `<span style="color: #888; margin-right: 10px;">${track.track}.</span>`
                : ""
            }
            ${track.displayName}
          </div>
          <div class="song-artist">${track.artist || "Unknown Artist"}</div>
        </div>
        <div class="song-duration">${this.formatTime(
          track.durationSeconds
        )}</div>
      `;

      item.addEventListener("click", () => this.selectTrack(originalIndex));
      this.playlist.appendChild(item);
    });

    this.debugPanel?.addLog(
      `💿 Showing ${albumTracks.length} songs from ${albumName}`
    );
  }

  private selectTrack(index: number): void {
    this.currentTrackIndex = index;
    const wasPlaying = this.isPlaying;

    void this.loadTrack(index).then(() => {
      this.updateActiveTrack();
      if (wasPlaying) this.play();
    });

    this.debugPanel?.addLog(`🎯 Selected: ${this.tracks[index].displayName}`);
  }

  private async loadTrack(index: number): Promise<void> {
    if (this.tracks.length === 0) return;

    const track = this.tracks[index];
    this.debugPanel?.addLog(`🎵 Loading: ${track.displayName}`);
    this.debugPanel?.addLog(`🔎 URL: ${track.uri}`);

    this.currentTrackName.textContent = track.displayName;
    this.currentTrackArtist.textContent = track.artist;

    try {
      const playableUrl = await MediaStoreService.getPlayableUrl(track.uri);
      this.audio.src = playableUrl;
      this.audio.load();

      this.progressFill.style.width = "0%";
      this.currentTimeDisplay.textContent = "0:00";
      this.totalTimeDisplay.textContent = track.durationSeconds.toString();

      this.updateActiveTrack();
      this.debugPanel?.addLog(`✅ Ready to play`);
    } catch (error) {
      this.debugPanel?.addLog(`❌ Failed: ${error}`);
    }
  }

  private updateActiveTrack(): void {
    document.querySelectorAll(".playlist-item").forEach((item) => {
      item.classList.remove("active", "sticky-active", "sticky-active-bottom");
    });

    const activeItem = document.querySelector(
      `.playlist-item[data-index="${this.currentTrackIndex}"]`
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
    this.debugPanel?.addLog("▶️ Playing");
    this.audio
      .play()
      .then(() => {
        this.isPlaying = true;
        this.playerSection.classList.add("playing");
        this.updatePlayIcon();
      })
      .catch((error) => {
        this.debugPanel?.addLog(`❌ Playback error: ${error.message}`);
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
    this.debugPanel?.addLog("⏸️ Paused");
  }

  private updatePlayIcon(): void {
    this.playStopIcon.src = this.isPlaying
      ? this.stopIconUrl
      : this.playIconUrl;
    this.playStopIcon.alt = this.isPlaying ? "Stop" : "Play";
  }

  private previousTrack(): void {
    if (this.tracks.length === 0) return;

    this.currentTrackIndex =
      (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
    const wasPlaying = this.isPlaying;

    this.stopProgressSimulation();
    void this.loadTrack(this.currentTrackIndex).then(() => {
      if (wasPlaying) this.play();
    });

    this.debugPanel?.addLog(`⏮️ Previous`);
  }

  private nextTrack(): void {
    if (this.tracks.length === 0) return;

    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    const wasPlaying = this.isPlaying;

    this.stopProgressSimulation();
    void this.loadTrack(this.currentTrackIndex).then(() => {
      if (wasPlaying) this.play();
    });

    this.debugPanel?.addLog(`⏭️ Next`);
  }

  private seek(e: MouseEvent): void {
    const progressBar = e.currentTarget as HTMLElement;
    const percentage = (e.offsetX / progressBar.offsetWidth) * 100;

    if (this.audio.duration) {
      this.audio.currentTime = (percentage / 100) * this.audio.duration;
    } else {
      this.progressFill.style.width = percentage + "%";
    }
  }

  private updateProgress(): void {
    if (this.audio.duration) {
      const percentage = (this.audio.currentTime / this.audio.duration) * 100;
      this.progressFill.style.width = percentage + "%";
      this.currentTimeDisplay.textContent = this.formatTime(
        this.audio.currentTime
      );
    }
  }

  private updateTrackInfo(): void {
    if (this.audio.duration) {
      this.totalTimeDisplay.textContent = this.formatTime(this.audio.duration);
      this.debugPanel?.addLog(
        `📊 Duration: ${this.formatTime(this.audio.duration)}`
      );
    }
  }

  private startProgressSimulation(): void {
    if (this.tracks.length === 0) return;

    const track = this.tracks[this.currentTrackIndex];
    let currentTime = 0;

    this.progressInterval = window.setInterval(() => {
      if (currentTime >= track.durationSeconds) {
        this.stopProgressSimulation();
        this.nextTrack();
        return;
      }

      currentTime += 1;
      this.progressFill.style.width =
        (currentTime / track.durationSeconds) * 100 + "%";
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
    this.debugPanel?.addLog("✅ Audio ready");
    this.stopProgressSimulation();
  }

  private onAudioError(e: Event): void {
    const target = e.target as HTMLAudioElement;
    if (target.error) {
      this.debugPanel?.addLog(`❌ Error ${target.error.code}`);
    }
  }

  private onLoadStart(): void {
    this.debugPanel?.addLog("⏳ Loading...");
  }

  private onWaiting(): void {
    this.debugPanel?.addLog("⏳ Buffering...");
  }

  private onPlaying(): void {
    this.stopProgressSimulation();
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  private displayActiveOption() {
    this.headerButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.headerButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const btnText = btn.textContent?.trim();
        this.debugPanel?.addLog(`✅ ${btnText} selected`);

        switch (btnText) {
          case "Songs":
            this.currentView = "songs";
            this.renderPlaylist();
            break;
          case "Albums":
            this.currentView = "albums";
            this.renderAlbumsList();
            break;
          case "Artists":
            this.currentView = "artists";
            this.renderArtistsList();
            break;
          case "Playlists":
            this.playlist.innerHTML =
              '<div style="padding: 20px; text-align: center; color: #00ffff;">Playlists view - Coming soon</div>';
            break;
        }
      });
    });
  }
}

const PERMISSION_KEY = "media_permissions_granted";
const debugPanel = new DebugPanel();
(window as any).debugPanel = debugPanel;

document.addEventListener("load", async () => {
  debugPanel.addLog("🚀 Starting...");
  const hasPermission = await CapacitorMediaStore.checkPermissions();
  if (!hasPermission) {
    debugPanel.addLog("❌ Permissions denied");
    return;
  }

  debugPanel.addLog("✅ Permissions granted");
  localStorage.setItem(PERMISSION_KEY, "true");
});

document.addEventListener("DOMContentLoaded", async () => {
  trackList = await MediaStoreService.waitForTracks();
  const player = new CosmicMusicPlayer(debugPanel);
  await player.init();
  debugPanel.addLog("🎵 Ready");
});

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
