import { parseFile } from "music-metadata";
import path from "path";
import { readdirSync, existsSync, mkdirSync } from "fs";

interface Track {
  name: string;
  artist: string;
  duration: string;
  durationSeconds: number;
  url: string;
  path: string;
}

const secondsToMinutes = (s: number): string =>
  `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

export async function getTracks(): Promise<Track[]> {
  try {
    const tracksPath = path.join(process.cwd(), "docs", "tracks");

    // Check if tracks directory exists
    if (!existsSync(tracksPath)) {
      console.warn("Tracks directory not found. Creating it...");
      mkdirSync(tracksPath, { recursive: true });
      return [];
    }

    // Read all files in the tracks directory using Bun's native APIs
    const files = readdirSync(tracksPath);

    // Filter for MP3 files only
    const mp3Files = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return ext === ".mp3";
    });

    // Return array of track objects with metadata
    const trackPromises = mp3Files.map(async (file): Promise<Track> => {
      const filePath = path.join(tracksPath, file);
      const meta = await parseFile(filePath);

      // Parse artist and name from filename (format: "Artist - Song.mp3")
      const [artist = "Unknown Artist", name = file] = file
        .split("-")
        .map((text) => text.trim());

      const durationInSeconds = Math.round(meta.format.duration || 0);
      const duration = secondsToMinutes(durationInSeconds);
      const url = `/tracks/${file}`;

      return {
        name: name.replace(/\.mp3$/i, ""), // Remove .mp3 extension
        artist,
        duration,
        durationSeconds: durationInSeconds,
        url,
        path: filePath,
      };
    });

    return await Promise.all(trackPromises);
  } catch (error) {
    console.error("Error reading tracks:", error);
    return [];
  }
}
