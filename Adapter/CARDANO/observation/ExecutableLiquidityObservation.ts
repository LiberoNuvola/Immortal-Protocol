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
  /** Exact candidate-transaction inputs that are the liquidity source. */
  sourceInputReferences: string[]
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
  const declaredSourceRefs = new Set(
    observation.sourceInputReferences.map((ref) => ref.toLowerCase()),
  )
  if (declaredSourceRefs.size === 0) {
    throw new Error('at least one executable liquidity source input is required')
  }
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
    if (!declaredSourceRefs.has(ref)) {
      throw new Error(
        'observed executable liquidity UTxO ' + ref + ' is not declared as a source input',
      )
    }
    total += utxo.usdmValue
  }

  if (observation.declaredUsdmLiquidity < 0n) {
    throw new Error('declared executable liquidity must be non-negative')
  }
  if (seen.size !== declaredSourceRefs.size) {
    throw new Error(
      'declared executable liquidity source inputs do not exactly match observed UTxOs',
    )
  }
  if (total !== observation.declaredUsdmLiquidity) {
    throw new Error(
      'declared executable liquidity does not match observed spendable UTxOs',
    )
  }
}

/**
 * Binds the observation to the concrete inputs of the candidate transaction.
 *
 * This is evidence binding, not a new economic rule: an observation cannot
 * claim immediate liquidity from a UTxO that the candidate transaction does
 * not actually consume for the action under evaluation.
 */
export function assertExecutableLiquidityBoundToInputs(
  observation: ExecutableLiquidityObservation,
  inputReferences: readonly string[],
): void {
  assertExecutableLiquidityObservation(observation)

  const inputs = new Set(
    inputReferences.map((ref) => ref.toLowerCase()),
  )

  for (const sourceRef of observation.sourceInputReferences) {
    if (!inputs.has(sourceRef.toLowerCase())) {
      throw new Error(
        'executable liquidity source input ' + sourceRef + ' is not a consumed candidate input',
      )
    }
  }

  for (const utxo of observation.utxos) {
    const ref = utxo.txHash.toLowerCase() + '#' + utxo.index
    if (!inputs.has(ref)) {
      throw new Error(
        `executable liquidity UTxO ${ref} is not a consumed candidate input`,
      )
    }
  }
}


/**
 * Correlates the observation with the authenticated B1 PrizePool state UTxO.
 *
 * The caller supplies the Pool UTxO reference and the USDM valuation already
 * authenticated by the Cardano/B1PrizePool observation path
 * (Economic.poolUsdmValue). This helper does not perform valuation itself and
 * therefore cannot introduce a second price source or haircut.
 */
export function assertExecutableLiquidityMatchesAuthenticatedPool(
  observation: ExecutableLiquidityObservation,
  authenticatedPoolInputReference: string,
  authenticatedPoolUsdmValue: bigint,
): void {
  assertExecutableLiquidityObservation(observation)

  const poolRef = authenticatedPoolInputReference.toLowerCase()
  const sources = observation.sourceInputReferences.map((ref) => ref.toLowerCase())

  if (sources.length !== 1 || sources[0] !== poolRef) {
    throw new Error(
      'executable liquidity observation must be backed by exactly the authenticated B1 PrizePool input',
    )
  }

  if (observation.utxos.length !== 1) {
    throw new Error(
      'authenticated B1 PrizePool liquidity correlation requires exactly one Pool UTxO',
    )
  }

  const observedRef =
    observation.utxos[0].txHash.toLowerCase() + '#' + observation.utxos[0].index

  if (observedRef !== poolRef) {
    throw new Error(
      'observed executable liquidity UTxO does not match the authenticated B1 PrizePool input',
    )
  }

  if (authenticatedPoolUsdmValue < 0n) {
    throw new Error('authenticated B1 PrizePool USDM valuation must be non-negative')
  }

  if (observation.declaredUsdmLiquidity !== authenticatedPoolUsdmValue) {
    throw new Error(
      'observed executable liquidity does not match authenticated B1 PrizePool USDM valuation',
    )
  }
}


/**
 * Validates observation freshness using caller-supplied authoritative time
 * and freshness horizon. No protocol-wide age constant is introduced here.
 */
export function assertExecutableLiquidityObservationFresh(
  observation: ExecutableLiquidityObservation,
  currentObservedAt: bigint,
  maxAge: bigint,
): void {
  assertExecutableLiquidityObservation(observation)

  if (currentObservedAt < 0n) {
    throw new Error('current observation timestamp must be non-negative')
  }
  if (maxAge < 0n) {
    throw new Error('observation freshness horizon must be non-negative')
  }
  if (observation.observedAt > currentObservedAt) {
    throw new Error('executable liquidity observation is from the future')
  }
  if (currentObservedAt - observation.observedAt > maxAge) {
    throw new Error('executable liquidity observation is stale')
  }
}
