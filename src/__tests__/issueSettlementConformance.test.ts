import { describe, expect, it } from 'vitest'
import { Constr } from 'lucid-cardano'

import {
  CANONICAL_ADA_MIN_UTXO_LOVELACE,
  CANONICAL_ORACLE_PRECISION,
  assertCompletedTreasuryAdaSettlement,
  assertCompletedTreasurySettlement,
  buildIssueSettlementAssets,
  decodeAdaOraclePriceReference,
  decodeOraclePriceReference,
  deriveAdaIssueSettlementLovelace,
  type AdaOraclePriceReference,
} from '../issueSettlement'

const publisher = 'ab'.repeat(28)
const nowMs = 10_000_000n

function adaQuote(overrides: Partial<AdaOraclePriceReference> = {}): AdaOraclePriceReference {
  return {
    assetPolicyHex: '',
    assetNameHex: '',
    price: 100n,
    timestampMs: nowMs - 1_000n,
    publisherPkh: publisher,
    ...overrides,
  }
}

function cmlCollection(items: any[]): any {
  return {
    len: () => items.length,
    get: (index: number) => items[index],
  }
}

function multiassetFor(policyHex: string, assetNameHex: string, quantity: bigint): any {
  const policy = { to_bytes: () => Uint8Array.from(policyHex.match(/../g)!.map(byte => parseInt(byte, 16))) }
  const assetName = { name: () => Uint8Array.from(assetNameHex.match(/../g)?.map(byte => parseInt(byte, 16)) ?? []) }
  const amount = { to_str: () => quantity.toString() }
  const perPolicy = {
    keys: () => cmlCollection([assetName]),
    get: (_name: any) => amount,
  }
  return {
    keys: () => cmlCollection([policy]),
    get: (_policy: any) => perPolicy,
    get_asset: (_policy: any, _name: any) => amount,
  }
}

function completedTx(outputs: any[]): any {
  return {
    txComplete: {
      body: () => ({
        outputs: () => outputs,
      }),
    },
  }
}

function treasuryOutput(lovelace: bigint, address = 'addr_test_treasury', multiasset?: any): any {
  return {
    address: () => ({ to_bech32: () => address }),
    amount: () => ({
      coin: () => ({ to_str: () => lovelace.toString() }),
      multiasset: () => multiasset,
    }),
  }
}

