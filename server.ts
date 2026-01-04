import { getTracks } from "./tracks";

const PORT = process.env.PORT || 3030;

const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",

  async fetch(req) {
    const url = new URL(req.url);

    // API endpoint to get all tracks
    if (url.pathname === "/api/tracks") {
      const tracks = await getTracks();
      return new Response(JSON.stringify(tracks), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Handle root path
    if (url.pathname === "/") {
      const file = Bun.file("./docs/index.html");
      return new Response(file, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Serve static files - decode URL first
    const decodedPath = decodeURIComponent(url.pathname);
    const filePath = `./docs${decodedPath}`;
    const file = Bun.file(filePath);

    const exists = await file.exists();
    if (!exists) {
      return new Response("404 Not Found", { status: 404 });
    }

    return new Response(file, {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
        "Accept-Ranges": "bytes",
      },
    });
  },
});

console.log(`🚀 Server running on http://localhost:${server.port}`);
console.log(`🎵 Place MP3 files in docs/tracks/`);
