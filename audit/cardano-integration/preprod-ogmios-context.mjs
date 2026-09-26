import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import WebSocket from 'ws'

const endpoint = process.env.DEMETER_OGMIOS_URL
const apiKey = process.env.DEMETER_API_KEY
const evidenceDir = process.env.PREPROD_EVIDENCE_DIR ?? 'audit/preprod-evidence'
if (!endpoint) throw new Error('DEMETER_OGMIOS_URL is required')
if (!apiKey) throw new Error('DEMETER_API_KEY is required')
await mkdir(evidenceDir, { recursive: true })

const headerName = ['dmtr', 'api', 'key'].join('-')
const client = new WebSocket(endpoint, { headers: { [headerName]: apiKey } })
let nextId = 1
const pending = new Map()

function rpc(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = `immortal-preprod-${nextId++}`
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

try {
  await opened
  const observations = {
    schema: 'IMMORTAL-PREPROD-OGMIOS-CONTEXT-v0.1',
    source: {
      provider: 'Demeter',
      network: 'cardano-preprod',
      interface: 'Ogmios v7 JSON-RPC',
      endpoint: endpoint,
      authentication: 'GitHub Actions secret',
    },
    observed_at: new Date().toISOString(),
    network_tip: await rpc('queryNetwork/tip'),
    network_block_height: await rpc('queryNetwork/blockHeight'),
    network_start_time: await rpc('queryNetwork/startTime'),
    shelley_genesis: await rpc('queryNetwork/genesisConfiguration', { era: 'shelley' }),
    alonzo_genesis: await rpc('queryNetwork/genesisConfiguration', { era: 'alonzo' }),
    ledger_epoch: await rpc('queryLedgerState/epoch'),
    ledger_tip: await rpc('queryLedgerState/tip'),
    era_summaries: await rpc('queryLedgerState/eraSummaries'),
    protocol_parameters: await rpc('queryLedgerState/protocolParameters'),
  }
  const body = JSON.stringify(observations, null, 2) + '\n'
  await writeFile(`${evidenceDir}/ogmios-preprod-context.json`, body)
  const digest = createHash('sha256').update(body).digest('hex')
  await writeFile(`${evidenceDir}/ogmios-preprod-context.sha256`, `${digest}  ogmios-preprod-context.json\n`)
  const summary = [
    'status=CONNECTED',
    'provider=Demeter',
    'network=cardano-preprod',
    'interface=Ogmios-v7',
    `network_tip=${JSON.stringify(observations.network_tip)}`,
    `ledger_epoch=${JSON.stringify(observations.ledger_epoch)}`,
    `context_sha256=${digest}`,
  ].join('\n') + '\n'
  await writeFile(`${evidenceDir}/summary.txt`, summary)
  console.log(summary)
} finally {
  client.close()
}
