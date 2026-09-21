import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-pdfjs-worker-as-js',
      apply: 'build',
      configResolved(config) {
        this.__outDir = config.build.outDir || 'dist'
      },
      writeBundle() {
        const outDir = this.__outDir || 'dist'
        const src = path.resolve(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs')
        const dest = path.resolve(process.cwd(), outDir, 'assets', 'pdf.worker.min.js')

        fs.mkdirSync(path.dirname(dest), { recursive: true })
        fs.copyFileSync(src, dest)
      },
    },
  ],
  // Build with relative asset paths so the app can be served from a WordPress plugin subfolder.
  base: './',
})
