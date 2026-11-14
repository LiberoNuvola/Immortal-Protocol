/**
 * Read-only five-component C1 acquired-point observation primitive.
 *
 * This module accepts an explicitly supplied candidate identity envelope and
 * queries all five declared addresses through one already-acquired Ogmios
 * ledger-state session. It does NOT authenticate deployment authority,
 * re-derive scripts, classify PrizeDatum rows, or qualify C1.
 *
 * Candidate inputs remain untrusted until the GOV-30 authority chain exists.
 */

export const C1_COMPONENT_IDS = Object.freeze([
  'prizeValidator',
  'b1Pool',
  'counter',
  'v3Carrier',
  'b2Control',
])

const SINGLETON_COMPONENTS = new Set(['b1Pool', 'v3Carrier', 'b2Control'])

function requiredString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('C1_IDENTITY_' + field + '_REQUIRED')
  }
  return value.trim()
}

function requiredHex(value, bytes, field) {
  const normalized = requiredString(value, field).toLowerCase()
  if (!(new RegExp('^[0-9a-f]{' + (bytes * 2) + '}$')).test(normalized)) {
    throw new Error('C1_IDENTITY_' + field + '_INVALID')
  }
  return normalized
}

/**
 * Structural validation only. A valid result is not an authenticated
 * deployment identity and must never be promoted to deployment authority.
 */
export function validateC1CandidateIdentityEnvelope(envelope) {
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    throw new Error('C1_IDENTITY_ENVELOPE_REQUIRED')
  }
  if (envelope.schema !== 'IMMORTAL-PREPROD-DEPLOYMENT-IDENTITY-v0.1') {
    throw new Error('C1_IDENTITY_SCHEMA_UNSUPPORTED')
  }
  if (envelope.network !== 'cardano-preprod') {
    throw new Error('C1_IDENTITY_NETWORK_MISMATCH')
  }

  const deploymentId = requiredString(envelope.deploymentId, 'DEPLOYMENT_ID')
  const sourceCommit = requiredHex(envelope.source?.commit, 20, 'SOURCE_COMMIT')
  if (!Array.isArray(envelope.components)) {
    throw new Error('C1_IDENTITY_COMPONENTS_REQUIRED')
  }

  const byId = new Map()
  for (const component of envelope.components) {
    const componentId = requiredString(component?.componentId, 'COMPONENT_ID')
    if (!C1_COMPONENT_IDS.includes(componentId)) {
      throw new Error('C1_IDENTITY_COMPONENT_UNKNOWN:' + componentId)
    }
    if (byId.has(componentId)) {
      throw new Error('C1_IDENTITY_COMPONENT_DUPLICATE:' + componentId)
    }
    if (requiredString(component.deploymentId, componentId + '_DEPLOYMENT_ID') !== deploymentId) {
      throw new Error('C1_IDENTITY_DEPLOYMENT_GENERATION_MISMATCH:' + componentId)
    }
    if (requiredHex(component.sourceCommit, 20, componentId + '_SOURCE_COMMIT') !== sourceCommit) {
      throw new Error('C1_IDENTITY_SOURCE_COMMIT_MISMATCH:' + componentId)
    }
    requiredString(component.address, componentId + '_ADDRESS')
    if (component.paymentCredentialKind !== 'script') {
      throw new Error('C1_IDENTITY_PAYMENT_CREDENTIAL_KIND_INVALID:' + componentId)
    }
    requiredHex(component.paymentCredentialHash, 28, componentId + '_PAYMENT_CREDENTIAL_HASH')
    requiredHex(component.derivedScriptHash, 28, componentId + '_DERIVED_SCRIPT_HASH')
    requiredHex(component.parameterDigest, 32, componentId + '_PARAMETER_DIGEST')
    requiredString(component.deploymentTxOutRef, componentId + '_DEPLOYMENT_TX_OUT_REF')

    if (SINGLETON_COMPONENTS.has(componentId)) {
      requiredHex(component.singleton?.policyId, 28, componentId + '_SINGLETON_POLICY_ID')
      const tokenNameHex = requiredString(component.singleton?.tokenNameHex, componentId + '_SINGLETON_TOKEN_NAME')
      if (!/^(?:[0-9a-fA-F]{2}){1,32}$/.test(tokenNameHex)) {
        throw new Error('C1_IDENTITY_SINGLETON_TOKEN_NAME_INVALID:' + componentId)
      }
    } else if (component.singleton != null) {
      throw new Error('C1_IDENTITY_UNEXPECTED_SINGLETON:' + componentId)
    }

    byId.set(componentId, component)
  }

  for (const componentId of C1_COMPONENT_IDS) {
    if (!byId.has(componentId)) {
      throw new Error('C1_IDENTITY_COMPONENT_MISSING:' + componentId)
    }
  }

  return {
    deploymentId,
    sourceCommit,
    components: C1_COMPONENT_IDS.map(componentId => byId.get(componentId)),
    identityConsistency: 'STRUCTURAL_INPUT_CHECKS_ONLY',
    deploymentAuthorityVerified: false,
    c1Qualified: false,
  }
}

