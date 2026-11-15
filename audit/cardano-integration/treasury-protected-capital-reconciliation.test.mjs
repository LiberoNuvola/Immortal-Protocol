import test from 'node:test'
import assert from 'node:assert/strict'
import { reconcileTicketSalesToProtectedCapital } from './treasury-protected-capital-reconciliation.mjs'

const POLICY = '33'.repeat(28)
const NAME = '505245524943480001'
const UNIT = POLICY + NAME
const TX = 'a1'.repeat(32)
const RECEIPT = TX + '#1'

function fixture() {
  return {
    journal: {
      schema: 'PRE-RICH-TREASURY-TICKET-SALE-RECEIPT-JOURNAL-v1',
      network: 'cardano-preprod',
      receiptEvents: [{
        receiptRef: RECEIPT,
        transactionHash: TX,
        network: 'cardano-preprod',
        ticket: { unit: UNIT, policyId: POLICY, assetNameHex: NAME, quantity: '1' },
      }],
      observation: {
        snapshotTip: { absoluteSlot: 900 },
        derivedTopology: { ticketPolicyId: POLICY },
      },
    },
    ledger: {
      schemaVersion: 'PRE-RICH-TICKET-ITEM-LEDGER-V1',
      source: { network: 'Preprod', observedSlot: 900, ticketPolicyId: POLICY },
      items: [{
        itemId: 'cardano-ticket:' + POLICY + '.' + NAME,
        utxoReference: TX + '#0',
        datumDigest: 'ab'.repeat(32),
        r7Cell: 'L3',
        pcComponent: 'worstCaseExposure',
        classificationReason: 'Live unresolved ticket',
      }],
    },
  }
}

test('matches one receipt to one current PrizeDatum by immutable ticket identity', () => {
  const { journal, ledger } = fixture()
  const result = reconcileTicketSalesToProtectedCapital({ journal, ledger })
  assert.equal(result.qualification.populationDisposition, 'NONEMPTY_ONE_TO_ONE_MATCH')
  assert.equal(result.qualification.identityCrosswalkComplete, true)
  assert.equal(result.qualification.economicPostingQualified, false)
  assert.equal(result.qualification.treasuryJournalHistoryCompletenessVerified, false)
  assert.equal(result.qualification.protectedCapitalSourceCompletenessAuthorityVerified, false)
  assert.equal(result.counts.matchedCount, 1)
  assert.equal(result.matched[0].ticketUnit, UNIT)
  assert.equal(result.matched[0].issueTransactionHash, TX)
  assert.equal(result.matched[0].currentPrizeDatumUtxoTransactionHash, TX)
  assert.equal(result.matched[0].r7Cell, 'L3')
})

test('reports two empty input populations without vacuously qualifying the identity crosswalk', () => {
  const { journal, ledger } = fixture()
  journal.receiptEvents = []
  ledger.items = []

  const result = reconcileTicketSalesToProtectedCapital({ journal, ledger })

  assert.equal(result.qualification.populationDisposition, 'EMPTY_INPUT_POPULATIONS')
  assert.equal(result.qualification.identityCrosswalkComplete, false)
  assert.equal(result.qualification.providedSetIdentityCrosswalkComplete, false)
  assert.deepEqual(result.qualification.blockers, [])
  assert.equal(result.counts.receiptCount, 0)
  assert.equal(result.counts.protectedCapitalItemCount, 0)
  assert.equal(result.counts.matchedCount, 0)
  assert.equal(result.qualification.treasuryJournalHistoryCompletenessVerified, false)
  assert.equal(result.qualification.protectedCapitalSourceCompletenessAuthorityVerified, false)
  assert.equal(result.qualification.economicPostingQualified, false)
  assert.equal(result.qualification.fullProtectedCapitalQualified, false)
  assert.equal(result.qualification.spendAuthorizationGranted, false)
})

test('does not qualify snapshots observed at different slots', () => {
  const { journal, ledger } = fixture()
  ledger.source.observedSlot = 901
  const result = reconcileTicketSalesToProtectedCapital({ journal, ledger })
  assert.equal(result.qualification.populationDisposition, 'NONEMPTY_UNRECONCILED')
  assert.equal(result.qualification.identityCrosswalkComplete, false)
  assert.deepEqual(result.qualification.blockers, ['SNAPSHOT_SLOT_MISMATCH'])
})

test('keeps a receipt without a current datum unresolved rather than treating it as no obligation', () => {
  const { journal, ledger } = fixture()
  ledger.items = []
  const result = reconcileTicketSalesToProtectedCapital({ journal, ledger })
  assert.equal(result.qualification.populationDisposition, 'NONEMPTY_UNRECONCILED')
  assert.equal(result.qualification.identityCrosswalkComplete, false)
  assert.equal(result.receiptWithoutCurrentDatum[0].status, 'RECEIPT_WITHOUT_CURRENT_LIVE_PRIZEDATUM')
})

test('reports a current datum without a matching receipt without inferring it was never sold', () => {
  const { journal, ledger } = fixture()
  journal.receiptEvents = []
  const result = reconcileTicketSalesToProtectedCapital({ journal, ledger })
  assert.equal(result.qualification.populationDisposition, 'NONEMPTY_UNRECONCILED')
  assert.equal(result.qualification.identityCrosswalkComplete, false)
  assert.equal(result.ledgerWithoutReceipt[0].status, 'CURRENT_PRIZEDATUM_WITHOUT_MATCHING_OBSERVED_RECEIPT')
})

test('accepts a current PrizeDatum recreated by a later lifecycle transaction while retaining Issue provenance', () => {
  const { journal, ledger } = fixture()
  const currentUtxoTx = 'b2'.repeat(32)
  ledger.items[0].utxoReference = currentUtxoTx + '#0'
  const result = reconcileTicketSalesToProtectedCapital({ journal, ledger })
  assert.equal(result.qualification.identityCrosswalkComplete, true)
  assert.equal(result.matched[0].issueTransactionHash, TX)
  assert.equal(result.matched[0].currentPrizeDatumUtxoTransactionHash, currentUtxoTx)
})

test('rejects duplicate ticket identities in the receipt source', () => {
  const { journal, ledger } = fixture()
  journal.receiptEvents.push({ ...journal.receiptEvents[0], receiptRef: 'c3'.repeat(32) + '#1' })
  assert.throws(() => reconcileTicketSalesToProtectedCapital({ journal, ledger }), /DUPLICATE_RECEIPT_TICKET_IDENTITY/)
})
