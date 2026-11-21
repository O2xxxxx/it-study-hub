import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const apiTarget = process.env.ITSTUDY_API_ORIGIN ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
      '/files': { target: apiTarget, changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // 把首屏不一定用到的大依赖拆出去，明细页/编辑器按需加载。
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-markdown': ['react-markdown', 'remark-gfm', 'rehype-highlight', 'rehype-sanitize', 'highlight.js'],
          'vendor-motion': ['motion'],
        },
      },
    },
  },
})
