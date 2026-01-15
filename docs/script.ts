import { MediaStoreService } from "./music.service";
import { DebugPanel } from "./debugPanel";
import { CapacitorMediaStore } from "@odion-cloud/capacitor-mediastore";
import { App } from "@capacitor/app";
import { createFloatingParticles } from "./background";
import { Track, Playlist } from "./types";
import { mockTracks } from "./tracks";

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
  private addToPlaylistBtn: HTMLElement;
  private playlistPopup: HTMLElement | null = null;
  private currentTrackForPlaylist: Track | null = null;
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
    | "album-detail"
    | "playlists"
    | "playlist-detail" = "songs";
  private selectedArtist: string | null = null;
  private selectedAlbum: string | null = null;
  private selectedPlaylist: Playlist | null = null;
  private playlists: Playlist[] = [];

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
    this.addToPlaylistBtn = document.getElementById(
      "add-to-playlist-btn"
    ) as HTMLElement;
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
    this.addToPlaylistBtn.addEventListener("click", () =>
      this.showPlaylistPopup()
    );

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
    // Find the active track in any container
    let activeItem = document.querySelector(
      ".playlist-item.active"
    ) as HTMLElement;
    
    if (!activeItem) return;

    // Determine the scroll container based on current view
    let scrollContainer: HTMLElement;
    
    if (this.currentView === "artist-detail" || 
        this.currentView === "album-detail" || 
        this.currentView === "playlist-detail") {
      // For detail views, use the tracks wrapper
      scrollContainer = this.playlist.querySelector(".tracks-wrapper") as HTMLElement;
    } else {
      // For main views, use the playlist section
      scrollContainer = this.playlistSection;
    }

    if (!scrollContainer) return;

    const containerRect = scrollContainer.getBoundingClientRect();
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
      "background: #1a1a2e; cursor: pointer; position: sticky; top: 0; z-index: 10; margin-bottom: 0;";
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
      "padding: 15px 20px; text-align: left; color: #00ffff; font-size: 1.1em; border-bottom: 2px solid rgba(0, 255, 255, 0.3); background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); position: sticky; top: 60px; z-index: 5; margin-bottom: 0;";
    header.innerHTML = `
      <span style="font-size: 0.8em; font-weight: bold;">🎤 ${artistName}</span>
    `;
    this.playlist.appendChild(header);

    // Create scrollable tracks wrapper
    const tracksWrapper = document.createElement("div");
    // Get playlist section height and calculate wrapper max height
    const playlistSection = document.querySelector(
      ".playlist-section"
    ) as HTMLElement;
    const playlistSectionHeight = playlistSection
      ? playlistSection.offsetHeight
      : window.innerHeight;
    const wrapperMaxHeight = playlistSectionHeight - 112;

    tracksWrapper.style.cssText = `position: fixed; top: 200px; left: 20px; width: 90%; max-height: ${wrapperMaxHeight}px; overflow-y: auto; padding: 0.5em; z-index: 1; scrollbar-width: none; -ms-overflow-style: none;`;
    tracksWrapper.className = "tracks-wrapper";

    // Add scroll event listener for sticky active track
    tracksWrapper.addEventListener("scroll", () =>
      this.handleStickyActiveTrack()
    );

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
      item.style.marginBottom = "0.5em";
      tracksWrapper.appendChild(item);
    });

    this.playlist.appendChild(tracksWrapper);

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
      "background: #1a1a2e; cursor: pointer; position: sticky; top: 0; z-index: 10; margin-bottom: 0;";
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
      "padding: 15px 20px; text-align: left; color: #00ffff; font-size: 1.1em; border-bottom: 2px solid rgba(0, 255, 255, 0.3); background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); position: sticky; top: 60px; z-index: 5; margin-bottom: 0;";
    header.innerHTML = `
      <span style="font-size: 0.8em; font-weight: bold;">💿 ${albumName}</span> • <span style="font-size: 0.6em; color: #888;">by ${artistName}</span>
    `;
    this.playlist.appendChild(header);

    // Create scrollable tracks wrapper
    const tracksWrapper = document.createElement("div");
    // Get playlist section height and calculate wrapper max height
    const playlistSection = document.querySelector(
      ".playlist-section"
    ) as HTMLElement;
    const playlistSectionHeight = playlistSection
      ? playlistSection.offsetHeight
      : window.innerHeight;
    const wrapperMaxHeight = playlistSectionHeight - 112;

    tracksWrapper.style.cssText = `position: fixed; top: 200px; left: 20px; width: 90%; max-height: ${wrapperMaxHeight}px; overflow-y: auto; padding: 0.5em; z-index: 1; scrollbar-width: none; -ms-overflow-style: none;`;
    tracksWrapper.className = "tracks-wrapper";

    // Add scroll event listener for sticky active track
    tracksWrapper.addEventListener("scroll", () =>
      this.handleStickyActiveTrack()
    );

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
      item.style.marginBottom = "0.5em";
      tracksWrapper.appendChild(item);
    });

    this.playlist.appendChild(tracksWrapper);

    this.debugPanel?.addLog(
      `💿 Showing ${albumTracks.length} songs from ${albumName}`
    );
  }

  // ==================== PLAYLISTS VIEW ====================

  private loadPlaylists(): void {
    try {
      const savedPlaylists = localStorage.getItem("cosmic_music_playlists");
      if (savedPlaylists) {
        this.playlists = JSON.parse(savedPlaylists);
        this.debugPanel?.addLog(
          `📋 Loaded ${this.playlists.length} playlists from storage`
        );
      } else {
        this.playlists = [];
        this.debugPanel?.addLog(`📋 No playlists found in storage`);
      }
    } catch (error) {
      this.debugPanel?.addLog(`❌ Error loading playlists: ${error}`);
      this.playlists = [];
    }
  }

  private savePlaylists(): void {
    try {
      localStorage.setItem(
        "cosmic_music_playlists",
        JSON.stringify(this.playlists)
      );
      this.debugPanel?.addLog(
        `💾 Saved ${this.playlists.length} playlists to storage`
      );
    } catch (error) {
      this.debugPanel?.addLog(`❌ Error saving playlists: ${error}`);
    }
  }

  private createPlaylist(name: string): Playlist {
    const playlist: Playlist = {
      id: Date.now().toString(),
      name: name.trim(),
      trackIds: [],
      createdAt: new Date(),
      isSystem: false,
    };

    this.playlists.push(playlist);
    this.savePlaylists();
    this.debugPanel?.addLog(`✅ Created playlist: ${name}`);

    return playlist;
  }

  private getLast90DaysTracks(): Track[] {
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000; // 90 days ago in milliseconds

    return this.tracks.filter((track) => {
      return track.dateAdded >= ninetyDaysAgo;
    });
  }

  private renderPlaylistsList(): void {
    this.playlist.innerHTML = "";

    // Load playlists from storage
    this.loadPlaylists();

    // Create container for first two inline options
    const inlineOptionsContainer = document.createElement("div");
    inlineOptionsContainer.style.cssText = "display: flex; gap: 10px;";

    // Create Last 90 Days playlist
    const recentTracks = this.getLast90DaysTracks();
    const recentItem = document.createElement("div");
    recentItem.className = "playlist-item";
    recentItem.style.cssText = "flex: 1; margin: 0;";
    recentItem.innerHTML = `
      <div class="song-info">
        <div class="song-name">
          <span style="font-size: 1.1em;">🕐 Last 90 Days</span>
        </div>
        <div class="song-artist" style="color: #888;">
          ${recentTracks.length} song${
      recentTracks.length !== 1 ? "s" : ""
    } • Recently added
        </div>
      </div>
      <div class="song-duration" style="font-size: 1.5em;">›</div>
    `;

    recentItem.addEventListener("click", () => this.showLast90DaysDetail());
    inlineOptionsContainer.appendChild(recentItem);

    // Create New Playlist button
    const createPlaylistItem = document.createElement("div");
    createPlaylistItem.className = "playlist-item";
    createPlaylistItem.style.cssText =
      "flex: 1; background: rgba(0, 255, 0, 0.1); border-color: rgba(0, 255, 0, 0.3); margin: 0;";
    createPlaylistItem.innerHTML = `
      <div class="song-info">
        <div class="song-name">
          <span style="font-size: 1.1em;">➕ New Playlist</span>
        </div>
        <div class="song-artist" style="color: #888;">
          Add a custom playlist
        </div>
      </div>
      <div class="song-duration" style="font-size: 1.5em;">+</div>
    `;

    createPlaylistItem.addEventListener("click", () =>
      this.showCreatePlaylistDialog()
    );
    inlineOptionsContainer.appendChild(createPlaylistItem);

    this.playlist.appendChild(inlineOptionsContainer);

    // Display saved playlists
    if (this.playlists.length === 0) {
      const noPlaylistsItem = document.createElement("div");
      noPlaylistsItem.className = "playlist-item";
      noPlaylistsItem.innerHTML = `
        <div class="song-info">
          <div class="song-name" style="color: #888; text-align: center; width: 100%;">
            No custom playlists yet
          </div>
        </div>
      `;
      this.playlist.appendChild(noPlaylistsItem);
    } else {
      this.playlists.forEach((playlist) => {
        const trackCount = playlist.trackIds.length;
        const item = document.createElement("div");
        item.className = "playlist-item";
        item.innerHTML = `
          <div class="song-info">
            <div class="song-name">
              <span style="font-size: 1.1em;">📋 ${playlist.name}</span>
            </div>
            <div class="song-artist" style="color: #888;">
              ${trackCount} song${
          trackCount !== 1 ? "s" : ""
        } • Created ${new Date(playlist.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div class="song-duration" style="font-size: 1.5em;">›</div>
        `;

        item.addEventListener("click", () => this.showPlaylistDetail(playlist));
        this.playlist.appendChild(item);
      });
    }

    this.debugPanel?.addLog(
      `📋 Playlists view: ${recentTracks.length} recent tracks, ${this.playlists.length} custom playlists`
    );
  }

  private showLast90DaysDetail(): void {
    this.currentView = "playlist-detail";
    this.playlist.innerHTML = "";

    const backBtn = document.createElement("div");
    backBtn.className = "playlist-item";
    backBtn.style.cssText =
      "background: #1a1a2e; cursor: pointer; position: sticky; top: 0; z-index: 10; margin-bottom: 0;";
    backBtn.innerHTML = `
      <div class="song-info">
        <div class="song-name">
          <span style="font-size: 1.1em;">‹ Back to Playlists</span>
        </div>
      </div>
    `;
    backBtn.addEventListener("click", () => this.renderPlaylistsList());
    this.playlist.appendChild(backBtn);

    const header = document.createElement("div");
    header.style.cssText =
      "padding: 15px 20px; text-align: left; color: #00ffff; font-size: 1.1em; border-bottom: 2px solid rgba(0, 255, 255, 0.3); background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); position: sticky; top: 60px; z-index: 5; margin-bottom: 0;";
    header.innerHTML = `
      <span style="font-size: 0.8em; font-weight: bold;">🕐 Last 90 Days</span> • <span style="font-size: 0.6em; color: #888;">Recently added</span>
    `;
    this.playlist.appendChild(header);

    // Create scrollable tracks wrapper
    const tracksWrapper = document.createElement("div");
    // Get playlist section height and calculate wrapper max height
    const playlistSection = document.querySelector(
      ".playlist-section"
    ) as HTMLElement;
    const playlistSectionHeight = playlistSection
      ? playlistSection.offsetHeight
      : window.innerHeight;
    const wrapperMaxHeight = playlistSectionHeight - 132;

    tracksWrapper.style.cssText = `position: fixed; top: 200px; left: 20px; width: 90%; max-height: ${wrapperMaxHeight}px; overflow-y: auto; padding: 0.5em; z-index: 1; scrollbar-width: none; -ms-overflow-style: none;`;
    tracksWrapper.className = "tracks-wrapper";

    // Add scroll event listener for sticky active track
    tracksWrapper.addEventListener("scroll", () =>
      this.handleStickyActiveTrack()
    );

    const recentTracks = this.getLast90DaysTracks();
    recentTracks.forEach((track) => {
      const originalIndex = this.tracks.indexOf(track);

      const item = document.createElement("div");
      item.className = "playlist-item";
      item.dataset.index = originalIndex.toString();
      item.innerHTML = `
        <div class="song-info">
          <div class="song-name">${track.displayName}</div>
          <div class="song-artist">${track.artist || "Unknown Artist"}</div>
        </div>
        <div class="song-duration">${this.formatTime(
          track.durationSeconds
        )}</div>
      `;

      item.addEventListener("click", () => this.selectTrack(originalIndex));
      item.style.marginBottom = "0.5em";
      tracksWrapper.appendChild(item);
    });

    this.playlist.appendChild(tracksWrapper);

    this.debugPanel?.addLog(`🕐 Showing ${recentTracks.length} recent tracks`);
  }

  private showCreatePlaylistDialog(): void {
    const playlistName = prompt("Enter playlist name:");

    if (playlistName && playlistName.trim()) {
      const newPlaylist = this.createPlaylist(playlistName.trim());
      this.renderPlaylistsList(); // Refresh the list
      this.debugPanel?.addLog(`✅ Playlist "${newPlaylist.name}" created`);
    } else {
      this.debugPanel?.addLog(`⚠️ Playlist creation cancelled or invalid name`);
    }
  }

  private showPlaylistDetail(playlist: Playlist): void {
    this.selectedPlaylist = playlist;
    this.currentView = "playlist-detail";
    this.playlist.innerHTML = "";

    const backBtn = document.createElement("div");
    backBtn.className = "playlist-item";
    backBtn.style.cssText =
      "background: #1a1a2e; cursor: pointer; position: sticky; top: 0; z-index: 10; margin-bottom: 0;";
    backBtn.innerHTML = `
      <div class="song-info">
        <div class="song-name">
          <span style="font-size: 1.1em;">‹ Back to Playlists</span>
        </div>
      </div>
    `;
    backBtn.addEventListener("click", () => this.renderPlaylistsList());
    this.playlist.appendChild(backBtn);

    const header = document.createElement("div");
    header.style.cssText =
      "padding: 15px 20px; text-align: left; color: #00ffff; font-size: 1.1em; border-bottom: 2px solid rgba(0, 255, 255, 0.3); background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); position: sticky; top: 60px; z-index: 5; margin-bottom: 0;";
    header.innerHTML = `
      <span style="font-size: 0.8em; font-weight: bold;">📋 ${
        playlist.name
      }</span> • <span style="font-size: 0.6em; color: #888;">${
      playlist.trackIds.length
    } song${playlist.trackIds.length !== 1 ? "s" : ""}</span>
    `;
    this.playlist.appendChild(header);

    // Create scrollable tracks wrapper
    const tracksWrapper = document.createElement("div");
    // Get playlist section height and calculate wrapper max height
    const playlistSection = document.querySelector(
      ".playlist-section"
    ) as HTMLElement;
    const playlistSectionHeight = playlistSection
      ? playlistSection.offsetHeight
      : window.innerHeight;
    const wrapperMaxHeight = playlistSectionHeight - 112;

    tracksWrapper.style.cssText = `position: fixed; top: 200px; left: 20px; width: 90%; max-height: ${wrapperMaxHeight}px; overflow-y: auto; padding: 0.5em; z-index: 1; scrollbar-width: none; -ms-overflow-style: none;`;
    tracksWrapper.className = "tracks-wrapper";

    // Add scroll event listener for sticky active track
    tracksWrapper.addEventListener("scroll", () =>
      this.handleStickyActiveTrack()
    );

    if (playlist.trackIds.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "playlist-item";
      emptyMessage.style.marginBottom = "0.5em";
      emptyMessage.innerHTML = `
        <div class="song-info">
          <div class="song-name" style="color: #888; text-align: center; width: 100%;">
            This playlist is empty
          </div>
          <div class="song-artist" style="color: #666; text-align: center; width: 100%;">
            Add tracks from the Songs view
          </div>
        </div>
      `;
      tracksWrapper.appendChild(emptyMessage);
    } else {
      playlist.trackIds.forEach((trackId) => {
        const track = this.tracks.find((t) => t.id === trackId);
        if (track) {
          const originalIndex = this.tracks.indexOf(track);

          const item = document.createElement("div");
          item.className = "playlist-item";
          item.dataset.index = originalIndex.toString();
          item.innerHTML = `
            <div class="song-info">
              <div class="song-name">${track.displayName}</div>
              <div class="song-artist">${track.artist || "Unknown Artist"}</div>
            </div>
            <div class="song-duration">${this.formatTime(
              track.durationSeconds
            )}</div>
          `;

          item.addEventListener("click", () => this.selectTrack(originalIndex));
          tracksWrapper.appendChild(item);
        }
      });
    }

    this.playlist.appendChild(tracksWrapper);

    this.debugPanel?.addLog(
      `📋 Showing playlist "${playlist.name}" with ${playlist.trackIds.length} tracks`
    );
  }

  // ==================== PLAYLIST POPUP ====================

  private showPlaylistPopup(): void {
    if (this.tracks.length === 0) {
      this.debugPanel?.addLog("⚠️ No tracks available to add to playlist");
      return;
    }

    // Get current track or use first track
    const currentTrack =
      this.currentTrackIndex >= 0
        ? this.tracks[this.currentTrackIndex]
        : this.tracks[0];
    this.currentTrackForPlaylist = currentTrack;

    // Create popup overlay
    this.playlistPopup = document.createElement("div");
    this.playlistPopup.id = "playlist-popup";
    this.playlistPopup.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 100001;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    `;

    // Create popup content
    const popupContent = document.createElement("div");
    popupContent.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 2px solid rgba(0, 255, 255, 0.3);
      border-radius: 20px;
      padding: 20px;
      max-width: 400px;
      width: 90%;
      max-height: 70vh;
      overflow-y: auto;
      box-shadow: 0 0 30px rgba(255, 0, 150, 0.3),
        inset 0 0 30px rgba(0, 255, 255, 0.1);
      animation: slideUp 0.3s ease;
      position: relative;
    `;

    // Load playlists
    this.loadPlaylists();

    popupContent.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid rgba(0, 255, 255, 0.3);">
        <h3 style="color: #00ffff; font-size: 1.3em; margin: 0;">Add to Playlist</h3>
      </div>
      <div style="color: #ffffff; margin-bottom: 15px; padding: 10px; background: rgba(255, 255, 255, 0.05); border-radius: 10px;">
        <div style="font-weight: bold; margin-bottom: 5px;">${
          currentTrack.displayName
        }</div>
        <div style="font-size: 0.9em; color: #cccccc;">${
          currentTrack.artist || "Unknown Artist"
        }</div>
      </div>
      <div style="color: #00ffff; margin-bottom: 15px; font-weight: bold;">Select playlists:</div>
      <div id="playlist-options" style="display: flex; flex-direction: column; gap: 10px;">
        ${this.renderPlaylistOptions()}
      </div>

    `;

    this.playlistPopup.appendChild(popupContent);
    document.body.appendChild(this.playlistPopup);

    // Apply floating particles effect to popup
    createFloatingParticles(popupContent);

    // Close on background click
    this.playlistPopup.addEventListener("click", (e) => {
      if (e.target === this.playlistPopup) {
        this.closePlaylistPopup();
      }
    });

    // Add click listeners to playlist options
    const playlistOptions = popupContent.querySelectorAll(".playlist-option");
    playlistOptions.forEach((option) => {
      option.addEventListener("click", () => {
        const playlistId = (option as HTMLElement).dataset.playlistId;
        if (playlistId === "new") {
          this.createPlaylistAndAddTrack();
        } else if (playlistId) {
          this.toggleTrackInPlaylist(playlistId);
        }
      });
    });

    this.debugPanel?.addLog(
      `📋 Opening playlist popup for: ${currentTrack.displayName}`
    );
  }

  private renderPlaylistOptions(): string {
    if (this.playlists.length === 0) {
      return `
        <div class="playlist-option" data-playlist-id="new" style="
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid rgba(0, 255, 0, 0.3);
          border-radius: 10px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #ffffff;
          display: flex;
          justify-content: center;
          align-items: center;
        " onmouseover="this.style.background='rgba(0, 255, 0, 0.2)'" onmouseout="this.style.background='rgba(0, 255, 0, 0.1)'">
          <span>New Playlist</span>
        </div>
      `;
    }

    let options = `
      <div class="playlist-option" data-playlist-id="new" style="
        background: rgba(0, 255, 0, 0.1);
        border: 1px solid rgba(0, 255, 0, 0.3);
        border-radius: 10px;
        padding: 15px;
        cursor: pointer;
        transition: all 0.3s ease;
        color: #ffffff;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 10px;
      " onmouseover="this.style.background='rgba(0, 255, 0, 0.2)'" onmouseout="this.style.background='rgba(0, 255, 0, 0.1)'">
        <span>New Playlist</span>
      </div>
    `;

    this.playlists.forEach((playlist) => {
      const isInPlaylist = playlist.trackIds.includes(
        this.currentTrackForPlaylist?.id || ""
      );
      const optionStyle = isInPlaylist
        ? "background: rgba(255, 0, 150, 0.2); border-color: rgba(255, 0, 150, 0.5);"
        : "background: rgba(255, 255, 255, 0.05); border-color: rgba(0, 255, 255, 0.2);";

      options += `
        <div class="playlist-option" data-playlist-id="${playlist.id}" style="
          border: 1px solid;
          border-radius: 10px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          ${optionStyle}
        " onmouseover="this.style.background='rgba(0, 255, 255, 0.1)'" onmouseout="this.style.background='${optionStyle}'">
          <span>${playlist.name}</span>
          <span style="color: ${
            isInPlaylist ? "#ff0096" : "#00ffff"
          }; font-size: 0.9em;">
            ${
              isInPlaylist
                ? "✓ Click to remove"
                : `${playlist.trackIds.length} tracks`
            }
          </span>
        </div>
      `;
    });

    return options;
  }

  private closePlaylistPopup(): void {
    if (this.playlistPopup) {
      this.playlistPopup.remove();
      this.playlistPopup = null;
      this.currentTrackForPlaylist = null;
      this.debugPanel?.addLog("📋 Playlist popup closed");
    }
  }

  private createPlaylistAndAddTrack(): void {
    const playlistName = prompt("Enter playlist name:");

    if (playlistName && playlistName.trim()) {
      const newPlaylist = this.createPlaylist(playlistName.trim());
      this.toggleTrackInPlaylist(newPlaylist.id);
    } else {
      this.debugPanel?.addLog("⚠️ Playlist creation cancelled or invalid name");
    }
  }

  private toggleTrackInPlaylist(playlistId: string): void {
    if (!this.currentTrackForPlaylist) return;

    const playlist = this.playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const trackId = this.currentTrackForPlaylist.id;
    const isAlreadyInPlaylist = playlist.trackIds.includes(trackId);

    if (isAlreadyInPlaylist) {
      // Remove track from playlist
      playlist.trackIds = playlist.trackIds.filter((id) => id !== trackId);
      this.debugPanel?.addLog(
        `🗑️ Removed "${this.currentTrackForPlaylist.displayName}" from "${playlist.name}"`
      );
    } else {
      // Add track to playlist
      playlist.trackIds.push(trackId);
      this.debugPanel?.addLog(
        `✅ Added "${this.currentTrackForPlaylist.displayName}" to "${playlist.name}"`
      );
    }

    this.savePlaylists();

    // Refresh the popup options to show updated state
    this.refreshPlaylistPopup();

    // Refresh playlists view if currently visible
    if (this.currentView === "playlists") {
      this.renderPlaylistsList();
    }
  }

  private refreshPlaylistPopup(): void {
    if (!this.playlistPopup || !this.currentTrackForPlaylist) return;

    const playlistOptionsContainer =
      this.playlistPopup.querySelector("#playlist-options");
    if (playlistOptionsContainer) {
      playlistOptionsContainer.innerHTML = this.renderPlaylistOptions();

      // Re-add click listeners to the new options
      const playlistOptions =
        playlistOptionsContainer.querySelectorAll(".playlist-option");
      playlistOptions.forEach((option) => {
        option.addEventListener("click", () => {
          const playlistId = (option as HTMLElement).dataset.playlistId;
          if (playlistId === "new") {
            this.createPlaylistAndAddTrack();
          } else if (playlistId) {
            this.toggleTrackInPlaylist(playlistId);
          }
        });
      });
    }
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
            this.currentView = "playlists";
            this.renderPlaylistsList();
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
  // Try to load real tracks, fallback to mock tracks if empty
  const realTracks = await MediaStoreService.waitForTracks();
  trackList = realTracks.length > 0 ? realTracks : mockTracks;

  const player = new CosmicMusicPlayer(debugPanel);
  await player.init();
  debugPanel.addLog("🎵 Ready");
});

document.addEventListener("DOMContentLoaded", () => {
  createFloatingParticles();

  // Add CSS to hide scrollbar for tracks wrapper
  const style = document.createElement("style");
  style.textContent = `
    .tracks-wrapper::-webkit-scrollbar {
      display: none;
    }
  `;
  document.head.appendChild(style);

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
