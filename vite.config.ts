import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize build output with esbuild (default, fast)
    minify: "esbuild",
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-form": ["react-hook-form", "zod", "@hookform/resolvers"],
          "vendor-ui": ["recharts", "sonner", "lucide-react", "date-fns", "react-day-picker"],
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
          ],
        },
      },
    },
    // Inline small assets
    assetsInlineLimit: 4096,
    // Adjust chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Enable source maps in production for error tracking
    sourcemap: "hidden",
  },
});
