// client/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // host: true, // Uncomment if needed
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // It's generally best to let Vite use its default input (client/index.html)
    // If you previously had rollupOptions: { input: ... }, remove it.
    // rollupOptions: {
    //   input: './index.html' // This should be the default, but you can try uncommenting if needed
    // }
  },
});