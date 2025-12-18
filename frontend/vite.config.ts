import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/app/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "127.0.0.1",
    proxy: {
      // Proxy API requests to the backend server
      "/api": {
        target: "http://127.0.0.1:2024",
        changeOrigin: true,
      },
      // Proxy LangGraph threads API requests
      "/threads": {
        target: "http://127.0.0.1:2024",
        changeOrigin: true,
      },
    },
  },
});
