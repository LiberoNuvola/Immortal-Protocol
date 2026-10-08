import { createHash, verify as verifySignature } from 'node:crypto'
import { createServer } from 'node:http'

const PORT = Number(process.env.PORT || 8080)
const SCHEMA = 'PRE-RICH-B2-ATTESTATION-V1'
const MODE = 'B2_ATTESTED'

function parseCommittee() {
  const raw = process.env.B2_COMMITTEE_JSON
  if (!raw) return []
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error('B2_COMMITTEE_JSON must be an array')
  return parsed.map((member) => {
    if (!member || typeof member.id !== 'string' || !member.id.trim()) {
      throw new Error('B2 committee member id is required')
    }
    if (typeof member.publicKeyPem !== 'string' || !member.publicKeyPem.includes('PUBLIC KEY')) {
      throw new Error('B2 committee member publicKeyPem is required')
    }
    return { id: member.id, publicKeyPem: member.publicKeyPem }
  })
}

function committeeConfig() {
  const committee = parseCommittee()
  const threshold = Number(process.env.B2_THRESHOLD || 0)
  if (!Number.isInteger(threshold) || threshold < 1 || threshold > committee.length) {
    return { committee, threshold: 0 }
  }
  const ids = new Set(committee.map((m) => m.id))
  if (ids.size !== committee.length) throw new Error('B2 committee member ids must be unique')
  return { committee, threshold }
}

function canonicalMessage(envelope) {
  const payload = {
    schema: SCHEMA,
    mode: MODE,
    attestationVersion: envelope.attestationVersion,
    roundId: envelope.roundId,
    checkpointRef: envelope.checkpointRef,
    beacon: envelope.beacon,
  }
  return Buffer.from(JSON.stringify(payload), 'utf8')
}

function digestHex(value) {
  return createHash('sha256').update(value).digest('hex')
}

function validateEnvelope(envelope) {
  if (!envelope || typeof envelope !== 'object') throw new Error('attestation envelope must be an object')
  if (envelope.schema !== SCHEMA) throw new Error('invalid B2 attestation schema')
  if (envelope.mode !== MODE) throw new Error('invalid B2 attestation mode')
  if (envelope.attestationVersion !== 'v1') throw new Error('invalid B2 attestation version')
  for (const key of ['roundId', 'checkpointRef', 'beacon']) {
    if (typeof envelope[key] !== 'string' || !envelope[key].trim()) {
      throw new Error(`B2 ${key} is required`)
    }
  }
  if (!Array.isArray(envelope.attestations) || envelope.attestations.length === 0) {
    throw new Error('B2 attestation set is required')
  }
}

function verifyEnvelope(envelope) {
  validateEnvelope(envelope)
  const { committee, threshold } = committeeConfig()
  if (threshold === 0) {
    return {
      valid: false,
      mode: MODE,
      reason: 'B2 committee is not deployed/configured',
    }
  }

  const members = new Map(committee.map((m) => [m.id, m]))
  const seen = new Set()
  const message = canonicalMessage(envelope)
  const validMembers = []
  const invalidMembers = []

  for (const attestation of envelope.attestations) {
    const memberId = attestation?.memberId
    if (typeof memberId !== 'string' || !memberId.trim() || typeof attestation.signature !== 'string') {
      invalidMembers.push({ memberId: memberId ?? null, reason: 'malformed attestation' })
      continue
    }
    if (seen.has(memberId)) {
      invalidMembers.push({ memberId, reason: 'duplicate member attestation' })
      continue
    }
    seen.add(memberId)
    const member = members.get(memberId)
    if (!member) {
      invalidMembers.push({ memberId, reason: 'unknown committee member' })
      continue
    }
    let signature
    try {
      signature = Buffer.from(attestation.signature, 'base64')
      if (signature.length !== 64) throw new Error('invalid Ed25519 signature length')
    } catch {
      invalidMembers.push({ memberId, reason: 'invalid signature encoding' })
      continue
    }
    const ok = verifySignature(null, message, member.publicKeyPem, signature)
    if (ok) validMembers.push(memberId)
    else invalidMembers.push({ memberId, reason: 'signature verification failed' })
  }

  return {
    valid: validMembers.length >= threshold,
    mode: MODE,
    roundId: envelope.roundId,
    checkpointRef: envelope.checkpointRef,
    beacon: envelope.beacon,
    threshold,
    committeeSize: committee.length,
    validMembers,
    invalidMembers,
    proofDigest: digestHex(message),
    quorumReached: validMembers.length >= threshold,
  }
}

async function readJson(req) {
  let body = ''
  for await (const chunk of req) body += chunk
  if (body.length > 1_000_000) throw new Error('request body too large')
  return JSON.parse(body || '{}')
}

const server = createServer(async (req, res) => {
  const headers = { 'content-type': 'application/json; charset=utf-8' }
  try {
    if (req.method === 'GET' && req.url === '/health') {
      const { committee, threshold } = committeeConfig()
      res.writeHead(200, headers)
      res.end(JSON.stringify({
        status: 'ok',
        mode: MODE,
        schema: SCHEMA,
        configured: threshold > 0,
        threshold,
        committeeSize: committee.length,
      }))
      return
    }

    if (req.method === 'POST' && req.url === '/verify') {
      const envelope = await readJson(req)
      const result = verifyEnvelope(envelope)
      res.writeHead(result.valid ? 200 : 422, headers)
      res.end(JSON.stringify(result))
      return
    }

    res.writeHead(404, headers)
    res.end(JSON.stringify({ error: 'not found' }))
  } catch (error) {
    res.writeHead(400, headers)
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }))
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`B2 verifier listening on :${PORT}`)
})
