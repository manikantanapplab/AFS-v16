import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'dist',

  build: {
    outDir: '../dist-build',
    emptyOutDir: true,
    sourcemap: false, // OFF for production vite build
  },

  css: {
    devSourcemap: true, // Vite uses .map files Sass generates
  },

  server: {
    port: 3000,
    open: true,
    watch: {
      include: ['dist/**'],
    },
  },

  plugins: [
    {
      name: 'watch-dist',
      handleHotUpdate({ file, server }) {
        if (file.includes('dist/assets/css') || file.endsWith('.html')) {
          server.ws.send({ type: 'full-reload' });
          return [];
        }
      },
    },
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
