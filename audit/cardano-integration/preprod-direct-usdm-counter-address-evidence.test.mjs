import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const producerUrl = new URL('./preprod-direct-usdm-bootstrap.mjs', import.meta.url)

test('direct-USDM topology persists the Counter address derived by the script loader', async () => {
  const source = await readFile(producerUrl, 'utf8')

  assert.match(
    source,
    /topology:\s*\{[\s\S]*?counterHash:\s*scripts\.counterHash,[\s\S]*?counterAddress:\s*scripts\.counterAddress,/,
    'topology must persist the Counter address returned by buildScriptsFromLucid',
  )
})

test('Counter address evidence is not silently promoted to materialization or authority', async () => {
  const source = await readFile(producerUrl, 'utf8')
  const topologyStart = source.indexOf('  topology: {')
  const topologyEnd = source.indexOf('\n  },', topologyStart)
  assert.notEqual(topologyStart, -1, 'topology block must exist')
  assert.notEqual(topologyEnd, -1, 'topology block must close')

  const topology = source.slice(topologyStart, topologyEnd)
  assert.match(topology, /counterAddress:\s*scripts\.counterAddress/)
  assert.doesNotMatch(topology, /counter(?:Utxo|OutRef|DeploymentRef|Authority)/i)
})
