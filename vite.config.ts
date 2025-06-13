const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');

// https://vitejs.dev/config/
module.exports = defineConfig({
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
