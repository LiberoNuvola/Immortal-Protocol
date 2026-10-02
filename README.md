# IMMORTAL Protocol

**Chain-neutral economic protocol** with explicit obligations, protected capital, deterministic transitions, and auditable evidence.

> **IMMORTAL = protocol · Cardano = adapter · PRE-RICH = first application**

**Status:** experimental open source — not a finished product, not certified mainnet, and not a custodial service.

```text
IMMORTAL
  universal economic rules
      ↓
Cardano Adapter
  realize / observe / evidence
      ↓
PRE-RICH
  Scratch & Win application
      ↓
Cardano ledger
```

## Read first — 2 minutes

| Role | Start here |
|---|---|
| Whole stack | [System Map](docs/IMMORTAL-ADAPTER-PRE-RICH-COMPLETE-SYSTEM-MAP.md) |
| Protocol | [IMMORTAL Complete System Specification](IMMORTAL/docs/IMMORTAL-COMPLETE-SYSTEM-SPECIFICATION.md) |
| Application | [PRE-RICH Complete System Specification](PRE-RICH/docs/PRE-RICH-COMPLETE-SYSTEM-SPECIFICATION.md) |
| Adapter | [Cardano Adapter Complete System Specification](Adapter/CARDANO/docs/CARDANO-ADAPTER-COMPLETE-SYSTEM-SPECIFICATION.md) |

Normative authority remains with the Constitution and applicable normative/economic specifications; these guides are navigation aids.

## What PRE-RICH is

PRE-RICH is the current application built on IMMORTAL:

- NFT tickets with a class ladder from **1 to 100 USDM**.
- **Commit → reveal → derived result**; the client does not choose the tier or payout.
- Classic-6 normal-game table with expected payout approximately **0.65 × P**.
- Liability-first accounting, protected capital, class gating, crystallization, and claim ≠ burn.
- Beacon model: **B1 is the current authorized-publisher path; B3 is the stronger publisher-independent target and remains evidence-tracked/open.**

These are application-level facts, not universal IMMORTAL semantics.

## What this is not

- Not a meme-token sales page.
- Not a guarantee of production readiness or certification.
- Not a claim that B3, Genesis, or full ledger conformance are closed.
- Not a claim of being the first commit–reveal system on Cardano.
- Not a promise that experimental code or CI status alone constitutes economic certification.

## Architecture

The universal layer defines what must be true. The adapter realizes and observes those requirements in a concrete execution environment. The application specializes them for a concrete economic system.

Application- or chain-specific parameters must not silently become IMMORTAL semantics.

```text
IMMORTAL
  ↓
economic rules / obligations / invariants
  ↓
Adapter
  ↓
execution + observation + evidence
  ↓
PRE-RICH
  ↓
application state / game rules
  ↓
Cardano ledger
```

## Verification boundary

IMMORTAL distinguishes:

```text
specification
    ↓
formal / model result
    ↓
implementation
    ↓
conformance evidence
    ↓
deployment evidence
```

**Green CI is evidence about a run, not a universal certification claim.**

For Beacon B3, the evidence chain being developed is:

```text
Materios canonical block
    ↓
GRANDPA finality
    ↓
authority history / transition
    ↓
runtime execution proof
    ↓
StateRoot / storage proof
    ↓
canonical Beacon
```

B3 is intentionally not described as closed until the required cryptographic and provenance obligations are actually evidenced.

## Open edges

Current major evidence gaps remain explicit:

- **B3 / Materios:** publisher-independent finality and authority-selection provenance.
- **Genesis:** carrier / transition evidence.
- **Cardano adapter:** full ledger-native conformance.
- **Deployment:** production environment evidence.

See [Verification Status](docs/03-audit/VERIFICATION_STATUS.md) and [Residual Obligations](docs/03-audit/RESIDUAL_OBLIGATION_REGISTER.md).

## Code entry points

For builders who want to inspect the implementation:

- `poc/materios-grandpa/` — GRANDPA and authority-transition proof boundary.
- `poc/materios-checkpoint/` — Materios checkpoint/evidence extraction.
- `poc/materios-execution-verifier/` — independent native execution-proof verifier.
- `Adapter/CARDANO/` — Cardano adapter implementation and conformance work.

## Why IMMORTAL

IMMORTAL is not based on a claim of inventing a new cryptographic primitive. The thesis is **composition under explicit constraints**: economic obligations, authority boundaries, deterministic transitions, solvency rules, and evidence must remain consistent rather than becoming independent feature silos.

The deeper socioeconomic premise is documented separately in [SOCIOECONOMIC-PREMISE.md](IMMORTAL/docs/SOCIOECONOMIC-PREMISE.md).

## Deeper documentation

**Protocol**

- [Constitution](docs/00-normative/01_CONSTITUTION_FINAL.md)
- [Economic Kernel](docs/00-normative/03_ECONOMIC_KERNEL_FINAL.md)
- [State Transition Specification](docs/00-normative/04_STATE_TRANSITION_SPECIFICATION.md)
- [Invariants and Conservation](docs/00-normative/05_INVARIANTS_CONSERVATION_FINAL.md)
- [Conformance Specification](docs/00-normative/07_CONFORMANCE_SPECIFICATION_FINAL.md)

**Application**

- [PRE-RICH Complete Specification](PRE-RICH/docs/PRE-RICH-COMPLETE-SYSTEM-SPECIFICATION.md)
- [Game Economy](PRE-RICH/docs/GAME-ECONOMY.md)

**Evidence / audit**

- [Proof Register](docs/01-formal-records/08_FORMAL_PROOF_REGISTER_FINAL.md)
- [Audit Closure Matrix](docs/01-formal-records/10_FINAL_AUDIT_CLOSURE_MATRIX.md)
- [Verification Status](docs/03-audit/VERIFICATION_STATUS.md)
- [Residual Obligations](docs/03-audit/RESIDUAL_OBLIGATION_REGISTER.md)

**Process**

- [CONTRIBUTING](CONTRIBUTING.md)
- [ROADMAP](ROADMAP.md)
- [SECURITY](SECURITY.md)

## License

See the repository license files for the applicable terms.

**Do your own verification before relying on any implementation.**
