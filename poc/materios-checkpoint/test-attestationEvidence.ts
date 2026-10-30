import assert from 'node:assert/strict'
import test from 'node:test'

import {
  decodeAttestationThresholdScale,
  decodeCommitteeMembersScale,
  decodeMateriosSs58AccountId,
  verifyIndexedSignerSetAgainstCommittee,
} from './src/attestationEvidence.js'

const signers = [
  '5Dd7WuLMyb71NT1Bea6oEZH8Je3MkQzamHVeU4tmQbtPWq2v',
  '5FHyiV88YBjxMjjZroQKcjW2nGyvHsGrPYmP7HhUNBxEpdZ7',
  '5FNdLcDWmnDxtsUwznPaxFr9u7nop3K2kmYmvTaZRTVQExkT',
]

const accountIds = [
  '0x44f3bafbc393f24fcfabbf57d4ca73a6a6b5df358cdaa9480a517a97f189964b',
  '0x8ed446c7114fbeb751866e6752dedf36fba9b3d2832a9fc50a005e00ed0ab124',
  '0x925fe8605fe32a53a7b391498fc1b0ab91d3af7319607bd70b850b4f5fa9d255',
]

function compactU8(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value >= 64) {
    throw new Error('fixture compact value out of range')
  }
  return (value * 4).toString(16).padStart(2, '0')
}

test('decodes and checksum-verifies Materios SS58 AccountId32 addresses', () => {
  assert.deepEqual(
    signers.map((address) => decodeMateriosSs58AccountId(address)),
    accountIds,
  )
})

test('rejects SS58 checksum mutation', () => {
  const changed = signers[0].slice(0, -1) + (signers[0].endsWith('1') ? '2' : '1')
  assert.throws(
    () => decodeMateriosSs58AccountId(changed),
    /checksum mismatch|SS58 prefix mismatch/,
  )
})

test('decodes exact BoundedBTreeSet<AccountId32> SCALE bytes', () => {
  const encoded = `0x${compactU8(accountIds.length)}${accountIds
    .map((id) => id.slice(2))
    .join('')}`
  assert.deepEqual(decodeCommitteeMembersScale(encoded), accountIds)
})

test('rejects malformed committee SCALE length and duplicate members', () => {
  assert.throws(() => decodeCommitteeMembersScale('0x0400'), /length mismatch/)
  const duplicate = `0x${compactU8(2)}${accountIds[0].slice(2)}${accountIds[0].slice(2)}`
  assert.throws(
    () => decodeCommitteeMembersScale(duplicate),
    /duplicate AccountId32/,
  )
})

test('decodes exact on-chain AttestationThreshold u32', () => {
  assert.equal(decodeAttestationThresholdScale('0x03000000'), 3)
  assert.throws(() => decodeAttestationThresholdScale('0x030000'), /must be 4 bytes/)
})

test('confirms indexer signers are committee members and meet threshold', () => {
  const result = verifyIndexedSignerSetAgainstCommittee(
    signers,
    [...accountIds, '0x' + 'aa'.repeat(32)],
    3,
  )
  assert.deepEqual(result.map((entry) => entry.accountId), accountIds)
})

test('rejects an indexer signer outside the committee', () => {
  assert.throws(
    () =>
      verifyIndexedSignerSetAgainstCommittee(
        signers,
        accountIds.slice(0, 2),
        2,
      ),
    /not in the on-chain committee snapshot/,
  )
})

test('rejects an indexer signer set below the exact on-chain threshold', () => {
  assert.throws(
    () => verifyIndexedSignerSetAgainstCommittee(signers.slice(0, 2), accountIds, 3),
    /below on-chain threshold/,
  )
})
