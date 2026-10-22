import { readFile } from 'node:fs/promises'
import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { Emulator, Lucid } from 'lucid-cardano'

const KOIOS = process.env.KOIOS_PREPROD_URL ?? 'https://preprod.koios.rest/api/v1'
const ARTIFACT_PATH = 'plutus/out/treasury.plutus.json'
const TUSDM_POLICY_ID = 'e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c9'
const TUSDM_ASSET_NAME_HEX = '0014df10745553444d'
const TUSDM_UNIT = TUSDM_POLICY_ID + TUSDM_ASSET_NAME_HEX
const OUTPUT_PATH = process.env.TREASURY_OBSERVATION_OUTPUT ?? 'audit/preprod-evidence/treasury-inventory-observation.json'

const artifactText = await readFile(ARTIFACT_PATH, 'utf8')
const artifact = JSON.parse(artifactText)
if (artifact.type !== 'PlutusScriptV2' || typeof artifact.cborHex !== 'string') {
  throw new Error('TREASURY_ARTIFACT_INVALID: expected PlutusScriptV2 cborHex')
}
// Address/hash derivation is offline; an Emulator supplies Lucid's protocol-parameter initialization without a network provider.
const lucid = await Lucid.new(new Emulator([]), 'Preprod')
const validator = { type: 'PlutusV2', script: artifact.cborHex }
const treasuryAddress = lucid.utils.validatorToAddress(validator)
const treasuryScriptHash = lucid.utils.validatorToScriptHash(validator)

const response = await fetch(`${KOIOS}/address_utxos`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ _addresses: [treasuryAddress] }),
})
if (!response.ok) throw new Error(`KOIOS_ADDRESS_UTXOS_HTTP_${response.status}`)
const rows = await response.json()
if (!Array.isArray(rows)) throw new Error('KOIOS_ADDRESS_UTXOS_INVALID_RESPONSE')
const addressRows = rows.filter((row) => row?.address === treasuryAddress)
if (addressRows.length !== rows.length) {
  throw new Error('KOIOS_RETURNED_UTXO_FOR_UNEXPECTED_ADDRESS')
}

const utxos = addressRows.map((u) => {
  const assets = Object.fromEntries((u.asset_list ?? []).map((a) => [
    String(a.policy_id) + String(a.asset_name ?? ''),
    String(a.quantity),
  ]))
  return {
    ref: String(u.tx_hash) + '#' + String(u.tx_index),
    lovelace: String(u.value),
    tUSDMAtomic: assets[TUSDM_UNIT] ?? '0',
    otherNativeAssets: Object.entries(assets)
      .filter(([unit]) => unit !== TUSDM_UNIT)
      .map(([unit, quantity]) => ({ unit, quantity })),
  }
})
// Historical candidate: the Treasury artifact before the 2026-09-05 artifact update.
const HISTORICAL_TREASURY_COMMIT = '2d3277ecf89a1b2e7489c85795470b0777446691'
const HISTORICAL_ARTIFACT_URL = `https://raw.githubusercontent.com/LiberoNuvola/Immortal-Protocol/${HISTORICAL_TREASURY_COMMIT}/src/plutusScripts/treasury.plutus.json`
const historicalArtifactResponse = await fetch(HISTORICAL_ARTIFACT_URL)
if (!historicalArtifactResponse.ok) {
  throw new Error(`HISTORICAL_TREASURY_ARTIFACT_HTTP_${historicalArtifactResponse.status}`)
}
const historicalArtifactText = await historicalArtifactResponse.text()
const historicalArtifact = JSON.parse(historicalArtifactText)
if (historicalArtifact.type !== 'PlutusScriptV2' || typeof historicalArtifact.cborHex !== 'string') {
  throw new Error('HISTORICAL_TREASURY_ARTIFACT_INVALID')
}
const historicalValidator = { type: 'PlutusV2', script: historicalArtifact.cborHex }
const historicalTreasuryAddress = lucid.utils.validatorToAddress(historicalValidator)
const historicalTreasuryScriptHash = lucid.utils.validatorToScriptHash(historicalValidator)
const historicalUtxoResponse = await fetch(`${KOIOS}/address_utxos`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ _addresses: [historicalTreasuryAddress] }),
})
if (!historicalUtxoResponse.ok) {
  throw new Error(`KOIOS_HISTORICAL_ADDRESS_UTXOS_HTTP_${historicalUtxoResponse.status}`)
}
const historicalUtxoRows = await historicalUtxoResponse.json()
if (!Array.isArray(historicalUtxoRows)) {
  throw new Error('KOIOS_HISTORICAL_ADDRESS_UTXOS_INVALID_RESPONSE')
}
if (historicalUtxoRows.some((row) => row?.address !== historicalTreasuryAddress)) {
  throw new Error('KOIOS_HISTORICAL_RETURNED_UTXO_FOR_UNEXPECTED_ADDRESS')
}
const historicalUtxos = historicalUtxoRows.map((u) => {
  const assets = Object.fromEntries((u.asset_list ?? []).map((a) => [
    String(a.policy_id) + String(a.asset_name ?? ''),
    String(a.quantity),
  ]))
  return {
    ref: String(u.tx_hash) + '#' + String(u.tx_index),
    lovelace: String(u.value),
    tUSDMAtomic: assets[TUSDM_UNIT] ?? '0',
  }
})
const historicalTotalLovelace = historicalUtxos.reduce((sum, u) => sum + BigInt(u.lovelace), 0n)
const historicalTotalTusdm = historicalUtxos.reduce((sum, u) => sum + BigInt(u.tUSDMAtomic), 0n)

