import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Path resolution for @ alias + stubs for Node-only modules (not available in WebView)
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "drizzle-orm/better-sqlite3/migrator": path.resolve(__dirname, "./src/_stubs/drizzle-orm-better-sqlite3-migrator.ts"),
      "drizzle-orm/better-sqlite3": path.resolve(__dirname, "./src/_stubs/drizzle-orm-better-sqlite3.ts"),
      "better-sqlite3": path.resolve(__dirname, "./src/_stubs/better-sqlite3.ts"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
});
