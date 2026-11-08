# Agent B — Statistical Issue Decision Binding Contract v0.1

**Date:** 2026-11-08  
**Branch:** \`work/immortal-green-closure\`  
**Baseline HEAD:** \`d67997372c9605910167f06f2cf67bc89c7a8215\`  
**Classification:** TECHNICAL CONTRACT PROPOSAL — NON-NORMATIVE / NOT IMPLEMENTATION AUTHORITY  
**Owner:** Agent B — IMMORTAL kernel, Plutus and verification boundary  
**Economic-policy owner:** Agent A / PRE-RICH specification authority  
**Scope:** PRE-RICH Scratch & Win statistical-cohort candidate only. D3 Arb Agent and its capital perimeter are excluded.

## 1. Purpose and disposition

This contract defines the minimum evidence binding required before a statistical risk assessment could be considered by an Issue admission path. It binds one assessment to:

1. one application profile and risk policy;
2. one exact candidate Issue action and pre-/post-state;
3. one complete, frozen, pre-outcome cohort;
4. one B1 Pool snapshot and a non-overlapping capital perimeter;
5. one authenticated game/randomness model and Beacon evidence set;
6. one reproducible integer calculation and its evidence.

It does **not** select a RiskMode, S-OBSERVE / S-GATE / S-COHORT / S-HYBRID, any \`ε\`, horizon, confidence level, quorum, source, fallback, or capital-allocation policy. It does not approve replacing V1's 500× floor.

### Current implementation boundary

The reviewed branch currently has these independent constraints:

- PRE-RICH V1 admission fixes \`preRichEconomicProfileV1\` and projects unresolved WCE as \`500 × Σ(P_i × N_i)\`.
- \`UniversalEconomicKernel.protectedCapital\` includes that WCE and requires \`EEV >= ProtectedCapital\`.
- B1 \`TicketIssued\` independently increments the face-price reserve and requires the post-state deterministic \`solvencyInvariant\`.
- \`RiskProtectionBridge\` accepts only the exact deterministic assessment; statistical-only and combined modes fail closed, and the bridge is not wired into \`PreRichEconomicAdmission\`.
- \`V3EconomicStateCarrier\` requires an Ed25519 signature verified against a configured authority public key.
- \`BeaconRegistry\` verifies a configured relayer signature and deterministic Beacon derivation from supplied context; it does not independently verify the external Materios receipt.

Consequently, a statistical certificate alone cannot increase current V1 capacity, cannot bypass B1's 500× check, and cannot make the present signed Issue/Beacon path fully permissionless. These are separate implementation and authority gates.

## 2. Core invariants

A future implementation MUST enforce all of the following:

**BIND-1 — Profile immutability.** Every decision is bound to the exact application profile identifier, version and canonical profile digest. A caller cannot select or downgrade the mode.

**BIND-2 — Exact action binding.** The decision is for one \`Issue(classId, price)\`, exact input state, exact candidate output state and exact transaction context. A decision for one ticket, class, price, round or state cannot authorize another.

**BIND-3 — Complete cohort membership.** The cohort commitment must represent every included Pending ticket exactly once. A Merkle root alone proves integrity of a supplied set, not completeness of that set. Completeness must arise from an on-ledger append-only enrollment transition that is atomically coupled to every included Issue.

**BIND-4 — Pre-outcome boundary.** At the applicable freeze boundary, every included BeaconTarget must still be \`BeaconPending\`; no included result may already be available to a ticket holder. The member set is closed before any included Beacon becomes Ready.

**BIND-5 — Model validity.** The canonical Classic-6 marginal distribution, game configuration and ticket commitment/randomness assumptions must be authenticated and version-bound. Commit-before-Beacon is necessary but does not alone prove Beacon unpredictability, bias resistance or validity of the marginal model.

**BIND-6 — One capital perimeter.** All included rounds sharing a B1 Pool are evaluated as one aggregate cohort. Separate rounds cannot independently reuse the same \`effectivePool\` or risk budget.

**BIND-7 — No capital or risk-budget reuse.** Capital committed to excluded/older epochs is deducted exactly once through an authenticated disjoint allocation. A lifetime risk budget cannot be reset at each Issue, Beacon round or state refresh.

**BIND-8 — Exact arithmetic.** All monetary inputs use one explicitly bound integer unit and scale. Statistical verification uses exact integer/rational arithmetic, not floating-point values or caller-supplied probability scalars.

**BIND-9 — Atomicity and replay resistance.** The Issue transaction updates the Pool and cohort accumulator atomically with the ticket/NFT and PrizeDatum creation. The same cohort state or decision cannot be consumed twice.

**BIND-10 — Permissionless verification.** A verifier must establish the decision from public, ledger-bound facts or a verifiable proof of those facts. A trusted API response, caller boolean, static signer or relayer assertion is not by itself a permissionless proof.

**BIND-11 — Existing-ticket immutability.** A new profile applies only to new commitments. It cannot rewrite existing ticket terms, payout rules, expiry rights or a previously committed cohort.

**BIND-12 — Fail closed.** Missing, ambiguous, stale, inconsistent, unverifiable, overlapping or out-of-policy evidence yields no statistical admission.

## 3. Canonical decision envelope

The following is a semantic contract, not a frozen Haskell record or datum ABI. All fields that affect the decision must be included in a versioned canonical encoding and its digest.

### 3.1 Domain and policy binding

Required fields:

- \`networkId\`;
- \`applicationId\` and \`profileVersion\`;
- canonical \`profileDigest\`;
- \`riskPolicyId\`, \`riskPolicyVersion\` and \`riskPolicyDigest\`;
- \`modelId\`, \`modelVersion\` and \`modelDigest\`;
- \`decisionSchemaVersion\`;
- the authorized analysis set / RiskMode resolved by the profile policy;
- the policy authority/evidence reference that makes this profile and policy authoritative.

The policy authority reference is provenance only unless the verifier can independently validate its authority and currentness. A digest of an unapproved document does not make that document normative.

### 3.2 State and Issue-action binding

Required fields:

- exact V3 carrier input reference (\`txId#index\`), datum hash and state version;
- canonical pre-state hash;
- exact action constructor and parameters, including ticket class and integer price;
- exact candidate post-state hash;
- canonical action fingerprint;
- decision and observation references;
- exact B1 Pool input reference and B1 datum hash;
- transaction/network binding sufficient to prove that the decision is consumed only by the intended state transition.

The action fingerprint must be domain-separated and cover the profile, policy, action, pre-state, post-state and cohort/capital snapshot digests. Human-readable references are not substitutes for canonical hashes.

A state hash without its input UTxO reference and version is insufficient for replay resistance. A repeated datum can appear in another context; the decision must be tied to the specific state transition being consumed.

### 3.3 Cohort / risk-epoch binding

Required semantic fields:

- globally unique \`cohortId\` and monotonic \`epochSequence\`;
- \`cohortStatus\` with at least OPEN and FROZEN states;
- exact B1 Pool identity to which the cohort belongs;
- canonical \`membershipRoot\`;
- \`memberCount\`;
- aggregate face value \`F = ΣP_i\`;
- selected BeaconTarget set and its canonical digest;
- enrollment start and freeze ledger references;
- freeze sequence / state version;
- explicit proof that membership is closed and cannot be extended.

Each membership leaf must bind, at minimum:

- ticket NFT policy and token name;
- exact PrizeDatum input/output reference or canonical datum hash;
- exact ticket price and its unit;
- game/profile/configuration version;
- exact BeaconTarget (network, round, mainchain reference and version);
- the corresponding BeaconRegistry reference and datum hash at enrollment/freeze;
- Pending status at the freeze boundary.

The ledger transition maintaining membership must reject duplicate tickets, duplicate leaves, a ticket associated with another Pool, price mismatch and a ticket already outside Pending status.

**Completeness requirement:** the current B1 datum stores aggregate reserve/count, not a membership root or epoch. A future accumulator must be updated atomically with every cohort Issue, with its count and face sum reconciled against B1. A Merkle root supplied by an off-chain agent without this append-only ledger transition is insufficient.

**Freeze semantics:** while OPEN, each candidate Issue must extend the same accumulator and re-evaluate the full candidate cohort bound. Before any included Beacon may transition to Ready, the cohort must move to FROZEN. Once FROZEN, no Issue may append to it. If an included Beacon becomes Ready before freeze, the unconditional static-cohort model is invalid for that epoch; do not silently exclude the affected tickets or treat them as fresh marginal draws.

### 3.4 Randomness / Beacon binding

For every selected BeaconTarget, bind:

- exact BeaconRegistry UTxO reference and datum hash;
- target identity and version;
- pre-freeze status \`BeaconPending\`;
- commitment context and digest;
- external randomness receipt/proof reference and digest;
- verifier identity/version and the result of independent proof verification;
- evidence that the result was not available before the cohort freeze;
- ticket commitment and game seed-derivation version.

The verifier must establish the source's relevant authenticity, finality, unpredictability and anti-grinding properties under the approved randomness profile. A non-empty \`materiosContext\`, an observer timestamp, a relayer signature or a self-declared \`VERIFIED\` flag is not sufficient.

The current \`BeaconRegistry\` validator explicitly does not verify the external Materios receipt. Until an independently verifiable randomness path exists, the Classic-6 marginal assumption remains conditional and the Cantelli result cannot be treated as a trustless admission guarantee.

### 3.5 Capital snapshot and non-overlap

Required fields:

- exact B1 Pool UTxO reference, datum hash, script identity and Pool authority NFT identity;
- all B1 datum quantities at the same ledger cut: total liquidity, pending liabilities, unresolved face reserve, unresolved count and locked Jackpot;
- exact asset identities, quantities and unit scales represented by the Pool value;
- valuation/source evidence used to derive the B1 USDM accounting value, including quote/feed identity, publication timestamps, policy and verifier references;
- computed \`effectivePool\` and its derivation digest;
- \`C_other\`: capital committed to excluded/older/parallel epochs, with evidence of its provenance and disjointness;
- cohort budget \`E* = effectivePool - C_other\`;
- explicit unit equality between \`E*\`, \`F\` and the model's payout unit.

The B1 accounting equation is:

\`\`\`text
effectivePool =
  ppTotalLiquidity
  - ppPendingLiabilities
  - ppUnresolvedReserve
  - ppLockedJackpot
\`\`\`

The statistical cohort budget is a further perimeter:

\`\`\`text
E* = effectivePool - C_other
\`\`\`

The subtraction is valid only where \`C_other\` is independently evidenced and does not overlap any obligation already deducted in \`effectivePool\`. Missing allocation evidence means the cohort budget is unavailable, not zero.

The \`effectivePool\` used in B1 is an accounting value. In the current implementation \`ppTotalLiquidity\` is recomputed using \`Economic.poolUsdmValue\`, which values Pool assets through the configured Oracle State. This must not be misrepresented as a direct physical tUSDM balance or immediately executable USD liquidity. The capital contract must separately state whether the candidate guarantee is over the B1 accounting predicate, directly verified settlement assets, or a qualified executable basket. It cannot switch among these meanings implicitly.

Do not substitute gross Pool Value, gross Treasury bootstrap, EEV alone, an unqualified mark-to-market price or a caller-supplied balance for \`E*\`. The existing Issue #37 direct-tUSDM EEV profile remains a separate narrow qualification and does not itself qualify USD/USDM conversion or every B1 Pool asset.

### 3.6 Model and statistical policy binding

For the currently researched Classic-6 candidate, bind:

- exact payout table / PMF digest;
- game rules and sampling algorithm versions;
- cap and payout semantics;
- exact marginal moments:
  - \`μ = 20799 / 32000\`;
  - \`σ² = 9164987571 / 204800000\`;
- the ticket price vector or a proven aggregate \`F\`;
- a governed rational risk ceiling \`ε = a / b\`, where policy defines valid positive integers and \`0 < a < b\`;
- risk horizon, epoch scope and lifetime risk-budget allocation rule;
- any conditions under which each ticket's unconditional marginal law remains valid.

The moments above are research-derived for the current canonical Classic-6 ticket-level PMF. They are not permission to reuse them for another game version, payout table, seed derivation or randomness source.

No value of \`ε\`, risk horizon, lifetime allocation or policy mode is selected here.

### 3.7 Calculation result

Let \`F = ΣP_i\` and \`C = E*\`, represented in the same USDM sub-unit scale. For the currently researched Classic-6 moments and a rational \`ε = a/b\`, define:

\`\`\`text
D = 32000*C - 20799*F
require D > 0

5*(b-a)*9164987571*F^2 <= a*D^2
\`\`\`

The result object must bind:

- formula identifier and version;
- exact \`F\`, \`C\`, \`D\`, \`a\` and \`b\`;
- left- and right-hand integer products (or a verifiable proof of the comparison);
- model, cohort, capital and policy digests;
- a deterministic PASS/FAIL result.

No rounded probability, floating-point scalar or unsigned JSON \`passed=true\` is an acceptable substitute. The verifier must recompute the predicate or verify a proof that is bound to the exact canonical inputs.

## 4. Required state machine

A permissionless implementation needs an on-ledger cohort state machine with semantics equivalent to:

1. **OPEN:** ticket Issues atomically enroll exact Pending ticket leaves and update member count, aggregate face value and membership commitment.
2. **Admission check:** each candidate Issue evaluates the full post-Issue cohort against the same Pool capital perimeter, model and risk-budget version. It cannot evaluate only the newly purchased ticket.
3. **FREEZE:** a deterministic, publicly callable transition closes membership. It proves every included BeaconTarget remains Pending and records the final root, count, face sum, Pool snapshot and epoch version.
4. **READY:** Beacon publication is permitted only after the cohort is frozen and the publication remains bound to the included target.
5. **RESOLUTION:** Reveal / Expire / Claim may proceed under the modeled lifecycle. No new Issue or unmodeled Pool-draining outflow may consume the cohort's reserved capital while the fixed-set theorem is relied upon.
6. **CLOSED:** the epoch can close only after its members have reached terminal lifecycle states and all accounting has reconciled. Its risk budget cannot be reused.

If new Issues are permitted after an included result becomes available, the unconditional Cantelli proof no longer applies. Such an adaptive path requires a separate conditional-moment contract over the full adversarial information history, including private information and strategic withholding. It is not a routine refresh of the same assessment.

## 5. Permissionless / trustless acceptance criteria

The certificate must be accepted from public and verifiable facts, not from the identity of its producer.

- Any user/keeper may construct and submit the transaction.
- Validators verify state continuity, exact membership updates, freeze state, capital perimeter, policy/model binding and calculation proof.
- No administrator selects the price, cohort membership after observing outcomes, risk mode, risk ceiling or preferred fallback.
- No single publisher or service can authoritatively set \`VERIFIED\` without an independently checked proof.
- Registry currentness and revocation must be ledger-verifiable or proof-backed with an independently verified authorization predicate.
- Beacon authenticity and unpredictability must be independently verifiable.
- Failure of any required proof stalls the new Issue; it does not fall back to an older quote, a stale Beacon or a hidden signer decision.

**Existing blocker:** the current V3 Carrier checks an Ed25519 signature against a configured public key, and the current Beacon Registry checks a configured relayer signature. Therefore this proposal cannot be called fully permissionless while those signatures remain the final admission/publication authorities. A future trust-minimizing design must replace these dependencies with deterministic ledger-verifiable authorization/proof rules, or explicitly declare the residual governance/trust assumption. Do not relabel the present path as trustless.

## 6. Atomicity, replay and lifecycle rules

A future Issue transaction using a statistical epoch must prove, atomically:

- it consumes the exact prior Pool and cohort-state UTxOs;
- it creates exactly one valid successor for each required state carrier;
- it appends exactly one unique ticket membership leaf;
- its leaf price equals the PrizeDatum price and B1 reserve delta;
- its cohort count and face sum equal the complete accumulator update;
- its profile/policy/model and epoch sequence match the active state;
- its Issue decision/action fingerprint matches the pre/post-state transition;
- the exact ticket NFT and Pending PrizeDatum are created in the same transaction;
- no included Beacon has become Ready before the valid freeze boundary;
- the statistical calculation is valid for the entire candidate cohort.

The same certificate must not authorize a second Issue, another Pool, another network, a different ticket price, another game version or another state version. Replaying a prior decision against a new UTxO, even with identical datum bytes, must fail.

Any external Pool outflow, new Issue, changed model, changed policy, Beacon publication before freeze, or capital reallocation not covered by the frozen contract invalidates the static-cohort admission basis. The protocol must then use a separately proved transition or remain quiescent; it must not silently carry forward the prior \`E*\` or \`ε\`.

## 7. Conformance test matrix

All tests below are required before any production consumer integration. These are test requirements, not claims that tests were run.

| ID | Adversarial input | Required result |
|---|---|---|
| BIND-01 | Wrong profile/policy/model digest | Reject |
| BIND-02 | Wrong pre-state UTxO reference, datum hash or version | Reject |
| BIND-03 | Action fingerprint for another class, price or action | Reject |
| BIND-04 | Candidate post-state hash mismatch | Reject |
| BIND-05 | Same decision replayed against another Pool/network/epoch | Reject |
| COHORT-01 | Duplicate ticket NFT or membership leaf | Reject |
| COHORT-02 | Missing member while count/face sum is forged | Reject |
| COHORT-03 | Membership root not produced by atomic on-ledger enrollment | Reject |
| COHORT-04 | Ticket price differs from PrizeDatum/B1 reserve delta | Reject |
| COHORT-05 | Member belongs to another Pool or game version | Reject |
| COHORT-06 | Included Beacon already Ready at freeze | Reject |
| COHORT-07 | New member after FROZEN | Reject |
| COHORT-08 | One included round omitted from a shared-Pool risk set | Reject |
| BEACON-01 | Relayer signature without independently verified receipt | Reject as insufficient proof |
| BEACON-02 | Wrong target, version, context digest or registry reference | Reject |
| BEACON-03 | Result available before freeze | Reject |
| CAPITAL-01 | Pool reference/datum hash changed | Reject |
| CAPITAL-02 | Gross Pool Value substituted for net effectivePool | Reject |
| CAPITAL-03 | Missing or overlapping \`C_other\` allocation evidence | Reject |
| CAPITAL-04 | Same capital tranche counted in two epochs | Reject |
| CAPITAL-05 | Capital units/scales differ from \`F\` | Reject |
| CAPITAL-06 | Oracle valuation evidence stale, unqualified or wrong asset pair | Reject |
| MODEL-01 | Wrong PMF, game rules or seed-derivation digest | Reject |
| MODEL-02 | Historical one-row moments used for current Classic-6 | Reject |
| MODEL-03 | Unsupported heterogeneous profile treated as common marginal | Reject |
| MODEL-04 | Floating-point or rounded risk calculation | Reject |
| MODEL-05 | Invalid rational \`ε\` or unapproved risk-policy version | Reject |
| MODEL-06 | \(D <= 0\) or integer predicate false | Reject |
| BUDGET-01 | Same lifetime \`ε\` reused for a second epoch without allocation | Reject |
| BUDGET-02 | New Issue after outcomes become available without conditional proof | Reject |
| AUTH-01 | Caller-supplied \`VERIFIED\` boolean or static signer used as sole authority | Reject |
| AUTH-02 | Registry head rollback, same-sequence equivocation or disappearing revocation | Reject |
| REGRESSION-01 | V1 RiskMode input attempts to remove or lower 500× | Reject |
| REGRESSION-02 | Statistical field silently mapped into \`ReserveProtection\` | Reject |

Positive conformance must demonstrate identical canonical decisions from identical inputs, a valid multi-round frozen cohort sharing one Pool, exact integer arithmetic, correct atomic append/freeze transitions and the intended Reveal/Expire paths.

## 8. Explicit blockers before implementation

1. **Policy authority:** decide the role of statistical Sale evaluation (S-OBSERVE, S-GATE, S-COHORT or S-HYBRID), risk guarantee, \`ε\`, horizon, lifetime allocation and the profile to which it applies.
2. **Randomness:** qualify Beacon authenticity, unpredictability, bias resistance, anti-grinding assumptions and per-ticket marginal validity.
3. **Capital:** derive the exact Pool capital perimeter, prove \`C_other\` disjointness, qualify current valuation/asset identity and bind executable settlement capacity where required.
4. **Cohort state:** design and prove permissionless atomic enrollment, completeness, freeze and round-publication gating.
5. **Authority:** remove or explicitly govern the current configured Carrier signer and relayer dependencies; no hidden fixed admin or publisher may be introduced under a trustless label.
6. **Arithmetic implementation:** build an independent reference calculator and exact-integer property tests; benchmark the predicate and full transaction on Plutus CEK and serialized Cardano transaction size.
7. **Ledger conformance:** demonstrate positive/negative vectors against the actual Cardano ledger semantics, not only TypeScript or Haskell mocks.
8. **Profile migration:** define how new statistical-profile tickets coexist with immutable V1 tickets and how shared Pool capital and lifetime risk budget are partitioned.

No one blocker can be closed by adding a \`RiskAssessment\` field to the existing bridge.

## 9. Non-regression and first-Issue separation

- PRE-RICH V1 remains deterministic 500×.
- No V3/Reveal datum, redeemer, transition or payout semantics are changed by this proposal.
- \`RiskProtectionBridge\` remains deterministic-only and fail-closed.
- The statistical estimate is not added to \`ReserveProtection\`.
- D3 Arb Agent capital/intensity controls are excluded.
- No source, quorum, freshness threshold, aggregation, fallback or USD/USDM conversion is approved here.
- No production Oracle State, MintPolicy, B1 validator, Carrier, wallet, transaction, deployment, Issue approval or ledger state is modified or authorized.

The first Preprod Issue remains a separate Issue #37 workstream: current USD/USDM source qualification, current EV1–EV7 evidence and deployment approval, and deployment-bound R1/Kc/Ω certification are still required. This statistical proposal must not displace or silently add to those gates.

## 10. Agent B conclusion

The correct binding object is not a standalone statistical number. It is a **RiskDecision certificate** over one exact Issue, one complete pre-outcome cohort, one Pool capital snapshot, one authenticated randomness/model version and one globally allocated risk budget.

The present repository does not yet provide the ledger state, randomness verification, capital partitioning or authority model needed to verify that certificate permissionlessly. Therefore this is a design contract and a conformance backlog, not an implementation approval or a current admission path.
