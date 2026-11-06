const test = require('node:test')
const assert = require('node:assert/strict')
const { readPreprodIssueObservation } = require('./preprodIssueObservationReader')

const ref = (ch) => ch.repeat(64)

function datum() {
  const prices = [1n,2n,3n,5n,10n,25n,50n,100n]
  const classes = prices.map((price, i) => ({
    fields: [
      BigInt(i), i < 2 ? 1n : 0n, 0n, 0n, 10n,
      { index: i === 0 ? 1 : 0, fields: [] },
    ],
  }))
  const state = {
    fields: [
      0n, 0n, 0n, 0n, 0n, 0n,
      classes,
      { fields: [0n, 0n] },
      { fields: [0n, 0n, { index: 0, fields: [] }, 0n] },
    ],
  }
  return { fields: [0n, state] }
}

function fakeLucid() {
  return {
    async utxosAt(address) {
      if (address === 'counter') {
        return [{ txHash: ref('a'), outputIndex: 0, datum: { fields: [0n] }, assets: { lovelace: 5_000_000n } }]
      }
      if (address === 'pool') {
        return [{
          txHash: ref('b'),
          outputIndex: 1,
          datum: { fields: [100_000n,1_000n,300n,2n,5_000n,0n,{},{}] },
          assets: { ['poolpolicy' + 'poolname']: 1n },
        }]
      }
      if (address === 'control') {
        return [{
          txHash: ref('e'),
          outputIndex: 3,
          datum: {
            fields: [
              0n, 0n, 0n, 0n,
              'ab'.repeat(28),
              'b2c0',
            ],
          },
          assets: { ['ab'.repeat(28) + 'b2c0']: 1n },
        }]
      }
      if (address === 'carrier') {
        const d = datum()
        d.fields[1].fields[0] = 10n
        d.fields[1].fields[1] = 3n
        d.fields[1].fields[2] = 2n
        d.fields[1].fields[3] = 20n
        d.fields[1].fields[4] = 30n
        d.fields[1].fields[5] = 40n
        d.fields[1].fields[6][0].fields[2] = 1n
        d.fields[1].fields[6][0].fields[3] = 1n
        d.fields[1].fields[6][1].fields[2] = 1n
        d.fields[1].fields[6][1].fields[3] = 2n
        d.fields[1].fields[1] = 3n
        d.fields[1].fields[2] = 2n
        d.fields[1].fields[6][0].fields[4] = 10n
        d.fields[1].fields[6][1].fields[4] = 10n
        d.fields[1].fields[8].fields[0] = 50n
        return [{
          txHash: ref('c'),
          outputIndex: 2,
          datum: d,
          assets: { ['carrierpolicy' + 'carriername']: 1n },
        }]
      }
      return []
    },
  }
}

function baseIssueOptions(lucid, overrides = {}) {
  return {
    lucid,
    counterAddress: 'counter',
    b1PrizePoolAddress: 'pool',
    poolTokenUnit: 'poolpolicy' + 'poolname',
    carrierAddress: 'carrier',
    carrierPolicyId: 'carrierpolicy',
    carrierTokenNameHex: 'carriername',
    controlAddress: 'control',
    controlPolicyId: 'ab'.repeat(28),
    controlTokenNameHex: 'b2c0',
    classId: 0,
    price: 1,
    observedAt: 123n,
    authoritativeInputs: {
      poolUsdmValue: 1_000n,
      preEEV: 1_000n,
      candidateEEV: 1_000n,
      requiredImmediateLiquidity: 1n,
      truthVerified: true,
      eevFresh: true,
      obligationsComplete: true,
      allOmegaSuccessorsCertified: true,
      decisionReference: 'decision-reconcile',
      protectedCapitalProvenance: {
        sourceReference: ref('c') + '#2',
        components: {
          crystallizedLiabilities: 10n,
          worstCaseExposure: 1_500n,
          safetyCapital: 20n,
          reserveProtection: 30n,
          lockedJackpot: 50n,
          mandatoryFutureCosts: 40n,
        },
        accountingInputs: { unresolvedReserve: 3n, unresolvedTicketCount: 2n },
        total: 1_650n,
      },
    },
    ...overrides,
  }
}

