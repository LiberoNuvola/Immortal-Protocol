# IMMORTAL — Proof Pack

**Purpose:** concise, non-normative overview of what IMMORTAL is, what is already demonstrated, and what remains under active verification.

> **IMMORTAL = protocol · Cardano = adapter · PRE-RICH = first application**

This document is a communication/evidence index. It does **not** replace the IMMORTAL Constitution, Economic Kernel, state-transition specification, conformance specification, or deployment-specific evidence.

---

## 1. What IMMORTAL is

IMMORTAL is a **chain-neutral economic protocol** built around explicit obligations, protected capital, deterministic transitions, safety/viability constraints, atomicity, and auditable evidence.

Its constitutional model does not grant economic authority merely because someone operates infrastructure. Economic authority is derived from defined verification predicates.

The protocol separates:

- **IMMORTAL:** universal economic semantics and admissibility.
- **Adapter:** concrete realization, observation, and evidence at a target ledger.
- **Application:** application-specific policy and behavior.
- **Ledger:** actual execution of the concrete transaction.

This separation is deliberate: application choices and chain mechanics must not silently become universal protocol rules.

---

## 2. Core economic model

The normative kernel defines a state-transition model:

```
(S, a, ω) → S′ = T(S,a,ω)
```

Accepted actions are required to pass the protocol's safety and viability conditions before atomic commitment.

Key universal principles include:

- obligations and economically material exposure must be represented before execution;
- `RawSurplus = max(0, EEV − ProtectedCapital)`;
- protected capital is not discretionary surplus merely because current liquidity is positive;
- protocol-defined derivations are deterministic, versioned and reproducible;
- expiry is final: late actions cannot resurrect an expired economic right;
- liveness mechanisms cannot override economic safety;
- rejection is fail-closed rather than an excuse to weaken a safety predicate.

The formal kernel establishes the mathematical soundness of a certified concrete under-approximation `K_c` when it is contained in `Safe` and is inductive under the authoritative environment envelope.

---

## 3. Why the architecture matters

The architecture is intentionally layered:

```
IMMORTAL
  ↓
Cardano Adapter
  ↓
PRE-RICH
  ↓
Cardano ledger
```

The Adapter may translate, realize, observe and measure. It must not create economic authority.

PRE-RICH is the **first application of IMMORTAL**, not the definition of IMMORTAL itself.

Application-specific features such as:

- price ladder;
- game distribution;
- jackpot policy;
- application expiry profile;
- application Beacon model

remain in PRE-RICH rather than being promoted into universal IMMORTAL semantics.

---

## 4. What is already demonstrated

### Formal / semantic layer

The repository contains a hardened normative Constitution and Economic Kernel with proven results including:

- monotonicity of the predecessor operator;
- existence and characterization of the greatest fixed point;
- soundness of certified concrete post-fixed-point under-approximation;
- kernel invariance and infinite-horizon safety under the stated conformance premises;
- adversarial closure as a consequence of the gate;
- the mathematical consequence that narrowing the authoritative Ω envelope is unsound.

The documentation explicitly distinguishes **theorems** from **deployment/conformance obligations**.

### Implementation / conformance layer

The project has dedicated evidence for:

- B2 numerical hysteresis;
- B3-D GameRules bounded replay;
- exact PRE-RICH payout-unit handling;
- Economic Gate interface;
- Cardano Adapter P2.7 semantic suite;
- PRE-RICH action refinement;
- ticket-expiry refinement;
- R4 liveness classification;
- certified ticket identity/state binding;
- frontend build;
- governance replay/registry implementation;
- Materios evidence-packet binding.

Additional adversarial and protocol-declaration conformance workflows are passing on the current branch lineage.

---

## 5. The Cardano proof boundary

The important engineering distinction is:

**a transaction that can be constructed is not automatically proof of economic conformance.**

The evidence chain is:

```
specification
  ↓
implementation
  ↓
concrete transaction
  ↓
ledger execution
  ↓
observed result
  ↓
economic revalidation
  ↓
evidence packet
```

For the current Cardano lab, the workflow has already demonstrated successful execution of the infrastructure layers needed to reach the real ledger-native V3 test:

- Haskell/Plutus artifact generation;
- native Plutus dependencies;
- isolated Yaci Cardano environment;
- funded test wallet;
- real ledger smoke transaction;
- Yaci/Lucid Evolution cost-model probing.

