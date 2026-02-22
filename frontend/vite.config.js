import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // allow LAN & mobile
    port: 5173,
    strictPort: true,

    // 🔥 CRITICAL FIX FOR NGROK
    allowedHosts: true,

    // 🔥 Fix 403 on root `/`
    cors: true,

    // Backend proxy
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
});
