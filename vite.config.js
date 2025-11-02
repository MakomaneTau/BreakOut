import { defineConfig } from 'vite';

// Vite config with Rollup manualChunks to improve chunking
export default defineConfig({
  // Use relative paths so built assets load correctly when not served from domain root
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Group local three.js build and helpers
          if (id.includes('/public/libs/three137/')) {
            return 'three-vendor';
          }
          // Physics libs
          if (id.includes('/public/libs/cannon') || id.includes('/public/libs/Cannon')) {
            return 'physics-vendor';
          }
          // Pathfinding helpers
          if (id.includes('/public/libs/pathfinding/')) {
            return 'pathfinding-vendor';
          }
          // Fallback vendor chunk for npm deps if any
          if (id.includes('/node_modules/')) {
            return 'vendor';
          }
        }
      }
    }
  }
});
