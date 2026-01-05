import { Capacitor } from "@capacitor/core";
import {
  CapacitorMediaStore,
  MediaType,
} from "@odion-cloud/capacitor-mediastore";

export class DebugPanel {
  private panel: HTMLDivElement;
  private debugContent: HTMLDivElement;
  private logs: string[] = [];
  private isInitialized: boolean = false;

  constructor() {
    this.panel = this.createPanel();
    this.debugContent = this.panel.querySelector(
      "#debug-content",
    ) as HTMLDivElement;
    document.body.appendChild(this.panel);
    this.setupToggle();

    // Agregar un pequeño delay para asegurar que el DOM está listo
    setTimeout(() => {
      this.initialize();
    }, 100);
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
      font-size: 11px;
      padding: 10px;
      overflow-y: auto;
      z-index: 99999;
      border-top: 2px solid #00ff00;
      transform: translateY(100%);
      transition: transform 0.3s;
      line-height: 1.4;
    `;

    panel.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; color: #ff0096; font-size: 12px;">
        🐛 DEBUG PANEL
      </div>
      <div id="debug-content" style="white-space: pre-wrap; word-wrap: break-word;"></div>
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
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    let isOpen = false;
    toggle.addEventListener("click", () => {
      isOpen = !isOpen;
      this.panel.style.transform = isOpen
        ? "translateY(0)"
        : "translateY(100%)";

      // Scroll al final cuando se abre
      if (isOpen) {
        setTimeout(() => {
          this.panel.scrollTop = this.panel.scrollHeight;
        }, 300);
      }
    });

    document.body.appendChild(toggle);
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.log("=== INITIALIZATION START ===");
    await this.checkPlatform();
    // await this.checkPermissions();
    await this.scanAudioFiles();
    // await this.getAlbums();
    this.log("=== INITIALIZATION COMPLETE ===");
  }

  private async checkPlatform(): Promise<void> {
    this.log("\n=== PLATFORM ===");
    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();
    this.log(`Platform: ${platform}`);
    this.log(`Native: ${isNative ? "YES" : "NO"}`);
  }

  private async checkPermissions(): Promise<void> {
    this.log("\n=== PERMISSIONS ===");

    if (!Capacitor.isNativePlatform()) {
      this.log("⚠️ Not on native platform - skipping permission check");
      return;
    }

    try {
      const checkResult = await CapacitorMediaStore.checkPermissions();
      this.log(`Check result: ${JSON.stringify(checkResult)}`);

      const result = await CapacitorMediaStore.requestPermissions();
      this.log(`Request result: ${JSON.stringify(result)}`);

      const granted =
        result.readMediaAudio === "granted" ||
        result.readExternalStorage === "granted";

      this.log(granted ? "✅ PERMISSIONS GRANTED" : "❌ PERMISSIONS DENIED");
    } catch (error: any) {
      this.log(`❌ Permission error: ${error.message || error}`);
    }
  }

  private async scanAudioFiles(): Promise<void> {
    this.log("\n=== SCANNING AUDIO FILES ===");

    if (!Capacitor.isNativePlatform()) {
      this.log("⚠️ Not on native platform - skipping scan");
      return;
    }

    try {
      this.log("Requesting audio files from MediaStore...");

      const result = await CapacitorMediaStore.getMediasByType({
        mediaType: MediaType.AUDIO,
        sortBy: "TITLE",
        sortOrder: "ASC",
        includeExternal: true,
      });

      const count = result.totalCount || 0;
      this.log(`✅ Found ${count} audio files`);

      if (count > 0 && result.media) {
        // Primeros 3 archivos con más detalles
        this.log("\n📋 SAMPLE FILES:");
        result.media.slice(0, 3).forEach((file, i) => {
          this.log(`\n${i + 1}. ${file.title || file.displayName}`);
          this.log(`   Artist: ${file.artist || "Unknown"}`);
          this.log(`   Album: ${file.album || "N/A"}`);
          this.log(`   URI: ${file.uri?.substring(0, 50)}...`);
          this.log(`   Duration: ${Math.floor((file.duration || 0) / 1000)}s`);
        });

        if (count > 3) {
          this.log(`\n... and ${count - 3} more files`);
        }

        // Estadísticas
        const internal = result.media.filter((f) => !f.isExternal).length;
        const external = result.media.filter((f) => f.isExternal).length;
        this.log(`\n📊 STORAGE: ${internal} internal, ${external} external/SD`);

        // Top 3 artistas
        const artists = new Map<string, number>();
        result.media.forEach((f) => {
          const artist = f.artist || "Unknown";
          artists.set(artist, (artists.get(artist) || 0) + 1);
        });

        this.log("\n👤 TOP ARTISTS:");
        Array.from(artists.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .forEach(([artist, count]) => {
            this.log(`  • ${artist}: ${count} tracks`);
          });
      } else {
        this.log("⚠️ No audio files found");
      }
    } catch (error: any) {
      this.log(`❌ Scan error: ${error.message || error}`);
      console.error("Full scan error:", error);
    }
  }

  private async getAlbums(): Promise<void> {
    this.log("\n=== ALBUMS ===");

    if (!Capacitor.isNativePlatform()) {
      this.log("⚠️ Not on native platform - skipping albums");
      return;
    }

    try {
      const result = await CapacitorMediaStore.getAlbums();
      const count = result.totalCount || 0;
      this.log(`✅ Found ${count} albums`);

      if (count > 0 && result.albums) {
        result.albums.slice(0, 3).forEach((album, i) => {
          this.log(
            `${i + 1}. ${album.name} - ${album.artist} (${album.trackCount} tracks)`,
          );
        });
        if (count > 3) {
          this.log(`... and ${count - 3} more albums`);
        }
      }
    } catch (error: any) {
      this.log(`❌ Album error: ${error.message || error}`);
    }
  }

  private log(message: string): void {
    this.logs.push(message);
    console.log(message);
    this.render();
  }

  private render(): void {
    if (!this.debugContent) {
      console.error("Debug content element not found!");
      return;
    }

    try {
      const html = this.logs
        .map((log) => {
          let color = "#00ffff"; // cyan por defecto

          if (log.includes("✅")) {
            color = "#00ff00"; // verde
          } else if (log.includes("❌")) {
            color = "#ff0000"; // rojo
          } else if (log.includes("⚠️")) {
            color = "#ffaa00"; // naranja
          } else if (
            log.includes("🎵") ||
            log.includes("▶️") ||
            log.includes("⏸️") ||
            log.includes("⏭️") ||
            log.includes("⏮️")
          ) {
            color = "#ff0096"; // rosa
          } else if (log.includes("===")) {
            color = "#ffffff"; // blanco para títulos
          } else if (
            log.includes("📋") ||
            log.includes("👤") ||
            log.includes("📊")
          ) {
            color = "#00d4ff"; // cyan claro
          }

          return `<div style="color: ${color}; margin: 2px 0;">${this.escapeHtml(log)}</div>`;
        })
        .join("");

      this.debugContent.innerHTML = html;

      // Auto-scroll al final
      this.panel.scrollTop = this.panel.scrollHeight;
    } catch (error) {
      console.error("Render error:", error);
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

  public clear(): void {
    this.logs = [];
    this.render();
  }

  public async rescan(): Promise<void> {
    this.log("\n=== MANUAL RESCAN ===");
    await this.scanAudioFiles();
    await this.getAlbums();
  }
}
