import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { vorzelajs } from '@vorzelajs/vite-plugin'
import { defineConfig } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/**
 * The preview app lives in `dev/` and imports components through the same `~`
 * alias a consumer gets from `vorzelajs-ui init`, so the docs exercise the
 * real import paths instead of relative ones.
 */
export default defineConfig({
  plugins: [vorzelajs()],
  resolve: {
    alias: {
      '~': path.resolve(rootDir, './src'),
    },
  },
  css: {
    devSourcemap: true,
    modules: {
      localsConvention: 'camelCaseOnly',
    },
    preprocessorOptions: {
      scss: {
        loadPaths: [path.resolve(rootDir, './src')],
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist-preview',
  },
})
