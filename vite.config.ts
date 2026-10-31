import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const target = process.env.VITE_BACKEND_URL ?? 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': target, '/mcp': target },
  },
})
