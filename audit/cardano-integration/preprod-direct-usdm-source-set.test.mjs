import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const script = resolve(root, 'audit/cardano-integration/preprod-direct-usdm-source-set.mjs')
const invalidUnit = 'f'.repeat(56) + '0014df10745553444d'
const result = spawnSync(process.execPath, [script], {
  cwd: root,
  encoding: 'utf8',
  env: {
    ...process.env,
    PREPROD_TUSDM_UNIT: invalidUnit,
    PREPROD_EVIDENCE_DIR: resolve(root, '.tmp-invalid-eev-evidence'),
    PREPROD_DEPLOYMENT_MANIFEST: resolve(root, '.tmp-no-deployment-manifest.json'),
  },
})

assert.notEqual(result.status, 0, 'unapproved asset unit must be rejected')
assert.match(
  result.stderr + result.stdout,
  /not the specification-authority-approved Cardano Preprod asset/,
  'rejection must be due to the exact normative asset allowlist, before manifest/network access',
)
console.log('preprod-direct-usdm-source-set: rejects any unit other than the authority-approved Preprod asset')
