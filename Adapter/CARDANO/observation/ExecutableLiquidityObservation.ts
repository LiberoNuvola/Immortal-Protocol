/**
 * Cardano-side observation boundary for immediately executable liquidity.
 *
 * This is an observation/refinement witness, not an economic authority.
 * Values must come from concrete spendable UTxOs observed for the candidate
 * action. Ring-fenced, locked, duplicated or negative entries fail closed.
 */
export type ExecutableLiquidityUtxo = {
  txHash: string
  index: number
  usdmValue: bigint
  spendable: boolean
  ringFenced: boolean
}

export type ExecutableLiquidityObservation = {
  observationReference: string
  observedAt: bigint
  utxos: ExecutableLiquidityUtxo[]
  declaredUsdmLiquidity: bigint
}

export function assertExecutableLiquidityObservation(
  observation: ExecutableLiquidityObservation,
): void {
  if (!observation.observationReference.trim()) {
    throw new Error('executable liquidity observation reference is required')
  }
  if (observation.observedAt < 0n) {
    throw new Error('executable liquidity observation timestamp must be non-negative')
  }

  const seen = new Set<string>()
  let total = 0n

  for (const utxo of observation.utxos) {
    if (!/^[0-9a-fA-F]{64}$/.test(utxo.txHash)) {
      throw new Error('executable liquidity UTxO txHash must be a 32-byte hex digest')
    }
    if (!Number.isInteger(utxo.index) || utxo.index < 0) {
      throw new Error('executable liquidity UTxO index must be a non-negative integer')
    }
    if (utxo.usdmValue < 0n) {
      throw new Error('executable liquidity UTxO value must be non-negative')
    }
    if (!utxo.spendable) {
      throw new Error('non-spendable UTxO cannot back immediate executable liquidity')
    }
    if (utxo.ringFenced) {
      throw new Error('ring-fenced UTxO cannot back immediate executable liquidity')
    }

    const ref = utxo.txHash.toLowerCase() + '#' + utxo.index
    if (seen.has(ref)) {
      throw new Error('duplicate executable liquidity UTxO reference')
    }
    seen.add(ref)
    total += utxo.usdmValue
  }

  if (observation.declaredUsdmLiquidity < 0n) {
    throw new Error('declared executable liquidity must be non-negative')
  }
  if (total !== observation.declaredUsdmLiquidity) {
    throw new Error(
      'declared executable liquidity does not match observed spendable UTxOs',
    )
  }
}
