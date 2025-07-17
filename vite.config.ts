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
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("radix-ui") ||
              id.includes("ui") ||
              id.includes("lucide") ||
              id.includes("sonner") ||
              id.includes("zod") ||
              id.includes("react-diff-viewer") ||
              id.includes("emotion") ||
              id.includes("react-remove--scroll") ||
              id.includes("react-hook-form")
            ) {
              return "ui";
            }
            if (
              id.includes("d3") ||
              id.includes("xyflow") ||
              id.includes("zustand")
            ) {
              return "reactflow";
            }

            if (id.includes("react")) {
              return "react";
            }
            return "modules";
          }

          return null;
        },
      },
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
