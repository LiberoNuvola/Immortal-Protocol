import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertArtifactEvidenceHash,
  assertQualificationEvidenceMatchesRepository,
  digestJson,
  EEV_EVIDENCE_REFERENCES,
  EEV_REPO_FILES,
} from './eev-approval-integrity.mjs'

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const sourceKeys = ['EV1', 'EV2', 'EV3', 'EV4', 'EV5', 'EV6', 'EV7']

function artifactWithDigest(body) {
  const artifact = { schema: 'test-artifact/v1', body }
  artifact.evidenceHash = digestJson(artifact)
  return artifact
}

async function currentQualificationFixture(repoRoot = root) {
  const evidence = {}
  for (const key of sourceKeys) {
    const bytes = await readFile(resolve(repoRoot, EEV_REPO_FILES[key]))
    evidence[key] = {
      reference: EEV_EVIDENCE_REFERENCES[key],
      digest: createHash('sha256').update(bytes).digest('hex'),
    }
  }
  return { status: 'qualified', evidence }
}

{
  const valid = artifactWithDigest({ candidate: 'synthetic-only' })
  assert.equal(assertArtifactEvidenceHash(valid, 'fixture'), valid.evidenceHash)

  const tampered = { ...valid, body: { candidate: 'changed' } }
  assert.throws(
    () => assertArtifactEvidenceHash(tampered, 'fixture'),
    /does not match its current content/,
  )
}

{
  const qualification = await currentQualificationFixture()
  await assert.doesNotReject(
    assertQualificationEvidenceMatchesRepository(qualification, root),
  )

  const tamperedDigest = structuredClone(qualification)
  tamperedDigest.evidence.EV2.digest = '0'.repeat(64)
  await assert.rejects(
    assertQualificationEvidenceMatchesRepository(tamperedDigest, root),
    /EV2 digest does not match the current repository source bytes/,
  )

  const tamperedReference = structuredClone(qualification)
  tamperedReference.evidence.EV3.reference = 'audit/other-source.mjs#untrusted'
  await assert.rejects(
    assertQualificationEvidenceMatchesRepository(tamperedReference, root),
    /EV3 reference does not match the canonical source reference/,
  )
}

{
  const tempRoot = await mkdtemp(resolve(tmpdir(), 'immortal-eev-evidence-'))
  try {
    const qualification = await currentQualificationFixture()
    const altered = structuredClone(qualification)
    altered.evidence.EV1.digest = 'f'.repeat(64)
    await assert.rejects(
      assertQualificationEvidenceMatchesRepository(altered, tempRoot),
      /EV1 source bytes are unavailable/,
    )
  } finally {
    await rm(tempRoot, { recursive: true, force: true })
  }
}

console.log('eev-approval-integrity: artifact hashes, canonical EV references and current source digests verified; tampering rejected')
