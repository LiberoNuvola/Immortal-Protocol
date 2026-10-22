/**
 * Canonical Pyth Pro (formerly Lazer) Cardano Preprod deployment identity
 * for the isolated ADA/USD probe. This is not Pyth Core, not mainnet, and
 * does not authorize using ADA/USD as an USDM quote.
 *
 * Source: https://docs.pyth.network/price-feeds/pro/contract-addresses
 */
export const PYTH_PRO_PREPROD_POLICY_ID =
  'c7d51d897fdfceb7682f4a1a9ef428a027ec0582cadee158429f7e45'

export const PYTH_PRO_CONTRACT_ADDRESSES_SOURCE =
  'https://docs.pyth.network/price-feeds/pro/contract-addresses'

export function validatePythPreprodPolicyId(value: string): string {
  const normalized = value.trim().replace(/^0x/i, '').toLowerCase()
  if (!/^[0-9a-f]{56}$/.test(normalized)) {
    throw new Error('PYTH_CARDANO_POLICY_ID must be exactly 56 hexadecimal characters')
  }
  if (normalized !== PYTH_PRO_PREPROD_POLICY_ID) {
    throw new Error(
      'PYTH_CARDANO_POLICY_ID does not match the published Pyth Pro Cardano Preprod deployment; see ' +
        PYTH_PRO_CONTRACT_ADDRESSES_SOURCE,
    )
  }
  return normalized
}
