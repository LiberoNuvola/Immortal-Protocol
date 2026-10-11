# Algorithmic Governability — Adversarial Executable Lab v0.1

**Status:** NON-NORMATIVE / EVIDENCE HARNESS  
**Purpose:** executable evidence for the boundary already defined by the Algorithmic Governability canon.

## Scope

This lab does not define new economic or governance rules. It checks two already-stated candidate properties:

1. **No Result-Dependent Authority:** a monitor result may not alter normative authority, the governing metric, the evidence contract, or the admissibility rule unless an explicitly pre-authorized institutional rule already permits that change.
2. **Search non-escalation:** a partial/adaptive search may not convert a partial coverage claim into a complete normative universe, widen its candidate domain, or weaken the immutable safe set merely because of search results.

The harness uses deliberately small immutable toy objects. Passing it is evidence that the implementation preserves these boundaries in the modeled cases; it is not a proof of the entire protocol.

## IMMORTAL Expansion namespace

This lab contains support for the **IMMORTAL Expansion** research front. Its identifiers are:

| ID | Generalization |
| --- | --- |
| EXP-01 | Typed obligations / seniority |
| EXP-02 | Term structure / time horizon |
| EXP-03 | Multi-asset / eligibility / haircut boundary |
| EXP-04 | Composition of profiles |
| EXP-05 | Abstract contingent claims |
| EXP-06 | Evidence-as-input |
| EXP-07 | Regime / hysteresis |
| EXP-08 | Netting / offset |
| EXP-09 | Obligation transfer / novation |
| EXP-10 | Explicit risk budget |
| EXP-11 | Deterministic auction / allocation |
| EXP-12 | Observer vs authority split |

The **EXP-** prefix is deliberate: it prevents these generalization axes from being confused with Governance (`GOV-xx`), system closure fronts (`B4/B5/B6`), or the separate G1–G6 liveness conditions.

Current bounded implementations in this branch include **EXP-01-light + seniority boundary, EXP-02 boundary, EXP-03-minimal + valuation/haircut boundary, EXP-04 boundary, EXP-05 boundary, EXP-06, EXP-07-light, EXP-08 boundary, EXP-09 boundary, EXP-10 boundary, EXP-11 boundary and EXP-12 boundary**. These are research/conformance boundaries only; their production semantics remain open. The catalog is now executable at the boundary layer, but this does not mean the underlying production generalizations are canonical or deployed.

These expansions are not a second governance system and do not create new economic authority.


## Workflow B — multi-front boundary matrix

| Front | Current boundary | What remains open |
| --- | --- | --- |
| Generalized derivation | executable family/rule/evidence identity | canonical parameter functions and institutional approval |
| Contributor credential | accepted ContributionRecord → credential | canonical credential schema / reward entitlement |
| Contributor reward | eligibility + explicit rule/evidence identity | reward function, budget policy, canonical authorization |
| Treasury → reward accounting | certified budget ≤ observed available revenue | normative reward-budget semantics and source classification |
| Multi-adapter semantics | same certified semantic result across encodings | real adapter differential evidence on concrete actions |
| Permissionless liveness | safe stall, stale-state rejection, single transition | action-specific real liveness witnesses |
| B3-A witness packet | checkpoint/transition/execution/selection bindings | real cryptographic witness + independent finality/authority verification |
| B3-C RootProof | checkpoint/stateRoot/storage/semantic bindings | real storage proof + complete B3-A/B relation |
| B5/B6 action evidence | Issue/Reveal/Claim/Expire packet completeness | real ledger-aligned action equivalence |
| Midnight/Moriarty adapter research | Intent → chain-neutral admission → Moriarty semantic mapping → Midnight execution | real Midnight deployment, proof/evidence binding and admission correspondence |
| Moriarty source-language correspondence | OwnerIntent/source/authority → explicit IMMORTAL projection; no schema equivalence | real source-to-admission and ledger binding |
| Observer vs authority | observation separated from authorization | full evidence-class/authority matrix |
| Treasury legacy isolation | production JS/TS usage scan | final on-chain legacy surface retirement/isolation |

These are boundary/conformance surfaces, not claims of production closure. They must not be used to infer missing economic rules.

## Evidence model

```
Immutable Boundary
  ├─ Domain
  ├─ Rule
  ├─ Inputs
  ├─ Limits
  ├─ EvidenceContract
  ├─ Version
  ├─ Contestability
  └─ Exit

Explore → CandidateSet
Certify → admissible / rejected / unverifiable
Adopt → only if Certify(admissible)
```

The lab intentionally gives two monitors identical observations but different derived metrics. The selection rule is predeclared and does not grant either monitor new authority.

## Run

```bash
node audit/algorithmic-governability/no-result-dependent-authority.mjs
node audit/algorithmic-governability/exp-01-typed-obligation-buckets-boundary.mjs
node audit/algorithmic-governability/exp-01-seniority-order-boundary.mjs
node audit/algorithmic-governability/exp-02-term-structure-horizon-boundary.mjs
node audit/algorithmic-governability/exp-03-minimal-asset-eligibility-boundary.mjs
node audit/algorithmic-governability/exp-03-asset-valuation-haircut-boundary.mjs
node audit/algorithmic-governability/exp-04-profile-composition-boundary.mjs
node audit/algorithmic-governability/exp-05-contingent-claims-boundary.mjs
node audit/algorithmic-governability/exp-06-evidence-catalog-boundary.mjs
node audit/algorithmic-governability/exp-08-netting-offset-boundary.mjs
node audit/algorithmic-governability/exp-09-obligation-transfer-novation-boundary.mjs
node audit/algorithmic-governability/exp-10-explicit-risk-budget-boundary.mjs
node audit/algorithmic-governability/exp-11-deterministic-auction-allocation-boundary.mjs
node audit/algorithmic-governability/exp-12-observer-authority-split-boundary.mjs
node audit/algorithmic-governability/midnight-adapter-intent-boundary.mjs
node audit/algorithmic-governability/moriarty-intent-semantic-boundary.mjs
node audit/algorithmic-governability/moriarty-intent-identity-binding-boundary.mjs
npx vitest run src/__tests__/preRichHysteresis.test.ts PRE-RICH/tests/conformance/PreRichHysteresisBinding.test.ts
```

Expected result: all assertions PASS.

## Non-goals

- no new reward formula;
- no fee formula;
- no governance threshold;
- no economic parameter;
- no claim of cryptographic proof;
- no substitution for AG-01 canonical replay/finality evidence;
- no production profile-composition engine;
- no production contingent-claims engine.
