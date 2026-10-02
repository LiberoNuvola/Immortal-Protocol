/**
 * CIP-113 / Cardano Adapter boundary.
 *
 * NON-NORMATIVE adapter capability.
 *
 * This module does not implement CIP-113 and does not define economic truth.
 * It binds the concrete CIP-113 deployment/configuration evidence observed by
 * the Cardano Adapter to the transaction being admitted/replayed.
 *
 * IMMORTAL and PRE-RICH economic rules remain authoritative above this layer.
 */
export type Cip113ProgrammableTokenEvidence = {
  deploymentId: string
  protocolParamsReference: string
  registryNodeReference: string
  tokenPolicyId: string
  assetNameHex: string
  transferLogicReference: string
  transactionReference: string
  ownershipCredential: string
  /** Deployment governance/update identity. Never an economic authority. */
  upgradeAuthorityReference: string
}

function nonEmpty(value: string, name: string): void {
  if (!value.trim()) throw new Error(name + ' must be non-empty')
}

function hex(value: string, name: string): void {
  if (!/^[0-9a-fA-F]*$/.test(value)) {
    throw new Error(name + ' must be hexadecimal')
  }
}

export function validateCip113ProgrammableTokenEvidence(
  evidence: Cip113ProgrammableTokenEvidence,
): void {
  nonEmpty(evidence.deploymentId, 'deploymentId')
  nonEmpty(evidence.protocolParamsReference, 'protocolParamsReference')
  nonEmpty(evidence.registryNodeReference, 'registryNodeReference')
  nonEmpty(evidence.tokenPolicyId, 'tokenPolicyId')
  nonEmpty(evidence.transferLogicReference, 'transferLogicReference')
  nonEmpty(evidence.transactionReference, 'transactionReference')
  nonEmpty(evidence.ownershipCredential, 'ownershipCredential')
  nonEmpty(evidence.upgradeAuthorityReference, 'upgradeAuthorityReference')
  hex(evidence.tokenPolicyId, 'tokenPolicyId')
  hex(evidence.assetNameHex, 'assetNameHex')
}

export type Cip113BindingExpectation = Pick<
  Cip113ProgrammableTokenEvidence,
  | 'deploymentId'
  | 'protocolParamsReference'
  | 'registryNodeReference'
  | 'tokenPolicyId'
  | 'assetNameHex'
  | 'transferLogicReference'
  | 'transactionReference'
  | 'ownershipCredential'
>

export function assertCip113EvidenceMatchesTransaction(
  evidence: Cip113ProgrammableTokenEvidence,
  expected: Cip113BindingExpectation,
): void {
  validateCip113ProgrammableTokenEvidence(evidence)

  for (const field of [
    'deploymentId',
    'protocolParamsReference',
    'registryNodeReference',
    'tokenPolicyId',
    'assetNameHex',
    'transferLogicReference',
    'transactionReference',
    'ownershipCredential',
  ] as const) {
    if (evidence[field] !== expected[field]) {
      throw new Error('CIP-113 ' + field + ' mismatch')
    }
  }
}

/**
 * Upgrade authority is configuration provenance only.
 *
 * This assertion exists specifically to prevent future Adapter code from
 * accidentally treating CIP-113 deployment governance as IMMORTAL authority.
 */
export function assertCip113UpgradeAuthorityIsNotEconomicAuthority(
  economicAuthorityReference: string,
  evidence: Cip113ProgrammableTokenEvidence,
): void {
  nonEmpty(economicAuthorityReference, 'economicAuthorityReference')
  validateCip113ProgrammableTokenEvidence(evidence)

  if (evidence.upgradeAuthorityReference === economicAuthorityReference) {
    throw new Error(
      'CIP-113 upgrade authority must not be reused as economic authority',
    )
  }
}
