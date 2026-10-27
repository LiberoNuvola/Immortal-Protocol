import { createHash } from 'node:crypto'
import { Asset, BlockfrostAdapter, NetworkId } from '@minswap/sdk'
import { BlockFrostAPI } from '@blockfrost/blockfrost-js'

const NETWORK = 'cardano-preprod'
const KOIOS = (process.env.KOIOS_PREPROD_URL ?? 'https://preprod.koios.rest/api/v1').replace(/\/$/, '')
const BLOCKFROST_PROJECT_ID = process.env.BLOCKFROST_PROJECT_ID?.trim()
const ADA_UNIT = 'lovelace'
const TUSDM_UNIT = 'e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d'
const TOKEN_POLICY = TUSDM_UNIT.slice(0, 56)
const TOKEN_NAME_HEX = TUSDM_UNIT.slice(56)

function sha256(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function normalizeHex(value) {
  const raw = typeof value === 'string' ? value : value?.bytes
  return typeof raw === 'string' ? raw.replace(/^0x/i, '').toLowerCase() : null
}

async function koiosGet(path) {
  const response = await fetch(KOIOS + path, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error('KOIOS_' + path.replace(/^\//, '').toUpperCase() + '_HTTP_' + response.status)
  return response.json()
}

async function koiosPost(path, body) {
  const response = await fetch(KOIOS + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error('KOIOS_' + path.replace(/^\//, '').toUpperCase() + '_HTTP_' + response.status)
  return response.json()
}

function decodeLedgerAssets(assetList = [], lovelace) {
  const assets = { lovelace: String(lovelace) }
  for (const item of assetList) {
    if (!item || typeof item.policy_id !== 'string' || typeof item.asset_name !== 'string' || item.quantity === undefined) {
      throw new Error('KOIOS_LEDGER_ASSET_ROW_MALFORMED')
    }
    assets[item.policy_id.toLowerCase() + item.asset_name.toLowerCase()] = String(item.quantity)
  }
  return assets
}

function tipSummary(tip) {
  if (!tip || tip.block_no == null || tip.abs_slot == null) {
    throw new Error('KOIOS_CHAIN_TIP_MISSING_REQUIRED_FIELDS')
  }
  return {
    blockNo: String(tip.block_no),
    slot: String(tip.abs_slot),
    blockHash: tip.hash ?? tip.block_hash ?? null,
  }
}

async function main() {
  if (!BLOCKFROST_PROJECT_ID) {
    throw new Error('BLOCKFROST_PROJECT_ID is required; value intentionally not logged')
  }

  const observedAt = new Date().toISOString()
  const blockfrost = new BlockFrostAPI({ projectId: BLOCKFROST_PROJECT_ID, network: 'preprod' })
  const adapter = new BlockfrostAdapter(NetworkId.TESTNET, blockfrost)
  const rawTip = await koiosGet('/tip')
  const chainTip = tipSummary(Array.isArray(rawTip) ? rawTip[0] : rawTip)

  const pool = await adapter.getV2PoolByPair(
    Asset.fromString(ADA_UNIT),
    Asset.fromString(TUSDM_UNIT),
  )

  if (!pool) {
    const snapshot = {
      schema: 'MINSWAP-PREPROD-V2-POOL-OBSERVATION-v1',
      network: NETWORK,
      status: 'POOL_NOT_FOUND_BY_MINSWAP_V2_ADAPTER',
      qualification: 'OBSERVED_NOT_QUALIFIED',
      candidatePair: {
        assetA: ADA_UNIT,
        assetB: TUSDM_UNIT,
        tokenPolicyId: TOKEN_POLICY,
        tokenNameHex: TOKEN_NAME_HEX,
        tokenDecimals: 6,
      },
      source: {
        sdk: '@minswap/sdk@0.5.0',
        discoveryProvider: 'Blockfrost Preprod',
        independentLedgerCheck: 'NOT_RUN_NO_SDK_POOL',
      },
      chainTip,
      observedAt,
      conclusion: 'The V2 adapter did not return this exact ADA / pinned Preprod tUSDM pair. This does not prove that no pool exists in another Minswap version or elsewhere on Preprod.',
    }
    snapshot.evidenceSha256 = sha256(snapshot)
    console.log(JSON.stringify(snapshot, null, 2))
    return
  }

  const assetSet = new Set([pool.assetA, pool.assetB])
  if (!assetSet.has(ADA_UNIT) || !assetSet.has(TUSDM_UNIT) || assetSet.size !== 2) {
    throw new Error('MINSWAP_SDK_RETURNED_DIFFERENT_ASSET_PAIR')
  }

  const txHash = String(pool.txIn?.txHash ?? '').toLowerCase()
  const outputIndex = Number(pool.txIn?.index)
  const poolAddress = String(pool.address ?? '')
  if (!/^[0-9a-f]{64}$/.test(txHash) || !Number.isSafeInteger(outputIndex) || outputIndex < 0 || !poolAddress) {
    throw new Error('MINSWAP_POOL_MISSING_CANONICAL_OUTREF_OR_ADDRESS')
  }

  const rows = await koiosPost('/address_utxos', { _addresses: [poolAddress], _extended: true })
  if (!Array.isArray(rows)) throw new Error('KOIOS_ADDRESS_UTXOS_NOT_ARRAY')
  const exact = rows.filter((row) =>
    String(row.tx_hash ?? '').toLowerCase() === txHash &&
    Number(row.tx_index) === outputIndex &&
    String(row.address ?? '') === poolAddress
  )

  if (exact.length !== 1) {
    const snapshot = {
      schema: 'MINSWAP-PREPROD-V2-POOL-OBSERVATION-v1',
      network: NETWORK,
      status: 'BLOCKED_SDK_OUTREF_NOT_UNIQUELY_VERIFIED_BY_KOIOS',
      qualification: 'OBSERVED_NOT_QUALIFIED',
      candidatePair: { assetA: ADA_UNIT, assetB: TUSDM_UNIT, tokenPolicyId: TOKEN_POLICY, tokenNameHex: TOKEN_NAME_HEX, tokenDecimals: 6 },
      sdkPool: { address: poolAddress, txHash, outputIndex, assetA: pool.assetA, assetB: pool.assetB },
      koiosMatches: exact.length,
      chainTip,
      observedAt,
      conclusion: 'The SDK-discovered pool out-reference was not found exactly once at the same address in the independent Koios query.',
    }
    snapshot.evidenceSha256 = sha256(snapshot)
    console.log(JSON.stringify(snapshot, null, 2))
    process.exitCode = 1
    return
  }

  const ledger = exact[0]
  const ledgerDatum = normalizeHex(ledger.inline_datum)
  const sdkDatum = normalizeHex(pool.datumRaw)
  const ledgerAssets = decodeLedgerAssets(ledger.asset_list, ledger.value)
  const directTUsdmAtomic = BigInt(ledgerAssets[TUSDM_UNIT] ?? '0')
  const sdkTUsdmAtomic = BigInt(pool.value?.find?.((item) => item.unit === TUSDM_UNIT)?.quantity ?? '0')
  const datumMatches = Boolean(ledgerDatum && sdkDatum && ledgerDatum === sdkDatum)
  const assetQuantityMatches = directTUsdmAtomic > 0n && sdkTUsdmAtomic > 0n && directTUsdmAtomic === sdkTUsdmAtomic

  const snapshot = {
    schema: 'MINSWAP-PREPROD-V2-POOL-OBSERVATION-v1',
    network: NETWORK,
    status: datumMatches && assetQuantityMatches ? 'OBSERVED_NOT_QUALIFIED' : 'BLOCKED_SDK_LEDGER_WITNESS_MISMATCH',
    qualification: 'OBSERVED_NOT_QUALIFIED',
    candidatePair: { assetA: ADA_UNIT, assetB: TUSDM_UNIT, tokenPolicyId: TOKEN_POLICY, tokenNameHex: TOKEN_NAME_HEX, tokenDecimals: 6 },
    source: {
      sdk: '@minswap/sdk@0.5.0',
      discoveryProvider: 'Blockfrost Preprod',
      independentLedgerProvider: 'Koios Preprod',
      mutatingActions: false,
    },
    pool: {
      protocolVariant: 'Minswap V2',
      address: poolAddress,
      outRef: txHash + '#' + outputIndex,
      assetA: pool.assetA,
      assetB: pool.assetB,
      datumCborHex: sdkDatum,
      datumMatchesKoios: datumMatches,
      reservesFromDatum: { reserveA: String(pool.reserveA), reserveB: String(pool.reserveB) },
      feeA: pool.feeA.map((value) => value.toString()),
      feeB: pool.feeB.map((value) => value.toString()),
      feeShare: pool.feeShare?.map((value) => value.toString()) ?? null,
      totalLiquidity: String(pool.totalLiquidity),
      lpAsset: pool.lpAsset,
      directLedger: {
        observedAddress: ledger.address,
        txHash: String(ledger.tx_hash).toLowerCase(),
        outputIndex: Number(ledger.tx_index),
        lovelace: ledgerAssets.lovelace,
        tusdmAtomic: directTUsdmAtomic.toString(),
        sdkValueTusdmAtomic: sdkTUsdmAtomic.toString(),
        assets: ledgerAssets,
        inlineDatumCborHex: ledgerDatum,
      },
    },
    chainTip,
    observedAt,
    guardrails: {
      mainnetMonetaUsdmIdentityUsed: false,
      usdUsdmConversionQualified: false,
      noParityAssumption: true,
      noSigningOrSubmission: true,
      statusNote: 'Preprod tUSDM pool observation is test integration evidence only. It does not qualify a USD/USDM conversion or authorize EEV/Issue.',
    },
  }

  snapshot.evidenceSha256 = sha256(snapshot)
  console.log(JSON.stringify(snapshot, null, 2))
  if (!datumMatches || !assetQuantityMatches) process.exitCode = 1
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'OBSERVATION_FAILED_CLOSED',
    network: NETWORK,
    error: String(error?.message ?? error).slice(0, 500),
    note: 'No transaction was signed or submitted. Provider credentials and response values are not logged.',
  }, null, 2))
  process.exitCode = 1
})
