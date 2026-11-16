import assert from 'node:assert/strict'
import test from 'node:test'

import {
  C1_COMPONENT_IDS,
  observeC1ComponentsAtAcquiredPoint,
  validateC1CandidateIdentityEnvelope,
  decodeTestnetScriptAddress,
  sha256CanonicalJson,
  validatePreprodNetworkGenesis,
} from './preprod-c1-acquired-point-observer.mjs'

const commit = 'a'.repeat(40)
const point = { slot: 123456, id: 'b'.repeat(64) }

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const BECH32_GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]

function polymod(values) {
  let checksum = 1
  for (const value of values) {
    const top = checksum >>> 25
    checksum = ((checksum & 0x1ffffff) << 5) ^ value
    for (let i = 0; i < BECH32_GENERATORS.length; i += 1) {
      if (((top >>> i) & 1) !== 0) checksum ^= BECH32_GENERATORS[i]
    }
  }
  return checksum >>> 0
}

function hrpExpand(hrp) {
  return [
    ...Array.from(hrp, character => character.charCodeAt(0) >>> 5),
    0,
    ...Array.from(hrp, character => character.charCodeAt(0) & 31),
  ]
}

function convertBits(data, from, to) {
  let accumulator = 0
  let bits = 0
  const result = []
  const maxValue = (1 << to) - 1
  const maxAccumulator = (1 << (from + to - 1)) - 1
  for (const value of data) {
    accumulator = ((accumulator << from) | value) & maxAccumulator
    bits += from
    while (bits >= to) {
      bits -= to
      result.push((accumulator >>> bits) & maxValue)
    }
  }
  if (bits > 0) result.push((accumulator << (to - bits)) & maxValue)
  return result
}

function enterpriseScriptAddress(paymentCredentialHash, networkId = 0, addressType = 7, hrp = 'addr_test') {
  const payload = Buffer.concat([
    Buffer.from([(addressType << 4) | networkId]),
    Buffer.from(paymentCredentialHash, 'hex'),
  ])
  const data = convertBits([...payload], 8, 5)
  const values = [...hrpExpand(hrp), ...data, 0, 0, 0, 0, 0, 0]
  const checksum = (polymod(values) ^ 1) >>> 0
  const checksumWords = []
  for (let i = 0; i < 6; i += 1) checksumWords.push((checksum >>> (5 * (5 - i))) & 31)
  return hrp + '1' + [...data, ...checksumWords].map(value => BECH32_CHARSET[value]).join('')
}

function fixture() {
  return {
    schema: 'IMMORTAL-PREPROD-DEPLOYMENT-IDENTITY-v0.1',
    network: 'cardano-preprod',
    deploymentId: 'deployment-generation-fixture-01',
    source: { commit },
    components: C1_COMPONENT_IDS.map((componentId, index) => ({
      componentId,
      deploymentId: 'deployment-generation-fixture-01',
      sourceCommit: commit,
      address: enterpriseScriptAddress(String(index + 1).repeat(56)),
      paymentCredentialKind: 'script',
      paymentCredentialHash: String(index + 1).repeat(56),
      derivedScriptHash: String(index + 1).repeat(56),
      scriptArtifactDigest: String(index + 1).repeat(64),
      parameterDigest: String(index + 1).repeat(64),
      deploymentTxOutRef: String(index + 1).repeat(64) + '#0',
      ...( ['b1Pool', 'v3Carrier', 'b2Control'].includes(componentId)
        ? { singleton: { policyId: String(index + 1).repeat(56), tokenNameHex: '01' } }
        : {}),
    })),
  }
}

function session() {
  const calls = []
  return {
    calls,
    isAcquired: true,
    isReleased: false,
    point,
    async query(method, params) {
      calls.push({ method, params })
      if (method === 'queryNetwork/genesisConfiguration') {
        return { era: 'shelley', network: 'testnet', networkMagic: 1 }
      }
      return [{ address: params.addresses[0], outputReference: { transaction: { id: 'c'.repeat(64) }, index: calls.length - 1 }, value: {} }]
    },
  }
}

test('accepts only the Shelley Preprod network magic', () => {
  assert.deepEqual(validatePreprodNetworkGenesis({
    era: 'shelley',
    network: 'testnet',
    networkMagic: 1,
  }), { era: 'shelley', network: 'testnet', networkMagic: 1 })

  assert.throws(() => validatePreprodNetworkGenesis({
    era: 'shelley',
    network: 'testnet',
    networkMagic: 2,
  }), /PREPROD_NETWORK_MAGIC_MISMATCH/)
  assert.throws(() => validatePreprodNetworkGenesis({
    era: 'shelley',
    network: 'mainnet',
    networkMagic: 764824073,
  }), /NETWORK_CONFIGURATION_MISMATCH/)
  assert.throws(() => validatePreprodNetworkGenesis({
    era: 'alonzo',
    network: 'testnet',
    networkMagic: 1,
  }), /NETWORK_CONFIGURATION_MISMATCH/)
})

