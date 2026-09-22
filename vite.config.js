import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(() => {
  const backendTarget = process.env.VITE_BACKEND_TARGET || "http://localhost:8080";

  return {
    plugins: [react()],
    define: {
      global: "globalThis",
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/ws-orders": {
          target: backendTarget,
          changeOrigin: true,
          ws: true,
        },
        "/uploads": {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
