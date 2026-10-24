// Operational note (2026-10-24): this observer performs a read-only exact-out-reference query; it never qualifies the candidate or approves EEV.

import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'

const KOIOS = process.env.KOIOS_PREPROD_URL ?? 'https://preprod.koios.rest/api/v1'
const OUT = process.env.EEV_OBSERVATION_PATH ?? 'audit/preprod-eev-observation/preprod-eev-liveness.json'

// Exact identifiers copied from historical EEV approval artifact #12324421376.
// They locate the historical candidate only; they do not authorize this asset
// as the normative Preprod accounting unit.
const CANDIDATE = Object.freeze({
  network: 'cardano-preprod',
  sourceOutRef: 'b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0',
  poolAddress: 'addr_test1wrhru9jt8jm600y2mltw300c9tu7cj5tuyew7lz0ex2p75gja592e',
  poolSingletonUnit: '9ada0966f747542f84af2bc352d564685d77f3839ec0b053a1b7700e504f4f4c2d444952454354',
  physicalAssetCandidateUnit: 'e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d',
  identityClassification: 'HISTORICAL_PREPROD_TUSDM_CANDIDATE_NOT_NORMATIVELY_APPROVED',
})

const [targetTxHash, targetOutputIndexText] = CANDIDATE.sourceOutRef.split('#')
const targetOutputIndex = Number(targetOutputIndexText)

function digest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

async function requestJson(url, init = {}) {
  let lastError
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          accept: 'application/json',
          ...(init.headers ?? {}),
        },
        signal: AbortSignal.timeout(15_000),
      })
      if (!response.ok) {
        const error = new Error('HTTP ' + response.status + ' from ' + url)
        if (response.status < 500 && response.status !== 429) throw error
        lastError = error
      } else {
        return await response.json()
      }
    } catch (error) {
      lastError = error
    }
    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1_000 * (attempt + 1)))
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

async function getTip() {
  const value = await requestJson(KOIOS + '/tip')
  return Array.isArray(value) ? value[0] ?? null : value
}

async function getAddressInfo() {
  const rows = await requestJson(KOIOS + '/address_info', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ _addresses: [CANDIDATE.poolAddress] }),
  })
  if (!Array.isArray(rows)) throw new Error('Koios address_info response is not an array')
  if (rows.length > 1) throw new Error('Koios returned multiple address rows for the single requested address')
  if (rows.length === 0) return null
  if (rows[0]?.address !== CANDIDATE.poolAddress) {
    throw new Error('Koios address_info response does not match the exact candidate Pool address')
  }
  if (!Array.isArray(rows[0]?.utxo_set)) {
    throw new Error('Koios address_info response has no UTxO set')
  }
  return rows[0]
}

function quantityOf(utxo, expectedUnit) {
  let quantity = 0n
  for (const asset of utxo.asset_list ?? []) {
    if (!asset || typeof asset.policy_id !== 'string' || typeof asset.asset_name !== 'string' || asset.quantity === undefined) {
      throw new Error('Koios returned malformed native-asset data')
    }
    if (asset.policy_id + asset.asset_name === expectedUnit) quantity += BigInt(asset.quantity)
  }
  return quantity
}

