import { Capacitor } from "@capacitor/core";
import {
  CapacitorMediaStore,
  MediaType,
} from "@odion-cloud/capacitor-mediastore";

export class DebugPanel {
  private panel: HTMLDivElement;
  private logs: string[] = [];

  constructor() {
    this.panel = this.createPanel();
    document.body.appendChild(this.panel);
    this.setupToggle();
    this.initialize();
  }

  private createPanel(): HTMLDivElement {
    const panel = document.createElement("div");
    panel.id = "debug-panel";
    panel.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      max-height: 400px;
      background: rgba(0, 0, 0, 0.95);
      color: #00ff00;
      font-family: monospace;
      font-size: 10px;
      padding: 10px;
      overflow-y: auto;
      z-index: 99999;
      border-top: 2px solid #00ff00;
      transform: translateY(100%);
      transition: transform 0.3s;
    `;

    panel.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; color: #ff0096;">
        🐛 DEBUG PANEL
      </div>
      <div id="debug-content"></div>
    `;

    return panel;
  }

  private setupToggle(): void {
    const toggle = document.createElement("button");
    toggle.textContent = "🐛";
    toggle.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #ff0096;
      color: white;
      border: none;
      font-size: 24px;
      z-index: 100000;
      box-shadow: 0 4px 12px rgba(255, 0, 150, 0.5);
      cursor: pointer;
    `;

    let isOpen = false;
    toggle.addEventListener("click", () => {
      isOpen = !isOpen;
      this.panel.style.transform = isOpen
        ? "translateY(0)"
        : "translateY(100%)";
    });

    document.body.appendChild(toggle);
  }

  private async initialize(): Promise<void> {
    await this.checkPlatform();
    await this.checkPermissions();
    await this.scanAudioFiles();
    await this.getAlbums();
  }

  private async checkPlatform(): Promise<void> {
    this.log("=== PLATFORM ===");
    this.log(
      `${Capacitor.getPlatform()} - Native: ${Capacitor.isNativePlatform()}`,
    );
  }

  private async checkPermissions(): Promise<void> {
    this.log("\n=== PERMISSIONS ===");

    if (!Capacitor.isNativePlatform()) {
      this.log("⚠️ Not on native platform");
      return;
    }

    try {
      const checkResult = await CapacitorMediaStore.checkPermissions();
      this.log(
        `Current: Audio=${checkResult.readMediaAudio || checkResult.readExternalStorage || "N/A"}`,
      );

      const result = await CapacitorMediaStore.requestPermissions();

      const granted =
        result.readMediaAudio === "granted" ||
        result.readExternalStorage === "granted";

      this.log(granted ? "✅ GRANTED" : "❌ DENIED");
    } catch (error: any) {
      this.log(`❌ Error: ${error.message || error}`);
    }
  }

  private async scanAudioFiles(): Promise<void> {
    this.log("\n=== AUDIO FILES ===");

    if (!Capacitor.isNativePlatform()) {
      this.log("⚠️ Not on native platform");
      return;
    }

    try {
      const result = await CapacitorMediaStore.getMediasByType({
        mediaType: MediaType.AUDIO,
        sortBy: "TITLE",
        sortOrder: "ASC",
        includeExternal: true,
      });

      const count = result.totalCount || 0;
      this.log(`✅ Found ${count} tracks`);

      if (count > 0 && result.media) {
        // Primeros 5 archivos
        this.log("\n📋 Sample:");
        result.media.slice(0, 5).forEach(async (file, i) => {
          this.log(`${i + 1}. ${file.title || file.displayName}`);
          this.log(`   ${file.artist || "Unknown"} - ${file.album || "N/A"}`);
          this.log(`FILE URI: ${file.uri}`);
        });

        if (count > 5) this.log(`... +${count - 5} more`);

        // Estadísticas
        const internal = result.media.filter((f) => !f.isExternal).length;
        const external = result.media.filter((f) => f.isExternal).length;
        this.log(`\n📊 ${internal} internal, ${external} SD card`);

        // Top artistas
        const artists = new Map<string, number>();
        result.media.forEach((f) => {
          const artist = f.artist || "Unknown";
          artists.set(artist, (artists.get(artist) || 0) + 1);
        });

        this.log("\n👤 Top Artists:");
        Array.from(artists.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .forEach(([artist, count]) => {
            this.log(`  ${artist}: ${count}`);
          });
      }
    } catch (error: any) {
      this.log(`❌ Error: ${error.message || error}`);
    }
  }

  private async getAlbums(): Promise<void> {
    this.log("\n=== ALBUMS ===");

    if (!Capacitor.isNativePlatform()) return;

    try {
      const result = await CapacitorMediaStore.getAlbums();
      const count = result.totalCount || 0;
      this.log(`✅ Found ${count} albums`);

      if (count > 0 && result.albums) {
        result.albums.slice(0, 3).forEach((album, i) => {
          this.log(
            `${i + 1}. ${album.name} - ${album.artist} (${album.trackCount})`,
          );
        });
        if (count > 3) this.log(`... +${count - 3} more`);
      }
    } catch (error: any) {
      this.log(`❌ Error: ${error.message || error}`);
    }
  }

  private log(message: string): void {
    this.logs.push(message);
    console.log(message);
    this.render();
  }

  private render(): void {
    const content = document.getElementById("debug-content");
    if (content) {
      content.innerHTML = this.logs
        .map((log) => {
          const color = log.includes("✅")
            ? "#00ff00"
            : log.includes("❌")
              ? "#ff0000"
              : log.includes("⚠️")
                ? "#ffaa00"
                : log.includes("🎵") || log.includes("👤") || log.includes("📀")
                  ? "#ff0096"
                  : "#00ffff";
          return `<div style="color: ${color}; margin: 2px 0;">${this.escapeHtml(log)}</div>`;
        })
        .join("");

      content.scrollTop = content.scrollHeight;
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  public addLog(message: string): void {
    this.log(message);
  }

  public async rescan(): Promise<void> {
    this.logs = [];
    await this.initialize();
  }
}

// document.addEventListener("DOMContentLoaded", () => {
//   debugPanel = new DebugPanel();
//   (window as any).debugPanel = debugPanel;
//   (window as any).debugPanel?.addLog(
//     "MediaLoader plugin: " +
//       JSON.stringify((window as any).Capacitor?.Plugins?.MediaLoader),
//   );
//   (window as any).debugPanel?.addLog(
//     "MediaLoader methods: " + Object.keys(MediaLoader).join(", "),
//   );

//   console.log("🐛 Debug: debugPanel.rescan()");
// });
