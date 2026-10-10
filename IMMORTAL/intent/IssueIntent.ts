/**
 * Chain-neutral declaration of a PRE-RICH Issue transition request.
 *
 * This is intent only:
 * - it does not authorize the transition;
 * - it does not contain EEV, liquidity, saleability or other economic truth;
 * - it does not contain Cardano-specific inputs.
 *
 * Authoritative admission remains the responsibility of the canonical economic
 * / profile layer and its admission witness.
 */
export type IssueIntent = {
  readonly action: 'Issue'
  readonly classId: bigint
  /**
   * Canonical PRE-RICH reference price units (1/2/3/5/10/25/50/100).
   * This is an input to the requested transition, not an assertion that the
   * requested class is currently saleable.
   */
  readonly price: bigint
}