function mutatePoolField(lucid, index, value) {
  const original = lucid.utxosAt.bind(lucid)
  lucid.utxosAt = async (address) => {
    const utxos = await original(address)
    if (address === 'pool' && utxos.length === 1) {
      utxos[0].datum.fields[index] = value
    }
    return utxos
  }
  return lucid
}

test('reads exact Counter, Pool and V3 carrier and binds authoritative inputs', async () => {
  const result = await readPreprodIssueObservation({
    lucid: fakeLucid(),
    counterAddress: 'counter',
    b1PrizePoolAddress: 'pool',
    poolTokenUnit: 'poolpolicy' + 'poolname',
    carrierAddress: 'carrier',
    carrierPolicyId: 'carrierpolicy',
    carrierTokenNameHex: 'carriername',
    controlAddress: 'control',
    controlPolicyId: 'ab'.repeat(28),
    controlTokenNameHex: 'b2c0',
    classId: 0,
    price: 1,
    observedAt: 123n,
    authoritativeInputs: {
      poolUsdmValue: 1_000n,
      preEEV: 1_000n,
      candidateEEV: 1_000n,
      requiredImmediateLiquidity: 1n,
      truthVerified: true,
      eevFresh: true,
      obligationsComplete: true,
      allOmegaSuccessorsCertified: true,
      decisionReference: 'decision-1',
      stateHash: '1'.repeat(64),
      actionFingerprint: '2'.repeat(64),
      postStateHash: '3'.repeat(64),
      protectedCapitalProvenance: {
        sourceReference: 'c'.repeat(64) + '#2',
        components: {
          crystallizedLiabilities: 10n,
          worstCaseExposure: 1500n,
          safetyCapital: 20n,
          reserveProtection: 30n,
          lockedJackpot: 50n,
          mandatoryFutureCosts: 40n,
        },
        accountingInputs: { unresolvedReserve: 3n, unresolvedTicketCount: 2n },
        total: 1650n,
      },
    },
  })

  assert.equal(result.counterInputReference, ref('a') + '#0')
  assert.equal(result.poolInputReference, ref('b') + '#1')
  assert.equal(result.carrierStateReference, ref('c') + '#2')
  assert.equal(result.controlStateReference, ref('e') + '#3')
  assert.deepEqual(result.authorityDecisionBinding, {
    stateHash: '1'.repeat(64),
    actionFingerprint: '2'.repeat(64),
    postStateHash: '3'.repeat(64),
  })
  assert.equal(result.protectedCapitalProvenance.total, 1650n)
  assert.deepEqual(result.protectedCapitalProvenance.components, {
    crystallizedLiabilities: 10n,
    worstCaseExposure: 1500n,
    safetyCapital: 20n,
    reserveProtection: 30n,
    lockedJackpot: 50n,
    mandatoryFutureCosts: 40n,
  })
  assert.deepEqual(result.protectedCapitalProvenance.accountingInputs, {
    unresolvedReserve: 3n,
    unresolvedTicketCount: 2n,
  })
  assert.equal(result.decisionInput.preState.control.currentActiveClass, 0n)
  assert.equal(result.decisionInput.classId, 0n)
  assert.equal(result.decisionInput.observationReference.includes(ref('c')), true)
})

