import { Data, type UTxO } from 'lucid-cardano'

/**
 * Resolve the one PRE-RICH Treasury address for the current deployment.
 *
 * The validator-derived address is authoritative. VITE_TREASURY_ADDRESS is
 * only an explicit deployment pin; it must never redirect a sale to another
 * address, including an address that happens to share the payment credential
 * but carries a different staking credential.
 */
export function resolveCanonicalTreasuryAddress(
  derivedAddress: string | undefined,
  configuredAddress?: string | null,
): string {
  if (typeof derivedAddress !== 'string' || derivedAddress.length === 0) {
    throw new Error('TREASURY_DERIVED_ADDRESS_MISSING')
  }

  const configured = configuredAddress?.trim() ?? ''
  if (configured.length > 0 && configured !== derivedAddress) {
    throw new Error(
      'TREASURY_IDENTITY_MISMATCH: configured Treasury address must exactly match the address derived from the current validator',
    )
  }

  return derivedAddress
}

function decodeTreasuryDatum(raw: unknown): Data {
  if (typeof raw === 'string') {
    return Data.from(raw)
  }
  if (raw === null || typeof raw !== 'object') {
    throw new Error('TREASURY_DATUM_MISSING_OR_INVALID')
  }
  return raw as Data
}

/**
 * Return the canonical Treasury datum only when the entire observed custody
 * set at the exact Treasury address is unambiguous.
 *
 * Multiple UTxOs are allowed: the Treasury is one script-controlled custody
 * boundary, not necessarily one UTxO. Every UTxO must nevertheless carry the
 * same decodable datum. This function does not infer category balances or
 * promote the legacy percentage fields into current accounting policy.
 */
export function selectCanonicalTreasuryDatum(
  utxos: readonly UTxO[],
  treasuryAddress: string,
): Data {
  if (!treasuryAddress) {
    throw new Error('TREASURY_ADDRESS_REQUIRED')
  }
  if (utxos.length === 0) {
    throw new Error('TREASURY_UTXO_SET_EMPTY: canonical Treasury datum is unavailable')
  }

  const seenRefs = new Set<string>()
  let canonicalDatum: Data | undefined
  let canonicalEncoding: string | undefined

  for (const utxo of utxos) {
    if (utxo.address !== treasuryAddress) {
      throw new Error('TREASURY_UTXO_ADDRESS_MISMATCH')
    }

    const ref = String(utxo.txHash) + '#' + String(utxo.outputIndex)
    if (seenRefs.has(ref)) {
      throw new Error('TREASURY_UTXO_REFERENCE_DUPLICATE')
    }
    seenRefs.add(ref)

    if (utxo.datum == null) {
      throw new Error('TREASURY_UTXO_DATUM_MISSING: custody set is not fully classifiable')
    }

    let datum: Data
    let encoding: string
    try {
      datum = decodeTreasuryDatum(utxo.datum)
      encoding = Data.to(datum)
    } catch {
      throw new Error('TREASURY_UTXO_DATUM_INVALID')
    }

    if (canonicalEncoding === undefined) {
      canonicalDatum = datum
      canonicalEncoding = encoding
    } else if (encoding !== canonicalEncoding) {
      throw new Error('TREASURY_DATUM_CONFLICT: Treasury UTxOs do not share one canonical datum')
    }
  }

  if (canonicalDatum === undefined) {
    throw new Error('TREASURY_DATUM_UNAVAILABLE')
  }

  return canonicalDatum
}
