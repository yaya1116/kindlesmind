import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import previewRoutes from './scripts/preview-routes.mjs'

export default defineConfig({
  // Not a history-fallback SPA any more: `/` is the only app URL, and every
  // other path is either a real file or a genuine 404. 'mpa' stops Vite's
  // preview server from rewriting unknown paths to index.html, so the local
  // preview 404s exactly like the deployment does.
  appType: 'mpa',
  plugins: [react(), previewRoutes()],
})
