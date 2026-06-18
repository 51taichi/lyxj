import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const WEB_PORT = Number(process.env.WEB_PORT ?? 10010)
const API_PORT = Number(process.env.API_PORT ?? 3180)

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: WEB_PORT,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