const holderResponse = await fetch(
  `${KOIOS}/asset_addresses?_asset_policy=${TUSDM_POLICY_ID}&_asset_name=${TUSDM_ASSET_NAME_HEX}`,
)
if (!holderResponse.ok) throw new Error(`KOIOS_ASSET_ADDRESSES_HTTP_${holderResponse.status}`)
const holderRows = await holderResponse.json()
if (!Array.isArray(holderRows)) throw new Error('KOIOS_ASSET_ADDRESSES_INVALID_RESPONSE')
const tUSDMHolders = holderRows.map((holder) => {
  if (typeof holder?.payment_address !== 'string' || holder.quantity == null) {
    throw new Error('KOIOS_ASSET_ADDRESSES_INVALID_HOLDER_ROW')
  }
  return {
    address: holder.payment_address,
    quantityAtomic: String(holder.quantity),
    matchesArtifactTreasury: holder.payment_address === treasuryAddress,
  }
})

const policyResponse = await fetch(
  `${KOIOS}/policy_asset_list?_asset_policy=${TUSDM_POLICY_ID}`,
)
if (!policyResponse.ok) throw new Error(`KOIOS_POLICY_ASSET_LIST_HTTP_${policyResponse.status}`)
const policyRows = await policyResponse.json()
if (!Array.isArray(policyRows)) throw new Error('KOIOS_POLICY_ASSET_LIST_INVALID_RESPONSE')
const policyAssets = policyRows.map((asset) => ({
  assetNameHex: String(asset.asset_name ?? ''),
  assetNameAscii: asset.asset_name_ascii == null ? null : String(asset.asset_name_ascii),
  totalSupply: asset.total_supply == null ? null : String(asset.total_supply),
  fingerprint: asset.fingerprint == null ? null : String(asset.fingerprint),
}))

const totalLovelace = utxos.reduce((sum, u) => sum + BigInt(u.lovelace), 0n)
const totalTusdm = utxos.reduce((sum, u) => sum + BigInt(u.tUSDMAtomic), 0n)
function formatSixDecimals(value) {
  const whole = value / 1_000_000n
  const fractional = (value % 1_000_000n).toString().padStart(6, '0').replace(/0+$/, '')
  return fractional ? `${whole}.${fractional}` : whole.toString()
}
const observation = {
  schema: 'IMMORTAL-PREPROD-TREASURY-INVENTORY-OBSERVATION-v1',
  observedAt: new Date().toISOString(),
  network: 'cardano-preprod',
  treasuryAddress,
  treasuryScriptHash,
  treasuryArtifactPath: ARTIFACT_PATH,
  treasuryArtifactSha256: createHash('sha256').update(artifactText).digest('hex'),
  source: { provider: 'Koios', endpoint: 'POST /address_utxos', responseAddressMatched: rows.length > 0 && addressRows.every((u) => u.address === treasuryAddress), noUtxosReturned: rows.length === 0, returnedUtxoRows: rows.length },
  assetIdentity: {
    tADA: 'native lovelace (testnet ADA; 1000000 lovelace per ADA)',
    tUSDM: { policyId: TUSDM_POLICY_ID, assetNameHex: TUSDM_ASSET_NAME_HEX, unit: TUSDM_UNIT },
  },
  totals: {
    utxoCount: utxos.length,
    tADALovelace: totalLovelace.toString(),
    tADA: formatSixDecimals(totalLovelace),
    tUSDMAtomic: totalTusdm.toString(),
    tUSDM: formatSixDecimals(totalTusdm),
  },
  utxos,
  historicalTreasuryArtifactCandidate: {
    sourceCommit: HISTORICAL_TREASURY_COMMIT,
    sourcePath: 'src/plutusScripts/treasury.plutus.json',
    artifactSha256: createHash('sha256').update(historicalArtifactText).digest('hex'),
    address: historicalTreasuryAddress,
    scriptHash: historicalTreasuryScriptHash,
    utxoCount: historicalUtxos.length,
    tADALovelace: historicalTotalLovelace.toString(),
    tADA: formatSixDecimals(historicalTotalLovelace),
    tUSDMAtomic: historicalTotalTusdm.toString(),
    tUSDM: formatSixDecimals(historicalTotalTusdm),
    utxos: historicalUtxos,
  },
  tUSDMPolicyDiscovery: {
    provider: 'Koios',
    endpoint: 'GET /policy_asset_list',
    policyId: TUSDM_POLICY_ID,
    returnedAssetCount: policyAssets.length,
    assets: policyAssets,
  },
  tUSDMHolderDiscovery: {
    provider: 'Koios',
    endpoint: 'GET /asset_addresses',
    policyId: TUSDM_POLICY_ID,
    assetNameHex: TUSDM_ASSET_NAME_HEX,
    returnedHolderCount: tUSDMHolders.length,
    holders: tUSDMHolders,
  },
  qualification: {
    addressDerivedFromCurrentArtifact: true,
    ledgerObservationObtained: true,
    tUSDMIdentityMatchedByExactPolicyAndAssetName: true,
    liquidationRouteVerified: false,
    swapExecuted: false,
    qneProven: false,
  },
  limitations: [
    'This is a read-only snapshot of the exact script address derived from the current repository artifact.',
    'Native lovelace is reported as testnet ADA; it is not USDM liquidity.',
    'The tUSDM unit is matched exactly by policy ID and asset-name hex; this observation does not independently certify issuer or redemption value.',
    'Balances do not prove an executable DEX route, minimum output, execution costs, or a non-erosive QNE action.',
  ],
}
await mkdir(OUTPUT_PATH.split('/').slice(0, -1).join('/') || '.', { recursive: true })
await writeFile(OUTPUT_PATH, JSON.stringify(observation, null, 2) + '\n')
console.log(JSON.stringify(observation, null, 2))
