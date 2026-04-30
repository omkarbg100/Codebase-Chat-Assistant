import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // Bind to all interfaces (needed if running Vite in Docker)
    port: 5173,
    proxy: {
      // In local dev, proxy /api requests to the Express server
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
