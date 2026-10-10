import wasm from 'vite-plugin-wasm'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const lucidWebEntry = fileURLToPath(
  new URL('node_modules/lucid-cardano/web/mod.js', import.meta.url),
)

export default defineConfig({
  plugins: [wasm()],
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
        immortal: 'web/index.html',
        protocol: 'web/protocol.html',
        algorithm: 'web/algorithm.html',
        mathematics: 'web/mathematics.html',
        code: 'web/code.html',
        adapters: 'web/adapters.html',
        ecosystem: 'web/ecosystem.html',
      live: 'live.html',
      'first-user': 'first-user.html',
      timeline: 'timeline.html',
      research: 'web/research.html',
      playground: 'playground.html',
      'verification-lab': 'web/verification-lab.html',
      'state-explorer': 'state-explorer.html',
      'threat-model': 'threat-model.html',
        governance: 'web/governance.html',
        documentation: 'web/documentation.html',
        community: 'web/community.html',
        status: 'web/status.html',
    read: 'web/read.html',
    map: 'web/map.html',
        dapp: 'dapp.html',
        treasury: 'preprod-treasury.html',
      },
    },
  },
})