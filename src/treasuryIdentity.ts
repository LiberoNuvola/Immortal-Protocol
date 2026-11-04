import type { UTxO } from 'lucid-cardano'

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

/** Stable structural representation for non-CBOR Data objects used by a provider/test. */
function stableDataShape(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'bigint') return `bigint:${value.toString()}`
  if (typeof value === 'string') return `string:${JSON.stringify(value)}`
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('TREASURY_DATUM_NUMBER_INVALID')
    return `number:${value}`
  }
  if (typeof value === 'boolean') return value ? 'boolean:true' : 'boolean:false'
  if (Array.isArray(value)) {
    return `array:[${value.map(stableDataShape).join(',')}]`
  }
  if (value instanceof Uint8Array) {
    return `bytes:${Array.from(value, byte => byte.toString(16).padStart(2, '0')).join('')}`
  }
  if (value instanceof Map) {
    const entries = [...value.entries()]
      .map(([key, item]) => [stableDataShape(key), stableDataShape(item)] as const)
      .sort(([left], [right]) => left.localeCompare(right))
    return `map:{${entries.map(([key, item]) => `${key}=>${item}`).join(',')}}`
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const keys = Object.keys(record).sort()
    return `object:{${keys.map(key => `${JSON.stringify(key)}:${stableDataShape(record[key])}`).join(',')}}`
  }
  throw new Error('TREASURY_DATUM_TYPE_INVALID')
}

function canonicalDatumEncoding(raw: unknown): string {
  if (typeof raw === 'string') {
    const normalized = raw.trim().replace(/^0x/i, '').toLowerCase()
    if (normalized.length === 0 || normalized.length % 2 !== 0 || !/^[0-9a-f]+$/.test(normalized)) {
      throw new Error('TREASURY_DATUM_CBOR_HEX_INVALID')
    }
    // A UTxO datum string is the exact provider-returned CBOR byte sequence.
    // Compare these bytes directly; do not invoke Lucid/WASM serialization.
    return `cbor:${normalized}`
  }

  if (raw === null || typeof raw !== 'object') {
    throw new Error('TREASURY_DATUM_MISSING_OR_INVALID')
  }

  return `shape:${stableDataShape(raw)}`
}

/**
 * Return the selected raw datum only when the entire observed custody set at
 * the exact Treasury address is unambiguous. The caller decodes a CBOR string
 * with Lucid Data.from; the selector itself stays pure and WASM-independent.
 *
 * Multiple UTxOs are allowed: the Treasury is one script-controlled custody
 * boundary, not necessarily one UTxO. Every UTxO must nevertheless carry the
 * same canonical datum. This function does not infer category balances or
 * promote legacy percentage fields into current accounting policy.
 */
export function selectCanonicalTreasuryDatum(
  utxos: readonly UTxO[],
  treasuryAddress: string,
): unknown {
  if (!treasuryAddress) {
    throw new Error('TREASURY_ADDRESS_REQUIRED')
  }
  if (utxos.length === 0) {
    throw new Error('TREASURY_UTXO_SET_EMPTY: canonical Treasury datum is unavailable')
  }

  const seenRefs = new Set<string>()
  let canonicalDatum: unknown
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

    let encoding: string
    try {
      encoding = canonicalDatumEncoding(utxo.datum)
    } catch {
      throw new Error('TREASURY_UTXO_DATUM_INVALID')
    }

    if (canonicalEncoding === undefined) {
      canonicalDatum = utxo.datum
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
