import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import WebSocket from 'ws'

const endpoint = process.env.DEMETER_OGMIOS_URL?.trim()
const apiKey = process.env.DEMETER_API_KEY?.trim()
const address = process.env.PREPROD_WALLET_ADDRESS?.trim()
const evidenceDir = process.env.PREPROD_EVIDENCE_DIR ?? 'audit/preprod-evidence'

if (!endpoint) throw new Error('DEMETER_OGMIOS_URL is required')
if (!apiKey) throw new Error('DEMETER_API_KEY is required')
if (!address) throw new Error('PREPROD_WALLET_ADDRESS is required')

await mkdir(evidenceDir, { recursive: true })

const headerName = ['dmtr', 'api', 'key'].join('-')
const client = new WebSocket(endpoint, { headers: { [headerName]: apiKey } })
let nextId = 1
const pending = new Map()

function rpc(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = `immortal-preprod-wallet-${nextId++}`
    const timer = setTimeout(() => {
      pending.delete(id)
      reject(new Error(`Ogmios RPC timeout: ${method}`))
    }, 30000)
    pending.set(id, { resolve, reject, timer, method })
    client.send(JSON.stringify({ jsonrpc: '2.0', method, params, id }))
  })
}

client.on('message', raw => {
  const response = JSON.parse(raw.toString())
  if (!response.id || !pending.has(response.id)) return
  const item = pending.get(response.id)
  pending.delete(response.id)
  clearTimeout(item.timer)
  if (response.error) item.reject(new Error(`Ogmios ${item.method}: ${JSON.stringify(response.error)}`))
  else item.resolve(response.result)
})

const opened = new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Ogmios WebSocket open timeout')), 30000)
  client.once('open', () => { clearTimeout(timer); resolve() })
  client.once('error', reject)
})

function lovelaceOf(value) {
  const raw =
    value?.ada?.lovelace ??
    value?.lovelace ??
    0
  return BigInt(raw)
}

function normalizeUtxos(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map((entry) => {
    const transaction = entry.outputReference?.transaction ?? entry.transaction ?? {}
    const index = entry.outputReference?.index ?? entry.index
    const value = entry.value ?? entry.amount ?? {}
    return {
      txHash: transaction.id ?? entry.txHash ?? null,
      index,
      address: entry.address ?? address,
      value,
      datum: entry.datum ?? null,
      datumHash: entry.datumHash ?? entry.datumhash ?? null,
      script: entry.script ?? entry.referenceScript ?? null,
    }
  })
}

try {
  await opened

  const tip = await rpc('queryNetwork/tip')
  const utxoRaw = await rpc('queryLedgerState/utxo', { addresses: [address] })
  const utxos = normalizeUtxos(utxoRaw)

  const lovelace = utxos.reduce((sum, u) => sum + lovelaceOf(u.value), 0n)
  const status = lovelace > 0n ? 'FUNDED' : 'UNFUNDED'

  const observations = {
    schema: 'IMMORTAL-PREPROD-WALLET-UTXO-v0.1',
    source: {
      provider: 'Demeter',
      network: 'cardano-preprod',
      interface: 'Ogmios v7 JSON-RPC',
      endpoint,
      authentication: 'GitHub Actions secret',
      query: 'queryLedgerState/utxo by address',
    },
    observedAt: new Date().toISOString(),
    wallet: {
      address,
      status,
    },
    networkTip: tip,
    utxoCount: utxos.length,
    lovelaceBalance: lovelace.toString(),
    utxos,
    rawOgmiosUtxoResult: utxoRaw,
  }

  const body = JSON.stringify(observations, null, 2) + '\n'
  await writeFile(`${evidenceDir}/preprod-wallet-utxo.json`, body)
  const digest = createHash('sha256').update(body).digest('hex')
  await writeFile(
    `${evidenceDir}/preprod-wallet-utxo.sha256`,
    `${digest}  preprod-wallet-utxo.json\n`,
  )

  const summary = [
    `status=${status}`,
    'provider=Demeter',
    'network=cardano-preprod',
    'interface=Ogmios-v7',
    `wallet_address=${address}`,
    `utxo_count=${utxos.length}`,
    `lovelace_balance=${lovelace}`,
    `network_tip=${JSON.stringify(tip)}`,
    `utxo_packet_sha256=${digest}`,
  ].join('\n') + '\n'

  await writeFile(`${evidenceDir}/preprod-wallet-summary.txt`, summary)
  console.log(summary)

  if (status !== 'FUNDED') {
    process.exitCode = 2
  }
} finally {
  client.close()
}
