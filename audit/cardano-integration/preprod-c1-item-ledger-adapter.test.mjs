import assert from 'node:assert/strict'
import test from 'node:test'
import {
  C1_COMPONENT_IDS,
  sha256CanonicalJson,
} from './preprod-c1-acquired-point-observer.mjs'
import { decodeC1ComponentCardinality } from './preprod-c1-cardinality-decoder.mjs'
import { buildC1ProtectedCapitalItemLedger } from './preprod-c1-item-ledger-adapter.mjs'

const deploymentId = 'c1-fixture-generation-01'
const sourceCommit = 'a'.repeat(40)
const ticketPolicyId = 'f'.repeat(56)
const acquiredPoint = { slot: 139116604, id: 'b'.repeat(64) }

const charset = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const generators = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]

function polymod(values) {
  let checksum = 1
  for (const value of values) {
    const top = checksum >>> 25
    checksum = ((checksum & 0x1ffffff) << 5) ^ value
    for (let i = 0; i < generators.length; i += 1) {
      if (((top >>> i) & 1) !== 0) checksum ^= generators[i]
    }
  }
  return checksum >>> 0
}
function expandHrp(hrp) {
  return [...Array.from(hrp, c => c.charCodeAt(0) >>> 5), 0, ...Array.from(hrp, c => c.charCodeAt(0) & 31)]
}
function convertBits(data) {
  let accumulator = 0
  let bits = 0
  const result = []
  for (const value of data) {
    accumulator = ((accumulator << 8) | value) & 0xfff
    bits += 8
    while (bits >= 5) {
      bits -= 5
      result.push((accumulator >>> bits) & 31)
    }
  }
  if (bits > 0) result.push((accumulator << (5 - bits)) & 31)
  return result
}
function addressFor(hash) {
  const payload = Buffer.concat([Buffer.from([0x70]), Buffer.from(hash, 'hex')])
  const words = convertBits([...payload])
  const prefix = expandHrp('addr_test')
  const checksum = (polymod([...prefix, ...words, 0, 0, 0, 0, 0, 0]) ^ 1) >>> 0
  const check = Array.from({ length: 6 }, (_, i) => (checksum >>> (5 * (5 - i))) & 31)
  return 'addr_test1' + [...words, ...check].map(x => charset[x]).join('')
}

function cborLength(major, length) {
  if (length < 24) return Buffer.from([(major << 5) | length])
  if (length <= 0xff) return Buffer.from([(major << 5) | 24, length])
  if (length <= 0xffff) return Buffer.from([(major << 5) | 25, length >> 8, length & 0xff])
  if (length <= 0xffffffff) {
    const b = Buffer.alloc(5)
    b[0] = (major << 5) | 26
    b.writeUInt32BE(length, 1)
    return b
  }
  throw new Error('fixture CBOR length too large')
}
function encInt(value) {
  const n = BigInt(value)
  if (n < 0n || n > 0xffffffffn) throw new Error('fixture integer out of range')
  if (n < 24n) return Buffer.from([Number(n)])
  if (n <= 0xffn) return Buffer.from([0x18, Number(n)])
  if (n <= 0xffffn) {
    const b = Buffer.alloc(3); b[0] = 0x19; b.writeUInt16BE(Number(n), 1); return b
  }
  const b = Buffer.alloc(5); b[0] = 0x1a; b.writeUInt32BE(Number(n), 1); return b
}
function encBytes(hex) {
  const raw = Buffer.from(hex, 'hex')
  return Buffer.concat([cborLength(2, raw.length), raw])
}
function encArray(parts) {
  return Buffer.concat([cborLength(4, parts.length), ...parts])
}
function constr(index, parts = []) {
  return Buffer.concat([encInt(BigInt(121 + index)).subarray(0, 0), Buffer.from(index === 0 ? 'd879' : 'd87a', 'hex'), encArray(parts)])
}
function datumHashBytes(hex) {
  return Buffer.from(hex, 'hex')
}

const prizeHash = '1'.repeat(56)
const poolHash = '2'.repeat(56)
const poolPolicy = '3'.repeat(56)
const v3Policy = '4'.repeat(56)
const b2Policy = '5'.repeat(56)
const singletonName = {
  b1Pool: '504f4f4c',
  v3Carrier: '563343415252494552',
  b2Control: '4232434f4e54524f4c',
}

