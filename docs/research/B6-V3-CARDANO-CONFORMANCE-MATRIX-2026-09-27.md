# B6 — V3 ↔ Cardano Conformance Matrix — 2026-09-27

## Classification
Evidence/conformance planning only. No canonical economics are changed.

## Action matrix

| Action | Canonical obligation | Cardano evidence needed | Current gap |
|---|---|---|---|
| Issue | exact profile class/price + saleability + reserve/count transition + admissible post-state | authoritative Issue admission + exact Counter/Pool/Ticket/Prize outputs + ledger witness | class saleability must be bound to committed action evidence |
| Reveal | deterministic payout + liability crystallization + post-state validity | Beacon evidence + reference-script execution + exact Pool/Prize continuation + native ledger result | executable-liquidity predicate must be represented as execution witness |
| Claim | liability reduction for crystallized amount | ownership + expiry + oracle settlement quote + exact liability/pool deltas + native ledger result | environment evidence must be bound to committed claim |
| Expire | unresolved right crosses crystallized expiry; reserve release | exact ticket/PrizeDatum + ticket expiry + post-expiry Pool delta + native ledger result | aggregate V3 action requires ticket-level refinement witness |

## RF8 target

The final B6 package must enumerate every economic-state-mutating implementation path and prove that each crosses the authoritative admission/submission boundary or is protected by an equivalent canonical on-chain predicate.

The existing source audit identifies Issue, Reveal, Claim and Expire as the principal application economic transitions. This matrix does not claim that the enumeration is complete.

## Differential replay target

For each action fixture:

1. decode canonical state;
2. normalize Cardano observation;
3. derive canonical expected transition/evidence requirements;
4. construct the Cardano candidate;
5. compare normalized transition facts;
6. run native ledger evaluation where available;
7. persist mismatch artifact on any divergence.

A mismatch is evidence to investigate, not permission to weaken the canonical model or validator.

## Closure rule

B6 is not closed by matching happy-path outputs alone. Negative cases, environment predicates, exact input/output binding, expiry identity, and no-side-door coverage are required.
