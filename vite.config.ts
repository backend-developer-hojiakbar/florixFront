import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
    return {
      define: {
        'process.env.API_KEY': JSON.stringify("AIzaSyBbzhuYpbao8d4YBXXMumKsfOUSoIreHf8"),
        'process.env.GEMINI_API_KEY': JSON.stringify("AIzaSyBbzhuYpbao8d4YBXXMumKsfOUSoIreHf8")
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