test('validates exactly five component identities without granting authority', () => {
  const identity = validateC1CandidateIdentityEnvelope(fixture())
  assert.equal(identity.components.length, 5)
  assert.equal(identity.deploymentAuthorityVerified, false)
  assert.equal(identity.c1Qualified, false)
})

test('rejects a missing component', () => {
  const input = fixture()
  input.components = input.components.filter(item => item.componentId !== 'counter')
  assert.throws(() => validateC1CandidateIdentityEnvelope(input), /COMPONENT_MISSING:counter/)
})

test('rejects duplicate or whitespace-padded component addresses', () => {
  const reused = fixture()
  reused.components[1].address = reused.components[0].address
  assert.throws(() => validateC1CandidateIdentityEnvelope(reused), /ADDRESS_REUSED:b1Pool/)

  const padded = fixture()
  padded.components[0].address += ' '
  assert.throws(() => validateC1CandidateIdentityEnvelope(padded), /ADDRESS_WHITESPACE_INVALID:prizeValidator/)
})

test('rejects mixed deployment generations', () => {
  const input = fixture()
  input.components[2].deploymentId = 'another-generation'
  assert.throws(() => validateC1CandidateIdentityEnvelope(input), /GENERATION_MISMATCH:counter/)
})

test('decodes a valid Preprod enterprise script address and binds its payment credential', () => {
  const hash = 'a'.repeat(56)
  const address = enterpriseScriptAddress(hash)
  assert.deepEqual(decodeTestnetScriptAddress(address, hash), {
    addressType: 7,
    networkId: 0,
    paymentCredentialHash: hash,
  })
})

test('rejects mainnet, non-Preprod network id, key credentials and invalid checksum', () => {
  const hash = 'a'.repeat(56)
  assert.throws(() => decodeTestnetScriptAddress(enterpriseScriptAddress(hash, 1), hash), /NETWORK_ID_NOT_PREPROD/)
  assert.throws(() => decodeTestnetScriptAddress(enterpriseScriptAddress(hash, 0, 6), hash), /PAYMENT_CREDENTIAL_NOT_SCRIPT/)
  assert.throws(() => decodeTestnetScriptAddress(enterpriseScriptAddress(hash, 0, 7, 'addr'), hash), /NOT_PREPROD/)
  assert.throws(() => decodeTestnetScriptAddress(enterpriseScriptAddress(hash.slice(0, 54)), hash), /SHELLEY_PAYLOAD/)
  const validAddress = enterpriseScriptAddress(hash)
  const replacement = validAddress.endsWith('q') ? 'p' : 'q'
  const damaged = validAddress.slice(0, -1) + replacement
  assert.throws(() => decodeTestnetScriptAddress(damaged, hash), /CHECKSUM_INVALID/)
})

test('rejects an address whose payment credential differs from the declared derived hash', () => {
  const input = fixture()
  input.components[1].paymentCredentialHash = 'f'.repeat(56)
  input.components[1].derivedScriptHash = 'f'.repeat(56)
  assert.throws(() => validateC1CandidateIdentityEnvelope(input), /ADDRESS_PAYMENT_CREDENTIAL_HASH_MISMATCH/)
})

test('rejects a payment credential that differs from the independently derived script hash', () => {
  const input = fixture()
  input.components[1].derivedScriptHash = 'f'.repeat(56)
  assert.throws(() => validateC1CandidateIdentityEnvelope(input), /PAYMENT_CREDENTIAL_DERIVED_HASH_MISMATCH:b1Pool/)
})

test('requires script artifact digests and exact deployment output references', () => {
  const missingDigest = fixture()
  delete missingDigest.components[0].scriptArtifactDigest
  assert.throws(() => validateC1CandidateIdentityEnvelope(missingDigest), /SCRIPT_ARTIFACT_DIGEST_REQUIRED/)

  const malformedReference = fixture()
  malformedReference.components[0].deploymentTxOutRef = 'not-an-out-reference'
  assert.throws(() => validateC1CandidateIdentityEnvelope(malformedReference), /DEPLOYMENT_TX_OUT_REF_INVALID:prizeValidator/)
})

test('canonical JSON digest is independent of object key insertion order', () => {
  assert.equal(
    sha256CanonicalJson({ z: 3, nested: { b: true, a: 1 }, a: 'value' }),
    sha256CanonicalJson({ a: 'value', nested: { a: 1, b: true }, z: 3 }),
  )
  assert.throws(() => sha256CanonicalJson({ unsafe: Number.MAX_SAFE_INTEGER + 1 }), /CANONICAL_JSON_NUMBER_INVALID/)
})

