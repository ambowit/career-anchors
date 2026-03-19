import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Force rebuild - clear all caches
const timestamp = Date.now();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: process.cwd(),
  cacheDir: `node_modules/.vite-${timestamp}`,
  clearScreen: true,
  optimizeDeps: {
    include: ["lucide-react", "framer-motion", "recharts"],
    force: true,
    entries: ["./src/**/*.tsx", "./src/**/*.ts"],
    esbuildOptions: {
      target: "esnext",
    },
  },
  server: {
    fs: {
      strict: false,
      allow: [process.cwd()],
    },
    warmup: {
      clientFiles: [],
    },
  },
  build: {
    target: "esnext",
    sourcemap: false,
    minify: "esbuild",
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-')) return 'charts';
            if (id.includes('framer-motion')) return 'motion';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('@radix-ui')) return 'radix';
            if (id.includes('react-dom')) return 'react-dom';
            if (id.includes('html2canvas') || id.includes('jspdf')) return 'pdf';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
