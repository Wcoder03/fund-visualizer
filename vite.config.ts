import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleApiRequest } from './src/lib/apiHandlers'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5173,
    host: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'fund-api-routes',
      configureServer(server) {
        server.middlewares.use('/api', (req, res) => {
          void handleApiRequest(req, res);
        });
      },
    },
  ],
})
