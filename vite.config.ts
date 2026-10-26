import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('recharts') || id.includes('d3-')) return 'charts'
          if (id.includes('jspdf')) return 'pdf'
          if (id.includes('/xlsx/')) return 'xlsx'
          if (id.includes('motion') || id.includes('framer')) return 'motion'
          if (id.includes('react-router') || id.includes('/react/') || id.includes('/react-dom/') || id.includes('scheduler')) return 'vendor'
          return undefined
        },
      },
    },
  },
})
