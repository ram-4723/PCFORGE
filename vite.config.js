import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repository = process.env.GITHUB_REPOSITORY?.split('/')
const owner = repository?.[0]
const repo = repository?.[1]
const base = process.env.GITHUB_ACTIONS
  ? (repo === `${owner}.github.io` ? '/' : `/${repo}/`)
  : '/'

export default defineConfig({ base, plugins: [react()] })
