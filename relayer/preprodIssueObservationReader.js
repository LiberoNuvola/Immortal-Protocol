/**
 * Concrete Preprod observation reader for the PRE-RICH Issue boundary.
 *
 * This module is deliberately limited to authenticated Cardano observation:
 * - exact Counter singleton;
 * - exact B1 PrizePool singleton;
 * - exact V3 economic-state carrier singleton;
 * - decoded V3 state from the carrier datum.
 *
 * It does NOT calculate EEV, ProtectedCapital, viability, class activation,
 * or Pool valuation. Those values must cross this boundary from an
 * authoritative source. This prevents a second economic oracle from being
 * introduced in the relayer.
 */

function decodeCarrierDatum(utxo) {
  if (!utxo?.datum || typeof utxo.datum === 'string' || !Array.isArray(utxo.datum.fields) ||
      utxo.datum.fields.length !== 2) {
    throw new Error('V3 carrier datum is missing or malformed')
  }
  const asInt = (v, field) => {
    try {
      const n = typeof v === 'bigint' ? v : BigInt(v?.int ?? v)
      if (n < 0n) throw new Error()
      return n
    } catch {
      throw new Error('V3 carrier ' + field + ' is not a non-negative integer')
    }
  }
  const root = utxo.datum.fields
  const stateVersion = asInt(root[0], 'stateVersion')
  const state = root[1]
  if (!state || !Array.isArray(state.fields) || state.fields.length !== 9) {
    throw new Error('V3 carrier state is missing or malformed')
  }
  const ints = state.fields.slice(0, 6).map((v, i) => asInt(v, 'state field ' + i))
  const classesRaw = state.fields[6]
  if (!Array.isArray(classesRaw) || classesRaw.length !== 8) {
    throw new Error('V3 carrier must contain exactly 8 classes')
  }
  const prices = [1n, 2n, 3n, 5n, 10n, 25n, 50n, 100n]
  const classes = classesRaw.map((entry, index) => {
    if (!entry || !Array.isArray(entry.fields) || entry.fields.length !== 6) {
      throw new Error('V3 class ' + index + ' is malformed')
    }
    const classId = asInt(entry.fields[0], 'classId')
    const issued = asInt(entry.fields[1], 'issued')
    const unresolved = asInt(entry.fields[2], 'unresolved')
    const exposure = asInt(entry.fields[3], 'exposure')
    const cap = asInt(entry.fields[4], 'cap')
    const saleable = entry.fields[5]?.index
    if (classId !== BigInt(index) || unresolved > issued ||
        exposure !== prices[index] * unresolved ||
        (saleable !== 0 && saleable !== 1)) {
      throw new Error('V3 class ' + index + ' violates canonical constraints')
    }
    return { classId, issued, unresolved, exposure, cap, saleable: saleable === 1 }
  })
  const control = state.fields[7]
  if (!control || !Array.isArray(control.fields) || control.fields.length !== 2) {
    throw new Error('V3 control state is malformed')
  }
  const currentActiveClass = asInt(control.fields[0], 'currentActiveClass')
  const highestClassEverActivated = asInt(control.fields[1], 'highestClassEverActivated')
  if (currentActiveClass > highestClassEverActivated || highestClassEverActivated > 7n) {
    throw new Error('V3 control state is invalid')
  }
  const jackpot = state.fields[8]
  if (!jackpot || !Array.isArray(jackpot.fields) || jackpot.fields.length !== 4) {
    throw new Error('V3 jackpot state is malformed')
  }
  const lockedAmount = asInt(jackpot.fields[0], 'jackpot.lockedAmount')
  const threshold = asInt(jackpot.fields[1], 'jackpot.threshold')
  const cycle = asInt(jackpot.fields[3], 'jackpot.cycle')
  const status = jackpot.fields[2]?.index
  if (![0, 1, 2, 3].includes(status)) throw new Error('V3 jackpot status is invalid')
  const derivedReserve = classes.reduce((sum, c) => sum + c.exposure, 0n)
  const derivedCount = classes.reduce((sum, c) => sum + c.unresolved, 0n)
  if (derivedReserve !== ints[1] || derivedCount !== ints[2]) {
    throw new Error('V3 carrier aggregates do not match class state')
  }
  return {
    stateVersion,
    state: {
      crystallizedLiabilities: ints[0],
      unresolvedReserve: ints[1],
      unresolvedTicketCount: ints[2],
      safetyCapital: ints[3],
      reserveProtection: ints[4],
      mandatoryFutureCosts: ints[5],
      classes,
      control: { currentActiveClass, highestClassEverActivated },
      jackpot: {
        lockedAmount,
        threshold,
        status: ['inactive', 'locked', 'payable', 'closed'][status],
        cycle,
      },
    },
  }
}

