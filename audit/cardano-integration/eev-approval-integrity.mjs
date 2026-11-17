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

export const EEV_EV3_BASKET_CONTRACT_FILE =
  'audit/cardano-integration/preprod-direct-usdm-basket-contract.mjs'

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

  const sourceSetEvidence = qualification.sourceSet
  if (!sourceSetEvidence || typeof sourceSetEvidence !== 'object') {
    throw new Error('EEV qualification is missing EV3 canonical source-set binding')
  }
  if (sourceSetEvidence.basketContractReference !== EEV_EV3_BASKET_CONTRACT_FILE) {
    throw new Error('EV3 basket contract reference does not match the canonical source reference')
  }
  if (typeof sourceSetEvidence.basketContractDigest !== 'string' ||
      !/^[0-9a-fA-F]{64}$/.test(sourceSetEvidence.basketContractDigest)) {
    throw new Error('EV3 basket contract digest must be a 32-byte hex digest')
  }
  if (typeof sourceSetEvidence.assetBasketDigest !== 'string' ||
      !/^[0-9a-fA-F]{64}$/.test(sourceSetEvidence.assetBasketDigest)) {
    throw new Error('EV3 asset basket digest must be a 32-byte hex digest')
  }
  let basketContractBytes
  try {
    basketContractBytes = await readFileImpl(resolve(repoRoot, EEV_EV3_BASKET_CONTRACT_FILE))
  } catch (error) {
    throw new Error(
      'EV3 basket contract source bytes are unavailable: ' +
      (error instanceof Error ? error.message : String(error)),
    )
  }
  const actualBasketContractDigest = createHash('sha256').update(basketContractBytes).digest('hex')
  if (actualBasketContractDigest.toLowerCase() !== sourceSetEvidence.basketContractDigest.toLowerCase()) {
    throw new Error('EV3 basket contract digest does not match the current repository source bytes')
  }
}


export const EEV_ORACLE_MAX_AGE_MS = 3_600_000n
export const EEV_ORACLE_SOURCE_QUALIFICATION_FILE =
  'preprod-oracle-source-qualification.json'

function nonNegativeInteger(value, label) {
  const raw = typeof value === 'bigint' ? value.toString() : String(value ?? '')
  if (!/^\\d+$/.test(raw)) throw new Error(label + ' must be a non-negative integer')
  return BigInt(raw)
}

function normalizedChainTip(tip, label) {
  if (!tip || typeof tip !== 'object') throw new Error(label + ' chain tip is missing')
  const hash = String(tip.hash ?? tip.block_hash ?? '').toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(hash)) throw new Error(label + ' chain-tip hash is invalid')
  const blockHeight = nonNegativeInteger(tip.block_height ?? tip.block_no, label + '.block_height')
  const absSlot = nonNegativeInteger(tip.abs_slot ?? tip.absolute_slot, label + '.abs_slot')
  const blockTimeSeconds = nonNegativeInteger(tip.block_time, label + '.block_time')
  return {
    hash,
    blockHeight,
    absSlot,
    blockTimeSeconds,
    blockTimeMs: blockTimeSeconds * 1_000n,
  }
}

/**
 * Bind the authenticated Oracle datum timestamp to the exact live source-set
 * chain tip. This rejects future/stale quotes and observations from a later
 * or divergent chain point. The source-set tip, not the runner clock, is the
 * time reference for the approval decision.
 */
export function assertOracleFreshAgainstSourceTip(oracleState, sourceSet) {
  const semantics = oracleState?.datumSemantics
  if (!semantics || typeof semantics !== 'object') {
    throw new Error('Oracle State datum semantics are missing')
  }
  const sourceTip = normalizedChainTip(sourceSet?.chainTip, 'sourceSet')
  const oracleTip = normalizedChainTip(oracleState?.observation?.chainTip, 'oracleState.observation')
  const timestampMs = nonNegativeInteger(semantics.timestampMs, 'Oracle State timestampMs')
  const declaredMaxAgeMs = nonNegativeInteger(semantics.maxAgeMs, 'Oracle State maxAgeMs')
  if (declaredMaxAgeMs <= 0n || declaredMaxAgeMs > EEV_ORACLE_MAX_AGE_MS) {
    throw new Error('Oracle State maxAgeMs exceeds the canonical one-hour freshness ceiling')
  }
  if (oracleState?.observation?.utxo !== oracleState?.oracleState?.utxo ||
      oracleState?.observation?.address !== oracleState?.oracleState?.address) {
    throw new Error('Oracle State observation is not bound to the configured singleton location')
  }
  if (oracleTip.blockHeight > sourceTip.blockHeight ||
      oracleTip.absSlot > sourceTip.absSlot ||
      oracleTip.blockTimeSeconds > sourceTip.blockTimeSeconds) {
    throw new Error('Oracle State observation tip is later than the source-set chain tip')
  }
  if (oracleTip.blockHeight === sourceTip.blockHeight &&
      (oracleTip.absSlot !== sourceTip.absSlot || oracleTip.hash !== sourceTip.hash)) {
    throw new Error('Oracle State and source-set identify different chain points at the same block height')
  }
  if (timestampMs > sourceTip.blockTimeMs) {
    throw new Error('Oracle State timestamp is later than the source-set chain tip')
  }
  const ageMs = sourceTip.blockTimeMs - timestampMs
  if (ageMs > declaredMaxAgeMs || ageMs > EEV_ORACLE_MAX_AGE_MS) {
    throw new Error(
      'Oracle State is stale against the source-set chain tip: ageMs=' +
      ageMs.toString() + ', maxAgeMs=' + declaredMaxAgeMs.toString(),
    )
  }
  if (oracleState?.observation?.freshnessStatus !== 'FRESH' ||
      oracleState?.observation?.withinMaxAge !== true) {
    throw new Error('Oracle State observation does not attest a fresh quote')
  }
  return {
    chainTipHash: sourceTip.hash,
    chainTipBlockHeight: sourceTip.blockHeight.toString(),
    chainTipAbsSlot: sourceTip.absSlot.toString(),
    chainTipTimeMs: sourceTip.blockTimeMs.toString(),
    oracleTimestampMs: timestampMs.toString(),
    ageMs: ageMs.toString(),
    maxAgeMs: declaredMaxAgeMs.toString(),
  }
}

