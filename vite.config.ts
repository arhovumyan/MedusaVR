import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath, URL } from "url";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: fileURLToPath(new URL("./client", import.meta.url)),

  plugins: [
    tailwindcss(),
    react(),
    tsconfigPaths(),              
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then(m =>
            m.cartographer()
          ),
        ]
      : []),
  ],

  assetsInclude: ['**/*.txt'],

  resolve: {
    alias: {
      // any manual aliases you still want:
      "@assets": fileURLToPath(new URL("./attached_assets", import.meta.url)),
    },
  },

  server: {
    proxy: {
      // Proxy API requests to the backend server
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:5002",
        changeOrigin: true,
      },
      // Proxy Socket.IO requests to the backend server
      "/socket.io": {
        target: process.env.VITE_API_URL || "http://localhost:5002",
        changeOrigin: true,
        ws: true, // Enable WebSocket proxy
      },
    },
  },

  build: {
    outDir: fileURLToPath(new URL("./client/dist", import.meta.url)),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'routing': ['wouter', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-accordion', '@radix-ui/react-alert-dialog', '@radix-ui/react-avatar', '@radix-ui/react-button', '@radix-ui/react-card'],
          'query-vendor': ['@tanstack/react-query', 'swr'],
          'icons': ['lucide-react', '@heroicons/react'],
          'utils': ['clsx', 'class-variance-authority', 'tailwind-merge'],
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    // Enable modern build optimizations
    target: 'es2015',
    minify: 'esbuild',
    sourcemap: false,
    // Disable CSS code splitting to prevent preload issues
    cssCodeSplit: false,
  },
});