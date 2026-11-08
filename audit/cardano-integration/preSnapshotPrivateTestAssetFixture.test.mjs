import test from 'node:test'
import assert from 'node:assert/strict'
import { join, resolve } from 'node:path'

import {
  selectLargestFundedUtxo,
  serializeFixtureSubmissionMarker,
  sumFixtureAssetQuantity,
  validatePrivateTestFixtureConfig
} from './preSnapshotPrivateTestAssetFixture.mjs'

const config = () => ({
  networkMagic: 4242,
  testnetRoot: '/home/test/immortal-m1/state/cardano-testnet',
  nodeSocketPath: '/home/test/immortal-m1/state/cardano-testnet/socket/node1/sock',
  nodeConfigPath: '/home/test/immortal-m1/state/cardano-testnet/configuration.yaml',
  walletIndex: 1,
  workDirectory: '/home/test/immortal-m1/state/cardano-testnet/m1-fixtures/pre-token'
})

test('keeps every private fixture submission marker parseable at recovery boundaries', () => {
  const txId = 'ab'.repeat(32)
  const assetUnit = 'cd'.repeat(28) + '.4d3154455354'
  const policyId = 'cd'.repeat(28)
  const markers = [
    {
      status: 'SUBMISSION_ATTEMPT_STARTED',
      networkMagic: 4242,
      assetUnit,
      tokenAmount: '100',
      startedAt: '2026-11-08T12:00:00.000Z'
    },
    {
      status: 'SIGNED_READY_TO_SUBMIT',
      networkMagic: 4242,
      assetUnit,
      tokenAmount: '100',
      startedAt: '2026-11-08T12:00:00.000Z',
      txId
    },
    {
      status: 'SUBMITTED_PRIVATE_TESTNET',
      networkMagic: 4242,
      txId,
      policyId,
      assetUnit,
      tokenAmount: '100',
      submittedAt: '2026-11-08T12:01:00.000Z'
    }
  ]

  for (const marker of markers) {
    const serialized = serializeFixtureSubmissionMarker(marker)
    assert.equal(serialized.charCodeAt(serialized.length - 1), 10)
    assert.deepEqual(JSON.parse(serialized), marker)
  }
})

test('accepts only the documented private magic, node1 socket and testnet-local workdir', () => {
  const value = validatePrivateTestFixtureConfig(config())
  assert.equal(value.networkMagic, 4242)
  assert.equal(value.walletDirectory, '/home/test/immortal-m1/state/cardano-testnet/utxo-keys/utxo1')
  assert.equal(value.tokenNameAscii, 'M1TEST')
  assert.equal(value.tokenNameHex, '4d3154455354')
})

test('refuses Preprod/Mainnet magic before any CLI can be called', () => {
  for (const networkMagic of [1, 2, 764824073, 42]) {
    assert.throws(
      () => validatePrivateTestFixtureConfig({ ...config(), networkMagic }),
      /M1_FIXTURE_PRIVATE_TESTNET_MAGIC_REQUIRED/
    )
  }
})

test('refuses a non-node1 socket or node configuration outside the generated testnet root', () => {
  assert.throws(
    () => validatePrivateTestFixtureConfig({
      ...config(),
      nodeSocketPath: '/tmp/remote.sock'
    }),
    /M1_FIXTURE_NODE1_SOCKET_REQUIRED/
  )
  assert.throws(
    () => validatePrivateTestFixtureConfig({
      ...config(),
      nodeConfigPath: '/etc/cardano/configuration.yaml'
    }),
    /M1_FIXTURE_NODE_CONFIG_OUTSIDE_PRIVATE_TESTNET/
  )
})

test('refuses non-generated wallet numbers and workdirs outside private testnet fixture storage', () => {
  assert.throws(
    () => validatePrivateTestFixtureConfig({ ...config(), walletIndex: 2 }),
    /M1_FIXTURE_ONLY_GENERATED_UTXO_WALLET_1_SUPPORTED/
  )
  assert.throws(
    () => validatePrivateTestFixtureConfig({
      ...config(),
      workDirectory: '/mnt/c/Users/test/repo/audit'
    }),
    /M1_FIXTURE_WORKDIR_MUST_BE_PRIVATE_TESTNET_LOCAL/
  )
})


test('accepts a descendant workdir but rejects parent traversal outside testnet root', () => {
  const value = config()
  assert.equal(
    validatePrivateTestFixtureConfig(value).workDirectory,
    resolve(value.workDirectory)
  )
  assert.throws(
    () => validatePrivateTestFixtureConfig({
      ...value,
      workDirectory: join(value.testnetRoot, '..', 'repository', 'audit')
    }),
    /M1_FIXTURE_WORKDIR_MUST_BE_PRIVATE_TESTNET_LOCAL/
  )
})

test('selects the largest funded UTxO and ignores malformed or underfunded rows', () => {
  const found = selectLargestFundedUtxo({
    ['11'.repeat(32) + '#0']: { value: { lovelace: '7000000' } },
    ['22'.repeat(32) + '#1']: { value: { lovelace: '18000000' } },
    ['33'.repeat(32) + '#0']: { value: { lovelace: Number.MAX_SAFE_INTEGER + 1 } },
    bad: { value: { lovelace: '900000000' } }
  })
  assert.deepEqual(found, {
    reference: '22'.repeat(32) + '#1',
    lovelace: '18000000'
  })
})

test('fails closed when no funded test UTxO exists', () => {
  assert.throws(
    () => selectLargestFundedUtxo({
      ['11'.repeat(32) + '#0']: { value: { lovelace: '100' } }
    }),
    /M1_FIXTURE_NO_FUNDED_TEST_UTXO/
  )
})

test('sums only the exact fixture policy and asset name using BigInt', () => {
  const asset = 'ab'.repeat(28) + '.4d3154455354'
  const other = 'cd'.repeat(28) + '.4d3154455354'
  const total = sumFixtureAssetQuantity({
    a: { value: { lovelace: '3000000', [asset]: '100', [other]: '9000000000000000000' } },
    b: { value: { lovelace: '4000000', [asset]: '250' } }
  }, asset)
  assert.equal(total, '350')
})

test('rejects malformed, unsafe or negative fixture token quantities', () => {
  const asset = 'ab'.repeat(28) + '.4d3154455354'
  for (const quantity of [Number.MAX_SAFE_INTEGER + 1, -1, '01', '1.5']) {
    assert.throws(
      () => sumFixtureAssetQuantity({ a: { value: { [asset]: quantity } } }, asset),
      /M1_FIXTURE_ASSET_QUANTITY_INVALID/
    )
  }
})
