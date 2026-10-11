import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '127.0.0.1',
    fs: {
      strict: true,
      deny: ['.env', '.env.*', '*.key', '**/.git/**']
    }
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
          }
          if (id.includes('src/data/plants') || id.includes('src\\data\\plants')) {
            return 'plant-catalog';
          }
        }
      }
    }
  },
  test: {
    setupFiles: ['./src/__tests__/setup.ts']
  }
} as any);
