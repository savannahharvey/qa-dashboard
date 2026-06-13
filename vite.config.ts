import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  base: '/qa-dashboard/',
  root: './', // Tells Vite to look at the root directory
  build: {
    outDir: 'dist', // Ensures the output folder is still called 'dist' at the root
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://127.0.0.1:4000",
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    setupFiles: ["src/client/test/setup.ts"],
  },
});
