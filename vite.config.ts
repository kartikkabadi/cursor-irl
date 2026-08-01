import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
  build: {
    // A path-mounted Worker route maps /cursor-irl/* to dist/cursor-irl/*.
    // Keep the production asset tree aligned with that route instead of
    // uploading root-level assets that the mounted app cannot resolve.
    outDir: process.env.VITE_BASE_PATH && !process.env.VITE_FALLBACK_BUILD ? 'dist/cursor-irl' : 'dist',
    emptyOutDir: !process.env.VITE_FALLBACK_BUILD,
    sourcemap: true,
  },
});