/**
 * Require a separate, content-addressed source qualification artifact.
 * A self-hashed datum/manifest alone cannot prove the external price source
 * or eliminate trust in the configured publisher.
 */
export async function assertQualifiedExternalOracleSource(
  oracleState,
  evidenceDirectory,
  readFileImpl = readFile,
) {
  const qualification = oracleState?.qualification
  if (qualification?.externalPriceSourceVerified !== true ||
      qualification?.configuredPublisherTrustIndependentlyEliminated !== true ||
      qualification?.sourceQualificationStatus !== 'QUALIFIED_EXTERNAL_SOURCE') {
    throw new Error('Oracle external price source is not independently qualified')
  }
  const reference = qualification?.sourceQualificationEvidenceReference
  if (reference !== EEV_ORACLE_SOURCE_QUALIFICATION_FILE) {
    throw new Error('Oracle source qualification evidence reference is not canonical')
  }
  const claimedDigest = qualification?.sourceQualificationEvidenceHash
  if (typeof claimedDigest !== 'string' || !/^[0-9a-f]{64}$/i.test(claimedDigest)) {
    throw new Error('Oracle source qualification evidence hash is missing or invalid')
  }

  let bytes
  try {
    bytes = await readFileImpl(resolve(evidenceDirectory, EEV_ORACLE_SOURCE_QUALIFICATION_FILE))
  } catch (error) {
    throw new Error(
      'Oracle source qualification evidence is unavailable: ' +
      (error instanceof Error ? error.message : String(error)),
    )
  }
  const actualFileDigest = createHash('sha256').update(bytes).digest('hex')
  if (actualFileDigest.toLowerCase() !== claimedDigest.toLowerCase()) {
    throw new Error('Oracle source qualification evidence file digest does not match the Oracle State manifest')
  }

  let evidence
  try {
    evidence = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw new Error('Oracle source qualification evidence is not valid JSON')
  }
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    throw new Error('Oracle source qualification evidence must be a JSON object')
  }
  const claimedEvidenceHash = evidence.evidenceHash
  if (typeof claimedEvidenceHash !== 'string' || !/^[0-9a-f]{64}$/i.test(claimedEvidenceHash)) {
    throw new Error('Oracle source qualification evidence self-hash is missing or invalid')
  }
  const body = { ...evidence }
  delete body.evidenceHash
  if (digestJson(body).toLowerCase() !== claimedEvidenceHash.toLowerCase()) {
    throw new Error('Oracle source qualification evidence self-hash does not match its contents')
  }

  const identity = oracleState.oracleState ?? {}
  const datum = oracleState.datumSemantics ?? {}
  if (evidence.schema !== 'IMMORTAL-PREPROD-ORACLE-SOURCE-QUALIFICATION-v1' ||
      evidence.status !== 'QUALIFIED_EXTERNAL_SOURCE' ||
      evidence.network !== 'cardano-preprod' ||
      evidence.externalPriceSourceVerified !== true ||
      evidence.configuredPublisherTrustIndependentlyEliminated !== true) {
    throw new Error('Oracle source qualification evidence is not a qualified external Preprod source')
  }
  if (evidence.oracleState?.policyId !== identity.policyId ||
      evidence.oracleState?.tokenNameHex !== identity.tokenNameHex ||
      evidence.oracleState?.publisherPkh !== identity.publisherPkh ||
      evidence.oracleState?.address !== identity.address ||
      evidence.oracleState?.utxo !== identity.utxo) {
    throw new Error('Oracle source qualification evidence does not bind the exact Oracle State singleton')
  }
  const quote = evidence.quote ?? {}
  if (quote.assetPolicyHex !== datum.assetPolicyHex ||
      quote.assetNameHex !== datum.assetNameHex ||
      String(quote.priceUsdmSubunitsPerLovelace ?? '') !== String(datum.priceUsdmSubunitsPerLovelace ?? '') ||
      String(quote.timestampMs ?? '') !== String(datum.timestampMs ?? '') ||
      quote.publisherPkh !== identity.publisherPkh) {
    throw new Error('Oracle source qualification quote does not match the exact on-chain datum fields')
  }
  const sourceReference = evidence.source?.sourceReference
  const verificationReference = evidence.source?.verificationReference
  if (typeof sourceReference !== 'string' || !/^https:\/\//.test(sourceReference) ||
      typeof verificationReference !== 'string' || verificationReference.trim().length < 8) {
    throw new Error('Oracle source qualification must provide an external source and verification reference')
  }
  if (String(evidence.freshness?.maxAgeMs ?? '') !== String(datum.maxAgeMs ?? '')) {
    throw new Error('Oracle source qualification freshness window does not match the on-chain datum')
  }
  return {
    fileReference: EEV_ORACLE_SOURCE_QUALIFICATION_FILE,
    fileSha256: actualFileDigest,
    evidenceHash: claimedEvidenceHash.toLowerCase(),
    sourceReference,
    verificationReference,
  }
}
