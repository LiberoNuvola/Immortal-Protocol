
test('rejects a non-Preprod or non-HTTPS Koios endpoint', () => {
  assert.equal(
    assertPreprodKoiosEndpoint('https://preprod.koios.rest/api/v1/'),
    'https://preprod.koios.rest/api/v1',
  )
  assert.throws(
    () => assertPreprodKoiosEndpoint('https://api.koios.rest/api/v1'),
    /KOIOS_ENDPOINT_MUST_BE_HTTPS_PREPROD_API_V1/,
  )
  assert.throws(
    () => assertPreprodKoiosEndpoint('http://preprod.koios.rest/api/v1'),
    /KOIOS_ENDPOINT_MUST_BE_HTTPS_PREPROD_API_V1/,
  )
})
const test = require('node:test')
const assert = require('node:assert/strict')

const {
  createKoiosProtectedCapitalSource,
  parseContentRange,
  assertPreprodKoiosEndpoint,
} = require('./koiosProtectedCapitalSourceCensus')

const TIP = {
  hash: 'a'.repeat(64),
  abs_slot: 1000,
  block_height: 500,
}

function response(body, headers = {}, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

function makeUtxo(index, address, overrides = {}) {
  return {
    tx_hash: String(index + 1).padStart(64, '0'),
    tx_index: 0,
    address,
    value: '2000000',
    asset_list: [],
    inline_datum: { bytes: 'd87980' },
    ...overrides,
  }
}

function mockKoios({
  pagesByAddress,
  tipSequence = [TIP, TIP],
  omitContentRange = false,
  datumRows = [],
  totalOverride,
} = {}) {
  const calls = []
  let tipCalls = 0

  const fetchImpl = async (urlValue, init = {}) => {
    const url = new URL(urlValue)
    calls.push({ url: url.toString(), method: init.method ?? 'GET', body: init.body })

    if (url.pathname.endsWith('/tip')) {
      const index = Math.min(tipCalls, tipSequence.length - 1)
      tipCalls += 1
      return response([tipSequence[index]])
    }

    if (url.pathname.endsWith('/address_utxos')) {
      const body = JSON.parse(init.body)
      const address = body._addresses[0]
      const all = pagesByAddress[address] ?? []
      const limit = Number(url.searchParams.get('limit'))
      const offset = Number(url.searchParams.get('offset'))
      const rows = all.slice(offset, offset + limit)
      const total = totalOverride?.(address, offset, all.length) ?? all.length
      const range = rows.length
        ? `${offset}-${offset + rows.length - 1}/${total}`
        : `*/${total}`
      return response(rows, omitContentRange ? {} : { 'content-range': range })
    }

    if (url.pathname.endsWith('/datum_info')) {
      const body = JSON.parse(init.body)
      const rows = datumRows.filter((row) => body._datum_hashes.includes(row.datum_hash))
      return response(rows)
    }

    return response({ error: 'unexpected path ' + url.pathname }, {}, 404)
  }

  return { fetchImpl, calls }
}

test('parseContentRange requires an exact numeric total', () => {
  assert.deepEqual(parseContentRange('0-99/257'), {
    first: 0,
    last: 99,
    total: 257,
    raw: '0-99/257',
  })
  assert.deepEqual(parseContentRange('*/0'), {
    first: null,
    last: null,
    total: 0,
    raw: '*/0',
  })
  assert.throws(() => parseContentRange('0-99/*'), /EXACT_CONTENT_RANGE_REQUIRED/)
  assert.throws(() => parseContentRange(null), /EXACT_CONTENT_RANGE_MISSING/)
})

test('enumerates every page using explicit limit/offset and exact Content-Range totals', async () => {
  const address = 'addr_test_prize'
  const rows = Array.from({ length: 5 }, (_, i) => makeUtxo(i, address))
  const mock = mockKoios({ pagesByAddress: { [address]: rows } })
  const source = createKoiosProtectedCapitalSource({
    baseUrl: 'https://preprod.koios.rest/api/v1',
    fetchImpl: mock.fetchImpl,
    pageSize: 2,
    now: () => '2026-11-02T07:00:00.000Z',
  })

  const scan = await source.scanSnapshot([{ name: 'prize', address }])

  assert.equal(scan.addressScans.prize.totalCount, 5)
  assert.equal(scan.addressScans.prize.returnedCount, 5)
  assert.equal(scan.addressScans.prize.pages.length, 3)
  assert.deepEqual(scan.addressScans.prize.pages.map((page) => page.offset), [0, 2, 4])
  assert.deepEqual(scan.addressScans.prize.pages.map((page) => page.returnedCount), [2, 2, 1])
  assert.equal(scan.manifest.paginationTotalsExactlyReconciled, true)
  assert.equal(scan.manifest.tipUnchangedAcrossScan, true)
  assert.equal(scan.manifest.providerAttestationVerified, false)
  assert.equal(scan.manifest.datumHashContentVerified, false)
  assert.equal(scan.manifest.providerSnapshotPinned, false)
  assert.equal(scan.manifest.sameBackendSnapshotVerified, false)
  assert.equal(scan.manifest.consistencyAssessment, 'TIP_STABLE_BUT_NOT_QUERY_PINNED')

  const pageCalls = mock.calls.filter((call) => call.url.includes('/address_utxos'))
  assert.deepEqual(pageCalls.map((call) => {
    const url = new URL(call.url)
    return [url.searchParams.get('limit'), url.searchParams.get('offset')]
  }), [['2', '0'], ['2', '2'], ['2', '4']])
  assert.ok(pageCalls.every((call) => call.method === 'POST'))
})

test('scans PrizeValidator and Pool addresses under one unchanged Preprod tip', async () => {
  const prize = 'addr_test_prize'
  const pool = 'addr_test_pool'
  const mock = mockKoios({
    pagesByAddress: {
      [prize]: [makeUtxo(0, prize)],
      [pool]: [makeUtxo(1, pool)],
    },
  })
  const source = createKoiosProtectedCapitalSource({
    fetchImpl: mock.fetchImpl,
    pageSize: 10,
  })

  const scan = await source.scanSnapshot([
    { name: 'prizeValidator', address: prize },
    { name: 'b1PrizePool', address: pool },
  ])

  assert.equal(scan.addressScans.prizeValidator.returnedCount, 1)
  assert.equal(scan.addressScans.b1PrizePool.returnedCount, 1)
  assert.match(scan.snapshotReference, /^koios-preprod-observation:1000:/)
})

test('fails closed when exact Content-Range is missing', async () => {
  const address = 'addr_test_prize'
  const mock = mockKoios({
    pagesByAddress: { [address]: [makeUtxo(0, address)] },
    omitContentRange: true,
  })
  const source = createKoiosProtectedCapitalSource({
    fetchImpl: mock.fetchImpl,
    pageSize: 10,
  })

  await assert.rejects(
    () => source.scanSnapshot([{ name: 'prize', address }]),
    /KOIOS_EXACT_CONTENT_RANGE_MISSING/,
  )
})

test('fails closed when the provider reports a different total on a later page', async () => {
  const address = 'addr_test_prize'
  const mock = mockKoios({
    pagesByAddress: { [address]: Array.from({ length: 3 }, (_, i) => makeUtxo(i, address)) },
    totalOverride: (_address, offset, total) => offset === 0 ? total + 1 : total,
  })
  const source = createKoiosProtectedCapitalSource({
    fetchImpl: mock.fetchImpl,
    pageSize: 2,
  })

  await assert.rejects(
    () => source.scanSnapshot([{ name: 'prize', address }]),
    /KOIOS_ADDRESS_UTXOS_TOTAL_CHANGED_DURING_PAGINATION/,
  )
})

test('fails closed when the Preprod tip changes while addresses are being scanned', async () => {
  const address = 'addr_test_prize'
  const changed = { ...TIP, hash: 'b'.repeat(64), abs_slot: 1001, block_height: 501 }
  const mock = mockKoios({
    pagesByAddress: { [address]: [makeUtxo(0, address)] },
    tipSequence: [TIP, changed],
  })
  const source = createKoiosProtectedCapitalSource({ fetchImpl: mock.fetchImpl })

  await assert.rejects(
    () => source.scanSnapshot([{ name: 'prize', address }]),
    /KOIOS_SNAPSHOT_CHANGED_DURING_CENSUS/,
  )
})

test('fails closed on duplicate UTxO references across paginated rows', async () => {
  const address = 'addr_test_prize'
  const first = makeUtxo(0, address)
  const duplicate = { ...first, value: '3000000' }
  const mock = mockKoios({
    pagesByAddress: { [address]: [first, duplicate] },
  })
  const source = createKoiosProtectedCapitalSource({
    fetchImpl: mock.fetchImpl,
    pageSize: 1,
  })

  await assert.rejects(
    () => source.scanSnapshot([{ name: 'prize', address }]),
    /KOIOS_ADDRESS_UTXOS_DUPLICATE_REFERENCE/,
  )
})

test('resolves datum-hash outputs through Koios datum_info and retains provenance', async () => {
  const address = 'addr_test_prize'
  const datumHash = 'c'.repeat(64)
  const rows = [makeUtxo(0, address, {
    inline_datum: null,
    datum_hash: datumHash,
  })]
  const mock = mockKoios({
    pagesByAddress: { [address]: rows },
    datumRows: [{ datum_hash: datumHash, bytes: 'd87980' }],
  })
  const source = createKoiosProtectedCapitalSource({ fetchImpl: mock.fetchImpl })

  const scan = await source.scanSnapshot([{ name: 'prize', address }])
  const row = scan.addressScans.prize.rows[0]

  assert.equal(row.datum_bytes, 'd87980')
  assert.equal(row.datum_source, 'DATUM_INFO')
  assert.ok(mock.calls.some((call) => call.url.includes('/datum_info')))
})

test('keeps unresolved or missing datums visible for caller-side fail-closed classification', async () => {
  const address = 'addr_test_prize'
  const rows = [
    makeUtxo(0, address, { inline_datum: null, datum_hash: 'd'.repeat(64) }),
    makeUtxo(1, address, { inline_datum: null, datum_hash: null }),
  ]
  const mock = mockKoios({
    pagesByAddress: { [address]: rows },
    datumRows: [],
  })
  const source = createKoiosProtectedCapitalSource({ fetchImpl: mock.fetchImpl })

  const scan = await source.scanSnapshot([{ name: 'prize', address }])
  assert.deepEqual(scan.addressScans.prize.rows.map((row) => row.datum_source), [
    'MISSING',
    'MISSING',
  ])
  assert.equal(scan.manifest.addresses.prize.missingDatumCount, 2)
})

test('accepts the documented Koios tip block_no field', async () => {
  const address = 'addr_test_prize'
  const koiosTip = {
    hash: 'f'.repeat(64),
    abs_slot: 2000,
    block_no: 900,
  }
  const mock = mockKoios({
    pagesByAddress: { [address]: [makeUtxo(0, address)] },
    tipSequence: [koiosTip, koiosTip],
  })
  const source = createKoiosProtectedCapitalSource({ fetchImpl: mock.fetchImpl })

  const scan = await source.scanSnapshot([{ name: 'prize', address }])
  assert.equal(scan.manifest.snapshot.blockHeight, 900)
})


test('fails closed when an address_utxos row belongs to another address', async () => {
  const address = 'addr_test_prize'
  const mock = mockKoios({
    pagesByAddress: {
      [address]: [makeUtxo(0, address, { address: 'addr_test_other' })],
    },
  })
  const source = createKoiosProtectedCapitalSource({ fetchImpl: mock.fetchImpl })

  await assert.rejects(
    () => source.scanSnapshot([{ name: 'prize', address }]),
    /KOIOS_ADDRESS_UTXOS_ADDRESS_MISMATCH/,
  )
})

test('rejects negative and duplicate asset quantities before any Pool token selection', async () => {
  const address = 'addr_test_pool'
  const negative = makeUtxo(0, address, {
    asset_list: [{ policy_id: 'a'.repeat(56), asset_name: '', quantity: '-1' }],
  })
  const mock = mockKoios({ pagesByAddress: { [address]: [negative] } })
  const source = createKoiosProtectedCapitalSource({ fetchImpl: mock.fetchImpl })

  await assert.rejects(
    () => source.scanSnapshot([{ name: 'pool', address }]),
    /KOIOS_ADDRESS_UTXO_NEGATIVE_ASSET_QUANTITY/,
  )
})

test('rejects repeated asset units in one Koios UTxO row', async () => {
  const address = 'addr_test_pool'
  const policy = 'b'.repeat(56)
  const mock = mockKoios({
    pagesByAddress: {
      [address]: [makeUtxo(0, address, {
        asset_list: [
          { policy_id: policy, asset_name: '504f4f4c', quantity: '1' },
          { policy_id: policy, asset_name: '504f4f4c', quantity: '1' },
        ],
      })],
    },
  })
  const source = createKoiosProtectedCapitalSource({ fetchImpl: mock.fetchImpl })

  await assert.rejects(
    () => source.scanSnapshot([{ name: 'pool', address }]),
    /KOIOS_ADDRESS_UTXO_DUPLICATE_ASSET_UNIT/,
  )
})
