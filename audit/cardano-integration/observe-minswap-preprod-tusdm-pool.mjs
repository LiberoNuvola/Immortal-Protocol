import { createHash } from 'node:crypto'
import { DexV2Constant, NetworkId, PoolV2 } from '@minswap/sdk'

const NETWORK = 'cardano-preprod'
const KOIOS = (process.env.KOIOS_PREPROD_URL ?? 'https://preprod.koios.rest/api/v1').replace(/\/$/, '')
const TUSDM_UNIT = 'e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d'
const ADA_UNIT = 'lovelace'
const CONFIG = DexV2Constant.CONFIG[NetworkId.TESTNET]
const POOL_SCRIPT_HASH = CONFIG.poolScriptHash.toLowerCase()
const POOL_AUTH_UNIT = CONFIG.poolAuthenAsset.toLowerCase()
const POOL_AUTH_POLICY = POOL_AUTH_UNIT.slice(0, 56)
const POOL_AUTH_NAME = POOL_AUTH_UNIT.slice(56)

function sha256(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function normalizeHex(value) {
  const raw = typeof value === 'string' ? value : value?.bytes
  return typeof raw === 'string' ? raw.replace(/^0x/i, '').toLowerCase() : null
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
  const text = await response.text()
  if (!response.ok) {
    throw new Error('KOIOS_' + path.replace(/^\//, '').toUpperCase() + '_HTTP_' + response.status + ':' + text.slice(0, 250))
  }
  return JSON.parse(text)
}

function decodeLedgerAssets(assetList = [], lovelace) {
  const assets = { [ADA_UNIT]: String(lovelace) }
  for (const item of assetList) {
    if (!item || typeof item.policy_id !== 'string' || typeof item.asset_name !== 'string' || item.quantity === undefined) {
      throw new Error('KOIOS_LEDGER_ASSET_ROW_MALFORMED')
    }
    const unit = item.policy_id.toLowerCase() + item.asset_name.toLowerCase()
    if (Object.hasOwn(assets, unit)) throw new Error('KOIOS_DUPLICATE_ASSET_UNIT')
    assets[unit] = String(item.quantity)
  }
  return assets
}

function sdkValueFromRow(row) {
  const assets = decodeLedgerAssets(row.asset_list, row.value)
  return Object.entries(assets).map(([unit, quantity]) => ({ unit, quantity }))
}

function parsePoolRow(row) {
  const txHash = String(row.tx_hash ?? '').toLowerCase()
  const outputIndex = Number(row.tx_index)
  const address = String(row.address ?? '')
  const paymentCred = String(row.payment_cred ?? '').toLowerCase()
  const datumHex = normalizeHex(row.inline_datum)
  if (!/^[0-9a-f]{64}$/.test(txHash) || !Number.isSafeInteger(outputIndex) || outputIndex < 0 || !address) {
    throw new Error('KOIOS_POOL_OUTREF_OR_ADDRESS_INVALID')
  }
  if (paymentCred !== POOL_SCRIPT_HASH) throw new Error('KOIOS_POOL_PAYMENT_CREDENTIAL_MISMATCH')
  if (!datumHex) throw new Error('KOIOS_POOL_INLINE_DATUM_MISSING')
  const value = sdkValueFromRow(row)
  const state = new PoolV2.State(
    NetworkId.TESTNET,
    address,
    { txHash, index: outputIndex },
    value,
    datumHex,
  )
  return { row, state, txHash, outputIndex, address, datumHex, value }
}

async function findLiveOutRef(address, txHash, outputIndex) {
  const rows = await koiosPost('/address_utxos', { _addresses: [address], _extended: true })
  if (!Array.isArray(rows)) throw new Error('KOIOS_ADDRESS_UTXOS_NOT_ARRAY')
  return rows.filter((row) =>
    String(row.tx_hash ?? '').toLowerCase() === txHash &&
    Number(row.tx_index) === outputIndex &&
    String(row.address ?? '') === address
  )
}

function exactAssetPair(pool) {
  const pair = new Set([pool.assetA, pool.assetB])
  return pair.size === 2 && pair.has(ADA_UNIT) && pair.has(TUSDM_UNIT)
}

async function main() {
  if (POOL_AUTH_UNIT.length <= 56 || !/^[0-9a-f]{56}$/.test(POOL_SCRIPT_HASH)) {
    throw new Error('MIN​​SWAP_TESTNET_CONFIG_INVALID'.replaceAll('\u200b', ''))
  }

  const observedAt = new Date().toISOString()
  const rawTipBefore = await koiosGet('/tip')
  const tipBefore = tipSummary(Array.isArray(rawTipBefore) ? rawTipBefore[0] : rawTipBefore)

  // Minswap V2's pool-authentication asset is the SDK's protocol-level pool discovery key.
  // Koios is queried directly, so this observer does not depend on Blockfrost/Maestro credentials.
  const rows = await koiosPost('/asset_utxos', {
    _asset_list: [[POOL_AUTH_POLICY, POOL_AUTH_NAME]],
    _extended: true,
  })
  if (!Array.isArray(rows)) throw new Error('KOIOS_ASSET_UTXOS_NOT_ARRAY')

  const poolCredentialRows = rows.filter((row) =>
    String(row.payment_cred ?? '').toLowerCase() === POOL_SCRIPT_HASH
  )
  const parsedPools = []
  let parseRejected = 0
  for (const row of poolCredentialRows) {
    try {
      const parsed = parsePoolRow(row)
      const authQty = BigInt(parsed.row.asset_list.find((item) =>
        String(item.policy_id).toLowerCase() + String(item.asset_name).toLowerCase() === POOL_AUTH_UNIT
      )?.quantity ?? '0')
      if (authQty !== 1n) {
        parseRejected += 1
        continue
      }
      parsedPools.push(parsed)
    } catch {
      parseRejected += 1
    }
  }

  const pairCandidates = parsedPools.filter((candidate) => exactAssetPair(candidate.state))
  const poolObservations = []
  let mismatchCount = 0

  for (const candidate of pairCandidates) {
    const exact = await findLiveOutRef(candidate.address, candidate.txHash, candidate.outputIndex)
    if (exact.length !== 1) {
      mismatchCount += 1
      poolObservations.push({
        status: 'BLOCKED_OUTREF_NOT_UNIQUELY_LIVE',
        address: candidate.address,
        outRef: candidate.txHash + '#' + candidate.outputIndex,
        exactKoiosMatches: exact.length,
      })
      continue
    }

    const direct = exact[0]
    const directDatumHex = normalizeHex(direct.inline_datum)
    const directAssets = decodeLedgerAssets(direct.asset_list, direct.value)
    const sdkAssets = Object.fromEntries(candidate.value.map((item) => [item.unit, String(item.quantity)]))
    const datumMatches = Boolean(directDatumHex && candidate.datumHex === directDatumHex)
    const assetValueMatches =
      String(direct.address) === candidate.address &&
      String(direct.payment_cred ?? '').toLowerCase() === POOL_SCRIPT_HASH &&
      (directAssets[POOL_AUTH_UNIT] ?? '0') === '1' &&
      (directAssets[TUSDM_UNIT] ?? '0') === (sdkAssets[TUSDM_UNIT] ?? '0') &&
      (directAssets[ADA_UNIT] ?? '0') === (sdkAssets[ADA_UNIT] ?? '0') &&
      BigInt(directAssets[TUSDM_UNIT] ?? '0') > 0n &&
      BigInt(directAssets[ADA_UNIT] ?? '0') > 0n

    const verifiedSnapshot = {
      status: datumMatches && assetValueMatches ? 'OBSERVED_NOT_QUALIFIED' : 'BLOCKED_SDK_LEDGER_WITNESS_MISMATCH',
      address: candidate.address,
      outRef: candidate.txHash + '#' + candidate.outputIndex,
      paymentCredential: String(direct.payment_cred ?? '').toLowerCase(),
      datumMatchesKoiosRequery: datumMatches,
      assetValueMatchesKoiosRequery: assetValueMatches,
      assetA: candidate.state.assetA,
      assetB: candidate.state.assetB,
      reservesFromDatum: { reserveA: String(candidate.state.reserveA), reserveB: String(candidate.state.reserveB) },
      valueReserves: candidate.state.valueReserves.map((value) => value.toString()),
      fees: {
        feeA: candidate.state.feeA.map((value) => value.toString()),
        feeB: candidate.state.feeB.map((value) => value.toString()),
        feeShare: candidate.state.feeShare?.map((value) => value.toString()) ?? null,
      },
      totalLiquidity: String(candidate.state.totalLiquidity),
      lpAsset: candidate.state.lpAsset,
      directLedger: {
        blockHeight: direct.block_height == null ? null : String(direct.block_height),
        blockTime: direct.block_time == null ? null : String(direct.block_time),
        lovelace: directAssets[ADA_UNIT],
        tUsdmAtomic: directAssets[TUSDM_UNIT],
        poolAuthAtomic: directAssets[POOL_AUTH_UNIT],
        allAssets: directAssets,
        inlineDatumCborHex: directDatumHex,
      },
      sdkDatumCborHex: candidate.datumHex,
    }
    if (!datumMatches || !assetValueMatches) mismatchCount += 1
    poolObservations.push(verifiedSnapshot)
  }

  const rawTipAfter = await koiosGet('/tip')
  const tipAfter = tipSummary(Array.isArray(rawTipAfter) ? rawTipAfter[0] : rawTipAfter)
  if (BigInt(tipAfter.slot) < BigInt(tipBefore.slot)) {
    throw new Error('KOIOS_CHAIN_TIP_MOVED_BACKWARDS')
  }

  let status
  if (mismatchCount > 0) status = 'BLOCKED_SDK_LEDGER_WITNESS_MISMATCH'
  else if (poolObservations.length > 0) status = 'OBSERVED_NOT_QUALIFIED'
  else if (parsedPools.length > 0) status = 'NO_EXACT_ADA_TUSDM_PAIR_FOUND_IN_MINSWAP_V2'
  else status = 'NO_VERIFIED_MINSWAP_V2_POOL_CANDIDATE_FOUND'

  const snapshot = {
    schema: 'MINSWAP-PREPROD-V2-POOL-OBSERVATION-v2',
    network: NETWORK,
    status,
    qualification: 'OBSERVED_NOT_QUALIFIED',
    candidatePair: {
      assetA: ADA_UNIT,
      assetB: TUSDM_UNIT,
      tokenPolicyId: TUSDM_UNIT.slice(0, 56),
      tokenNameHex: TUSDM_UNIT.slice(56),
      tokenDecimals: 6,
    },
    discovery: {
      provider: 'Koios Preprod public API',
      endpoint: 'POST /asset_utxos',
      filterAsset: POOL_AUTH_UNIT,
      minswapV2PoolPaymentCredential: POOL_SCRIPT_HASH,
      rowsWithPoolCredential: poolCredentialRows.length,
      decodedPoolStates: parsedPools.length,
      rejectedRowsOrDatums: parseRejected,
      exactPairCandidates: pairCandidates.length,
      exactOutRefRequery: 'POST /address_utxos',
      mutatingActions: false,
    },
    poolObservations,
    chainTip: { before: tipBefore, after: tipAfter },
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
  if (status === 'BLOCKED_SDK_LEDGER_WITNESS_MISMATCH') process.exitCode = 1
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'OBSERVATION_FAILED_CLOSED',
    network: NETWORK,
    error: String(error?.message ?? error).slice(0, 500),
    note: 'No transaction was signed or submitted. This observer uses public Koios reads and does not log credentials.',
  }, null, 2))
  process.exitCode = 1
})
