
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Force cache busting in development
    headers: mode === 'development' ? {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    } : undefined,
  },
  // Disable caching for development builds
  build: {
    rollupOptions: mode === 'development' ? {
      output: {
        entryFileNames: `[name].${Date.now()}.js`,
        chunkFileNames: `[name].${Date.now()}.js`,
        assetFileNames: `[name].${Date.now()}.[ext]`
      }
    } : undefined
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
