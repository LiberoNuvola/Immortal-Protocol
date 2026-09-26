/**
 * Preprod Issue observation boundary.
 *
 * This module discovers the exact runtime UTxOs needed by Issue and delegates
 * all V3 economic-state fields to an injected authoritative state producer.
 *
 * It is deliberately not an economic oracle:
 * - it never computes EEV;
 * - it never computes ProtectedCapital;
 * - it never derives class activation/saleability from balances;
 * - it never assigns a Pool valuation without an authenticated valuation source.
 *
 * The resulting context is suitable for createAuthoritativeIssueAdmissionProvider.
 */

function required(value, field) {
  if (value === undefined || value === null || value === '') {
    throw new Error(`${field} is required`)
  }
  return value
}

function ref(utxo, label) {
  if (!utxo || typeof utxo.txHash !== 'string' || !Number.isInteger(utxo.outputIndex)) {
    throw new Error(`${label} UTxO has no exact txHash/outputIndex`)
  }
  return `${utxo.txHash}#${utxo.outputIndex}`
}

function fieldsOf(value) {
  if (!value) return null
  if (typeof value === 'string') {
    throw new Error('datum must be decoded by the observation caller before parsing')
  }
  return Array.isArray(value.fields) ? value.fields : null
}

function intOf(value, field) {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number' && Number.isInteger(value)) return BigInt(value)
  if (value && typeof value.int !== 'undefined') return BigInt(value.int)
  throw new Error(`${field} is not an integer datum field`)
}

function singletonByUnit(utxos, unit, label) {
  const matches = utxos.filter((u) => (u.assets?.[unit] ?? 0n) === 1n)
  if (matches.length !== 1) {
    throw new Error(`${label}: expected exactly one singleton UTxO, found ${matches.length}`)
  }
  return matches[0]
}

/**
 * Observe the exact Counter and B1PrizePool inputs and delegate construction
 * of the complete IssueDecisionInput to an authoritative producer.
 *
 * Required authoritative producer contract:
 *   async ({ counterUtxo, poolUtxo, poolDatum, observedAt, poolUsdmValue })
 *     -> { decisionInput, observationReference }
 *
 * The producer MUST obtain class/control/protected-capital/EEV inputs from
 * an authoritative source. This module merely binds them to exact runtime
 * UTxOs and refuses incomplete output.
 */
async function buildPreprodIssueDecisionContext({
  lucid,
  counterAddress,
  b1PrizePoolAddress,
  poolTokenUnit,
  poolUsdmValue,
  authoritativeStateProducer,
  observedAt = BigInt(Date.now()),
}) {
  if (!lucid) throw new Error('lucid is required')
  required(counterAddress, 'counterAddress')
  required(b1PrizePoolAddress, 'b1PrizePoolAddress')
  required(poolTokenUnit, 'poolTokenUnit')
  required(authoritativeStateProducer, 'authoritativeStateProducer')

  const counterUtxos = await lucid.utxosAt(counterAddress)
  if (counterUtxos.length !== 1) {
    throw new Error(`Counter observation is ambiguous: expected exactly one UTxO, found ${counterUtxos.length}`)
  }
  const counterUtxo = counterUtxos[0]
  const counterInputReference = ref(counterUtxo, 'Counter')

  const poolUtxos = await lucid.utxosAt(b1PrizePoolAddress)
  const poolUtxo = singletonByUnit(poolUtxos, poolTokenUnit, 'B1PrizePool')
  const poolInputReference = ref(poolUtxo, 'B1PrizePool')

  const poolFields = fieldsOf(poolUtxo.datum)
  if (!poolFields || poolFields.length !== 8) {
    throw new Error('B1PrizePool datum is missing or malformed')
  }

  const poolState = {
    totalLiquidity: intOf(poolFields[0], 'ppTotalLiquidity'),
    pendingLiabilities: intOf(poolFields[1], 'ppPendingLiabilities'),
    unresolvedReserve: intOf(poolFields[2], 'ppUnresolvedReserve'),
    unresolvedTicketCount: intOf(poolFields[3], 'ppUnresolvedTicketCount'),
    lockedJackpot: intOf(poolFields[4], 'ppLockedJackpot'),
    jackpotThreshold: intOf(poolFields[5], 'ppJackpotThreshold'),
  }

  if (poolState.totalLiquidity < 0n ||
      poolState.pendingLiabilities < 0n ||
      poolState.unresolvedReserve < 0n ||
      poolState.unresolvedTicketCount < 0n ||
      poolState.lockedJackpot < 0n ||
      poolState.jackpotThreshold < 0n) {
    throw new Error('B1PrizePool contains a negative accounting field')
  }

  if (poolUsdmValue === undefined) {
    throw new Error('authenticated poolUsdmValue is required')
  }
  const authenticatedPoolUsdmValue = BigInt(poolUsdmValue)
  if (authenticatedPoolUsdmValue < 0n) {
    throw new Error('authenticated poolUsdmValue must be non-negative')
  }

  const context = await authoritativeStateProducer({
    counterUtxo,
    poolUtxo,
    poolState,
    counterInputReference,
    poolInputReference,
    observedAt: BigInt(observedAt),
    poolUsdmValue: authenticatedPoolUsdmValue,
  })

  if (!context || typeof context !== 'object') {
    throw new Error('authoritative state producer returned no context')
  }
  if (!context.decisionInput || typeof context.decisionInput !== 'object') {
    throw new Error('authoritative state producer returned no IssueDecisionInput')
  }
  if (typeof context.observationReference !== 'string' || context.observationReference.trim() === '') {
    throw new Error('authoritative state producer returned no observationReference')
  }

  return {
    decisionInput: context.decisionInput,
    observationReference: context.observationReference,
    observedAt: BigInt(observedAt),
    runtimeInputs: {
      counterInputReference,
      poolInputReference,
      liquiditySourceReferences: [poolInputReference],
      poolUsdmValue: authenticatedPoolUsdmValue,
    },
    poolState,
  }
}

module.exports = {
  buildPreprodIssueDecisionContext,
}
