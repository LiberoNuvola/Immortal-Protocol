/**
 * PRE-RICH / CIP-113 isolation rules.
 *
 * Adapter-level only. These predicates do not define PRE-RICH economics.
 * They prevent a programmable-token realization from being accepted when
 * its token-level operation is not represented by the canonical transition.
 */
export type Cip113OperationKind =
  | 'Transfer'
  | 'Unfracking'
  | 'ThirdParty'
  | 'Mint'
  | 'Burn'

export type Cip113OperationEvidence = {
  deploymentId: string
  transactionReference: string
  operation: Cip113OperationKind
  ownershipBefore: string
  ownershipAfter: string
  tokenQuantityBefore: bigint
  tokenQuantityAfter: bigint
  canonicalTransitionReference: string | null
}

function nonEmpty(value: string, name: string): void {
  if (!value.trim()) throw new Error(name + ' must be non-empty')
}

export function assertCip113OperationEvidence(
  evidence: Cip113OperationEvidence,
): void {
  nonEmpty(evidence.deploymentId, 'deploymentId')
  nonEmpty(evidence.transactionReference, 'transactionReference')
  nonEmpty(evidence.ownershipBefore, 'ownershipBefore')
  nonEmpty(evidence.ownershipAfter, 'ownershipAfter')
  if (evidence.tokenQuantityBefore < 0n || evidence.tokenQuantityAfter < 0n) {
    throw new Error('CIP-113 token quantities must be non-negative')
  }
}

export function assertCip113OperationIsEconomicallyBound(
  evidence: Cip113OperationEvidence,
): void {
  assertCip113OperationEvidence(evidence)
  if (!evidence.canonicalTransitionReference?.trim()) {
    throw new Error(
      'CIP-113 operation has no canonical economic transition binding',
    )
  }
}

/**
 * Third-party actions are never implicitly admitted as ordinary transfers.
 */
export function assertCip113ThirdPartyActionExplicitlyAdmitted(
  evidence: Cip113OperationEvidence,
): void {
  assertCip113OperationEvidence(evidence)
  if (evidence.operation !== 'ThirdParty') {
    throw new Error('expected CIP-113 ThirdParty operation')
  }
  throw new Error(
    'CIP-113 ThirdParty operation requires an explicit PRE-RICH authorization profile',
  )
}

/**
 * Unfracking is representation-level only unless an explicit canonical
 * transition binding exists.
 */
export function assertCip113UnfrackingIsRepresentationOnly(
  evidence: Cip113OperationEvidence,
): void {
  assertCip113OperationEvidence(evidence)
  if (evidence.operation !== 'Unfracking') {
    throw new Error('expected CIP-113 Unfracking operation')
  }
  if (evidence.ownershipBefore !== evidence.ownershipAfter) {
    throw new Error('CIP-113 Unfracking changed ownership')
  }
  if (evidence.tokenQuantityBefore !== evidence.tokenQuantityAfter) {
    throw new Error('CIP-113 Unfracking changed token quantity')
  }
}

/**
 * Mint/burn cannot become an economic transition merely because CIP-113
 * issuance logic accepts it.
 */
export function assertCip113MintBurnHasCanonicalBinding(
  evidence: Cip113OperationEvidence,
): void {
  assertCip113OperationEvidence(evidence)
  if (evidence.operation !== 'Mint' && evidence.operation !== 'Burn') {
    throw new Error('expected CIP-113 Mint or Burn operation')
  }
  assertCip113OperationIsEconomicallyBound(evidence)
}

/**
 * A historical transaction is not current deployment evidence if its
 * deployment identity changed.
 */
export function assertCip113ReplayDeployment(
  evidence: Cip113OperationEvidence,
  expectedDeploymentId: string,
): void {
  assertCip113OperationEvidence(evidence)
  nonEmpty(expectedDeploymentId, 'expectedDeploymentId')
  if (evidence.deploymentId !== expectedDeploymentId) {
    throw new Error('CIP-113 deployment identity mismatch on replay')
  }
}
