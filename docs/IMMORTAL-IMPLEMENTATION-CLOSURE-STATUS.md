# IMMORTAL — Implementation & Conformance Closure Status

**Snapshot branch:** `edf125ba8068a7c18c30920a2ed4aca3a89030fb`
**Classification:** non-normative implementation/evidence checkpoint
**Date:** 2026-09-21

## 1. Closed policy boundaries

| Area | Status | Canonical result |
|---|---|---|
| IMMORTAL / Adapter / PRE-RICH ownership | CLOSED | Universal economic semantics remain in IMMORTAL; Cardano realization remains Adapter; PRE-RICH owns application policy. |
| Ticket expiry semantics | CLOSED | Deterministic DApp/profile horizon crystallized at issuance; expiry final; late reveal economically inert. |
| Exact expiry duration | OPEN POLICY | No universal number; historical 365-day value is non-canonical. |
| Jackpot ownership | CLOSED | Jackpot is PRE-RICH policy, not an IMMORTAL universal primitive. |
| Ticket ladder | CLOSED AS PRE-RICH | 1/2/3/5/10/25/50/100 USDM belongs to PRE-RICH profile. |
| Max normal payout | CLOSED AS PRE-RICH | 500×P belongs to PRE-RICH profile. |
| Hysteresis | CLOSED AS PRE-RICH | KA=8, KC=4, KD=4 are application policy; exact integer predicates implemented. |

## 2. Verified implementation evidence

| Front | Status | Evidence |
|---|---|---|
| B2 numerical hysteresis | GREEN / bounded | Dedicated exact-integer implementation and CI conformance. |
| B3-D GameRules replay | GREEN / bounded | Canonical 20,000-domain replay vectors and CI evidence. |
| B3 payout units | GREEN / bounded | 2.5 USDM represented exactly as 250 sub-units; no truncation bug. |
| B5 Economic Gate interface | IMPLEMENTED / evidence continuing | Explicit verified EEV + immediately executable liquidity + separate Viability witness. |
| Cardano Adapter semantic suite P2.7 | GREEN | 4 Adapter tests + 4 reveal tests + 14/14 P2.7 native `node:test` subtests. |
| PRE-RICH action refinement | GREEN | Issue, Expire, expiry policy and certified ticket tests; current TypeScript conformance passes. |
| RF9 ticket expiry refinement | GREEN | Dedicated ticket-level expiry evidence. |
| R4 liveness classifier | GREEN | FM1–FM10 classifier passes dedicated CI after precedence correction. |
| 3D certified ticket boundary | IMPLEMENTED | NFT identity/state binding separated from presentation renderer; renderer has no economic authority. |
| Frontend build | GREEN | Vite build passes after separating browser/runtime boundary. |
| Governance replay/registry | INTEGRATED INTO HASKELL GATE | Core governance suites registered; current final Haskell result pending in latest run. |
| Materios evidence packet | IMPLEMENTED / bounded | Deterministic anchor tuple binding; finality/storage proof authenticity remains external verifier work. |

## 3. Explicit remaining certification gaps

| Gap | Why it remains open |
|---|---|
| B3-A Materios canonicality | Existing PoCs can parse/finalize/verify, but publisher-independent canonicality must be proven against the full finality/authority/ancestry/perimeter contract. |
| B3-B State authentication | Storage proof and final StateRoot→value binding remain external verifier obligations; packet schema alone is not proof. |
| B3-C succinct/ZK | Proof system is not canonically fixed; choice depends on verifier feasibility, script size and execution budget. |
| RF8 no-side-door | Whole-program proof requires enumeration of every economic-state-mutating path, not only current tests. |
| RF6 Ω completeness | Real environment perimeter and over-approximation certificate require deployment-specific evidence. |
| Non-vacuity / Kc | Concrete S0/QNE/certificate E1–E10 are deployment/profile evidence, not universal math. |
| B2 live/on-chain control integration | Hysteresis reference is implemented, but live PRE-RICH control datum/on-chain enforcement is separate. |
| Jackpot activation on-chain | Application policy is defined, but current B1 datum lacks current/highest class state needed for a faithful direct on-chain predicate. |
| 3D production UI wiring | Certified boundary and renderer exist; production page integration remains a UI task, not a protocol task. |
| P2.8 full lifecycle | Yaci lab remains the final real-ledger evidence gate for the whole Issue→Reveal→Claim/Expire path. |
| Haskell final regression | Toolchain run still needs a completed result on the latest branch snapshot. |

## 4. Anti-regression decisions

- Never promote placeholders or historical values to canon.
- Never weaken an invariant to make a test pass.
- Never move PRE-RICH Jackpot/ladder/500×/KA-KC-KD into universal IMMORTAL state.
- Never treat renderer state, relayer state or frontend state as economic authority.
- Never treat a passing bounded replay as a proof of infinite-horizon viability.
- Never treat schema validation as cryptographic authenticity.

## 5. Final closure criterion

The implementation baseline can be called **operationally green** when the current-head Haskell regression and Yaci/P2.8 lab complete successfully. The project can be called **fully certified** only after the deployment-specific R1–R8/RF1–RF11 evidence packages, including Ω perimeter, Kc/non-vacuity, no-side-door and external canonical-state proof, are actually attached to a concrete deployment.

This distinction is deliberate: it prevents implementation green from being misreported as mathematical or deployment certification.