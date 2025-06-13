import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'framer-motion', 'html2canvas']
        }
      }
    }
  },
  define: {
    'process.env': {
      'GOOGLE_API_KEY': process.env.GOOGLE_API_KEY,
      'GOOGLE_API_URL': process.env.GOOGLE_API_URL,
      'NODE_ENV': process.env.NODE_ENV
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  }
});
