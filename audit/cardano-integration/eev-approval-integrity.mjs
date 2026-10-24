import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export const EEV_REPO_FILES = Object.freeze({
  EV1: 'docs/02-certification/EEV_ORACLE_AND_VALUATION_CONTRACT.md',
  EV2: 'Adapter/CARDANO/observation/DirectUsdmEev.ts',
  EV3: 'audit/cardano-integration/preprod-direct-usdm-source-set.mjs',
  EV4: 'Adapter/CARDANO/observation/DirectUsdmEev.test.ts',
  EV5: 'Adapter/CARDANO/observation/PreprodDirectUsdmObservation.test.ts',
  EV6: 'docs/01-contracts/16_OMEGA_COMPLETENESS_CONTRACT.md',
  EV7: 'docs/02-certification/ACCOUNTING_PARTITION_AND_CONSERVATION_CERTIFICATION.md',
})

export const EEV_EVIDENCE_REFERENCES = Object.freeze({
  EV1: EEV_REPO_FILES.EV1 + '#EV1-Source-specification-and-verification-predicate',
  EV2: EEV_REPO_FILES.EV2 + '#direct-usdm-v1',
  EV3: EEV_REPO_FILES.EV3 + '#LIVE_UTXO_REVALIDATION',
  EV4: EEV_REPO_FILES.EV4 + '#deterministic-floor-conversion',
  EV5: EEV_REPO_FILES.EV5 + '#exact-pool-binding-failure-matrix',
  EV6: EEV_REPO_FILES.EV6 + '#external-truth-failure-and-shock-perimeter',
  EV7: EEV_REPO_FILES.EV7 + '#PA1-PA7-accounting-partition-certification',
})

export function digestJson(value) {
  return createHash('sha256')
    .update(
      JSON.stringify(value, (_key, item) =>
        typeof item === 'bigint' ? item.toString() : item,
      ),
      'utf8',
    )
    .digest('hex')
}

/**
 * Verify a manifest whose evidenceHash was calculated over its JSON content
 * before the evidenceHash property was appended. A 64-hex string alone is not
 * evidence of integrity.
 */
export function assertArtifactEvidenceHash(artifact, label) {
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) {
    throw new Error(label + ' must be a JSON object')
  }
  const claimed = artifact.evidenceHash
  if (typeof claimed !== 'string' || !/^[0-9a-fA-F]{64}$/.test(claimed)) {
    throw new Error(label + '.evidenceHash must be a 32-byte hex digest')
  }

  const withoutEvidenceHash = { ...artifact }
  delete withoutEvidenceHash.evidenceHash
  const actual = digestJson(withoutEvidenceHash)
  if (actual.toLowerCase() !== claimed.toLowerCase()) {
    throw new Error(label + '.evidenceHash does not match its current content')
  }
  return actual
}

/**
 * Verify each EV reference and digest against the current exact source bytes.
 * This prevents an approval workflow from blessing stale or altered evidence
 * merely because the digest fields have valid syntax.
 */
export async function assertQualificationEvidenceMatchesRepository(
  qualification,
  repoRoot,
  readFileImpl = readFile,
) {
  if (!qualification || typeof qualification !== 'object') {
    throw new Error('EEV qualification object is required')
  }
  if (!qualification.evidence || typeof qualification.evidence !== 'object') {
    throw new Error('EEV qualification evidence map is required')
  }

  for (const key of ['EV1', 'EV2', 'EV3', 'EV4', 'EV5', 'EV6', 'EV7']) {
    const entry = qualification.evidence[key]
    if (!entry || typeof entry !== 'object') {
      throw new Error('EEV qualification is missing ' + key + ' evidence')
    }
    if (entry.reference !== EEV_EVIDENCE_REFERENCES[key]) {
      throw new Error(key + ' reference does not match the canonical source reference')
    }
    if (typeof entry.digest !== 'string' || !/^[0-9a-fA-F]{64}$/.test(entry.digest)) {
      throw new Error(key + ' digest must be a 32-byte hex digest')
    }

    let bytes
    try {
      bytes = await readFileImpl(resolve(repoRoot, EEV_REPO_FILES[key]))
    } catch (error) {
      throw new Error(
        key + ' source bytes are unavailable: ' +
        (error instanceof Error ? error.message : String(error)),
      )
    }
    const actual = createHash('sha256').update(bytes).digest('hex')
    if (actual.toLowerCase() !== entry.digest.toLowerCase()) {
      throw new Error(key + ' digest does not match the current repository source bytes')
    }
  }
}
