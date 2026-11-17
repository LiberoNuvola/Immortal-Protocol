import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CANDIDATE_GROUPS,
  CONTROL_GROUPS,
  TUSDM_UNIT,
  normalizeScriptInfo,
  summarizeRedeemers,
  inspectCurrentUtxo,
  observe,
} from './observe-preprod-tusdm-script-identities.mjs'

const creationTx = '11'.repeat(32)
const bytesHex = 'deadbeef'
const sampleHash = CANDIDATE_GROUPS[0].scriptHash
const response = value => new Response(JSON.stringify(value), {
  status: 200,
  headers: { 'content-type': 'application/json', date: 'Tue, 17 Nov 2026 05:20:00 GMT' },
})

test('pins five unresolved scripts separately from six known controls', () => {
  assert.equal(CANDIDATE_GROUPS.length, 5)
  assert.equal(CONTROL_GROUPS.length, 6)
  assert.ok(CANDIDATE_GROUPS.every(x => /^[0-9a-f]{56}$/.test(x.scriptHash)))
  assert.ok(!CANDIDATE_GROUPS.some(x => CONTROL_GROUPS.some(c => c.scriptHash === x.scriptHash)))
  assert.ok(CANDIDATE_GROUPS.reduce((n, x) => n + x.previousOutRefs.length, 0) > 0)
})

test('normalizes Koios script_info bytes, language, creation transaction and serialized size', () => {
  const info = normalizeScriptInfo({
    script_hash: sampleHash,
    creation_tx_hash: creationTx,
    type: 'plutusV2',
    value: null,
    bytes: bytesHex,
    size: 4,
  }, sampleHash)
  assert.equal(info.scriptHash, sampleHash)
  assert.equal(info.type, 'plutusV2')
  assert.equal(info.byteLength, 4)
  assert.equal(info.scriptBytesHex, bytesHex)
  assert.throws(() => normalizeScriptInfo({
    script_hash: 'aa'.repeat(28), creation_tx_hash: creationTx, type: 'plutusV2', bytes: bytesHex, size: 4,
  }, sampleHash), /SCRIPT_INFO_HASH_MISMATCH/)
})

test('rejects malformed script_info bytes, language and creation reference', () => {
  const base = { script_hash: sampleHash, creation_tx_hash: creationTx, type: 'plutusV2', bytes: bytesHex, size: 4 }
  assert.throws(() => normalizeScriptInfo({ ...base, bytes: 'xyz' }, sampleHash), /SCRIPT_BYTES_INVALID/)
  assert.throws(() => normalizeScriptInfo({ ...base, type: 'unknown' }, sampleHash), /SCRIPT_TYPE_UNSUPPORTED/)
  assert.throws(() => normalizeScriptInfo({ ...base, creation_tx_hash: '12' }, sampleHash), /SCRIPT_CREATION_TX_INVALID/)
})

test('summarizes redeemer purposes and execution evidence without retaining datum payloads', () => {
  const summary = summarizeRedeemers([{
    script_hash: sampleHash,
    redeemers: [
      { tx_hash: '22'.repeat(32), tx_index: 0, purpose: 'spend', datum_hash: '33'.repeat(32), unit_mem: 12, unit_steps: 34, fee: '50' },
      { tx_hash: '22'.repeat(32), tx_index: 1, purpose: 'spend', datum_hash: '44'.repeat(32), unit_mem: 13, unit_steps: 35, fee: '51' },
      { tx_hash: '55'.repeat(32), tx_index: 0, purpose: 'mint', datum_hash: null, unit_mem: 1, unit_steps: 2, fee: '3' },
    ],
  }], sampleHash)
  assert.equal(summary.redeemerCount, 3)
  assert.equal(summary.distinctTransactions, 2)
  assert.deepEqual(summary.purposeCounts, { spend: 2, mint: 1 })
  assert.equal('datum_value' in summary.redeemers[0], false)
})

test('re-observation validates exact source reference, script credential, ADA, tUSDM and datum', () => {
  const group = CANDIDATE_GROUPS[0]
  const ref = group.previousOutRefs[0]
  const [tx_hash, index] = ref.split('#')
  const row = {
    tx_hash,
    tx_index: Number(index),
    payment_cred: group.scriptHash,
    value: '2000000',
    asset_list: [{ policy_id: TUSDM_UNIT.slice(0, 56), asset_name: TUSDM_UNIT.slice(56), quantity: '2500000' }],
    inline_datum: { bytes: bytesHex, hash: '66'.repeat(32) },
  }
  const result = inspectCurrentUtxo(row, group)
  assert.equal(result.status, 'LIVE_SOURCE_UTXO_REOBSERVED')
  assert.equal(result.approvedTusdmAtomic, '2500000')
  assert.throws(() => inspectCurrentUtxo({ ...row, payment_cred: 'aa'.repeat(28) }, group), /UTXO_PAYMENT_CREDENTIAL_MISMATCH/)
  assert.throws(() => inspectCurrentUtxo({ ...row, asset_list: [] }, group), /UTXO_NO_LONGER_HAS_ADA_AND_APPROVED_TUSDM/)
})