async function main() {
  const startedAt = new Date().toISOString()
  const tipBefore = await getTip()
  const addressInfo = await getAddressInfo()
  const tipAfter = await getTip()
  const rows = (addressInfo?.utxo_set ?? []).filter(utxo =>
    utxo.tx_hash === targetTxHash && Number(utxo.tx_index) === targetOutputIndex,
  )

  let status
  let matchedOutput = null
  if (rows.length === 0) {
    status = 'NOT_LIVE_EXACT_OUTREF'
  } else if (rows.length !== 1) {
    status = 'AMBIGUOUS_EXACT_OUTREF'
  } else {
    const utxo = rows[0]
    const poolSingletonQuantity = quantityOf(utxo, CANDIDATE.poolSingletonUnit)
    const physicalAssetQuantity = quantityOf(utxo, CANDIDATE.physicalAssetCandidateUnit)
    matchedOutput = {
      outRef: CANDIDATE.sourceOutRef,
      lovelace: String(utxo.value),
      poolSingletonQuantity: poolSingletonQuantity.toString(),
      physicalAssetCandidateQuantity: physicalAssetQuantity.toString(),
      assetListSha256: digest(utxo.asset_list ?? []),
      inlineDatumPresent: Boolean(utxo.inline_datum?.bytes),
      inlineDatumBytesSha256: utxo.inline_datum?.bytes
        ? createHash('sha256').update(utxo.inline_datum.bytes).digest('hex')
        : null,
    }
    status = poolSingletonQuantity === 1n && physicalAssetQuantity > 0n
      ? 'LIVE_CANDIDATE_OUTREF_AND_ASSETS_MATCH'
      : 'LIVE_OUTREF_ASSET_MISMATCH'
  }

  const evidence = {
    schema: 'IMMORTAL-PREPROD-EEV-LIVENESS-OBSERVATION-v1',
    status,
    startedAt,
    completedAt: new Date().toISOString(),
    network: CANDIDATE.network,
    observationKind: 'READ_ONLY_EXACT_OUTREF_LIVENESS',
    source: CANDIDATE,
    chainTipBefore: tipBefore,
    chainTipAfter: tipAfter,
    queryEndpoint: KOIOS + '/address_info',
    addressRowsReturned: addressInfo ? 1 : 0,
    exactOutRefMatchCount: rows.length,
    matchedOutput,
    rawAddressInfoSha256: digest(addressInfo),
    noEconomicConversionApplied: true,
    noQualificationPerformed: true,
    noDeploymentApprovalCreated: true,
    noTransactionBuiltSignedOrSubmitted: true,
    explicitNonClaims: [
      'This observation does not qualify tUSDM as the normative Preprod accounting unit.',
      'This observation does not establish mainnet USDM identity or USD/USDM parity.',
      'This observation is not EV1-EV7 qualification or deployment approval.',
      'This observation does not establish control state, viability, authoritative Issue admission, expiry binding or Claim readiness.',
    ],
  }

  await mkdir(OUT.split('/').slice(0, -1).join('/') || '.', { recursive: true })
  await writeFile(OUT, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({
    status: evidence.status,
    network: evidence.network,
    sourceOutRef: CANDIDATE.sourceOutRef,
    poolAddress: CANDIDATE.poolAddress,
    exactOutRefMatchCount: evidence.exactOutRefMatchCount,
    poolSingletonQuantity: matchedOutput?.poolSingletonQuantity ?? null,
    physicalAssetCandidateQuantity: matchedOutput?.physicalAssetCandidateQuantity ?? null,
    evidencePath: OUT,
    rawAddressInfoSha256: evidence.rawAddressInfoSha256,
    chainTipBefore: tipBefore,
    chainTipAfter: tipAfter,
    noTransactionSubmitted: true,
    qualification: 'NOT_PERFORMED',
  }, null, 2))
}

main().catch(async error => {
  const evidence = {
    schema: 'IMMORTAL-PREPROD-EEV-LIVENESS-OBSERVATION-v1',
    status: 'OBSERVATION_FAILED',
    completedAt: new Date().toISOString(),
    network: CANDIDATE.network,
    observationKind: 'READ_ONLY_EXACT_OUTREF_LIVENESS',
    source: CANDIDATE,
    error: error instanceof Error ? error.message : String(error),
    noEconomicConversionApplied: true,
    noQualificationPerformed: true,
    noDeploymentApprovalCreated: true,
    noTransactionBuiltSignedOrSubmitted: true,
  }
  try {
    await mkdir(OUT.split('/').slice(0, -1).join('/') || '.', { recursive: true })
    await writeFile(OUT, JSON.stringify(evidence, null, 2) + '\n', 'utf8')
  } catch {}
  console.error(JSON.stringify(evidence, null, 2))
  process.exitCode = 1
})
