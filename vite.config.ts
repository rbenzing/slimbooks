import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  preview: {
    port: 8080,
    strictPort: true,
  },
  server: {
    origin: "http://0.0.0.0:8080",
    strictPort: true,
    host: true,
    port: 8080,
  },
  plugins: [
    react(),
  ],
  build: {
    outDir: 'dist',    // output directory
    sourcemap: false,   // disable source maps for production to save memory
    minify: 'esbuild',  // use esbuild for faster, less memory-intensive minification
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks to reduce memory usage during build
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
});
