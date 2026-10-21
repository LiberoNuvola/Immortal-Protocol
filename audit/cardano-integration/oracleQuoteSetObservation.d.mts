export type OracleQuoteObservation = {
  unit: string
  assetPolicyHex: string
  assetNameHex: string
  assetIdentityValid: boolean
  price: string
  timestampMs: string
  publisherPkh: string
  publisherMatches: boolean
  ageMs: string
  timestampNotFuture: boolean
  fresh: boolean
  positivePrice: boolean
  uniqueIdentity: boolean
  usableForIssue: boolean
  blockers: string[]
}

export type OracleDatumInspection = {
  schema: 'legacy-single-quote' | 'oracle-quote-set'
  constructorIndex: 0 | 1
  quoteCount: number
  quotes: OracleQuoteObservation[]
  duplicateAssetUnits: string[]
  adaQuoteCount: number
  adaOnlySettlementStructurallyUsable: boolean
  eligibleUnits: string[]
  blockers: string[]
  sourceTruthProven: false
  sourceQualificationStatus: 'NOT_PROVEN_BY_DATUM_ALONE'
  qualificationNote: string
}

export const ORACLE_QUOTE_MAX_AGE_MS: bigint

export function inspectOracleDatum(
  raw: unknown,
  options: {
    expectedPublisherPkh: string
    nowMs: bigint
    maxAgeMs?: bigint
  },
): OracleDatumInspection

export function decodeOracleDatumCbor(raw: string): unknown
