import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'entrypoints/popup.html'),
        sidebar: resolve(__dirname, 'entrypoints/sidebar/sidebar.html'),
        content: resolve(__dirname, 'entrypoints/content.ts'),
        background: resolve(__dirname, 'entrypoints/background.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Put scripts in root of dist
          return '[name].js';
        },
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          // Put HTML files at root
          if (assetInfo.name?.endsWith('.html')) {
            return '[name][extname]';
          }
          // Keep CSS and other assets with their names
          return '[name][extname]';
        }
      }
    }
  }
});