import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const lucidWebEntry = fileURLToPath(
  new URL('node_modules/lucid-cardano/web/mod.js', import.meta.url),
)

export default defineConfig({
  root: '.',
  base: './',
  resolve: {
    // lucid-cardano ships an explicit browser build. Use it for the Vite
    // application instead of bundling the Node-oriented npm entry, which
    // pulls node-fetch and Node built-ins into the browser graph.
    alias: {
      'lucid-cardano': lucidWebEntry,
    },
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    rollupOptions: {
      input: {
        home: 'index.html',
        protocol: 'protocol.html',
        algorithm: 'algorithm.html',
        mathematics: 'mathematics.html',
        code: 'code.html',
        adapters: 'adapters.html',
        ecosystem: 'ecosystem.html',
        governance: 'governance.html',
        documentation: 'documentation.html',
        community: 'community.html',
        dapp: 'dapp.html',
        treasury: 'preprod-treasury.html',
      },
    },
  },
})