async function observeCarrier({ lucid, carrierAddress, carrierPolicyId, carrierTokenNameHex }) {
  const unit = required(carrierPolicyId, 'carrierPolicyId') + required(carrierTokenNameHex, 'carrierTokenNameHex')
  const utxos = await lucid.utxosAt(required(carrierAddress, 'carrierAddress'))
  const matches = utxos.filter((u) => (u.assets?.[unit] ?? 0n) === 1n)
  if (matches.length !== 1) {
    throw new Error('V3 economic state carrier is ambiguous: expected exactly one singleton UTxO, found ' + matches.length)
  }
  const decoded = decodeCarrierDatum(matches[0])
  const carrierStateReference = 'cardano:tx/' + exactRef(matches[0], 'V3 carrier')
  return {
    ...decoded,
    carrierStateReference,
    carrierPolicyId,
    carrierTokenNameHex,
  }
}

function required(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(field + ' is required')
  }
  return value.trim()
}

function exactRef(utxo, label) {
  if (!utxo || typeof utxo.txHash !== 'string' || !/^[0-9a-fA-F]{64}$/.test(utxo.txHash) ||
      !Number.isInteger(utxo.outputIndex) || utxo.outputIndex < 0) {
    throw new Error(label + ' has no exact Cardano txHash/outputIndex')
  }
  return utxo.txHash + '#' + utxo.outputIndex
}

function singletonByUnit(utxos, unit, label) {
  const matches = utxos.filter((u) => (u.assets?.[unit] ?? 0n) === 1n)
  if (matches.length !== 1) {
    throw new Error(label + ': expected exactly one singleton UTxO, found ' + matches.length)
  }
  return matches[0]
}

function decodePoolDatum(utxo) {
  if (!utxo?.datum || typeof utxo.datum === 'string' || !Array.isArray(utxo.datum.fields) ||
      utxo.datum.fields.length !== 8) {
    throw new Error('B1PrizePool datum is missing or malformed')
  }
  const asInt = (v, field) => {
    try {
      const n = typeof v === 'bigint' ? v : BigInt(v?.int ?? v)
      if (n < 0n) throw new Error()
      return n
    } catch {
      throw new Error('B1PrizePool ' + field + ' is not a non-negative integer')
    }
  }
  return {
    totalLiquidity: asInt(utxo.datum.fields[0], 'totalLiquidity'),
    pendingLiabilities: asInt(utxo.datum.fields[1], 'pendingLiabilities'),
    unresolvedReserve: asInt(utxo.datum.fields[2], 'unresolvedReserve'),
    unresolvedTicketCount: asInt(utxo.datum.fields[3], 'unresolvedTicketCount'),
    lockedJackpot: asInt(utxo.datum.fields[4], 'lockedJackpot'),
    jackpotThreshold: asInt(utxo.datum.fields[5], 'jackpotThreshold'),
  }
}

/**
 * Read one exact Preprod Issue observation.
 *
 * authoritativeInputs must be supplied by an external authenticated source:
 * {
 *   poolUsdmValue,
 *   preEEV,
 *   candidateEEV,
 *   requiredImmediateLiquidity,
 *   truthVerified,
 *   eevFresh,
 *   obligationsComplete,
 *   allOmegaSuccessorsCertified,
 *   decisionReference
 * }
 *
 * The function binds those values to the exact observed Counter/Pool/Carrier
 * references and the decoded V3 state, but never computes them.
 */
