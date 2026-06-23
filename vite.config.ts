import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',  // 使用相对路径，确保 Electron 能正确加载
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    react(),
  ],
})