test('passes the decoded B1 datum liquidity to the authenticated authority source', async () => {
  let observedPoolDatumLiquidity
  await readPreprodIssueObservation({
    lucid: fakeLucid(),
    counterAddress: 'counter',
    b1PrizePoolAddress: 'pool',
    poolTokenUnit: 'poolpolicy' + 'poolname',
    carrierAddress: 'carrier',
    carrierPolicyId: 'carrierpolicy',
    carrierTokenNameHex: 'carriername',
    controlAddress: 'control',
    controlPolicyId: 'ab'.repeat(28),
    controlTokenNameHex: 'b2c0',
    classId: 0,
    price: 1,
    observedAt: 123n,
    authoritySource: async (request) => {
      observedPoolDatumLiquidity = request.poolDatumTotalLiquidity
      return {
        poolUsdmValue: 1_000n,
        preEEV: 1_000n,
        candidateEEV: 1_000n,
        requiredImmediateLiquidity: 1n,
        truthVerified: true,
        eevFresh: true,
        obligationsComplete: true,
        allOmegaSuccessorsCertified: true,
        decisionReference: 'decision-datum-binding',
        observedAt: 123n,
        protectedCapitalProvenance: {
          sourceReference: ref('c') + '#2',
          components: {
            crystallizedLiabilities: 10n,
            worstCaseExposure: 1500n,
            safetyCapital: 20n,
            reserveProtection: 30n,
            lockedJackpot: 50n,
            mandatoryFutureCosts: 40n,
          },
          accountingInputs: { unresolvedReserve: 3n, unresolvedTicketCount: 2n },
          total: 1650n,
        },
      }
    },
  })
  assert.equal(observedPoolDatumLiquidity, 1_000n)
})

test('fails closed when the carrier singleton is ambiguous', async () => {
  const lucid = fakeLucid()
  const original = lucid.utxosAt
  lucid.utxosAt = async (address) => {
    const values = await original(address)
    if (address === 'carrier') values.push({ ...values[0], outputIndex: 3 })
    return values
  }

  await assert.rejects(
    () => readPreprodIssueObservation({
      lucid,
      counterAddress: 'counter',
      b1PrizePoolAddress: 'pool',
      poolTokenUnit: 'poolpolicy' + 'poolname',
      carrierAddress: 'carrier',
      carrierPolicyId: 'carrierpolicy',
      carrierTokenNameHex: 'carriername',
      controlAddress: 'control',
      controlPolicyId: 'controlpolicy',
      controlTokenNameHex: 'controlname',
      classId: 0,
      price: 1,
      observedAt: 123n,
      authoritativeInputs: {
        poolUsdmValue: 1n,
        preEEV: 1n,
        candidateEEV: 1n,
        requiredImmediateLiquidity: 1n,
        truthVerified: true,
        eevFresh: true,
        obligationsComplete: true,
        allOmegaSuccessorsCertified: true,
        decisionReference: 'decision-1',
      protectedCapitalProvenance: {
        sourceReference: 'c'.repeat(64) + '#2',
        components: {
          crystallizedLiabilities: 10n,
          worstCaseExposure: 1500n,
          safetyCapital: 20n,
          reserveProtection: 30n,
          lockedJackpot: 50n,
          mandatoryFutureCosts: 40n,
        },
        accountingInputs: { unresolvedReserve: 3n, unresolvedTicketCount: 2n },
        total: 1650n,
      },
      },
    }),
    /ambiguous/,
  )
})


test('fails closed when observation time is not authenticated', async () => {
  await assert.rejects(
    () => readPreprodIssueObservation({
      lucid: fakeLucid(),
      counterAddress: 'counter',
      b1PrizePoolAddress: 'pool',
      poolTokenUnit: 'poolpolicy' + 'poolname',
      carrierAddress: 'carrier',
      carrierPolicyId: 'carrierpolicy',
      carrierTokenNameHex: 'carriername',
      controlAddress: 'control',
      controlPolicyId: 'ab'.repeat(28),
      controlTokenNameHex: 'b2c0',
      classId: 0,
      price: 1,
      authoritativeInputs: {
        poolUsdmValue: 1n,
        preEEV: 1n,
        candidateEEV: 1n,
        requiredImmediateLiquidity: 1n,
        truthVerified: true,
        eevFresh: true,
        obligationsComplete: true,
        allOmegaSuccessorsCertified: true,
        decisionReference: 'decision-1',
      protectedCapitalProvenance: {
        sourceReference: 'c'.repeat(64) + '#2',
        components: {
          crystallizedLiabilities: 10n,
          worstCaseExposure: 1500n,
          safetyCapital: 20n,
          reserveProtection: 30n,
          lockedJackpot: 50n,
          mandatoryFutureCosts: 40n,
        },
        accountingInputs: { unresolvedReserve: 3n, unresolvedTicketCount: 2n },
        total: 1650n,
      },
      },
    }),
    /observedAt is required/,
  )
})