test('rejects a PrizeValidator singleton token assumption', () => {
  const input = fixture()
  input.components[0].singleton = { policyId: 'd'.repeat(56), tokenNameHex: '01' }
  assert.throws(() => validateC1CandidateIdentityEnvelope(input), /UNEXPECTED_SINGLETON:prizeValidator/)
})

test('queries all five addresses in one acquired point and preserves raw responses', async () => {
  const ledgerSession = session()
  const result = await observeC1ComponentsAtAcquiredPoint({
    ledgerSession,
    identityEnvelope: fixture(),
  })

  assert.deepEqual(ledgerSession.calls.filter(call => call.method === 'queryLedgerState/utxo').map(call => call.params.addresses[0]),
    fixture().components.map(component => component.address))
  assert.equal(ledgerSession.calls[0].method, 'queryNetwork/genesisConfiguration')
  assert.deepEqual(ledgerSession.calls[0].params, { era: 'shelley' })
  assert.ok(ledgerSession.calls.slice(1).every(call => call.method === 'queryLedgerState/utxo'))
  assert.deepEqual(result.networkIdentity, { era: 'shelley', network: 'testnet', networkMagic: 1 })
  assert.match(result.networkGenesisQueryCanonicalJsonSha256, /^[0-9a-f]{64}$/)
  assert.match(result.networkGenesisResultCanonicalJsonSha256, /^[0-9a-f]{64}$/)
  assert.deepEqual(result.acquiredLedgerState, point)
  assert.equal(result.digestAlgorithm, 'SHA256_CANONICAL_JSON_V1')
  assert.equal(result.digestScope, 'PARSED_JSON_OBJECTS_NOT_ORIGINAL_WEBSOCKET_WIRE_BYTES')
  assert.match(result.identityEnvelopeCanonicalJsonSha256, /^[0-9a-f]{64}$/)
  assert.deepEqual(Object.keys(result.observations), C1_COMPONENT_IDS)
  for (const observation of Object.values(result.observations)) {
    assert.equal(observation.query.method, 'queryLedgerState/utxo')
    assert.match(observation.queryCanonicalJsonSha256, /^[0-9a-f]{64}$/)
    assert.match(observation.rawOgmiosUtxoResultCanonicalJsonSha256, /^[0-9a-f]{64}$/)
  }
  assert.equal(result.observations.prizeValidator.rawUtxoCount, 1)
  assert.equal(result.observations.b1Pool.cardinalityStatus, 'FAIL_SINGLETON_TOKEN_CARDINALITY_OR_QUANTITY')
  assert.equal(result.observations.counter.cardinalityStatus, 'OBSERVED_EXACTLY_ONE_UTXO')
  assert.equal(result.observations.prizeValidator.cardinality.populationClassificationStatus, 'NOT_CLASSIFIED_PRIZEDATUM_DECODER_REQUIRED')
  assert.equal(result.deploymentAuthorityVerified, false)
  assert.equal(result.cardinalityQualified, false)
  assert.equal(result.c1Qualified, false)
})

test('refuses Preview network magic before any address census', async () => {
  const ledgerSession = session()
  ledgerSession.query = async (method, params) => {
    ledgerSession.calls.push({ method, params })
    return { era: 'shelley', network: 'testnet', networkMagic: 2 }
  }
  await assert.rejects(
    observeC1ComponentsAtAcquiredPoint({ ledgerSession, identityEnvelope: fixture() }),
    /PREPROD_NETWORK_MAGIC_MISMATCH/,
  )
  assert.deepEqual(ledgerSession.calls.map(call => call.method), [
    'queryNetwork/genesisConfiguration',
  ])
})

test('refuses a released or unacquired session before querying', async () => {
  const ledgerSession = session()
  ledgerSession.isReleased = true
  await assert.rejects(
    observeC1ComponentsAtAcquiredPoint({ ledgerSession, identityEnvelope: fixture() }),
    /ACTIVE_ACQUIRED_LEDGER_SESSION/,
  )
  assert.equal(ledgerSession.calls.length, 0)
})

test('rejects non-array UTxO responses and stops the census', async () => {
  const ledgerSession = session()
  ledgerSession.query = async (method, params) => {
    ledgerSession.calls.push({ method, params })
    if (method === 'queryNetwork/genesisConfiguration') {
      return { era: 'shelley', network: 'testnet', networkMagic: 1 }
    }
    return { malformed: true }
  }
  await assert.rejects(
    observeC1ComponentsAtAcquiredPoint({ ledgerSession, identityEnvelope: fixture() }),
    /UTXO_RESPONSE_NOT_ARRAY:prizeValidator/,
  )
})
