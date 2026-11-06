#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
const canary = process.env.VITE_BLOCKFROST_PROJECT_ID
if (!canary || canary.length < 20) {
  console.error('VITE_BLOCKFROST_PROJECT_ID canary must be set to a distinctive value')
  process.exit(2)
}
const root = path.resolve('dist')
if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error('dist/ does not exist; run the production build before the bundle check')
  process.exit(2)
}
const matches = []
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(file)
    else if (entry.isFile() && fs.readFileSync(file).includes(Buffer.from(canary))) matches.push(path.relative(root, file))
  }
}
walk(root)
if (matches.length) {
  console.error('Provider-key canary leaked into generated browser bundle:')
  for (const file of matches) console.error('- ' + file)
  process.exit(1)
}
console.log('Provider-key bundle canary: PASS (absent from every generated dist/ file)')