test('fails closed when authoritative boolean evidence is not actually boolean', async () => {
  await assert.rejects(
    () => readPreprodIssueObservation({
      lucid: fakeLucid(),
      counterAddress: 'counter',
      b1PrizePoolAddress: 'pool',
      poolTokenUnit: 'poolpolicy' + 'poolname',
      carrierAddress: 'carrier',
      carrierPolicyId: 'carrierpolicy',
      carrierTokenNameHex: 'carriername',
      controlAddress: 'control',
      controlPolicyId: 'ab'.repeat(28),
      controlTokenNameHex: 'b2c0',
      classId: 0,
      price: 1,
      observedAt: 123n,
      authoritativeInputs: {
        poolUsdmValue: 1n,
        preEEV: 1n,
        candidateEEV: 1n,
        requiredImmediateLiquidity: 1n,
        truthVerified: 'false',
        eevFresh: true,
        obligationsComplete: true,
        allOmegaSuccessorsCertified: true,
        decisionReference: 'decision-1',
      protectedCapitalProvenance: {
        sourceReference: 'c'.repeat(64) + '#2',
        components: {
          crystallizedLiabilities: 10n,
          worstCaseExposure: 1500n,
          safetyCapital: 20n,
          reserveProtection: 30n,
          lockedJackpot: 50n,
          mandatoryFutureCosts: 40n,
        },
        accountingInputs: { unresolvedReserve: 3n, unresolvedTicketCount: 2n },
        total: 1650n,
      },
      },
    }),
    /truthVerified must be boolean/,
  )
})


test('rejects B1/V3 monetary aggregate mismatch before calling the authority source', async () => {
  const cases = [
    { index: 1, value: 900n, field: 'pendingLiabilities' },
    { index: 1, value: 1_100n, field: 'pendingLiabilities' },
    { index: 2, value: 200n, field: 'unresolvedReserve' },
    { index: 2, value: 400n, field: 'unresolvedReserve' },
    { index: 4, value: 4_900n, field: 'lockedJackpot' },
    { index: 4, value: 5_100n, field: 'lockedJackpot' },
    { index: 5, value: 100n, field: 'jackpotThreshold' },
    { index: 3, value: 1n, field: 'unresolvedTicketCount' },
    { index: 3, value: 3n, field: 'unresolvedTicketCount' },
  ]

  for (const scenario of cases) {
    const lucid = mutatePoolField(fakeLucid(), scenario.index, scenario.value)
    let authorityCalled = false
    const options = baseIssueOptions(lucid, {
      authoritySource: async () => {
        authorityCalled = true
        throw new Error('authority source must not run on inconsistent accounting')
      },
    })

    await assert.rejects(
      () => readPreprodIssueObservation(options),
      new RegExp('B1PrizePool/V3 ' + scenario.field + ' mismatch'),
    )
    assert.equal(authorityCalled, false)
  }
})

test('rejects non-divisible B1 monetary sub-units rather than rounding into V3 units', async () => {
  const lucid = mutatePoolField(fakeLucid(), 1, 1_001n)
  await assert.rejects(
    () => readPreprodIssueObservation(baseIssueOptions(lucid)),
    /pendingLiabilities is not exactly representable in IMMORTAL reference units/,
  )
})

