import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    // Asegurar que los recursos se sirvan correctamente en PWA
    rollupOptions: {
      output: {
        // Asset file names
        assetFileNames: 'assets/[name].[hash][extname]',
        // Chunk file names
        chunkFileNames: 'assets/[name].[hash].js',
        // Entry file names
        entryFileNames: 'assets/[name].[hash].js',
      }
    }
  },
  // Configuración para PWA
  server: {
    // Headers para service worker
    headers: {
      'Service-Worker-Allowed': '/'
    }
  }
})