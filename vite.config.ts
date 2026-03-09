import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@ffmpeg/ffmpeg') || id.includes('@ffmpeg/util')) {
              return 'ffmpeg';
            }

            if (id.includes('@imgly/background-removal')) {
              return 'background-removal';
            }

            if (id.includes('@tensorflow/tfjs-backend-webgl')) {
              return 'tfjs-backend-webgl';
            }

            if (id.includes('@tensorflow/tfjs-backend-cpu')) {
              return 'tfjs-backend-cpu';
            }

            if (id.includes('@tensorflow/tfjs-converter')) {
              return 'tfjs-converter';
            }

            if (id.includes('@tensorflow/tfjs-core')) {
              return 'tfjs-core';
            }

            if (id.includes('@tensorflow')) {
              return 'tensorflow';
            }

            if (id.includes('upscaler')) {
              return 'upscaler';
            }

            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }

            if (id.includes('lucide-react')) {
              return 'icons';
            }
          }
        },
      },
    },
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
})
