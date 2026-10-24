/// <reference types="vitest" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // Forward /api to the local Finance API (npm run server) when VITE_DATA_PROVIDER=http.
    proxy: { '/api': 'http://localhost:8787' },
  },
  build: {
    chunkSizeWarningLimit: 600, // Recharts is isolated in its own "charts" chunk (~525 kB)
    rollupOptions: {
      output: { manualChunks: { charts: ['recharts'] } },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