function identity() {
  return {
    schema: 'IMMORTAL-PREPROD-DEPLOYMENT-IDENTITY-v0.1',
    network: 'cardano-preprod',
    deploymentId,
    source: { commit: sourceCommit },
    components: C1_COMPONENT_IDS.map((componentId, index) => {
      const hash = String(index + 1).repeat(56)
      const base = {
        componentId,
        deploymentId,
        sourceCommit,
        address: addressFor(hash),
        paymentCredentialKind: 'script',
        paymentCredentialHash: hash,
        derivedScriptHash: hash,
        scriptArtifactDigest: String(index + 1).repeat(64),
        parameterDigest: String(index + 1).repeat(64),
        deploymentTxOutRef: String(index + 1).repeat(64) + '#0',
      }
      if (componentId === 'prizeValidator') base.ticketPolicyId = ticketPolicyId
      if (componentId === 'b1Pool') base.singleton = { policyId: poolPolicy, tokenNameHex: singletonName.b1Pool }
      if (componentId === 'v3Carrier') base.singleton = { policyId: v3Policy, tokenNameHex: singletonName.v3Carrier }
      if (componentId === 'b2Control') base.singleton = { policyId: b2Policy, tokenNameHex: singletonName.b2Control }
      return base
    }),
  }
}

function prizeDatum({ status = 0, beacon = 0, price = 100, payout = 0 } = {}) {
  const values = Array.from({ length: 23 }, () => encInt(0))
  values[0] = encBytes(ticketPolicyId)
  values[1] = encBytes('7469636b65742d3031')
  values[3] = encInt(price)
  values[7] = encInt(payout)
  values[10] = constr(status)
  values[14] = constr(beacon)
  values[18] = encBytes(poolHash)
  values[19] = encInt(1000)
  values[20] = encInt(2000)
  return Buffer.concat([Buffer.from('d879', 'hex'), encArray(values)]).toString('hex')
}

function poolDatum({ liquidity = 100000, pending = 0, reserve = 0, count = 0, locked = 0 } = {}) {
  const values = [
    encInt(liquidity), encInt(pending), encInt(reserve), encInt(count),
    encInt(locked), encInt(10000), encInt(0), encBytes(prizeHash),
  ]
  return Buffer.concat([Buffer.from('d879', 'hex'), encArray(values)]).toString('hex')
}

function utxo(id, component, { datum = null, datumHash = null, value = { ada: { lovelace: 2000000 } } } = {}) {
  return {
    address: component.address,
    outputReference: { transaction: { id: id.repeat(64) }, index: 0 },
    value,
    datum,
    datumHash,
  }
}

function makeObservation({ prizeRows = [], pool = {} } = {}) {
  const env = identity()
  const observations = {}
  for (const component of env.components) {
    let raw = []
    if (component.componentId === 'prizeValidator') raw = prizeRows.map((row, i) => utxo(String(i + 6), component, row))
    if (component.componentId === 'b1Pool') {
      raw = [utxo('a', component, {
        datum: poolDatum(pool),
        value: {
          [poolPolicy]: { [singletonName.b1Pool]: 1 },
          ada: { lovelace: 5000000 },
        },
      })]
    }
    if (component.componentId === 'counter') raw = [utxo('b', component)]
    if (component.componentId === 'v3Carrier') {
      raw = [utxo('c', component, { value: { [v3Policy]: { [singletonName.v3Carrier]: 1 } } })]
    }
    if (component.componentId === 'b2Control') {
      raw = [utxo('d', component, { value: { [b2Policy]: { [singletonName.b2Control]: 1 } } })]
    }
    const query = { method: 'queryLedgerState/utxo', params: { addresses: [component.address] } }
    observations[component.componentId] = {
      address: component.address,
      query,
      queryCanonicalJsonSha256: sha256CanonicalJson(query),
      rawUtxoCount: raw.length,
      rawOgmiosUtxoResult: raw,
      rawOgmiosUtxoResultCanonicalJsonSha256: sha256CanonicalJson(raw),
      cardinality: decodeC1ComponentCardinality({ component, rawUtxos: raw }),
    }
  }
  const genesisQuery = { method: 'queryNetwork/genesisConfiguration', params: { era: 'shelley' } }
  const genesisResult = { era: 'shelley', network: 'testnet', networkMagic: 1 }
  return {
    schema: 'IMMORTAL-PREPROD-C1-ACQUIRED-POINT-RAW-OBSERVATION-v0.1',
    network: 'cardano-preprod',
    deploymentId,
    sourceCommit,
    acquiredLedgerState: acquiredPoint,
    queryConsistency: 'ONE_ACQUIRED_OGMIOS_LEDGER_STATE',
    networkIdentity: { era: 'shelley', network: 'testnet', networkMagic: 1 },
    networkGenesisQuery: genesisQuery,
    networkGenesisQueryCanonicalJsonSha256: sha256CanonicalJson(genesisQuery),
    networkGenesisResult: genesisResult,
    networkGenesisResultCanonicalJsonSha256: sha256CanonicalJson(genesisResult),
    digestAlgorithm: 'SHA256_CANONICAL_JSON_V1',
    digestScope: 'PARSED_JSON_OBJECTS_NOT_ORIGINAL_WEBSOCKET_WIRE_BYTES',
    identityEnvelopeCanonicalJsonSha256: sha256CanonicalJson(env),
    componentOrder: [...C1_COMPONENT_IDS],
    observations,
  }
}

