import { generateKeyPairSync, sign } from 'node:crypto'
import { spawn } from 'node:child_process'
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'

const members = ['m1', 'm2', 'm3'].map((id) => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519')
  return { id, publicKey, privateKey }
})

function pem(key) { return key.export({ type: 'spki', format: 'pem' }) }
function privateKey(key) { return key.export({ type: 'pkcs8', format: 'pem' }) }
function message(envelope) {
  return Buffer.from(JSON.stringify({
    schema: envelope.schema,
    mode: envelope.mode,
    attestationVersion: envelope.attestationVersion,
    roundId: envelope.roundId,
    checkpointRef: envelope.checkpointRef,
    beacon: envelope.beacon,
  }))
}

const proc = spawn(process.execPath, ['services/beacon-b2-verifier/server.mjs'], {
  env: {
    ...process.env,
    PORT: '18765',
    B2_THRESHOLD: '2',
    B2_COMMITTEE_JSON: JSON.stringify(members.map((m) => ({ id: m.id, publicKeyPem: pem(m.publicKey) }))),
  },
  stdio: ['ignore', 'pipe', 'pipe'],
})

try {
  await delay(500)
  const envelope = {
    schema: 'PRE-RICH-B2-ATTESTATION-V1',
    mode: 'B2_ATTESTED',
    attestationVersion: 'v1',
    roundId: 'round-test-1',
    checkpointRef: 'checkpoint-test-1',
    beacon: 'ab'.repeat(32),
    attestations: [],
  }
  const payload = message(envelope)
  envelope.attestations = members.slice(0, 2).map((m) => ({
    memberId: m.id,
    signature: sign(null, payload, privateKey(m.privateKey)).toString('base64'),
  }))

  const ok = await fetch('http://127.0.0.1:18765/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(envelope),
  })
  const body = await ok.json()
  assert.equal(ok.status, 200)
  assert.equal(body.valid, true)
  assert.equal(body.quorumReached, true)
  assert.equal(body.validMembers.length, 2)

  const wrong = { ...envelope, beacon: 'cd'.repeat(32) }
  const bad = await fetch('http://127.0.0.1:18765/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(wrong),
  })
  assert.equal(bad.status, 422)

  console.log('B2 verifier tests: PASS')
} finally {
  proc.kill('SIGTERM')
}
