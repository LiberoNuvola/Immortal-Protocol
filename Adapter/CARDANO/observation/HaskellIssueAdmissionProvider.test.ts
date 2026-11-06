
import { describe, expect, it } from 'vitest'
import { execPath } from 'node:process'
import {
  assertHaskellDecisionMatchesAuthorityBinding,
  createHaskellIssueAdmissionProvider,
  stringifyHaskellIssueInput,
} from './HaskellIssueAdmissionProvider'

const counter = 'a'.repeat(64) + '#0'
const pool = 'b'.repeat(64) + '#1'
const carrier = 'c'.repeat(64) + '#2'
const control = 'e'.repeat(64) + '#3'
const observationReference = 'observation:issue:provider'
const decisionReference = 'decision:issue:provider'

function v3PreStateWithLargeInteger() {
  const prices = [1n, 2n, 3n, 5n, 10n, 25n, 50n, 100n]
  return {
    crystallizedLiabilities: 9_007_199_254_740_993n,
    unresolvedReserve: 1n,
    unresolvedTicketCount: 1n,
    safetyCapital: 2n,
    reserveProtection: 3n,
    mandatoryFutureCosts: 5n,
    classes: prices.map((price, index) => ({
      classId: BigInt(index),
      issued: index === 0 ? 1n : 0n,
      unresolved: index === 0 ? 1n : 0n,
      exposure: index === 0 ? price : 0n,
      cap: 10n,
      saleable: index === 0,
    })),
    control: { currentActiveClass: 0n, highestClassEverActivated: 0n },
    jackpot: { lockedAmount: 4n, threshold: 0n, status: 'inactive' as const, cycle: 0n },
  }
}

function pc() {
  return {
    sourceReference: carrier,
    components: {
      crystallizedLiabilities: 1n,
      worstCaseExposure: 500n,
      safetyCapital: 2n,
      reserveProtection: 3n,
      lockedJackpot: 4n,
      mandatoryFutureCosts: 5n,
    },
    accountingInputs: { unresolvedReserve: 1n, unresolvedTicketCount: 1n },
    total: 515n,
  }
}

function eevQualification() {
  return {
    status: 'qualified' as const,
    contractVersion: '3.0.0',
    deploymentApproval: {
      status: 'DEPLOYMENT_APPROVED' as const,
      candidateId: 'candidate',
      sourceSetId: 'source-set',
      profileVersion: 'PRE-RICH-EEV-USDM-DIRECT-V1',
      evidenceHash: 'd'.repeat(64),
      qualifiedProperties: ['EV1','EV2','EV3','EV4','EV5','EV6','EV7'],
      excludedProperties: [],
      testSuiteVersion: 'suite',
      failureMatrixVersion: 'matrix',
      validFrom: '2026-10-09T00:00:00Z',
      validUntilOrRevalidationRule: 'LIVE_UTXO_REVALIDATION',
    },
    sourceReference: 'cardano:preprod/utxo/' + pool,
    verificationReference: 'github-actions:run/test@' + 'e'.repeat(40),
    derivationVersion: 'direct-usdm-v1',
    snapshotReference: 'sha256:' + 'f'.repeat(64),
    evidence: Object.fromEntries(
      ['EV1','EV2','EV3','EV4','EV5','EV6','EV7'].map((key) => [
        key,
        { reference: 'repo:' + key, digest: '1'.repeat(64) },
      ]),
    ),
  }
}

function viabilityCertificate() {
  const refs = (prefix: string, keys: readonly string[]) =>
    Object.fromEntries(keys.map((key) => [
      key,
      { reference: prefix + key, digest: '2'.repeat(64) },
    ]))
  return {
    id: 'kc-test',
    version: '1',
    modelReference: 'model:test',
    characteristicPredicateReference: 'chi:test',
    witnessSelectorReference: 'wit:test',
    boundsReference: 'bounds:test',
    proofs: refs('proof:', ['VC1','VC2','VC3','VC4','VC5','VC6']),
    evidence: refs('evidence:', ['E1','E2','E3','E4','E5','E6','E7','E8','E9','E10']),
    digest: '3'.repeat(64),
    deploymentBinding: {
      network: 'cardano-preprod',
      carrierStateReference: carrier,
        controlStateReference: control,
      stateHash: '4'.repeat(64),
      eevSnapshotReference: 'sha256:' + 'f'.repeat(64),
      protectedCapitalSourceReference: carrier,
    },
  }
}