async function project(options = {}) {
  const env = identity()
  const observation = makeObservation(options)
  const result = await buildC1ProtectedCapitalItemLedger({
    observation,
    identityEnvelope: env,
    observedAtMs: 1794800000000n,
  })
  return result
}

test('projects an empty PrizeValidator population and zero B1 ticket aggregates as internal reconciliation only', async () => {
  const result = await project()
  assert.equal(result.prizeValidator.sourceUtxoCount, 0)
  assert.equal(result.itemLedger.qualification.ticketLedgerInternallyReconciled, true)
  assert.equal(result.itemLedger.totals.l1PayoutUsdmSubunits, '0')
  assert.equal(result.itemLedger.totals.l3FacePriceUsdmSubunits, '0')
  assert.equal(result.qualification.deploymentAuthorityVerified, false)
  assert.equal(result.qualification.sourceCompletenessAuthorityVerified, false)
  assert.equal(result.qualification.v3AggregateReconciliationPerformed, false)
  assert.equal(result.qualification.fullProtectedCapitalQualified, false)
  assert.equal(result.qualification.c1Qualified, false)
})

test('maps a canonical Pending ticket to L3 at the unchanged 500x exposure', async () => {
  const result = await project({
    prizeRows: [{ datum: prizeDatum({ status: 0, beacon: 0, price: 100, payout: 0 }) }],
    pool: { reserve: 100, count: 1 },
  })
  assert.equal(result.itemLedger.items[0].r7Cell, 'L3')
  assert.equal(result.itemLedger.totals.l3TicketCount, '1')
  assert.equal(result.itemLedger.totals.l3FacePriceUsdmSubunits, '100')
  assert.equal(result.itemLedger.totals.l3WorstCaseExposureReferenceUnits, '500')
  assert.equal(result.qualification.l1L3ReconciledToB1Aggregates, true)
  assert.equal(result.qualification.fullProtectedCapitalQualified, false)
})

test('maps a Revealed winning ticket to L1 and reconciles its unpaid payout to B1', async () => {
  const result = await project({
    prizeRows: [{ datum: prizeDatum({ status: 1, beacon: 1, price: 100, payout: 50000 }) }],
    pool: { pending: 50000 },
  })
  assert.equal(result.itemLedger.items[0].r7Cell, 'L1')
  assert.equal(result.itemLedger.totals.l1PayoutUsdmSubunits, '50000')
  assert.equal(result.itemLedger.totals.l1PayoutReferenceUnits, '500')
  assert.equal(result.itemLedger.reconciliation.l1MatchesB1PendingLiabilities, true)
  assert.equal(result.qualification.c1Qualified, false)
})

test('retains a missing PrizeDatum as unclassified and blocks the ticket ledger', async () => {
  const result = await project({
    prizeRows: [{ datum: null, datumHash: null }],
  })
  assert.equal(result.prizeValidator.sourceUtxoCount, 1)
  assert.equal(result.prizeValidator.decodedPrizeDatumCount, 0)
  assert.equal(result.prizeValidator.unclassifiedUtxoCount, 1)
  assert.equal(result.itemLedger.qualification.ticketLedgerInternallyReconciled, false)
  assert.equal(result.itemLedger.qualification.blockers.includes('UNCLASSIFIED_PRIZE_ADDRESS_UTXOS_PRESENT'), true)
})

test('rejects a bad singleton or altered raw-result digest rather than projecting it', async () => {
  const env = identity()
  const observation = makeObservation()
  observation.observations.b1Pool.rawOgmiosUtxoResult[0].value[poolPolicy][singletonName.b1Pool] = 2
  observation.observations.b1Pool.rawOgmiosUtxoResultCanonicalJsonSha256 =
    sha256CanonicalJson(observation.observations.b1Pool.rawOgmiosUtxoResult)
  await assert.rejects(
    buildC1ProtectedCapitalItemLedger({ observation, identityEnvelope: env }),
    /SINGLETON_CARDINALITY_FAILED:b1Pool/,
  )

  const altered = makeObservation()
  altered.observations.counter.rawOgmiosUtxoResultCanonicalJsonSha256 = '0'.repeat(64)
  await assert.rejects(
    buildC1ProtectedCapitalItemLedger({ observation: altered, identityEnvelope: env }),
    /RAW_COMPONENT_OBSERVATION_INVALID:counter/,
  )
})

