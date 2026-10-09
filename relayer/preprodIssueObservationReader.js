let lucidDataModulePromise

async function datumFields(utxo, label) {
  const datum = utxo?.datum
  if (!datum) throw new Error(label + ' datum is missing or malformed')
  if (typeof datum === 'string') {
    try {
      lucidDataModulePromise ??= import('@lucid-evolution/lucid')
      const { Data } = await lucidDataModulePromise
      return Data.from(datum)
    } catch (error) {
      throw new Error(
        label + ' datum CBOR is invalid: ' + (error instanceof Error ? error.message : String(error)),
      )
    }
  }
  return datum
}

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

async function decodeCarrierDatum(utxo) {
  const datum = await datumFields(utxo, 'V3 carrier')
  if (!Array.isArray(datum.fields) || datum.fields.length !== 2) {
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
  const root = datum.fields
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

function requireBoolean(value, field) {
  if (typeof value !== 'boolean') {
    throw new Error(field + ' must be boolean')
  }
  return value
}

async function observeCarrier({ lucid, carrierAddress, carrierPolicyId, carrierTokenNameHex }) {
  const unit = required(carrierPolicyId, 'carrierPolicyId') + required(carrierTokenNameHex, 'carrierTokenNameHex')
  const utxos = await lucid.utxosAt(required(carrierAddress, 'carrierAddress'))
  const matches = utxos.filter((u) => (u.assets?.[unit] ?? 0n) === 1n)
  if (matches.length !== 1) {
    throw new Error('V3 economic state carrier is ambiguous: expected exactly one singleton UTxO, found ' + matches.length)
  }
  const decoded = await decodeCarrierDatum(matches[0])
  const carrierStateReference = exactRef(matches[0], 'V3 carrier')
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

async function decodeB2ControlDatum(utxo, expectedPolicyId, expectedTokenNameHex) {
  const datum = await datumFields(utxo, 'B2 control')
  if (!Array.isArray(datum.fields) || datum.fields.length !== 6) {
    throw new Error('B2 control datum is missing or malformed')
  }
  const asInt = (v, field) => {
    try {
      const n = typeof v === 'bigint' ? v : BigInt(v?.int ?? v)
      if (n < 0n) throw new Error()
      return n
    } catch {
      throw new Error('B2 control ' + field + ' is not a non-negative integer')
    }
  }
  const asHex = (v, field) => {
    if (typeof v !== 'string' || !/^[0-9a-fA-F]*$/.test(v)) {
      throw new Error('B2 control ' + field + ' is not hex')
    }
    return v.toLowerCase()
  }
  const fields = datum.fields
  const currentActiveClass = asInt(fields[0], 'currentActiveClass')
  const highestClassEverActivated = asInt(fields[1], 'highestClassEverActivated')
  const stateVersion = asInt(fields[2], 'stateVersion')
  const transitionNonce = asInt(fields[3], 'transitionNonce')
  const controlPolicy = asHex(fields[4], 'controlPolicy')
  const controlTokenNameHex = asHex(fields[5], 'controlTokenName')
  if (
    currentActiveClass > highestClassEverActivated ||
    highestClassEverActivated > 7n ||
    controlPolicy !== required(expectedPolicyId, 'controlPolicyId').toLowerCase() ||
    controlTokenNameHex !== required(expectedTokenNameHex, 'controlTokenNameHex').toLowerCase()
  ) {
    throw new Error('B2 control datum violates authenticated control invariants')
  }
  return {
    currentActiveClass,
    highestClassEverActivated,
    stateVersion,
    transitionNonce,
    controlPolicy,
    controlTokenNameHex,
  }
}

async function observeB2Control({
  lucid,
  controlAddress,
  controlPolicyId,
  controlTokenNameHex,
}) {
  const unit =
    required(controlPolicyId, 'controlPolicyId') +
    required(controlTokenNameHex, 'controlTokenNameHex')
  const utxos = await lucid.utxosAt(required(controlAddress, 'controlAddress'))
  const matches = utxos.filter((u) => (u.assets?.[unit] ?? 0n) === 1n)
  if (matches.length !== 1) {
    throw new Error(
      'B2 control singleton is ambiguous: expected exactly one UTxO, found ' +
        matches.length,
    )
  }
  const controlUtxo = matches[0]
  const decoded = await decodeB2ControlDatum(
    controlUtxo,
    controlPolicyId,
    controlTokenNameHex,
  )
  return {
    ...decoded,
    controlStateReference: exactRef(controlUtxo, 'B2 control'),
  }
}

async function decodePoolDatum(utxo) {
  const datum = await datumFields(utxo, 'B1PrizePool')
  if (!Array.isArray(datum.fields) || datum.fields.length !== 8) {
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
    totalLiquidity: asInt(datum.fields[0], 'totalLiquidity'),
    pendingLiabilities: asInt(datum.fields[1], 'pendingLiabilities'),
    unresolvedReserve: asInt(datum.fields[2], 'unresolvedReserve'),
    unresolvedTicketCount: asInt(datum.fields[3], 'unresolvedTicketCount'),
    lockedJackpot: asInt(datum.fields[4], 'lockedJackpot'),
    jackpotThreshold: asInt(datum.fields[5], 'jackpotThreshold'),
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
  controlAddress,
  controlPolicyId,
  controlTokenNameHex,
  classId,
  price,
  authoritativeInputs,
  observedAt,
  authoritySource,
}) {
  if (!lucid) throw new Error('lucid is required')
  required(counterAddress, 'counterAddress')
  required(b1PrizePoolAddress, 'b1PrizePoolAddress')
  required(poolTokenUnit, 'poolTokenUnit')
  required(carrierAddress, 'carrierAddress')
  required(carrierPolicyId, 'carrierPolicyId')
  required(carrierTokenNameHex, 'carrierTokenNameHex')
  required(controlAddress, 'controlAddress')
  required(controlPolicyId, 'controlPolicyId')
  required(controlTokenNameHex, 'controlTokenNameHex')
  if (!Number.isInteger(classId) || classId < 0 || classId > 7) {
    throw new Error('classId must be an integer in 0..7')
  }
  if (!Number.isInteger(price) || price <= 0) {
    throw new Error('price must be a positive integer')
  }
  if (typeof authoritySource !== 'function' && (!authoritativeInputs || typeof authoritativeInputs !== 'object')) {
    throw new Error('authoritativeInputs or an authenticated authoritySource is required')
  }
  if (
    typeof authoritySource !== 'function' &&
    (observedAt === undefined || observedAt === null)
  ) {
    throw new Error('observedAt is required from the authenticated observation source')
  }

  const counterUtxos = await lucid.utxosAt(counterAddress)
  if (counterUtxos.length !== 1) {
    throw new Error('Counter observation is ambiguous: expected exactly one UTxO, found ' + counterUtxos.length)
  }
  const counterUtxo = counterUtxos[0]

  const poolUtxos = await lucid.utxosAt(b1PrizePoolAddress)
  const poolUtxo = singletonByUnit(poolUtxos, poolTokenUnit, 'B1PrizePool')
  const poolState = await decodePoolDatum(poolUtxo)

  const carrier = await observeCarrier({
    lucid,
    carrierAddress,
    carrierPolicyId,
    carrierTokenNameHex,
  })
  const control = await observeB2Control({
    lucid,
    controlAddress,
    controlPolicyId,
    controlTokenNameHex,
  })

  if (
    control.currentActiveClass !== carrier.state.control.currentActiveClass ||
    control.highestClassEverActivated !== carrier.state.control.highestClassEverActivated
  ) {
    throw new Error(
      'B2 control state does not match the authenticated V3 control projection',
    )
  }

  const counterRef = exactRef(counterUtxo, 'Counter')
  const poolRef = exactRef(poolUtxo, 'B1PrizePool')
  const observationReference =
    'preprod-issue:' + counterRef + ':' + poolRef + ':' + carrier.carrierStateReference

  if (typeof authoritySource === 'function') {
    authoritativeInputs = await authoritySource({
      counterInputReference: counterRef,
      poolInputReference: poolRef,
      carrierStateReference: carrier.carrierStateReference,
      controlStateReference: control.controlStateReference,
      classId,
      price,
      ...(observedAt === undefined || observedAt === null
        ? {}
        : { observedAt: BigInt(observedAt) }),
      observationReference,
    })
  }

  if (!authoritativeInputs || typeof authoritativeInputs !== 'object') {
    throw new Error('authenticated authority source returned no evidence')
  }

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

  const authoritativeObservedAt =
    authoritativeInputs.observedAt === undefined || authoritativeInputs.observedAt === null
      ? observedAt
      : authoritativeInputs.observedAt
  if (authoritativeObservedAt === undefined || authoritativeObservedAt === null) {
    throw new Error('authenticated authority source did not provide observedAt')
  }

  const protectedCapitalProvenance = authoritativeInputs.protectedCapitalProvenance
  if (!protectedCapitalProvenance || typeof protectedCapitalProvenance !== 'object') {
    throw new Error('authenticated authority source did not provide ProtectedCapital provenance')
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

  return {
    observationReference,
    observedAt: nonNegative(authoritativeObservedAt, 'observedAt'),
    counterInputReference: counterRef,
    poolInputReference: poolRef,
    poolUsdmValue,
    carrierStateReference: carrier.carrierStateReference,
    carrierPolicyId: carrier.carrierPolicyId,
    carrierTokenNameHex: carrier.carrierTokenNameHex,
    controlStateReference: control.controlStateReference,
    controlState: {
      currentActiveClass: control.currentActiveClass,
      highestClassEverActivated: control.highestClassEverActivated,
      stateVersion: control.stateVersion,
      transitionNonce: control.transitionNonce,
    },
    protectedCapitalProvenance: authoritativeInputs.protectedCapitalProvenance,
    eevQualification: authoritativeInputs.eevQualification,
    viabilityCertificate: authoritativeInputs.viabilityCertificate,
    poolState,
    decisionInput: {
      preState: carrier.state,
      classId: BigInt(classId),
      price: BigInt(price),
      preEEV,
      candidateEEV,
      availableExecutableLiquidity: poolUsdmValue,
      requiredImmediateLiquidity,
      truthVerified: requireBoolean(authoritativeInputs.truthVerified, 'truthVerified'),
      eevFresh: requireBoolean(authoritativeInputs.eevFresh, 'eevFresh'),
      obligationsComplete: requireBoolean(authoritativeInputs.obligationsComplete, 'obligationsComplete'),
      allOmegaSuccessorsCertified: requireBoolean(
        authoritativeInputs.allOmegaSuccessorsCertified,
        'allOmegaSuccessorsCertified',
      ),
      decisionReference: required(authoritativeInputs.decisionReference, 'decisionReference'),
      observationReference,
      controlStateReference: control.controlStateReference,
    },
  }
}

module.exports = {
  readPreprodIssueObservation,
}