describe('Issue settlement conformance', () => {
  it('decodes the five-field OracleDatum without reinterpreting its asset identity', () => {
    const datum = new Constr(0, ['', '', 100n, nowMs - 1_000n, publisher] as any)
    expect(decodeAdaOraclePriceReference(datum)).toEqual(adaQuote())
  })

  it('selects ADA and PRE quotes from the additive multi-asset OracleQuoteSet constructor', () => {
    const ada = new Constr(0, ['', '', 100n, nowMs - 1_000n, publisher] as any)
    const pre = new Constr(0, ['11'.repeat(28), '5052452d52494348', 250n, nowMs - 1_000n, publisher] as any)
    const quoteSet = new Constr(1, [[ada, pre]] as any)
    expect(decodeAdaOraclePriceReference(quoteSet)).toEqual(adaQuote())
    expect(decodeOraclePriceReference(quoteSet, '11'.repeat(28), '5052452d52494348')).toEqual({
      assetPolicyHex: '11'.repeat(28),
      assetNameHex: '5052452d52494348',
      price: 250n,
      timestampMs: nowMs - 1_000n,
      publisherPkh: publisher,
    })
  })

  it('rejects a quote set with a missing or duplicated requested asset quote', () => {
    const ada = new Constr(0, ['', '', 100n, nowMs - 1_000n, publisher] as any)
    const pre1 = new Constr(0, ['11'.repeat(28), '505245', 250n, nowMs - 1_000n, publisher] as any)
    const pre2 = new Constr(0, ['11'.repeat(28), '505245', 260n, nowMs - 1_000n, publisher] as any)
    expect(() => decodeOraclePriceReference(new Constr(1, [[ada]] as any), '11'.repeat(28), '505245'))
      .toThrow(/exactly one quote/)
    expect(() => decodeOraclePriceReference(new Constr(1, [[ada, pre1, pre2]] as any), '11'.repeat(28), '505245'))
      .toThrow(/exactly one quote/)
  })

  it('rejects malformed OracleDatum structure or field types', () => {
    expect(() => decodeAdaOraclePriceReference(new Constr(1, ['', '', 100n, nowMs, publisher] as any)))
      .toThrow(/constructor/)
    expect(() => decodeAdaOraclePriceReference(new Constr(0, ['', '', 100n] as any)))
      .toThrow(/five fields/)
    expect(() => decodeAdaOraclePriceReference(new Constr(0, ['', '', 'not-an-integer', nowMs, publisher] as any)))
      .toThrow(/field types/)
  })

  it('builds a PRE-only economic basket while retaining only the ADA min-UTxO floor', () => {
    const policy = '11'.repeat(28)
    const name = '5052452d52494348'
    const oracleDatum = new Constr(1, [[
      new Constr(0, ['', '', 100n, nowMs - 1_000n, publisher] as any),
      new Constr(0, [policy, name, 100n, nowMs - 1_000n, publisher] as any),
    ]] as any)
    const assets = buildIssueSettlementAssets({
      targetUsdmSubunits: 100n,
      economicAssetQuantities: { [policy + name]: 1_000_000n },
      oracleDatum,
      expectedPublisherPkh: publisher,
      nowMs,
    })
    expect(assets).toEqual({ lovelace: CANONICAL_ADA_MIN_UTXO_LOVELACE, [policy + name]: 1_000_000n })
  })

  it('builds a mixed ADA+PRE basket only when per-asset rounded values sum to the USDM target', () => {
    const policy = '22'.repeat(28)
    const name = '4e49474854'
    const oracleDatum = new Constr(1, [[
      new Constr(0, ['', '', 100n, nowMs - 1_000n, publisher] as any),
      new Constr(0, [policy, name, 100n, nowMs - 1_000n, publisher] as any),
    ]] as any)
    const assets = buildIssueSettlementAssets({
      targetUsdmSubunits: 100n,
      economicAssetQuantities: { lovelace: 500_000n, [policy + name]: 500_000n },
      oracleDatum,
      expectedPublisherPkh: publisher,
      nowMs,
    })
    expect(assets).toEqual({ lovelace: 2_100_000n, [policy + name]: 500_000n })
  })

  it('rejects baskets missing any required quote, including ADA for min-UTxO', () => {
    const policy = '11'.repeat(28)
    const name = '505245'
    const oracleDatum = new Constr(1, [[
      new Constr(0, [policy, name, 100n, nowMs - 1_000n, publisher] as any),
    ]] as any)
    expect(() => buildIssueSettlementAssets({
      targetUsdmSubunits: 100n,
      economicAssetQuantities: { [policy + name]: 1_000_000n },
      oracleDatum,
      expectedPublisherPkh: publisher,
      nowMs,
    })).toThrow(/exactly one quote for settlement asset lovelace/)
  })

  it('rejects stale, duplicate, and non-equal multi-asset basket quotes', () => {
    const policy = '11'.repeat(28)
    const name = '505245'
    const ada = new Constr(0, ['', '', 100n, nowMs - 1_000n, publisher] as any)
    const freshPre = new Constr(0, [policy, name, 100n, nowMs - 1_000n, publisher] as any)
    const stalePre = new Constr(0, [policy, name, 100n, nowMs - 3_600_001n, publisher] as any)
    const quoteSet = (entries: any[]) => new Constr(1, [entries] as any)
    const request = (oracleDatum: any) => buildIssueSettlementAssets({
      targetUsdmSubunits: 100n,
      economicAssetQuantities: { [policy + name]: 1_000_000n },
      oracleDatum,
      expectedPublisherPkh: publisher,
      nowMs,
    })
    expect(() => request(quoteSet([ada, stalePre]))).toThrow(/stale/)
    expect(() => request(quoteSet([ada, freshPre, freshPre]))).toThrow(/exactly one quote/)
    expect(() => buildIssueSettlementAssets({
      targetUsdmSubunits: 101n,
      economicAssetQuantities: { [policy + name]: 1_000_000n },
      oracleDatum: quoteSet([ada, freshPre]),
      expectedPublisherPkh: publisher,
      nowMs,
    })).toThrow(/expected 101/)
  })

  it('derives ADA payment from the authenticated Oracle price and canonical USDM target', () => {
    const lovelace = deriveAdaIssueSettlementLovelace({
      targetUsdmSubunits: 100n,
      quote: adaQuote(),
      expectedPublisherPkh: publisher,
      nowMs,
    })

    expect(lovelace).toBe(2_600_000n)
    expect(lovelace - CANONICAL_ADA_MIN_UTXO_LOVELACE).toBe(1_000_000n)
  })

  it('uses the existing on-chain ceiling conversion at a non-exact raw boundary', () => {
    const quote = adaQuote({ price: 48n })
    const lovelace = deriveAdaIssueSettlementLovelace({
      targetUsdmSubunits: 100n,
      quote,
      expectedPublisherPkh: publisher,
      nowMs,
    })
    const economicLovelace = lovelace - CANONICAL_ADA_MIN_UTXO_LOVELACE
    const value = (economicLovelace * quote.price + CANONICAL_ORACLE_PRECISION - 1n) /
      CANONICAL_ORACLE_PRECISION
    expect(value).toBe(100n)
    expect(((economicLovelace + 1n) * quote.price + CANONICAL_ORACLE_PRECISION - 1n) /
      CANONICAL_ORACLE_PRECISION).toBeGreaterThan(100n)
  })

  it('rejects non-ADA quote in the legacy ADA-only fallback helper', () => {
    expect(() => deriveAdaIssueSettlementLovelace({
      targetUsdmSubunits: 100n,
      quote: adaQuote({ assetPolicyHex: '11'.repeat(28), assetNameHex: '505245' }),
      expectedPublisherPkh: publisher,
      nowMs,
    })).toThrow(/only an authenticated ADA OracleDatum quote/)
  })

  it('rejects a missing or mismatched publisher', () => {
    expect(() => deriveAdaIssueSettlementLovelace({
      targetUsdmSubunits: 100n,
      quote: adaQuote({ publisherPkh: 'cd'.repeat(28) }),
      expectedPublisherPkh: publisher,
      nowMs,
    })).toThrow(/publisher/)
  })

  it('rejects stale, future and zero-price oracle evidence', () => {
    for (const quote of [
      adaQuote({ timestampMs: nowMs - 3_600_001n }),
      adaQuote({ timestampMs: nowMs + 1n }),
      adaQuote({ price: 0n }),
    ]) {
      expect(() => deriveAdaIssueSettlementLovelace({
        targetUsdmSubunits: 100n,
        quote,
        expectedPublisherPkh: publisher,
        nowMs,
      })).toThrow()
    }
  })

  it('rejects integer quotes whose output would not map to the exact USDM sub-unit target', () => {
    expect(() => deriveAdaIssueSettlementLovelace({
      targetUsdmSubunits: 100n,
      quote: adaQuote({ price: 200_000_000n }),
      expectedPublisherPkh: publisher,
      nowMs,
    })).toThrow(/cannot be represented/)
  })

  it('inspects the completed Treasury output and accepts only the exact ADA target', () => {
    assertCompletedTreasuryAdaSettlement(
      completedTx([treasuryOutput(2_600_000n)]),
      'addr_test_treasury',
      2_600_000n,
    )
  })

  it('rejects completed Treasury value that differs from the derived settlement', () => {
    expect(() => assertCompletedTreasuryAdaSettlement(
      completedTx([treasuryOutput(2_600_001n)]),
      'addr_test_treasury',
      2_600_000n,
    )).toThrow(/output mismatch/)
  })

  it('rejects zero, missing, and duplicate Treasury output candidates', () => {
    expect(() => assertCompletedTreasuryAdaSettlement(
      completedTx([]),
      'addr_test_treasury',
      2_600_000n,
    )).toThrow(/exactly one Treasury output/)
    expect(() => assertCompletedTreasuryAdaSettlement(
      completedTx([treasuryOutput(2_600_000n), treasuryOutput(2_600_000n)]),
      'addr_test_treasury',
      2_600_000n,
    )).toThrow(/exactly one Treasury output/)
  })

  it('accepts the exact completed Treasury basket, including ADA floor and selected token amount', () => {
    const policy = '11'.repeat(28)
    const name = '5052452d52494348'
    assertCompletedTreasurySettlement(
      completedTx([treasuryOutput(
        1_600_000n,
        'addr_test_treasury',
        multiassetFor(policy, name, 1_000_000n),
      )]),
      'addr_test_treasury',
      { lovelace: 1_600_000n, [policy + name]: 1_000_000n },
    )
  })

  it('rejects a completed basket when a token quantity differs from the derived map', () => {
    const policy = '11'.repeat(28)
    const name = '505245'
    expect(() => assertCompletedTreasurySettlement(
      completedTx([treasuryOutput(
        1_600_000n,
        'addr_test_treasury',
        multiassetFor(policy, name, 999_999n),
      )]),
      'addr_test_treasury',
      { lovelace: 1_600_000n, [policy + name]: 1_000_000n },
    )).toThrow(/does not match/)
  })

  it('rejects a completed Treasury output containing non-ADA assets', () => {
    const multiasset = { keys: () => ({ len: () => 1 }) }
    expect(() => assertCompletedTreasuryAdaSettlement(
      completedTx([treasuryOutput(2_600_000n, 'addr_test_treasury', multiasset)]),
      'addr_test_treasury',
      2_600_000n,
    )).toThrow(/non-ADA assets/)
  })

  it('rejects a quote whose publisher configuration is empty', () => {
    expect(() => deriveAdaIssueSettlementLovelace({
      targetUsdmSubunits: 100n,
      quote: adaQuote(),
      expectedPublisherPkh: ' ',
      nowMs,
    })).toThrow(/publisher/)
  })
})
