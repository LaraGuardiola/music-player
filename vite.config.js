import { defineConfig } from "vite";

export default defineConfig({
  root: "docs",
  server: {
    port: 5174,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:3030",
        changeOrigin: true,
      },
      "/tracks": {
        target: "http://localhost:3030",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
