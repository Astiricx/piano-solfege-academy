import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` doit correspondre au nom du dépôt pour GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: '/piano-solfege-academy/',
  build: {
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        manualChunks: {
          vexflow: ['vexflow'],
          tone: ['tone'],
        },
      },
    },
  },
});
