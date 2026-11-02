import { describe, expect, it } from 'vitest'
import { Constr, Data } from '@lucid-evolution/lucid'

import {
  decodePoolDatum,
  decodePrizeDatum,
  fetchAddressUtxos,
} from './preprod-protected-capital-ticket-census.mjs'

function response(rows, contentRange = null) {
  return {
    ok: true,
    status: 200,
    headers: { get: (name) => name.toLowerCase() === 'content-range' ? contentRange : null },
    text: async () => JSON.stringify(rows),
  }
}

function row(hash, index = 0) {
  return {
    tx_hash: hash.repeat(64),
    tx_index: index,
    address: 'addr_test_fixture',
    value: '1000000',
    asset_list: [],
  }
}

function prizeDatum() {
  return new Constr(0, [
    'aa'.repeat(28),
    '01',
    'bb'.repeat(32),
    100n,
    'cc'.repeat(32),
    '56',
    1n,
    0n,
    '',
    '',
    new Constr(0, []),
    '',
    0n,
    new Constr(0, [0n, 0n, '', '']),
    new Constr(1, []),
    '11'.repeat(32),
    '22'.repeat(32),
    '33'.repeat(32),
    '44'.repeat(28),
    1n,
    2n,
    0n,
    0n,
  ])
}

describe('Preprod ProtectedCapital ticket census', () => {
  it('exhausts a short final page and reports page metadata', async () => {
    const calls = []
    const fetchImpl = async (url) => {
      const offset = Number(new URL(url).searchParams.get('offset'))
      calls.push(offset)
      if (offset === 0) return response([row('a'), row('b')], '0-1/*')
      if (offset === 2) return response([row('c')], '2-2/*')
      throw new Error('unexpected offset ' + offset)
    }

    const result = await fetchAddressUtxos({
      koiosUrl: 'https://preprod.koios.rest/api/v1',
      address: 'addr_test_fixture',
      fetchImpl,
      pageSize: 2,
      maxRows: 10,
    })

    expect(calls).toEqual([0, 2])
    expect(result.rows).toHaveLength(3)
    expect(result.pageCount).toBe(2)
    expect(result.paginationComplete).toBe(true)
  })

  it('requires an empty follow-up page when the final page is exactly full', async () => {
    const calls = []
    const fetchImpl = async (url) => {
      const offset = Number(new URL(url).searchParams.get('offset'))
      calls.push(offset)
      if (offset === 0) return response([row('a'), row('b')], '0-1/*')
      if (offset === 2) return response([], '*/0')
      throw new Error('unexpected offset ' + offset)
    }

    const result = await fetchAddressUtxos({
      koiosUrl: 'https://preprod.koios.rest/api/v1',
      address: 'addr_test_fixture',
      fetchImpl,
      pageSize: 2,
      maxRows: 10,
    })

    expect(calls).toEqual([0, 2])
    expect(result.rows).toHaveLength(2)
    expect(result.pageCount).toBe(2)
    expect(result.paginationComplete).toBe(true)
  })

  it('fails closed on duplicate out-references across pages', async () => {
    const duplicate = row('a')
    const fetchImpl = async (url) => {
      const offset = Number(new URL(url).searchParams.get('offset'))
      return offset === 0 ? response([duplicate]) : response([duplicate])
    }

    await expect(fetchAddressUtxos({
      koiosUrl: 'https://preprod.koios.rest/api/v1',
      address: 'addr_test_fixture',
      fetchImpl,
      pageSize: 1,
      maxRows: 10,
    })).rejects.toThrow('KOIOS_ADDRESS_UTXOS_DUPLICATE_OUTREF')
  })

  it('fails closed when Koios returns a page range for a different offset', async () => {
    const fetchImpl = async () => response([row('a')], '5-5/*')

    await expect(fetchAddressUtxos({
      koiosUrl: 'https://preprod.koios.rest/api/v1',
      address: 'addr_test_fixture',
      fetchImpl,
      pageSize: 2,
      maxRows: 10,
    })).rejects.toThrow('KOIOS_ADDRESS_UTXOS_OFFSET_MISMATCH')
  })

  it('decodes the canonical 23-field PrizeDatum without inventing identity', () => {
    const decoded = decodePrizeDatum(Data.to(prizeDatum()))

    expect(decoded.ticketPolicyId).toBe('aa'.repeat(28))
    expect(decoded.ticketAssetNameHex).toBe('01')
    expect(decoded.priceUsdmSubunits).toBe(100n)
    expect(decoded.prizeAmountUsdmSubunits).toBe(0n)
    expect(decoded.prizeStatus).toBe('Pending')
    expect(decoded.beaconStatus).toBe('BeaconReady')
    expect(decoded.prizePoolHash).toBe('44'.repeat(28))
    expect(decoded.issuedAt).toBe(1n)
    expect(decoded.expiresAt).toBe(2n)
  })

  it('rejects a PrizeDatum with the wrong constructor field count', () => {
    expect(() => decodePrizeDatum(Data.to(new Constr(0, [1n])))).toThrow(
      'PRIZEDATUM_FIELD_COUNT_INVALID',
    )
  })

  it('decodes all eight canonical B1 PrizePool datum fields', () => {
    const datum = new Constr(0, [
      1000n, 20n, 30n, 4n, 5n, 6n, 7n, 'bb'.repeat(28),
    ])
    const decoded = decodePoolDatum(Data.to(datum))

    expect(decoded.totalLiquidityUsdmSubunits).toBe(1000n)
    expect(decoded.pendingLiabilitiesUsdmSubunits).toBe(20n)
    expect(decoded.unresolvedReserveUsdmSubunits).toBe(30n)
    expect(decoded.unresolvedTicketCount).toBe(4n)
    expect(decoded.lockedJackpotUsdmSubunits).toBe(5n)
    expect(decoded.jackpotThresholdUsdmSubunits).toBe(6n)
    expect(decoded.suspendedClasses).toBe(7n)
    expect(decoded.prizeValidatorHash).toBe('bb'.repeat(28))
  })
})
