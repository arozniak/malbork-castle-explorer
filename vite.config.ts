import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/malbork-castle-explorer/",
  plugins: [react()],
  server: {
    open: true,
  },
  build: {
    outDir: "dist",
  },
});
