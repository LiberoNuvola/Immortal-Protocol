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

async function koiosPost(endpoint, payload, label) {
  const response = await fetch(`${KOIOS}/${endpoint}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(`${label}_HTTP_${response.status}`)
  const rows = await response.json()
  if (!Array.isArray(rows)) throw new Error(`${label}_INVALID_RESPONSE`)
  return rows
}

async function fetchDatumDetails(datumHashes, label) {
  const uniqueHashes = [...new Set(datumHashes)]
  const details = new Map()

  // The public Koios request-body limit is small; keep each batch safely below 1 KiB.
  for (let offset = 0; offset < uniqueHashes.length; offset += 8) {
    const batch = uniqueHashes.slice(offset, offset + 8)
    const rows = await koiosPost('datum_info', { _datum_hashes: batch }, `${label}_DATUM_INFO`)
    for (const row of rows) {
      const hash = String(row?.hash ?? '').toLowerCase()
      if (!batch.includes(hash) || details.has(hash)) {
        throw new Error(`${label}_DATUM_INFO_UNEXPECTED_OR_DUPLICATE_HASH`)
      }
      if (typeof row.bytes !== 'string' || row.bytes.length === 0 || row.bytes.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(row.bytes)) {
        throw new Error(`${label}_DATUM_INFO_INVALID_CBOR`)
      }
      details.set(hash, { value: row.value ?? null, bytes: row.bytes.toLowerCase() })
    }
    for (const hash of batch) {
      if (!details.has(hash)) throw new Error(`${label}_DATUM_INFO_MISSING_HASH_${hash}`)
    }
  }

  return details
}

async function observeTreasuryAddress(address, label) {
  const rows = await koiosPost('address_info', { _addresses: [address] }, `KOIOS_${label}_ADDRESS_INFO`)
  if (rows.length !== 1 || rows[0]?.address !== address) {
    throw new Error(`KOIOS_${label}_ADDRESS_INFO_ADDRESS_MISMATCH`)
  }

  const info = rows[0]
  if (info.script_address !== true) {
    throw new Error(`KOIOS_${label}_ADDRESS_IS_NOT_SCRIPT_CONTROLLED`)
  }
  if (!Array.isArray(info.utxo_set)) {
    throw new Error(`KOIOS_${label}_UTXO_SET_MISSING`)
  }

  const datumHashes = info.utxo_set
    .map((utxo) => utxo?.datum_hash == null ? null : String(utxo.datum_hash).toLowerCase())
    .filter((hash) => hash !== null)
  for (const hash of datumHashes) {
    if (!/^[0-9a-f]{64}$/.test(hash)) {
      throw new Error(`KOIOS_${label}_DATUM_HASH_INVALID`)
    }
  }
  const datumDetails = await fetchDatumDetails(datumHashes, label)

  const seenRefs = new Set()
  const utxos = info.utxo_set.map((utxo) => {
    if (utxo?.tx_hash == null || utxo?.tx_index == null || utxo?.value == null) {
      throw new Error(`KOIOS_${label}_UTXO_REFERENCE_OR_VALUE_MISSING`)
    }
    const ref = String(utxo.tx_hash) + '#' + String(utxo.tx_index)
    if (seenRefs.has(ref)) throw new Error(`KOIOS_${label}_DUPLICATE_UTXO_REFERENCE`)
    seenRefs.add(ref)

    if (utxo.asset_list != null && !Array.isArray(utxo.asset_list)) {
      throw new Error(`KOIOS_${label}_UTXO_ASSET_LIST_INVALID`)
    }
    const assets = (utxo.asset_list ?? []).map((asset) => {
      if (typeof asset?.policy_id !== 'string' || asset.quantity == null) {
        throw new Error(`KOIOS_${label}_UTXO_ASSET_INVALID`)
      }
      return {
        policyId: asset.policy_id,
        assetNameHex: String(asset.asset_name ?? ''),
        unit: asset.policy_id + String(asset.asset_name ?? ''),
        quantity: String(asset.quantity),
      }
    })

    const datumHash = utxo.datum_hash == null ? null : String(utxo.datum_hash).toLowerCase()
    const inlineDatum = utxo.inline_datum ?? null
    const hashDatum = datumHash === null ? null : datumDetails.get(datumHash)
    if (datumHash !== null && !hashDatum) {
      throw new Error(`KOIOS_${label}_HASH_ONLY_DATUM_NOT_RESOLVED`)
    }

    return {
      ref,
      blockHeight: utxo.block_height == null ? null : Number(utxo.block_height),
      blockTime: utxo.block_time == null ? null : Number(utxo.block_time),
      lovelace: String(utxo.value),
      assets,
      datum: {
        hash: datumHash,
        inlinePresent: inlineDatum !== null,
        inline: inlineDatum,
        hashResolved: hashDatum !== null,
        hashValue: hashDatum?.value ?? null,
        hashBytes: hashDatum?.bytes ?? null,
      },
      referenceScriptPresent: utxo.reference_script != null,
    }
  })

  return {
    address,
    scriptAddress: info.script_address,
    stakeAddress: info.stake_address == null ? null : String(info.stake_address),
    balanceLovelace: String(info.balance ?? '0'),
    utxoCount: utxos.length,
    datumHashCount: datumHashes.length,
    inlineDatumCount: utxos.filter((u) => u.datum.inlinePresent).length,
    noDatumCount: utxos.filter((u) => u.datum.hash === null && !u.datum.inlinePresent).length,
    utxos,
  }
}

const currentInventory = await observeTreasuryAddress(treasuryAddress, 'CURRENT_TREASURY')
const utxos = currentInventory.utxos.map((utxo) => {
  const assets = Object.fromEntries(utxo.assets.map((asset) => [asset.unit, asset.quantity]))
  return {
    ...utxo,
    tUSDMAtomic: assets[TUSDM_UNIT] ?? '0',
    otherNativeAssets: utxo.assets.filter((asset) => asset.unit !== TUSDM_UNIT),
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
const historicalInventory = await observeTreasuryAddress(historicalTreasuryAddress, 'HISTORICAL_TREASURY')
const historicalUtxos = historicalInventory.utxos.map((utxo) => {
  const assets = Object.fromEntries(utxo.assets.map((asset) => [asset.unit, asset.quantity]))
  return {
    ...utxo,
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

const PRE_POLICY_ID = '1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c'
const PRE_ASSET_NAME_HEX = '5052452d52494348'
const preHolderResponse = await fetch(
  `${KOIOS}/asset_addresses?_asset_policy=${PRE_POLICY_ID}&_asset_name=${PRE_ASSET_NAME_HEX}`,
)
if (!preHolderResponse.ok) throw new Error(`KOIOS_PRE_ASSET_ADDRESSES_HTTP_${preHolderResponse.status}`)
const preHolderRows = await preHolderResponse.json()
if (!Array.isArray(preHolderRows)) throw new Error('KOIOS_PRE_ASSET_ADDRESSES_INVALID_RESPONSE')
const preHolders = preHolderRows.map((holder) => {
  if (typeof holder?.payment_address !== 'string' || holder.quantity == null) {
    throw new Error('KOIOS_PRE_ASSET_ADDRESSES_INVALID_HOLDER_ROW')
  }
  return {
    address: holder.payment_address,
    quantityAtomic: String(holder.quantity),
    matchesArtifactTreasury: holder.payment_address === treasuryAddress,
  }
})
const preHolderAddresses = new Set(preHolders.map((holder) => holder.address))
// Discover script-controlled addresses among current canonical tUSDM holders.
const holderAddressInfo = []
for (let offset = 0; offset < tUSDMHolders.length; offset += 40) {
  const batch = tUSDMHolders.slice(offset, offset + 40).map((holder) => holder.address)
  const infoResponse = await fetch(`${KOIOS}/address_info`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ _addresses: batch }),
  })
  if (!infoResponse.ok) throw new Error(`KOIOS_HOLDER_ADDRESS_INFO_HTTP_${infoResponse.status}`)
  const infoRows = await infoResponse.json()
  if (!Array.isArray(infoRows)) throw new Error('KOIOS_HOLDER_ADDRESS_INFO_INVALID_RESPONSE')
  holderAddressInfo.push(...infoRows)
}
const tUSDMScriptAddressHolders = holderAddressInfo
  .filter((info) => info?.script_address === true)
  .map((info) => ({
    address: String(info.address),
    balanceLovelace: String(info.balance ?? '0'),
    tUSDMAtomic: tUSDMHolders.find((holder) => holder.address === info.address)?.quantityAtomic ?? '0',
    utxoCount: Array.isArray(info.utxo_set) ? info.utxo_set.length : null,
    utxos: (info.utxo_set ?? []).map((u) => ({
      ref: String(u.tx_hash) + '#' + String(u.tx_index),
      lovelace: String(u.value),
      datumHash: u.datum_hash == null ? null : String(u.datum_hash),
      inlineDatumPresent: u.inline_datum != null,
      assets: (u.asset_list ?? []).map((a) => ({
        policyId: String(a.policy_id),
        assetNameHex: String(a.asset_name ?? ''),
        quantity: String(a.quantity),
      })),
    })),
  }))

const tUSDMAndPREHolderIntersection = tUSDMHolders
  .filter((holder) => preHolderAddresses.has(holder.address))
  .map((holder) => ({
    address: holder.address,
    tUSDMAtomic: holder.quantityAtomic,
    PREAtomic: preHolders.find((preHolder) => preHolder.address === holder.address).quantityAtomic,
    matchesArtifactTreasury: holder.address === treasuryAddress,
  }))

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
  source: { provider: 'Koios', endpoints: ['POST /address_info', 'POST /datum_info'], responseAddressMatched: currentInventory.address === treasuryAddress, scriptAddressConfirmed: currentInventory.scriptAddress, noUtxosReturned: currentInventory.utxoCount === 0, returnedUtxoRows: currentInventory.utxoCount, datumHashCount: currentInventory.datumHashCount, inlineDatumCount: currentInventory.inlineDatumCount, noDatumCount: currentInventory.noDatumCount },
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
  treasuryAddressInventory: currentInventory,
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
    inventory: historicalInventory,
  },
  tUSDMScriptAddressHolderDiscovery: {
    provider: 'Koios',
    endpoint: 'POST /address_info',
    searchedHolderCount: tUSDMHolders.length,
    returnedAddressInfoCount: holderAddressInfo.length,
    scriptAddressHolderCount: tUSDMScriptAddressHolders.length,
    candidates: tUSDMScriptAddressHolders,
    interpretation: 'Candidate discovery only. Script-address custody does not identify the configured Treasury without exact script hash/address binding.',
  },
  PREHolderDiscovery: {
    provider: 'Koios',
    endpoint: 'GET /asset_addresses',
    policyId: PRE_POLICY_ID,
    assetNameHex: PRE_ASSET_NAME_HEX,
    returnedHolderCount: preHolders.length,
    holders: preHolders,
  },
  tUSDMAndPREHolderIntersection: {
    count: tUSDMAndPREHolderIntersection.length,
    candidates: tUSDMAndPREHolderIntersection,
    interpretation: 'Discovery only. A shared PRE/tUSDM holder is not proven to be the configured Treasury; validate its address/script identity and UTxOs before attribution.',
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
    'This is a read-only snapshot of the exact script address derived from the current repository artifact; Koios reports the UTxO set, datum hashes, inline datums, assets and referenced datum bytes.',
    'Native lovelace is reported as testnet ADA; it is not USDM liquidity.',
    'The tUSDM unit is matched exactly by policy ID and asset-name hex; this observation does not independently certify issuer or redemption value.',
    'Balances do not prove an executable DEX route, minimum output, execution costs, or a non-erosive QNE action.',
  ],
}
await mkdir(OUTPUT_PATH.split('/').slice(0, -1).join('/') || '.', { recursive: true })
await writeFile(OUTPUT_PATH, JSON.stringify(observation, null, 2) + '\n')
console.log(JSON.stringify(observation, null, 2))