function producerScript(requiredInputFragment = '') {
  const decision = {
    actionClass: 'Issue',
    action: 'Issue:0:1',
    stateHash: '4'.repeat(64),
    postStateHash: '5'.repeat(64),
    actionFingerprint: '6'.repeat(64),
    decisionReference,
    authoritativeObservationReference: observationReference,
    preEEV: '2000',
    candidateEEV: '2000',
    availableExecutableLiquidity: '200000',
    requiredImmediateLiquidity: '150000',
    truthVerified: true,
    eevFresh: true,
    obligationsComplete: true,
    allOmegaSuccessorsCertified: true,
    candidateState: {
      crystallizedLiabilities: '1',
      unresolvedReserve: '1',
      unresolvedTicketCount: '1',
      safetyCapital: '2',
      reserveProtection: '3',
      mandatoryFutureCosts: '5',
      classes: [],
      control: { currentActiveClass: '0', highestClassEverActivated: '0' },
      jackpot: { lockedAmount: '4', threshold: '0', status: 'inactive', cycle: '0' },
    },
    protectedCapitalProvenance: {
      sourceType: 'V3_PRESTATE_CANONICAL_HASKELL',
      components: {
        crystallizedLiabilities: '1',
        worstCaseExposure: '500',
        safetyCapital: '2',
        reserveProtection: '3',
        lockedJackpot: '4',
        mandatoryFutureCosts: '5',
      },
      accountingInputs: {
        unresolvedReserve: '1',
        unresolvedTicketCount: '1',
      },
      total: '515',
    },
  }
  const payload = JSON.stringify({ admitted: true, decision })
  const expected = JSON.stringify(requiredInputFragment)
  return [
    'let raw = "";',
    'process.stdin.setEncoding("utf8");',
    'process.stdin.on("data", chunk => raw += chunk);',
    'process.stdin.on("end", () => {',
    '  if (' + expected + ' && !raw.includes(' + expected + ')) {',
    '    process.stderr.write("exact BigInt JSON input fragment missing");',
    '    process.exitCode = 2;',
    '    return;',
    '  }',
    '  process.stdout.write(' + JSON.stringify(payload) + ');',
    '});',
  ].join(' ')
}

