import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import WebSocket from 'ws'

const endpoint = process.env.DEMETER_OGMIOS_URL?.trim()
const evidenceDir = process.env.PREPROD_EVIDENCE_DIR ?? 'audit/preprod-evidence'
const explicitAuthenticatedEndpoint = process.env.DEMETER_OGMIOS_AUTHENTICATED_URL?.trim()
const credentials = [
  ['DEMETER_API_KEY_PRIMARY', process.env.DEMETER_API_KEY_PRIMARY?.trim()],
  ['DEMETER_API_KEY_ALIAS', process.env.DEMETER_API_KEY_ALIAS?.trim()],
  ['DEMETER_API_KEY', process.env.DEMETER_API_KEY?.trim()],
].filter(([, value], index, all) => value && all.findIndex(([, candidate]) => candidate === value) === index)

if (!endpoint) throw new Error('DEMETER_OGMIOS_URL is required')
if (!credentials.length) throw new Error('No Demeter credential is configured')
await mkdir(evidenceDir, { recursive: true })

const headerName = ['dmtr', 'api', 'key'].join('-')

function authenticatedEndpoint(base, key) {
  if (explicitAuthenticatedEndpoint) return explicitAuthenticatedEndpoint
  const url = new URL(base)
  if (!url.hostname.endsWith('.dmtr.host') && !url.hostname.endsWith('.demeter.run')) {
    throw new Error('authenticated endpoint fallback requires a Demeter hostname')
  }
  url.hostname = key + '.' + url.hostname
  return url.toString()
}

function openClient(target, key, useHeader) {
  return new Promise((resolve, reject) => {
    const options = useHeader ? { headers: { [headerName]: key } } : {}
    const socket = new WebSocket(target, options)
    const timer = setTimeout(() => {
      socket.close()
      reject(new Error('Ogmios WebSocket open timeout'))
    }, 30000)
    socket.once('open', () => {
      clearTimeout(timer)
      resolve(socket)
    })
    socket.once('error', error => {
      clearTimeout(timer)
      reject(error)
    })
    socket.once('unexpected-response', (_request, response) => {
      clearTimeout(timer)
      reject(new Error('Ogmios WebSocket HTTP upgrade failed: status=' + response.statusCode))
    })
  })
}

let client
let credentialLabel
const attempts = []

for (const [label, key] of credentials) {
  try {
    client = await openClient(endpoint, key, true)
    credentialLabel = label
    attempts.push(label + ':header=connected')
    break
  } catch (headerError) {
    const headerMessage = headerError instanceof Error ? headerError.message : String(headerError)
    attempts.push(label + ':header=' + (headerMessage.match(/status=\d+/)?.[0] ?? 'failed'))
    if (!/status=401\b/.test(headerMessage)) throw headerError
    try {
      const fallback = authenticatedEndpoint(endpoint, key)
      client = await openClient(fallback, key, false)
      credentialLabel = label
      attempts.push(label + ':authenticated-endpoint=connected')
      break
    } catch (fallbackError) {
      const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
      attempts.push(label + ':authenticated-endpoint=' + (fallbackMessage.match(/status=\d+/)?.[0] ?? 'failed'))
    }
  }
}

if (!client) {
  throw new Error('Demeter Ogmios authentication failed for all configured credentials: ' + attempts.join(', '))
}

console.log('Ogmios WebSocket connected using ' + credentialLabel + '; attempts=' + attempts.join(', '))
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

try {
  console.log('Ogmios WebSocket connected')
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
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  const diagnostic = {
    schema: 'IMMORTAL-PREPROD-OGMIOS-DIAGNOSTIC-v0.1',
    observed_at: new Date().toISOString(),
    endpoint: endpoint,
    failure: message.replace(apiKey ?? '', '[REDACTED]'),
  }
  await writeFile(
    `${evidenceDir}/ogmios-preprod-diagnostic.json`,
    JSON.stringify(diagnostic, null, 2) + '\\n',
  )
  console.error(diagnostic.failure)
  process.exitCode = 1
} finally {
  client?.close()
}
