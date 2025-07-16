import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

const shouldAnalyze = process.env.ANALYZE_ROLLUP === "true";
// https://vite.dev/config/
export default defineConfig({
  root: "./frontend",
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      plugins: shouldAnalyze
        ? [
            visualizer({
              open: true,
              gzipSize: true,
              brotliSize: true,
              filename: path.resolve(__dirname, "frontend/dist/stats.html"),
            }),
          ]
        : [],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./frontend/src"),
    },
  },
});