describe('Haskell Issue admission provider', () => {
  it('serializes nested BigInts as exact JSON integer tokens without Number coercion', () => {
    const serialized = stringifyHaskellIssueInput({
      preState: {
        crystallizedLiabilities: 9_007_199_254_740_993n,
        nested: [{ reserve: 123_456_789_012_345_678_901n }],
      },
      preEEV: 2_000n,
      candidateEEV: 2_000n,
      availableExecutableLiquidity: 200_000n,
      requiredImmediateLiquidity: 150_000n,
      ordinaryString: 'USDM_SUBUNITS',
    })

    expect(serialized).toContain('"crystallizedLiabilities":9007199254740993')
    expect(serialized).toContain('"reserve":123456789012345678901')
    expect(serialized).toContain('"preEEV":2000')
    expect(serialized).toContain('"availableExecutableLiquidity":200000')
    expect(serialized).toContain('"requiredImmediateLiquidity":150000')
    expect(serialized).toContain('"ordinaryString":"USDM_SUBUNITS"')
    expect(serialized).not.toContain('"9007199254740993"')
  })

  it('rejects collisions with the reserved BigInt JSON marker', () => {
    expect(() => stringifyHaskellIssueInput({
      comment: '__IMMORTAL_BIGINT_JSON_NUMBER__:42',
    })).toThrow('reserved BigInt JSON marker')
    expect(() => stringifyHaskellIssueInput({
      __IMMORTAL_BIGINT_JSON_NUMBER__: '42',
    })).toThrow('reserved BigInt JSON marker')
  })

  it('rejects a signed carrier binding when Haskell recomputes a different digest', () => {
    const computed = {
      stateHash: '4'.repeat(64),
      actionFingerprint: '6'.repeat(64),
      postStateHash: '5'.repeat(64),
    }
    expect(() => assertHaskellDecisionMatchesAuthorityBinding(
      computed,
      { ...computed, actionFingerprint: '9'.repeat(64) },
    )).toThrow('Haskell Issue actionFingerprint does not match signed authority carrier binding')
    expect(() => assertHaskellDecisionMatchesAuthorityBinding(
      computed,
      { ...computed, stateHash: '9'.repeat(64) },
    )).toThrow('Haskell Issue stateHash does not match signed authority carrier binding')
    expect(() => assertHaskellDecisionMatchesAuthorityBinding(
      computed,
      undefined,
    )).toThrow('signed authority carrier decision binding is required')
  })

  it('binds Haskell decision coordinates and ProtectedCapital provenance', async () => {
    const eev = eevQualification()
    const certificate = viabilityCertificate()
    const protectedCapital = pc()

    const provider = createHaskellIssueAdmissionProvider({
      command: execPath,
      args: ['-e', producerScript('"crystallizedLiabilities":9007199254740993')],
      observationSource: async () => ({
        decisionInput: {
          preState: v3PreStateWithLargeInteger(),
          classId: 0n,
          price: 1n,
          preEEV: 2_000n,
          candidateEEV: 2_000n,
          availableExecutableLiquidity: 200_000n,
          requiredImmediateLiquidity: 150_000n,
          truthVerified: true,
          eevFresh: true,
          obligationsComplete: true,
          allOmegaSuccessorsCertified: true,
          decisionReference,
          observationReference,
        },
        decisionReference,
        observationReference,
        authorityDecisionBinding: {
          stateHash: '4'.repeat(64),
          actionFingerprint: '6'.repeat(64),
          postStateHash: '5'.repeat(64),
        },
        poolInputReference: pool,
        poolUsdmValue: 200_000n,
        liquiditySourceReferences: [pool],
        carrierStateReference: carrier,
        controlStateReference: control,
        controlStateReference: control,
        eevQualification: eev,
        protectedCapitalProvenance: protectedCapital,
        viabilityCertificate: certificate,
        carrierBindingSignature: 'a'.repeat(128),
        observedAt: 1000n,
      }),
    })

    const witness = await provider({
      counterInputReference: counter,
      poolInputReference: pool,
      liquiditySourceReferences: [pool],
      poolUsdmValue: 200_000n,
      classId: 0n,
      price: 1n,
      carrierStateReference: carrier,
        controlStateReference: control,
    })

    expect(witness.actionClass).toBe('Issue')
    expect(witness.counterInputReference).toBe(counter)
    expect(witness.preEEV).toBe(2_000n)
    expect(witness.eev).toBe(2_000n)
    expect(witness.authenticatedPoolUsdmValue).toBe(200_000n)
    expect(witness.executableLiquidityObservation.declaredUsdmLiquidity).toBe(200_000n)
    expect(witness.requiredImmediateLiquidity).toBe(150_000n)
    expect(witness.issueClassId).toBe(0n)
    expect(witness.issuePrice).toBe(1n)
    expect(witness.truthVerified).toBe(true)
    expect(witness.eevFresh).toBe(true)
    expect(witness.obligationsComplete).toBe(true)
    expect(witness.allOmegaSuccessorsCertified).toBe(true)
    expect(witness.controlStateReference).toBe(control)
    expect(witness.protectedCapitalProvenance.total).toBe(515n)
    expect(witness.protectedCapitalProvenance.sourceReference).toBe(carrier)
    expect(witness.carrierAuthoritySignature).toBe('a'.repeat(128))
  })

  it('rejects Haskell ProtectedCapital that disagrees with the authority source', async () => {
    const eev = eevQualification()
    const certificate = viabilityCertificate()
    const bad = pc()
    bad.components.safetyCapital = 99n

    const provider = createHaskellIssueAdmissionProvider({
      command: execPath,
      args: ['-e', producerScript()],
      observationSource: async () => ({
        decisionInput: {
          preState: {},
          classId: 0,
          price: 1,
          preEEV: 2_000,
          candidateEEV: 2_000,
          availableExecutableLiquidity: 200_000,
          requiredImmediateLiquidity: 150_000,
          truthVerified: true,
          eevFresh: true,
          obligationsComplete: true,
          allOmegaSuccessorsCertified: true,
          decisionReference,
          observationReference,
        },
        decisionReference,
        observationReference,
        authorityDecisionBinding: {
          stateHash: '4'.repeat(64),
          actionFingerprint: '6'.repeat(64),
          postStateHash: '5'.repeat(64),
        },
        poolInputReference: pool,
        poolUsdmValue: 200_000n,
        liquiditySourceReferences: [pool],
        carrierStateReference: carrier,
        controlStateReference: control,
        eevQualification: eev,
        protectedCapitalProvenance: bad,
        viabilityCertificate: certificate,
        carrierBindingSignature: 'a'.repeat(128),
        observedAt: 1000n,
      }),
    })

    await expect(
      provider({
        counterInputReference: counter,
        poolInputReference: pool,
        liquiditySourceReferences: [pool],
        poolUsdmValue: 200_000n,
        classId: 0n,
        price: 1n,
        carrierStateReference: carrier,
        controlStateReference: control,
      }),
    ).rejects.toThrow('ProtectedCapital mismatch on safetyCapital')
  })
})
