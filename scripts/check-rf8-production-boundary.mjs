import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const allowedDirectSubmission = new Set([
  'src/txHelpers.ts',
  'Adapter/CARDANO/runtime/CardanoExecutionAdapter.ts',
  'relayer/registryPublisher.js',
  'relayer/relayer.js',
])

const roots = ['src', 'Adapter/CARDANO', 'relayer']
const directCall = /\.(?:signTx|submitTx)\s*\(/

function walk(root) {
  if (!existsSync(root)) return []
  const out = []
  for (const name of readdirSync(root)) {
    if (name === '__tests__' || name === 'node_modules') continue
    const p = join(root, name)
    const st = statSync(p)
    if (st.isDirectory()) out.push(...walk(p))
    else if (/\.(?:ts|tsx|js|mjs)$/.test(p)) out.push(p)
  }
  return out
}

const violations = []
for (const root of roots) {
  for (const file of walk(root)) {
    const rel = file.replaceAll('\\', '/')
    const source = readFileSync(file, 'utf8')
    if (directCall.test(source) && !allowedDirectSubmission.has(rel)) violations.push(rel)
  }
}

if (violations.length) {
  console.error('RF8 PRODUCTION BOUNDARY CHECK: FAIL')
  for (const v of violations) console.error(`unexpected direct sign/submit call: ${v}`)
  process.exit(1)
}

const mint = readFileSync('src/mint.ts', 'utf8')
if (!mint.includes('signAndSubmitEconomicTx') && !mint.includes('submitEconomic')) {
  console.error('RF8 PRODUCTION BOUNDARY CHECK: FAIL — mint path lacks explicit economic submission')
  process.exit(1)
}
const gameFlow = readFileSync('src/gameFlow.ts', 'utf8')
if (!gameFlow.includes('signAndSubmitEconomicTx')) {
  console.error('RF8 PRODUCTION BOUNDARY CHECK: FAIL — gameFlow lacks explicit economic submission')
  process.exit(1)
}

console.log('RF8 PRODUCTION BOUNDARY CHECK: PASS')
console.log('Direct signing/submission is restricted to declared adapter/infrastructure boundaries; economic mint/game paths require the EconomicAdmission submission path.')
