import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [tailwindcss(), react(), tsconfigPaths()],
    resolve: {
      alias: {
        "@assets": new URL("./attached_assets", import.meta.url).pathname,
      },
    },
    server: {
      proxy: {
        "/api": {
          target: env.VITE_DEV_API_URL || "http://localhost:5002",
          changeOrigin: true,
        },
        "/socket.io": {
          target: env.VITE_DEV_API_URL || "http://localhost:5002",
          changeOrigin: true,
          ws: true,
        },
      },
      // Ensure proper MIME types for dynamic imports
      headers: {
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
        'Cross-Origin-Opener-Policy': 'unsafe-none',
      },
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'routing': ['wouter', 'react-router-dom'],
            'ui-vendor': ['@radix-ui/react-accordion', '@radix-ui/react-alert-dialog', '@radix-ui/react-avatar'],
            'query-vendor': ['@tanstack/react-query', 'swr'],
            'icons': ['lucide-react', '@heroicons/react'],
            'utils': ['clsx', 'class-variance-authority', 'tailwind-merge'],
            'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: false,
      cssCodeSplit: false,
    },
    // Ensure proper module resolution
    optimizeDeps: {
      include: ['react', 'react-dom', 'wouter'],
    },
  };

  console.log("VITE_SOCKET_URL at build time:", process.env.VITE_SOCKET_URL);

});