async function readPreprodIssueObservation({
  lucid,
  counterAddress,
  b1PrizePoolAddress,
  poolTokenUnit,
  carrierAddress,
  carrierPolicyId,
  carrierTokenNameHex,
  classId,
  price,
  authoritativeInputs,
  observedAt = BigInt(Date.now()),
}) {
  if (!lucid) throw new Error('lucid is required')
  required(counterAddress, 'counterAddress')
  required(b1PrizePoolAddress, 'b1PrizePoolAddress')
  required(poolTokenUnit, 'poolTokenUnit')
  required(carrierAddress, 'carrierAddress')
  required(carrierPolicyId, 'carrierPolicyId')
  required(carrierTokenNameHex, 'carrierTokenNameHex')
  if (!Number.isInteger(classId) || classId < 0 || classId > 7) {
    throw new Error('classId must be an integer in 0..7')
  }
  if (!Number.isInteger(price) || price <= 0) {
    throw new Error('price must be a positive integer')
  }
  if (!authoritativeInputs || typeof authoritativeInputs !== 'object') {
    throw new Error('authoritativeInputs are required')
  }

  const counterUtxos = await lucid.utxosAt(counterAddress)
  if (counterUtxos.length !== 1) {
    throw new Error('Counter observation is ambiguous: expected exactly one UTxO, found ' + counterUtxos.length)
  }
  const counterUtxo = counterUtxos[0]

  const poolUtxos = await lucid.utxosAt(b1PrizePoolAddress)
  const poolUtxo = singletonByUnit(poolUtxos, poolTokenUnit, 'B1PrizePool')
  const poolState = decodePoolDatum(poolUtxo)

  const carrier = await observeEconomicStateCarrier({
    lucid,
    carrierAddress,
    carrierPolicyId,
    carrierTokenNameHex,
  })

  const counterRef = exactRef(counterUtxo, 'Counter')
  const poolRef = exactRef(poolUtxo, 'B1PrizePool')
  const observationReference =
    'preprod-issue:' + counterRef + ':' + poolRef + ':' + carrier.carrierStateReference

  const requiredKeys = [
    'poolUsdmValue',
    'preEEV',
    'candidateEEV',
    'requiredImmediateLiquidity',
    'truthVerified',
    'eevFresh',
    'obligationsComplete',
    'allOmegaSuccessorsCertified',
    'decisionReference',
  ]
  for (const key of requiredKeys) {
    if (authoritativeInputs[key] === undefined || authoritativeInputs[key] === null) {
      throw new Error('authoritativeInputs.' + key + ' is required')
    }
  }

  const nonNegative = (value, field) => {
    const n = BigInt(String(value))
    if (n < 0n) throw new Error(field + ' must be non-negative')
    return n
  }

  const poolUsdmValue = nonNegative(authoritativeInputs.poolUsdmValue, 'poolUsdmValue')
  const preEEV = nonNegative(authoritativeInputs.preEEV, 'preEEV')
  const candidateEEV = nonNegative(authoritativeInputs.candidateEEV, 'candidateEEV')
  const requiredImmediateLiquidity = nonNegative(
    authoritativeInputs.requiredImmediateLiquidity,
    'requiredImmediateLiquidity',
  )

  const active = carrier.state.control.currentActiveClass
  const highest = carrier.state.control.highestClassEverActivated
  const classState = carrier.state.classes.find((entry) => entry.classId === BigInt(classId))
  if (!classState) throw new Error('observed V3 carrier has no requested Issue class')
  if (BigInt(classId) > active || classState.issued >= classState.cap || !classState.saleable) {
    throw new Error('observed V3 carrier does not make the requested Issue class saleable')
  }

  const candidateClasses = carrier.state.classes.map((entry) =>
    entry.classId === BigInt(classId)
      ? { ...entry, issued: entry.issued + 1n }
      : entry,
  )

  const candidateState = {
    ...carrier.state,
    unresolvedReserve: carrier.state.unresolvedReserve + BigInt(price),
    unresolvedTicketCount: carrier.state.unresolvedTicketCount + 1n,
    classes: candidateClasses.map((entry) =>
      entry.classId === BigInt(classId)
        ? { ...entry, unresolved: entry.unresolved + 1n, exposure: entry.exposure + BigInt(price) }
        : entry,
    ),
  }

  return {
    observationReference,
    observedAt: BigInt(observedAt),
    counterInputReference: counterRef,
    poolInputReference: poolRef,
    poolUsdmValue,
    carrierStateReference: carrier.carrierStateReference,
    carrierPolicyId: carrier.carrierPolicyId,
    carrierTokenNameHex: carrier.carrierTokenNameHex,
    poolState,
    decisionInput: {
      preState: carrier.state,
      classId: BigInt(classId),
      price: BigInt(price),
      preEEV,
      candidateEEV,
      availableExecutableLiquidity: poolUsdmValue,
      requiredImmediateLiquidity,
      truthVerified: Boolean(authoritativeInputs.truthVerified),
      eevFresh: Boolean(authoritativeInputs.eevFresh),
      obligationsComplete: Boolean(authoritativeInputs.obligationsComplete),
      allOmegaSuccessorsCertified: Boolean(authoritativeInputs.allOmegaSuccessorsCertified),
      decisionReference: required(authoritativeInputs.decisionReference, 'decisionReference'),
      observationReference,
      candidateState,
      currentActiveClass: active,
      highestClassEverActivated: highest,
    },
  }
}

module.exports = {
  readPreprodIssueObservation,
}
