import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy API calls to the ckiller server during development.
    proxy: {
      "/skill": "http://localhost:3000",
      "/version": "http://localhost:3000",
    },
  },
});
