import {
  Lucid,
  Koios,
  getAddressDetails,
  scriptFromNative,
  mintingPolicyToId,
  Constr,
  Data,
} from '@lucid-evolution/lucid'
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'

const KOIOS = process.env.KOIOS_PREPROD_URL ?? 'https://preprod.koios.rest/api/v1'
const SEED = process.env.PREPROD_REVEAL_SEED?.trim()
const EXPECTED_ADDRESS = process.env.PREPROD_WALLET_ADDRESS?.trim()
const EVIDENCE_DIR = process.env.PREPROD_EVIDENCE_DIR ?? 'audit/preprod-evidence'

const ORACLE_STATE_TOKEN_NAME_HEX =
  process.env.PREPROD_ORACLE_STATE_TOKEN_NAME_HEX?.trim() ??
  '4f5241434c45'

const ADA_ASSET_POLICY_HEX = ''
const ADA_ASSET_NAME_HEX = ''
const ADA_PRICE_USDM_SUBUNITS_PER_LOVELACE = 100n
const ORACLE_MAX_AGE_MS = 3_600_000n
const ORACLE_LOVELACE = 2_000_000n

function required(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(field + ' is required')
  }
  return value.trim()
}

function ref(utxo) {
  if (
    !utxo ||
    typeof utxo.txHash !== 'string' ||
    !/^[0-9a-fA-F]{64}$/.test(utxo.txHash) ||
    !Number.isInteger(utxo.outputIndex) ||
    utxo.outputIndex < 0
  ) {
    throw new Error('UTxO has no exact Cardano reference')
  }
  return utxo.txHash + '#' + utxo.outputIndex
}

function hashJson(value) {
  return createHash('sha256')
    .update(
      JSON.stringify(
        value,
        (_key, v) => (typeof v === 'bigint' ? v.toString() : v),
      ),
    )
    .digest('hex')
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function safeKoiosUtxos(address) {
  const response = await fetch(KOIOS + '/address_info', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ _addresses: [address] }),
  })
  if (!response.ok) {
    throw new Error('Koios address_info failed: ' + response.status)
  }
  const rows = await response.json()
  const info = rows?.[0]
  if (!info) return []

  return (info.utxo_set ?? []).map(u => {
    const assets = { lovelace: BigInt(u.value) }
    for (const asset of u.asset_list ?? []) {
      assets[asset.policy_id + (asset.asset_name ?? '')] =
        BigInt(asset.quantity)
    }
    return {
      txHash: u.tx_hash,
      outputIndex: u.tx_index,
      assets,
      address: info.address,
      datum: u.inline_datum?.bytes,
    }
  })
}

async function waitFor(fn, predicate, label) {
  for (let i = 0; i < 60; i += 1) {
    const value = await fn()
    if (predicate(value)) return value
    await wait(2000)
  }
  throw new Error('Timed out waiting for ' + label)
}

required(SEED, 'PREPROD_REVEAL_SEED')
required(EXPECTED_ADDRESS, 'PREPROD_WALLET_ADDRESS')

if (
  typeof ORACLE_STATE_TOKEN_NAME_HEX !== 'string' ||
  ORACLE_STATE_TOKEN_NAME_HEX.length === 0 ||
  ORACLE_STATE_TOKEN_NAME_HEX.length % 2 !== 0 ||
  !/^[0-9a-fA-F]+$/.test(ORACLE_STATE_TOKEN_NAME_HEX)
) {
  throw new Error('PREPROD_ORACLE_STATE_TOKEN_NAME_HEX must be non-empty even-length hex')
}

await mkdir(EVIDENCE_DIR, { recursive: true })

const provider = new Koios(KOIOS)
provider.awaitTx = async txHash => {
  await waitFor(
    async () => {
      const response = await fetch(KOIOS + '/tx_info', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ _tx_hashes: [txHash] }),
      })
      if (!response.ok) {
        throw new Error('Koios tx_info failed: ' + response.status)
      }
      return response.json()
    },
    rows => Array.isArray(rows) && rows.some(row => row?.tx_hash === txHash),
    'transaction ' + txHash,
  )
  return true
}

provider.getUtxos = async address => safeKoiosUtxos(address)

const lucid = await Lucid(provider, 'Preprod')
lucid.selectWallet.fromSeed(SEED)

const address = await lucid.wallet().address()
if (address !== EXPECTED_ADDRESS) {
  throw new Error('PREPROD_REVEAL_SEED resolves to unexpected wallet address')
}

const details = getAddressDetails(address)
const walletKeyHash = details.paymentCredential?.hash
if (!walletKeyHash) {
  throw new Error('Preprod wallet has no payment credential')
}

const oraclePolicy = scriptFromNative({
  type: 'all',
  scripts: [{ type: 'sig', keyHash: walletKeyHash }],
})
const oracleStatePolicyId = mintingPolicyToId(oraclePolicy)
const oracleStateUnit =
  oracleStatePolicyId + ORACLE_STATE_TOKEN_NAME_HEX

const existing = (await provider.getUtxos(address)).filter(
  u => (u.assets?.[oracleStateUnit] ?? 0n) === 1n,
)