test('keeps unresolved face reserve distinct from the 500x worst-case exposure', async () => {
  const result = await readPreprodIssueObservation(baseIssueOptions(fakeLucid()))
  const preState = result.decisionInput.preState
  const worstCaseExposure = preState.classes.reduce(
    (sum, entry) => sum + entry.exposure * 500n,
    0n,
  )

  assert.equal(result.poolState.unresolvedReserve, 300n)
  assert.equal(preState.unresolvedReserve, 3n)
  assert.equal(worstCaseExposure, 1_500n)
  assert.notEqual(preState.unresolvedReserve, worstCaseExposure)
})

test('decodes Lucid CBOR string datums', async () => {
  const lucid = fakeLucid()
  const { Data, Constr } = await import('@lucid-evolution/lucid')

  const poolDatum = new Constr(0, [
    100_000n, 1_000n, 300n, 2n, 5_000n, 0n,
    new Constr(0, []),
    new Constr(0, []),
  ])
  const controlDatum = new Constr(0, [
    0n,
    0n,
    0n,
    0n,
    'ab'.repeat(28),
    'b2c0',
  ])
  const classes = Array.from({ length: 8 }, (_, i) =>
    new Constr(0, [
      BigInt(i),
      i < 2 ? 1n : 0n,
      i < 2 ? 1n : 0n,
      i === 0 ? 1n : i === 1 ? 2n : 0n,
      10n,
      new Constr(i < 2 ? 1 : 0, []),
    ]),
  )
  const carrierDatum = new Constr(0, [
    0n,
    new Constr(0, [
      10n,
      3n,
      2n,
      20n,
      30n,
      40n,
      classes,
      new Constr(0, [0n, 0n]),
      new Constr(0, [50n, 0n, new Constr(0, []), 0n]),
    ]),
  ])

  const originalUtxosAt = lucid.utxosAt
  lucid.utxosAt = async address => {
    const values = await originalUtxosAt(address)
    if (values.length !== 1) return values
    const value = { ...values[0] }
    if (address === 'pool') value.datum = Data.to(poolDatum)
    if (address === 'control') value.datum = Data.to(controlDatum)
    if (address === 'carrier') value.datum = Data.to(carrierDatum)
    return [value]
  }

  const result = await readPreprodIssueObservation({
    lucid,
    counterAddress: 'counter',
    b1PrizePoolAddress: 'pool',
    poolTokenUnit: 'poolpolicy' + 'poolname',
    carrierAddress: 'carrier',
    carrierPolicyId: 'carrierpolicy',
    carrierTokenNameHex: 'carriername',
    controlAddress: 'control',
    controlPolicyId: 'ab'.repeat(28),
    controlTokenNameHex: 'b2c0',
    classId: 0,
    price: 1,
    observedAt: 123n,
    authoritativeInputs: {
      poolUsdmValue: 1_000n,
      preEEV: 1_000n,
      candidateEEV: 1_000n,
      requiredImmediateLiquidity: 1n,
      truthVerified: true,
      eevFresh: true,
      obligationsComplete: true,
      allOmegaSuccessorsCertified: true,
      decisionReference: 'decision-cbor',
      protectedCapitalProvenance: {
        sourceReference: ref('c') + '#2',
        components: {
          crystallizedLiabilities: 10n,
          worstCaseExposure: 1500n,
          safetyCapital: 20n,
          reserveProtection: 30n,
          lockedJackpot: 50n,
          mandatoryFutureCosts: 40n,
        },
        accountingInputs: { unresolvedReserve: 3n, unresolvedTicketCount: 2n },
        total: 1650n,
      },
    },
  })

  assert.equal(result.poolInputReference, ref('b') + '#1')
  assert.equal(result.controlStateReference, ref('e') + '#3')
  assert.equal(result.carrierStateReference, ref('c') + '#2')
  assert.equal(result.decisionInput.classId, 0n)
})
