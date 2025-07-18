import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { getTracks } from "./tracks.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3030;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// API endpoint to get all tracks
app.get("/api/tracks", async (req, res) => {
  const tracks = await getTracks();
  res.json(tracks);
});

// Start the server
app.listen(PORT, () => {
  console.log(
    `🚀 Cosmic Music Player server running on http://localhost:${PORT}`,
  );
  console.log(`🎵 Place your MP3 files in the public/tracks/ folder`);
});
