import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import WebSocket from 'ws'

const endpoint = process.env.DEMETER_OGMIOS_URL?.trim()
const apiKey = process.env.DEMETER_API_KEY?.trim()
const evidenceDir = process.env.PREPROD_EVIDENCE_DIR ?? 'audit/preprod-evidence'
if (!endpoint) throw new Error('DEMETER_OGMIOS_URL is required')
if (!apiKey) throw new Error('DEMETER_API_KEY is required')
await mkdir(evidenceDir, { recursive: true })

const headerName = ['dmtr', 'api', 'key'].join('-')
const explicitAuthenticatedEndpoint = process.env.DEMETER_OGMIOS_AUTHENTICATED_URL?.trim()

function authenticatedEndpoint(base) {
  if (explicitAuthenticatedEndpoint) return explicitAuthenticatedEndpoint
  const url = new URL(base)
  if (!url.hostname.endsWith('.dmtr.host') && !url.hostname.endsWith('.demeter.run')) {
    throw new Error('authenticated endpoint fallback requires a Demeter hostname')
  }
  url.hostname = `${apiKey}.${url.hostname}`
  return url.toString()
}

function openClient(target, useHeader) {
  return new Promise((resolve, reject) => {
    const options = useHeader ? { headers: { [headerName]: apiKey } } : {}
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
      reject(new Error(`Ogmios WebSocket HTTP upgrade failed: status=${response.statusCode} headers=${JSON.stringify({
        'www-authenticate': response.headers['www-authenticate'] ?? null,
        'content-type': response.headers['content-type'] ?? null,
      })}`))
    })
  })
}

let client
try {
  client = await openClient(endpoint, true)
} catch (firstError) {
  const firstMessage = firstError instanceof Error ? firstError.message : String(firstError)
  if (!/status=401\b/.test(firstMessage)) throw firstError
  const fallback = authenticatedEndpoint(endpoint)
  console.log('Ogmios header authentication returned 401; retrying the configured Demeter authenticated endpoint form')
  client = await openClient(fallback, false)
}
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
  client.close()
}
