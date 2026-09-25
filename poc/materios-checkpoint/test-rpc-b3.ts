import { strict as assert } from 'node:assert'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { test } from 'node:test'
import { MateriosRpc } from './src/rpc.ts'

async function withServer(
  handler: (req: IncomingMessage, res: ServerResponse) => void,
): Promise<{ endpoint: string; close: () => Promise<void> }> {
  const server = createServer(handler)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('server address unavailable')
  return {
    endpoint: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      ),
  }
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString('utf8')
}

test('getRuntimeCode requests state_getCode at the exact block', async () => {
  const target = '11'.repeat(32)
  let seenMethod = ''
  let seenParams: unknown[] = []

  const server = await withServer(async (req, res) => {
    const body = JSON.parse(await readBody(req))
    seenMethod = body.method
    seenParams = body.params
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: '0x6000' }))
  })

  try {
    const rpc = new MateriosRpc(server.endpoint)
    const code = await rpc.getRuntimeCode(target)
    assert.equal(code, '0x6000')
    assert.equal(seenMethod, 'state_getCode')
    assert.deepEqual(seenParams, [`0x${target}`])
  } finally {
    await server.close()
  }
})

test('getCommitteeExecutionProof preserves exact transport fields', async () => {
  const target = '22'.repeat(32)

  const server = await withServer(async (req, res) => {
    const body = JSON.parse(await readBody(req))
    res.setHeader('content-type', 'application/json')
    res.end(
      JSON.stringify({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          blockHash: `0x${target}`,
          runtimeApiMethod: 'SessionValidatorManagementApi_calculate_committee',
          callDataHex: '0xaabb',
          resultHex: '0xccdd',
          proofScaleHex: '0x040801020304',
          runtime: {
            specName: 'materios',
            implName: 'materios',
            authoringVersion: 1,
            specVersion: 238,
            implVersion: 1,
            apis: [['0x1234', 1]],
          },
        },
      }),
    )
  })

  try {
    const rpc = new MateriosRpc(server.endpoint)
    const packet = await rpc.getCommitteeExecutionProof('0xaabb', target)
    assert.equal(packet.blockHash, target)
    assert.equal(packet.runtimeApiMethod, 'SessionValidatorManagementApi_calculate_committee')
    assert.equal(packet.callDataHex, '0xaabb')
    assert.equal(packet.resultHex, '0xccdd')
    assert.equal(packet.proofScaleHex, '0x040801020304')
    assert.equal(packet.runtime.specVersion, 238)
  } finally {
    await server.close()
  }
})

test('getCommitteeExecutionProof fails closed on malformed proof bytes', async () => {
  const target = '33'.repeat(32)

  const server = await withServer(async (req, res) => {
    const body = JSON.parse(await readBody(req))
    res.setHeader('content-type', 'application/json')
    res.end(
      JSON.stringify({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          blockHash: `0x${target}`,
          runtimeApiMethod: 'SessionValidatorManagementApi_calculate_committee',
          callDataHex: '0xaabb',
          resultHex: '0xccdd',
          proofScaleHex: 'not-hex',
          runtime: {
            specName: 'materios',
            implName: 'materios',
            authoringVersion: 1,
            specVersion: 238,
            implVersion: 1,
            apis: [],
          },
        },
      }),
    )
  })

  try {
    const rpc = new MateriosRpc(server.endpoint)
    await assert.rejects(
      () => rpc.getCommitteeExecutionProof('0xaabb', target),
      /B3 proof proofScaleHex must be 0x-prefixed hex/,
    )
  } finally {
    await server.close()
  }
})


test('collectCommitteeExecutionEvidence rejects runtime identity drift', async () => {
  const target = '44'.repeat(32)
  const runtime = {
    specName: 'materios',
    implName: 'materios',
    authoringVersion: 1,
    specVersion: 239,
    implVersion: 1,
    apis: [],
  }

  const server = await withServer(async (req, res) => {
    const body = JSON.parse(await readBody(req))
    res.setHeader('content-type', 'application/json')

    if (body.method === 'chain_getHeader') {
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          parentHash: `0x${'55'.repeat(32)}`,
          number: '0x10',
          stateRoot: `0x${'66'.repeat(32)}`,
          extrinsicsRoot: `0x${'77'.repeat(32)}`,
          digest: { logs: [] },
        },
      }))
      return
    }

    if (body.method === 'state_getCode') {
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        id: body.id,
        result: '0x6000',
      }))
      return
    }

    if (body.method === 'state_getRuntimeVersion') {
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          specName: 'materios',
          implName: 'materios',
          authoringVersion: 1,
          specVersion: 238,
          implVersion: 1,
          apis: [],
        },
      }))
      return
    }

    if (body.method === 'materios_b3_calculateCommitteeProof') {
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          blockHash: `0x${target}`,
          runtimeApiMethod: 'SessionValidatorManagementApi_calculate_committee',
          callDataHex: '0xaabb',
          resultHex: '0xccdd',
          proofScaleHex: '0x040801020304',
          runtime,
        },
      }))
      return
    }

    res.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, error: { code: -32601, message: 'method not mocked' } }))
  })

  try {
    const { collectCommitteeExecutionEvidence, MateriosRpc } = await import('./src/rpc.ts')
    const rpc = new MateriosRpc(server.endpoint)
    await assert.rejects(
      () => collectCommitteeExecutionEvidence(rpc, {
        finalizedBlockHash: target,
        callDataHex: '0xaabb',
      }),
      /B3 execution-proof runtime identity does not match block runtime/,
    )
  } finally {
    await server.close()
  }
})
