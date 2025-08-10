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
    sourcemap: true,   // generate source maps
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
