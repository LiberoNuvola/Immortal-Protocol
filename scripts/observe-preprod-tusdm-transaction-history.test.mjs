import test from 'node:test'
import assert from 'node:assert/strict'
import { CANDIDATE_GROUPS, TUSDM_UNIT } from './observe-preprod-tusdm-script-identities.mjs'
import {
  TARGET_ORDER_SCRIPT, HIGH_ACTIVITY_SCRIPT,
  scriptHash, selectRelevantTransactions, summarizeTransaction, observe,
} from './observe-preprod-tusdm-transaction-history.mjs'

const txHash = n => n.toString(16).padStart(64, '0')
const response = value => new Response(JSON.stringify(value), {
  status: 200, headers: { 'content-type': 'application/json', date: 'Tue, 17 Nov 2026 05:35:00 GMT' },
})

test('validates Plutus script hashes as 28-byte hashes, separately from 32-byte transaction hashes', () => {
  assert.equal(scriptHash(TARGET_ORDER_SCRIPT), TARGET_ORDER_SCRIPT)
  assert.throws(() => scriptHash(txHash(1)), /SCRIPT_HASH_INVALID/)
})

test('selects all target-order spends and stratifies high-activity datum versions', () => {
  const history = [
    { scriptHash: TARGET_ORDER_SCRIPT, redeemers: Array.from({ length: 13 }, (_, i) => ({ txHash: txHash(i + 1), datumHash: 'aa'.repeat(32) })) },
    { scriptHash: HIGH_ACTIVITY_SCRIPT, redeemers: [
      { txHash: txHash(20), datumHash: '11'.repeat(32) }, { txHash: txHash(21), datumHash: '11'.repeat(32) },
      { txHash: txHash(22), datumHash: '11'.repeat(32) }, { txHash: txHash(23), datumHash: '22'.repeat(32) },
      { txHash: txHash(24), datumHash: '22'.repeat(32) }, { txHash: txHash(25), datumHash: '33'.repeat(32) },
    ] },
  ]
  const selected = selectRelevantTransactions(history, [{ scriptHash: TARGET_ORDER_SCRIPT, previousOutRefs: ['ff'.repeat(32) + '#0'] }])
  assert.equal(selected.filter(x => x.reasons.includes('HISTORICAL_SPEND:' + TARGET_ORDER_SCRIPT)).length, 13)
  assert.equal(selected.filter(x => x.reasons.includes('HISTORICAL_SPEND:' + HIGH_ACTIVITY_SCRIPT)).length, 5)
  assert.ok(selected.some(x => x.txHash === 'ff'.repeat(32) && x.reasons.includes('CURRENT_CANDIDATE_UTXO_CREATION')))
})

