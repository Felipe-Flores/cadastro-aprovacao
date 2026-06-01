import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // aceita conexões de qualquer IP
    port: 5173,
    strictPort: true,
    // permite que o ngrok/qualquer host envie o header correto
    cors: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
})
