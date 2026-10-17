import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const repository = process.env.GITHUB_REPOSITORY?.split('/')
const owner = repository?.[0]
const repo = repository?.[1]
const base = process.env.GITHUB_ACTIONS
  ? (repo === `${owner}.github.io` ? '/' : `/${repo}/`)
  : '/'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
  base,
  plugins: [react()],
  server: { proxy: { '/api': env.VITE_API_PROXY_TARGET || 'http://localhost:8080' } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return undefined
          if (/\/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) return 'framework'
          if (id.includes('/node_modules/framer-motion/')) return 'motion'
          if (id.includes('/node_modules/lucide-react/')) return 'icons'
          return undefined
        },
      },
    },
  },
  }
})
