// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',           // <-- make all asset links relative
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // optional manualChunks you had earlier
      }
    }
  }
})
