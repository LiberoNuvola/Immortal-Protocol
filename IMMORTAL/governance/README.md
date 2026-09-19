# GOV-IMPLEMENTATION-02 — Chain-neutral Governance Core Skeleton

Target branch: `b1-hardening`.

## Files

- `IMMORTAL/governance/Governance.hs`
- `plutus/test/GovernanceTest.hs`

This is the first pure governance-core skeleton. It deliberately does not
modify `EconomicStateV3` or `EconomicKernel`, and it contains no Cardano
serialization or PRE-RICH application policy.

## Frozen rules represented

- ledger entities are the representation boundary;
- voting weight is linear in PRE;
- quorum is `Q/E >= 1/4`;
- ordinary approval is `Y/(Y+N) > 1/2`;
- kernel approval is `Y/(Y+N) >= 2/3`;
- abstention contributes to quorum and not to the approval denominator;
- lifecycle transitions are explicit;
- governance events are replayable.

## Important implementation status

This is a skeleton, not a conformance certificate. Temporal clocks,
snapshot acquisition from chain state, full delegation validation,
challenge/finality windows, emergency expiry enforcement, canonical
serialization, and Cardano integration remain subsequent work.