/**
 * Query the five exact candidate addresses at the same acquired ledger point.
 * Raw Ogmios responses are retained unchanged for independent decoding.
 */
export async function observeC1ComponentsAtAcquiredPoint({
  ledgerSession,
  identityEnvelope,
}) {
  if (!ledgerSession || ledgerSession.isAcquired !== true ||
      ledgerSession.isReleased !== false || !ledgerSession.point) {
    throw new Error('C1_OBSERVER_REQUIRES_ACTIVE_ACQUIRED_LEDGER_SESSION')
  }

  const identity = validateC1CandidateIdentityEnvelope(identityEnvelope)
  const acquiredPoint = { ...ledgerSession.point }
  const observations = {}

  for (const component of identity.components) {
    const raw = await ledgerSession.query('queryLedgerState/utxo', {
      addresses: [component.address],
    })
    if (!Array.isArray(raw)) {
      throw new Error('C1_OBSERVER_UTXO_RESPONSE_NOT_ARRAY:' + component.componentId)
    }
    if (ledgerSession.isAcquired !== true || ledgerSession.isReleased !== false ||
        JSON.stringify(ledgerSession.point) !== JSON.stringify(acquiredPoint)) {
      throw new Error('C1_OBSERVER_LEDGER_SESSION_POINT_CHANGED:' + component.componentId)
    }

    observations[component.componentId] = {
      address: component.address,
      rawUtxoCount: raw.length,
      rawOgmiosUtxoResult: raw,
      cardinalityStatus: 'NOT_EVALUATED_RAW_VALUE_DECODER_REQUIRED',
    }
  }

  return {
    schema: 'IMMORTAL-PREPROD-C1-ACQUIRED-POINT-RAW-OBSERVATION-v0.1',
    network: 'cardano-preprod',
    deploymentId: identity.deploymentId,
    sourceCommit: identity.sourceCommit,
    acquiredLedgerState: acquiredPoint,
    queryConsistency: 'ONE_ACQUIRED_OGMIOS_LEDGER_STATE',
    componentOrder: [...C1_COMPONENT_IDS],
    observations,
    identityConsistency: identity.identityConsistency,
    deploymentAuthorityVerified: false,
    cardinalityQualified: false,
    prizeValidatorPopulationClassified: false,
    c1Qualified: false,
    qualificationBlockers: [
      'GOV_30_TRUST_ROOT_AND_AUTHORIZED_DEPLOYMENT_ATTESTATION_UNRESOLVED',
      'SCRIPT_AND_PARAMETER_REDERIVATION_NOT_PERFORMED_BY_THIS_OBSERVER',
      'SINGLETON_CARDINALITY_REQUIRES_INDEPENDENT_OGMIOS_VALUE_DECODER',
      'PRIZEVALIDATOR_POPULATION_CLASSIFICATION_NOT_PERFORMED_BY_THIS_OBSERVER',
      'B1_V3_AGGREGATE_RECONCILIATION_NOT_PERFORMED',
    ],
  }
}