test('summarizes exact input/output tUSDM and candidate-script transitions', () => {
  const hash = txHash(50)
  const summary = summarizeTransaction({
    tx_hash: hash, block_hash: 'ab'.repeat(32), block_height: 99, epoch_no: 2, absolute_slot: 777,
    tx_timestamp: 1780000000, tx_size: 900, fee: '200000', valid_contract: true,
    inputs: [{
      tx_hash: txHash(49), tx_index: 0, value: '3000000',
      payment_addr: { bech32: 'addr_test1script', cred: TARGET_ORDER_SCRIPT },
      asset_list: [{ policy_id: TUSDM_UNIT.slice(0, 56), asset_name: TUSDM_UNIT.slice(56), quantity: '2000000' }],
      datum_hash: 'cc'.repeat(32), inline_datum: { value: { int: '42' } },
    }],
    outputs: [{
      tx_hash: hash, tx_index: 0, value: '2900000',
      payment_addr: { bech32: 'addr_test1script', cred: TARGET_ORDER_SCRIPT },
      asset_list: [{ policy_id: TUSDM_UNIT.slice(0, 56), asset_name: TUSDM_UNIT.slice(56), quantity: '1000000' }],
      datum_hash: 'dd'.repeat(32), inline_datum: { value: { int: '43' } },
    }, {
      tx_hash: hash, tx_index: 1, value: '2000000',
      payment_addr: { bech32: 'addr_test1wallet', cred: 'ee'.repeat(28) },
      asset_list: [{ policy_id: TUSDM_UNIT.slice(0, 56), asset_name: TUSDM_UNIT.slice(56), quantity: '1000000' }],
    }],
    reference_inputs: [], collateral_inputs: [],
    plutus_contracts: [{
      script_hash: TARGET_ORDER_SCRIPT, address: 'addr_test1script',
      spends_input: { tx_hash: txHash(49), tx_index: 0 }, valid_contract: true, size: 4262,
      input: { redeemer: { purpose: 'spend', fee: '12000', unit: { mem: '10', steps: '20' }, datum: { hash: '11'.repeat(32), value: { int: '1' } } },
        datum: { hash: 'cc'.repeat(32), value: { int: '42' } } },
    }],
    metadata: { '674': { msg: ['test fixture'] } },
  })
  assert.equal(summary.txHash, hash)
  assert.equal(summary.inputTusdmAtomic, '2000000')
  assert.equal(summary.outputTusdmAtomic, '1000000')
  assert.equal(summary.netTusdmAtomic, '-1000000')
  assert.equal(summary.candidateScriptInputs.length, 1)
  assert.equal(summary.candidateScriptOutputs.length, 1)
  assert.equal(summary.relevantInputEndpoints.length, 1)
  assert.equal(summary.relevantOutputEndpoints.length, 2)
  assert.equal(summary.relevantOutputEndpoints.find(x => !x.isCandidateScript).approvedTusdmAtomic, '1000000')
  assert.equal(summary.relevantOutputEndpoints.find(x => !x.isCandidateScript).paymentCredential, 'ee'.repeat(28))
  assert.equal(summary.plutusContracts[0].validContract, true)
  assert.equal(summary.plutusContracts[0].spentDatumHash, 'cc'.repeat(32))
  assert.equal(summary.metadataKeys[0], '674')
})

test('tx_info probe is read-only, bounded and binds responses to requested hashes', async () => {
  const history = CANDIDATE_GROUPS.map((group, i) => ({
    script_hash: group.scriptHash,
    redeemers: [{ tx_hash: txHash(100 + i), datum_hash: 'ab'.repeat(32), purpose: 'spend' },
      ...(group.scriptHash === TARGET_ORDER_SCRIPT ? [{ tx_hash: txHash(200 + i), datum_hash: 'cd'.repeat(32), purpose: 'spend' }] : [])],
  }))
  const calls = []
  const fetchImpl = async (url, init = {}) => {
    const body = init.body ? JSON.parse(init.body) : null
    calls.push({ url, method: init.method ?? 'GET', body })
    if (url.endsWith('/tip')) return response([{ abs_slot: '10', hash: 'aa'.repeat(32), block_no: 5 }])
    if (url.includes('/script_redeemers?')) {
      const hash = new URL(url).searchParams.get('_script_hash')
      return response([history.find(x => x.script_hash === hash)])
    }
    if (url.endsWith('/tx_info')) return response(body._tx_hashes.map(hash => ({
      tx_hash: hash, block_hash: 'bb'.repeat(32), block_height: 20, epoch_no: 1, absolute_slot: 30,
      tx_timestamp: 1700000000, tx_size: 500, fee: '1000', valid_contract: true,
      inputs: [], outputs: [], reference_inputs: [], collateral_inputs: [], plutus_contracts: [],
    })))
    throw new Error('Unexpected request: ' + url)
  }
  const manifest = await observe({ fetchImpl })
  assert.equal(manifest.txInfo.blockedTransactions, 0)
  assert.equal(manifest.txInfo.returnedTransactions, manifest.selection.requestedTransactions)
  assert.equal(manifest.mode.transactionSubmitted, false)
  assert.ok(calls.some(x => x.url.endsWith('/tx_info') && x.method === 'POST' && x.body._scripts === true))
  assert.equal(calls.some(x => x.url.includes('/submit') || x.url.includes('tx/submit')), false)
})
