const { spawn } = require('node:child_process')
const path = require('node:path')

const DEFAULT_EXECUTABLE = 'issue-admission'

function requiredString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} is required`)
  }
  return value
}

function parseNonNegativeBigInt(value, field) {
  try {
    const parsed = BigInt(String(value))
    if (parsed < 0n) throw new Error('negative')
    return parsed
  } catch {
    throw new Error(`${field} must be a non-negative integer`)
  }
}

function normalizeDecision(raw) {
  if (!raw || raw.admitted !== true || !raw.decision) {
    throw new Error(raw?.error || 'EconomicAdmission rejected Issue')
  }

  const decision = raw.decision

  if (decision.actionClass !== 'Issue') {
    throw new Error('issue-admission returned a non-Issue decision')
  }

  return {
    decisionReference: requiredString(decision.decisionReference, 'decisionReference'),
    authoritativeObservationReference: requiredString(
      decision.authoritativeObservationReference,
      'authoritativeObservationReference',
    ),
    stateHash: requiredString(decision.stateHash, 'stateHash'),
    actionClass: 'Issue',
    actionFingerprint: requiredString(decision.actionFingerprint, 'actionFingerprint'),
    postStateHash: requiredString(decision.postStateHash, 'postStateHash'),
    eev: parseNonNegativeBigInt(decision.preEEV, 'preEEV'),
    availableExecutableLiquidity: parseNonNegativeBigInt(
      decision.availableExecutableLiquidity,
      'availableExecutableLiquidity',
    ),
    requiredImmediateLiquidity: parseNonNegativeBigInt(
      decision.requiredImmediateLiquidity,
      'requiredImmediateLiquidity',
    ),
  }
}

function defaultRunner(input, { cwd }) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'cabal',
      ['run', DEFAULT_EXECUTABLE, '--', '--json'],
      {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: process.env,
      },
    )

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    child.on('error', reject)
    child.on('close', code => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `issue-admission exited with code ${code}`))
        return
      }

      try {
        resolve(JSON.parse(stdout))
      } catch {
        reject(new Error('issue-admission returned invalid JSON'))
      }
    })

    child.stdin.end(JSON.stringify(input))
  })
}

/**
 * Execute the existing canonical Haskell Issue producer and adapt only its
 * decision metadata into the runtime EconomicAdmissionWitness.
 *
 * This module is transport/refinement infrastructure. It does not calculate
 * EEV, liquidity, ProtectedCapital, viability, class state or an economic
 * decision.
 */
async function produceAuthoritativeIssueAdmission({
  decisionInput,
  runtimeInputs,
  runner = defaultRunner,
  plutusDir = path.resolve(__dirname, '..', 'plutus'),
}) {
  if (!decisionInput || typeof decisionInput !== 'object') {
    throw new Error('decisionInput is required')
  }
  if (!runtimeInputs || typeof runtimeInputs !== 'object') {
    throw new Error('runtimeInputs are required')
  }

  const counterInputReference = requiredString(
    runtimeInputs.counterInputReference,
    'counterInputReference',
  )
  const poolInputReference = requiredString(
    runtimeInputs.poolInputReference,
    'poolInputReference',
  )
  const observationReference = requiredString(
    runtimeInputs.observationReference,
    'observationReference',
  )
  const observedAt = parseNonNegativeBigInt(
    runtimeInputs.observedAt,
    'observedAt',
  )
  const poolUsdmValue = parseNonNegativeBigInt(
    runtimeInputs.poolUsdmValue,
    'poolUsdmValue',
  )

  const liquiditySourceReferences = Array.isArray(
    runtimeInputs.liquiditySourceReferences,
  )
    ? runtimeInputs.liquiditySourceReferences.map(ref =>
        requiredString(ref, 'liquiditySourceReference'),
      )
    : []

  if (liquiditySourceReferences.length === 0) {
    throw new Error('at least one liquidity source reference is required')
  }

  if (decisionInput.observationReference !== observationReference) {
    throw new Error(
      'IssueDecisionInput observationReference does not match runtime observation',
    )
  }

  const raw = await runner(decisionInput, { cwd: plutusDir })
  const decision = normalizeDecision(raw)

  if (
    decision.authoritativeObservationReference !==
    observationReference
  ) {
    throw new Error(
      'authoritative Issue decision is bound to a different observation reference',
    )
  }

  if (
    decision.availableExecutableLiquidity !==
    poolUsdmValue
  ) {
    throw new Error(
      'authoritative Issue liquidity does not match observed Pool valuation',
    )
  }

  if (!liquiditySourceReferences.includes(poolInputReference)) {
    throw new Error(
      'authenticated Pool input must be an executable liquidity source',
    )
  }

  return {
    gateVersion: 'economic-gate-v1',
    admitted: true,
    decisionReference: decision.decisionReference,
    authoritativeObservationReference: decision.authoritativeObservationReference,
    stateHash: decision.stateHash,
    actionClass: decision.actionClass,
    actionFingerprint: decision.actionFingerprint,
    postStateHash: decision.postStateHash,
    eev: decision.eev,
    executableLiquidityObservation: {
      observationReference,
      observedAt,
      sourceInputReferences: liquiditySourceReferences,
      utxos: [{
        txHash: poolInputReference.split('#')[0],
        index: Number(poolInputReference.split('#')[1]),
        usdmValue: poolUsdmValue,
        spendable: true,
        ringFenced: false,
      }],
      declaredUsdmLiquidity: poolUsdmValue,
    },
    authenticatedPoolInputReference: poolInputReference,
    authenticatedPoolUsdmValue: poolUsdmValue,
    requiredImmediateLiquidity: decision.requiredImmediateLiquidity,
    counterInputReference,
  }
}

module.exports = {
  produceAuthoritativeIssueAdmission,
}