---

## 6. Current V3 milestone

The first successful end-to-end arrival at the V3 Carrier was **Cardano Integration Lab #1069**.

There the generated V3 artifacts were produced successfully and the workflow reached:

```
Yaci / Ogmios
      ↓
Lucid Evolution
      ↓
V3 Carrier mint evaluation
```

The ledger evaluator then returned:

```
A non-constructor value was scrutinized in a case expression
```

This is a **technical ledger-evaluation failure**, not an economic-policy decision.

The first remediation was deliberately narrow: the V3 mint policy was changed to check that the mint value is exactly the expected singleton asset rather than destructuring it through `flattenValue`.

**Result of the next ledger-native run (#1071): the same Plutus evaluation failure remained.** Therefore the cause has not yet been isolated to `flattenValue`, and no economic rule is being changed to make the test pass.

The economic rule being enforced remains the same:

> exactly the expected asset, quantity 1.

---

## 7. Live verification status

**Current branch:** `work/immortal-green-closure`

**Current V3 test commit:** `25d6283bf07b49974cf6614cac6cab26f6f94cae`

**Cardano Integration Lab #1071:** **IN PROGRESS**

The current run has already passed:

- repository checkout;
- Node setup;
- project dependencies;
- lab dependencies;
- GHC/Haskell setup;
- native Plutus dependencies.

It is currently in fresh Plutus artifact generation.

Therefore the V3 fix is **not yet certified by the live ledger lab**. The decisive step remains:

```
Execute V3 carrier against native Cardano ledger
```

---

## 8. What is not claimed

IMMORTAL does **not** currently claim:

- mainnet production readiness;
- full deployment certification;
- universal non-emptiness of the maximal viability kernel;
- that bounded replay proves infinite-horizon viability by itself;
- complete publisher-independent B3/Materios canonicality;
- complete Ω certification for every deployment;
- that CI green alone constitutes economic certification.

This restraint is part of the project's verification model.

---

## 9. PRE-RICH's role

PRE-RICH is the first concrete application used to exercise IMMORTAL on Cardano.

That gives us a useful demonstration path:

```
IMMORTAL economic semantics
        ↓
Cardano Adapter
        ↓
PRE-RICH application policy
        ↓
Cardano execution
        ↓
observable evidence
```

The target operational milestone is a **real PRE-RICH ticket transaction on Cardano Preprod**, with wallet signature, confirmed transaction, verified economic transition, and bound evidence.

That milestone is a demonstration of an IMMORTAL implementation path; it is not the definition of the IMMORTAL protocol.

---

## 10. Evidence index

Primary sources in the repository:

- `docs/00-normative/01_CONSTITUTION_FINAL.md`
- `docs/00-normative/03_ECONOMIC_KERNEL_FINAL.md`
- `docs/00-normative/04_STATE_TRANSITION_SPECIFICATION.md`
- `docs/00-normative/07_CONFORMANCE_SPECIFICATION_FINAL.md`
- `docs/IMMORTAL-ADAPTER-PRE-RICH-COMPLETE-SYSTEM-MAP.md`
- `docs/03-audit/VERIFICATION_STATUS.md`
- `docs/03-audit/RESIDUAL_OBLIGATION_REGISTER.md`

Current Cardano laboratory evidence:

- workflow: `.github/workflows/immortal-cardano-lab.yml`
- V3 mint policy: `PRE-RICH/onchain/V3EconomicStateCarrierMintPolicy.hs`
- V3 ledger probe: `audit/cardano-integration/v3-carrier-ledger-probe.mts`

---

## 11. External one-paragraph description

**IMMORTAL is a chain-neutral economic protocol designed around explicit obligations, protected capital, deterministic state transitions, safety and viability constraints, and independently auditable evidence. It separates universal economic semantics from ledger-specific realization through an Adapter, with PRE-RICH serving as its first Cardano application. The project is currently completing ledger-native Cardano verification; the V3 economic state carrier has reached real transaction evaluation in the integration lab, and the current branch is testing a narrowly scoped fix to that concrete evaluator failure.**

---

## Verification note

Use this document for orientation and external communication only. For any claim about protocol authority, economics, or certification, follow the repository source-of-truth hierarchy and the deployment-specific evidence.
