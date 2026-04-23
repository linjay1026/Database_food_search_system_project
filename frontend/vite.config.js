import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'https://two025-db-final-project.onrender.com', // 這裡代理到 Flask 的伺服器
    }
  }
})
