import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleAdminsRequest } from './server/adminsHandler.mjs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'webinars-admins-api',
        configureServer(server) {
          server.middlewares.use('/api/admins', (req, res) => handleAdminsRequest(req, res, { env }))
        },
      },
    ],
    server: {
      port: 3000,
      open: true,
    },
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@pages': '/archive/components',
      },
    },
  }
})
