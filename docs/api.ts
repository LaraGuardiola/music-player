import { MediaStoreService } from "./music.service";

export interface Track {
  name: string;
  artist: string;
  url: string;
  duration: string;
  durationSeconds: number;
  path: string;
  album?: string;
}

export async function fetchTracks(): Promise<Track[]> {
  try {
    console.log("📱 Fetching tracks using MediaStore...");
    const deviceTracks = await MediaStoreService.scanDeviceMusic();
    console.log(`✅ Loaded ${deviceTracks.length} tracks`);
    return deviceTracks;
  } catch (error) {
    console.error("Error loading device music:", error);

    // Mostrar mensaje al usuario
    if (error instanceof Error && error.message.includes("permission")) {
      alert(
        "⚠️ Storage permission required\n\nPlease grant storage permissions in your device settings to access your music files.",
      );
    } else {
      alert(
        "❌ Could not load music files\n\nError: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }

    return [];
  }
}
