import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { parseFile } from "music-metadata";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const secondsToMinutes = (s) =>
  `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

export async function getTracks() {
  try {
    const tracksPath = path.join(__dirname, "docs", "tracks");

    // Check if tracks directory exists
    if (!fs.existsSync(tracksPath)) {
      console.warn("Tracks directory not found. Creating it...");
      fs.mkdirSync(tracksPath, { recursive: true });
      return [];
    }

    // Read all files in the tracks directory
    const files = fs.readdirSync(tracksPath);

    // Filter for MP3 files only
    const mp3Files = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return ext === ".mp3";
    });

    // Return array of track objects with metadata
    const trackPromises = mp3Files.map(async (file) => {
      const meta = await parseFile(path.join(tracksPath, file));
      const [artist, name] = file.split("-").map((text) => text.trim());
      const duration = secondsToMinutes(
        Math.round(meta.format.duration.toFixed(0)),
      );
      const durationSeconds = duration * 60;
      const url = `/tracks/${file}`;

      return {
        name,
        artist,
        duration,
        durationSeconds,
        url,
        path: path.join(tracksPath, file),
      };
    });

    return await Promise.all(trackPromises);
  } catch (error) {
    console.error("Error reading tracks:", error);
    return [];
  }
}
