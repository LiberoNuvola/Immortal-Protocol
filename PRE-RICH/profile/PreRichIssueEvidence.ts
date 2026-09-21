/**
 * PRE-RICH Issue refinement evidence.
 *
 * This module proves the application-side preconditions corresponding to the
 * current V3 Issue transition. It does not mint, sign or submit anything.
 */

export const PRE_RICH_ISSUE_PRICES = [
  1n, 2n, 3n, 5n, 10n, 25n, 50n, 100n,
] as const

export type IssueRefinementEvidence = {
  classId: bigint
  priceReferenceUnits: bigint
  currentActiveClass: bigint
  highestClassEverActivated: bigint
  issued: bigint
  cap: bigint
}

export function issueClassSaleable(
  evidence: IssueRefinementEvidence,
): boolean {
  validateIssueRefinementEvidence(evidence)
  return evidence.classId <= evidence.currentActiveClass &&
    evidence.issued < evidence.cap
}

export function validateIssueRefinementEvidence(
  evidence: IssueRefinementEvidence,
): void {
  if (evidence.classId < 0n || evidence.classId >= BigInt(PRE_RICH_ISSUE_PRICES.length)) {
    throw new Error('unknown PRE-RICH issue class')
  }
  if (evidence.priceReferenceUnits !== PRE_RICH_ISSUE_PRICES[Number(evidence.classId)]) {
    throw new Error('PRE-RICH issue price does not match class')
  }
  if (evidence.currentActiveClass < 0n || evidence.highestClassEverActivated < 0n) {
    throw new Error('class activation state must be non-negative')
  }
  if (evidence.currentActiveClass > evidence.highestClassEverActivated) {
    throw new Error('current active class cannot exceed highest-ever activated class')
  }
  if (evidence.issued < 0n || evidence.cap < 0n) {
    throw new Error('issued count and class cap must be non-negative')
  }
}

export function issueRefinementAdmissible(
  evidence: IssueRefinementEvidence,
): boolean {
  return issueClassSaleable(evidence)
}