import assert from 'node:assert/strict'
import { fetchAllAddressUtxos } from './koios-address-utxos.mjs'

const address = 'addr_test1' + 'q'.repeat(50)
const row = (tx_hash, tx_index = 0) => ({ address, tx_hash, tx_index, value: '1000000', asset_list: [] })
const response = (rows, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => rows,
})

{
  const calls = []
  const pages = [
    [row('a'), row('b')],
    [row('c')],
  ]
  const result = await fetchAllAddressUtxos({
    baseUrl: 'https://preprod.koios.rest/api/v1/',
    address,
    pageSize: 2,
    fetchImpl: async (url, init) => {
      calls.push({ url: new URL(url), init })
      return response(pages[calls.length - 1])
    },
  })
  assert.equal(result.complete, true)
  assert.equal(result.pagesFetched, 2)
  assert.equal(result.rows.length, 3)
  assert.equal(calls[0].url.searchParams.get('offset'), '0')
  assert.equal(calls[0].url.searchParams.get('limit'), '2')
  assert.equal(calls[1].url.searchParams.get('offset'), '2')
  assert.equal(calls[1].url.searchParams.get('limit'), '2')
  assert.equal(calls[0].init.method, 'POST')
  assert.deepEqual(JSON.parse(calls[0].init.body), { _addresses: [address] })
}

{
  await assert.rejects(
    fetchAllAddressUtxos({
      baseUrl: 'https://preprod.koios.rest/api/v1',
      address,
      pageSize: 1,
      maxPages: 3,
      fetchImpl: async url => {
        const offset = Number(new URL(url).searchParams.get('offset'))
        return response(offset === 0 ? [row('same')] : [row('same')])
      },
    }),
    /KOIOS_ADDRESS_UTXOS_DUPLICATE_OUTREF/,
  )
}

{
  await assert.rejects(
    fetchAllAddressUtxos({
      baseUrl: 'https://preprod.koios.rest/api/v1',
      address,
      pageSize: 1,
      maxPages: 2,
      fetchImpl: async () => response([row(Math.random().toString())]),
    }),
    /KOIOS_ADDRESS_UTXOS_PAGINATION_LIMIT_REACHED/,
  )
}

{
  await assert.rejects(
    fetchAllAddressUtxos({
      baseUrl: 'https://preprod.koios.rest/api/v1',
      address,
      pageSize: 2,
      fetchImpl: async () => response([row('wrong-address').address = 'addr_test1wrong']),
    }),
    /KOIOS_ADDRESS_UTXO_ROW_INVALID|KOIOS_RETURNED_UTXO_FOR_UNEXPECTED_ADDRESS/,
  )
}

process.stdout.write('KOIOS_ADDRESS_UTXOS_PAGINATION_TESTS=PASS\n')
