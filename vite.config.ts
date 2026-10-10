import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Published on GitHub Pages under the repo's name: the deploy workflow
  // sets BASE_PATH (e.g. "/pixel-quest/"). Locally it stays at the root.
  base: process.env.BASE_PATH ?? "/",
  plugins: [react()],
})
