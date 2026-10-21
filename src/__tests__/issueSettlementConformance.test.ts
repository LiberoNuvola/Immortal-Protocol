import { describe, expect, it } from 'vitest'

import {
  CANONICAL_ADA_MIN_UTXO_LOVELACE,
  CANONICAL_ORACLE_PRECISION,
  assertCompletedTreasuryAdaSettlement,
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

  it('rejects a quote for a non-ADA asset until multi-asset Oracle coverage is implemented', () => {
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