test('an unresolved candidate script_info result remains blocked while missing controls are optional', async () => {
  const allGroups = [...CANDIDATE_GROUPS, ...CONTROL_GROUPS]
  const info = allGroups.slice(0, CANDIDATE_GROUPS.length + 3).map(group => ({
    script_hash: group.scriptHash,
    creation_tx_hash: creationTx,
    type: 'plutusV3',
    value: null,
    bytes: bytesHex,
    size: 4,
  }))
  const utxos = []
  for (const group of CANDIDATE_GROUPS) {
    for (const ref of group.previousOutRefs) {
      const [tx_hash, index] = ref.split('#')
      utxos.push({
        tx_hash, tx_index: Number(index), payment_cred: group.scriptHash, value: '2000000',
        asset_list: [{ policy_id: TUSDM_UNIT.slice(0, 56), asset_name: TUSDM_UNIT.slice(56), quantity: '1' }],
        inline_datum: { bytes: bytesHex, hash: '66'.repeat(32) },
      })
    }
  }
  const fetchImpl = async (url, init = {}) => {
    if (url.endsWith('/tip')) return response([{ abs_slot: '100', hash: 'aa'.repeat(32), block_no: 50 }])
    if (url.endsWith('/script_info')) return response(info)
    if (url.includes('/script_redeemers?')) return response([{
      script_hash: new URL(url).searchParams.get('_script_hash'), redeemers: [],
    }])
    if (url.endsWith('/utxo_info')) return response(utxos)
    throw new Error('Unexpected request: ' + url)
  }
  const manifest = await observe({ fetchImpl })
  assert.equal(manifest.summary.candidateScriptInfoBlocked, 0)
  assert.equal(manifest.summary.controlScriptInfoMissing, CONTROL_GROUPS.length - 3)
  const candidateMissing = CANDIDATE_GROUPS[0].scriptHash
  const controlToDrop = CANDIDATE_GROUPS.length - 1
  info.splice(controlToDrop, 1)
  const blocked = await observe({ fetchImpl: async (url, init = {}) => {
    if (url.endsWith('/tip')) return response([{ abs_slot: '100', hash: 'aa'.repeat(32), block_no: 50 }])
    if (url.endsWith('/script_info')) return response(info)
    if (url.includes('/script_redeemers?')) return response([{
      script_hash: new URL(url).searchParams.get('_script_hash'), redeemers: [],
    }])
    if (url.endsWith('/utxo_info')) return response(utxos)
    throw new Error('Unexpected request: ' + url)
  }})
  assert.equal(blocked.summary.candidateScriptInfoBlocked, 1)
  assert.equal(blocked.classification.scriptIdentityResolved, false)
})

test('live probe queries script_info, each candidate redeemer history and exact source outrefs read-only', async () => {
  const calls = []
  const allGroups = [...CANDIDATE_GROUPS, ...CONTROL_GROUPS]
  const info = allGroups.map(group => ({
    script_hash: group.scriptHash,
    creation_tx_hash: creationTx,
    type: 'plutusV2',
    value: null,
    bytes: bytesHex,
    size: 4,
  }))
  const utxos = []
  for (const group of CANDIDATE_GROUPS) {
    for (const ref of group.previousOutRefs) {
      const [tx_hash, index] = ref.split('#')
      utxos.push({
        tx_hash,
        tx_index: Number(index),
        payment_cred: group.scriptHash,
        value: '2000000',
        asset_list: [{ policy_id: TUSDM_UNIT.slice(0, 56), asset_name: TUSDM_UNIT.slice(56), quantity: '1' }],
        inline_datum: { bytes: bytesHex, hash: '66'.repeat(32) },
      })
    }
  }
  const fetchImpl = async (url, init = {}) => {
    const method = init.method ?? 'GET'
    calls.push({ url, method, body: init.body ? JSON.parse(init.body) : null })
    if (url.endsWith('/tip')) return response([{ abs_slot: '100', hash: 'aa'.repeat(32), block_no: 50 }])
    if (url.endsWith('/script_info')) return response(info)
    if (url.includes('/script_redeemers?')) return response([{
      script_hash: new URL(url).searchParams.get('_script_hash'),
      redeemers: [{ tx_hash: 'bb'.repeat(32), tx_index: 0, purpose: 'spend', datum_hash: 'cc'.repeat(32), unit_mem: 1, unit_steps: 2, fee: '3' }],
    }])
    if (url.endsWith('/utxo_info')) return response(utxos)
    throw new Error('Unexpected request: ' + url)
  }
  const manifest = await observe({ fetchImpl })
  assert.equal(manifest.summary.candidateScriptInfoObserved, CANDIDATE_GROUPS.length)
  assert.equal(manifest.summary.candidateScriptInfoBlocked, 0)
  assert.equal(manifest.summary.controlScriptInfoMissing, 3)
  assert.equal(manifest.summary.scriptInfoObserved, CANDIDATE_GROUPS.length + CONTROL_GROUPS.length - 3)
  assert.equal(manifest.summary.redeemerHistoryBlocked, 0)
  assert.equal(manifest.summary.sourceOutRefsBlocked, 0)
  assert.equal(manifest.summary.sourceOutRefsLive, CANDIDATE_GROUPS.reduce((n, g) => n + g.previousOutRefs.length, 0))
  assert.equal(manifest.classification.dexPoolProven, false)
  assert.equal(manifest.classification.priceProduced, false)
  assert.equal(manifest.operation.transactionSubmitted, false)
  assert.equal(calls.some(c => /submit|tx\/submit/i.test(c.url)), false)
  assert.ok(calls.some(c => c.url.endsWith('/script_info') && c.method === 'POST'))
  assert.equal(calls.filter(c => c.url.includes('/script_redeemers?')).length, CANDIDATE_GROUPS.length)
})