let oracleStateUtxo
let bootstrapTxHash = null
let reusedExisting = false
let oracleTimestamp

if (existing.length > 1) {
  throw new Error(
    'Multiple Oracle State singleton UTxOs already exist for the derived identity',
  )
}

if (existing.length === 1) {
  oracleStateUtxo = existing[0]
  reusedExisting = true
  if (!oracleStateUtxo.datum) {
    throw new Error('Existing Oracle State singleton is missing its inline datum')
  }
  console.log(JSON.stringify({
    status: 'EXISTING_VALID_IDENTITY',
    network: 'cardano-preprod',
    oracleStatePolicyId,
    oracleStateTokenNameHex: ORACLE_STATE_TOKEN_NAME_HEX,
    oraclePublisherPkh: walletKeyHash,
    oracleStateUnit,
    oracleStateUtxo: ref(oracleStateUtxo),
  }, null, 2))
} else {
  oracleTimestamp = BigInt(Date.now())
  const oracleDatum = new Constr(0, [
    ADA_ASSET_POLICY_HEX,
    ADA_ASSET_NAME_HEX,
    ADA_PRICE_USDM_SUBUNITS_PER_LOVELACE,
    oracleTimestamp,
    walletKeyHash,
  ])

  const tx = await lucid
    .newTx()
    .mintAssets(
      { [oracleStateUnit]: 1n },
      Data.void(),
    )
    .attach.MintingPolicy(oraclePolicy)
    .pay.ToAddressWithData(
      address,
      { kind: 'inline', value: Data.to(oracleDatum) },
      { lovelace: ORACLE_LOVELACE, [oracleStateUnit]: 1n },
    )
    .addSigner(address)
    .complete()

  const signed = await tx.sign.withWallet().complete()
  bootstrapTxHash = await signed.submit()
  await lucid.awaitTx(bootstrapTxHash)

  const matches = await waitFor(
    () => provider.getUtxos(address),
    xs =>
      xs.filter(
        u => (u.assets?.[oracleStateUnit] ?? 0n) === 1n,
      ).length === 1,
    'Oracle State UTxO',
  )

  oracleStateUtxo = matches.find(
    u => (u.assets?.[oracleStateUnit] ?? 0n) === 1n,
  )

  if (!oracleStateUtxo?.datum) {
    throw new Error('Materialized Oracle State UTxO has no inline datum')
  }
}

const manifest = {
  schema: 'IMMORTAL-PREPROD-ORACLE-STATE-DEPLOYMENT-v0.1',
  status: 'MATERIALIZED',
  network: 'cardano-preprod',
  authorityKind: 'DEPLOYMENT_WALLET_SIGNED',
  oracleState: {
    policyId: oracleStatePolicyId,
    tokenNameHex: ORACLE_STATE_TOKEN_NAME_HEX,
    unit: oracleStateUnit,
    publisherPkh: walletKeyHash,
    address,
    utxo: ref(oracleStateUtxo),
  },
  datumSemantics: {
    assetPolicyHex: ADA_ASSET_POLICY_HEX,
    assetNameHex: ADA_ASSET_NAME_HEX,
    priceUsdmSubunitsPerLovelace: ADA_PRICE_USDM_SUBUNITS_PER_LOVELACE.toString(),
    scale: '1e6',
    timestampMs: oracleTimestamp?.toString() ?? null,
    maxAgeMs: ORACLE_MAX_AGE_MS.toString(),
  },
  bootstrap: {
    reusedExisting,
    txHash: bootstrapTxHash,
    lovelace: ORACLE_LOVELACE.toString(),
  },
}

manifest.evidenceHash = hashJson(manifest)

await writeFile(
  EVIDENCE_DIR + '/preprod-oracle-state-deployment.json',
  JSON.stringify(manifest, null, 2) + '\n',
)

if (process.env.GITHUB_OUTPUT) {
  await writeFile(
    process.env.GITHUB_OUTPUT,
    [
      'oracle_state_policy_id=' + oracleStatePolicyId,
      'oracle_state_token_name_hex=' + ORACLE_STATE_TOKEN_NAME_HEX,
      'oracle_publisher_pkh=' + walletKeyHash,
      'oracle_state_address=' + address,
      'oracle_state_unit=' + oracleStateUnit,
      'oracle_state_utxo=' + ref(oracleStateUtxo),
    ].join('\n') + '\n',
  )
}

console.log(
  JSON.stringify(
    {
      status: manifest.status,
      reusedExisting,
      network: manifest.network,
      oracleStatePolicyId,
      oracleStateTokenNameHex: ORACLE_STATE_TOKEN_NAME_HEX,
      oraclePublisherPkh: walletKeyHash,
      oracleStateUnit,
      oracleStateAddress: address,
      oracleStateUtxo: ref(oracleStateUtxo),
      bootstrapTxHash,
      manifest: EVIDENCE_DIR + '/preprod-oracle-state-deployment.json',
      evidenceHash: manifest.evidenceHash,
    },
    null,
    2,
  ),
)
