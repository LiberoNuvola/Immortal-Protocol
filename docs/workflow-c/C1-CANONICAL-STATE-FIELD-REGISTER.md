# Workflow C — C1 Canonical-State Field Register

**Status:** SOURCE-MAPPED / PROFILE COMPLETENESS OPEN  
**Authorized branch:** `release/public-main-curated-2026-09-24`  
**Source snapshot:** `908f921890395cdc7ae67106b1a4e5fd35d41fb9`  
**Scope:** inspect the actual chain-neutral Haskell aggregate and its kernel consumers. This register does not promote an implementation record into a normative definition and does not change economic behavior.

## Findings at a glance

The current `UniversalEconomicState` is an eight-field accounting/safety aggregate. It is a useful application-neutral projection, but the available source does **not** establish it as a complete canonical `S ∈ 𝒮` for the universal model.

Three concrete completeness/provenance gaps are visible at the source level:

1. The normative Universal Economic Model lists `History` as a canonical component, but `UniversalEconomicState` has no history field or separate history-binding contract in this data type.
2. `EEV` is supplied as an independent `Integer` argument to `rawSurplus` and `solvencyInvariant`, not carried or source-bound by this state record.
3. The economic model depends on `A(S)`, `Accept(S,a)`, `Ω(S,a)`, `T(S,a,ω)`, `Safe(S)`, profile identity and perimeter `E`; none of those bindings is represented by this record. They may live in a separate profile, but that completeness/refinement relation remains unproved.

All eight fields are untyped `Integer` values at the Plutus data-structure level. The file does not encode currency, asset identity, decimal scale/unit, observation time, source identity, derivation version, or canonical serialization metadata for the field values.

## Observed state schema

Source: `IMMORTAL/state/UniversalEconomicState.hs`, blob `f89fe04c8aad8ca9c5e544fa9c145a38d157826f` at the reviewed branch head. Kernel consumer: `IMMORTAL/kernel/UniversalEconomicKernel.hs`, blob `cd304c26c5ae9795cf5a1c4f8ca5cf9a8bf65785`.

| Field | Concrete type | Kernel consumption observed | Unit/identity encoded in type? | C1 qualification |
|---|---|---|---|---|
| `uesCrystallizedLiabilities` | `Integer` | Summed into `protectedCapital`; checked non-negative | No | Monetary/accounting meaning is suggested by the name and kernel usage, but currency, scale, and obligation-source binding are absent from the type. |
| `uesUnresolvedReserve` | `Integer` | Checked non-negative; **not** summed into `protectedCapital` by the current kernel function | No | Its relationship to protected liabilities/reserve accounting must be established by the profile contract; do not silently double-count it or assume the current exclusion is universally correct. |
| `uesUnresolvedTicketCount` | `Integer` | Checked non-negative; not summed into `protectedCapital` | No; intended meaning appears to be a count | Count domain, lifecycle linkage, and how it constrains exposure/action availability are not represented by this type. |
| `uesWorstCaseExposure` | `Integer` | Summed into `protectedCapital`; checked non-negative | No | Requires a profile-defined valuation method, perimeter, unit and evidence for the worst-case envelope. |
| `uesSafetyCapital` | `Integer` | Summed into `protectedCapital`; checked non-negative | No | The type does not identify the governing rule/version or its canonical source. |
| `uesReserveProtection` | `Integer` | Summed into `protectedCapital`; checked non-negative | No | Needs canonical ownership/partition binding so the same protected content is not counted again elsewhere. |
| `uesMandatoryFutureCosts` | `Integer` | Summed into `protectedCapital`; checked non-negative | No | Needs source-bound cost classes, timing/horizon and valuation units. |
| `uesAdditionalProtectedCapital` | `Integer` | Summed into `protectedCapital`; checked non-negative | No | The generic field name does not identify the disjoint obligation class, evidence, owner or anti-double-counting proof. |

**Exact formula currently implemented** in `IMMORTAL/kernel/UniversalEconomicKernel.hs`:

`protectedCapital(s) = crystallizedLiabilities + worstCaseExposure + safetyCapital + reserveProtection + mandatoryFutureCosts + additionalProtectedCapital`.

The implementation separately requires `uesUnresolvedReserve ≥ 0` and `uesUnresolvedTicketCount ≥ 0` in `nonNegativeState`, but neither field enters the displayed protected-capital sum. This is an observation about current code, **not** a declaration that the fields are semantically irrelevant or that their omission is a bug. Resolve the relation from the normative accounting partition and selected profile, not from names alone.

## Kernel consumers

| Function | Actual signature/behavior observed | What it does not establish |
|---|---|---|
| `protectedCapital :: UniversalEconomicState -> Integer` | Sums six named fields above | No unit validation, source authenticity, partition disjointness, or proof all protected classes are present. |
| `rawSurplus :: Integer -> UniversalEconomicState -> Integer` | Returns `max 0 (eev - protectedCapital s)` | Does not bind EEV to an authoritative oracle/source and does not authorize an action. |
| `nonNegativeState :: UniversalEconomicState -> Bool` | Checks each of the eight integer values is ≥ 0 | Non-negativity is not completeness, solvency, semantic validity, nor proof of field provenance. |
| `solvencyInvariant :: Integer -> UniversalEconomicState -> Bool` | Requires EEV ≥ 0, all fields non-negative, and EEV ≥ protected capital | Does not prove that the passed EEV belongs to the same canonical observation as the state, that values use the same unit, or that the state is closed under Ω-successors. |
| `zeroUniversalEconomicState` | Constructs eight zeros | A helper constructor is not evidence that a live initial state is zero, admissible, authoritative, or in `K_c`. |

## Required profile binding before C1 can close

For each field, a concrete profile must supply or reference:

1. **Canonical identity:** profile ID/version, schema version and canonical equality/encoding.
2. **Domain and unit:** monetary denomination/asset identity and subunit scale, or count/unit domain where applicable; non-negativity/range conditions; no implicit conversions.
3. **Owner and semantic class:** exact protected-content partition category, whether it contributes to `ProtectedCapital`, and the invariant preventing omission/double-counting.
4. **Authoritative source:** source/observation/checkpoint identity, timestamp/slot, freshness and failure behavior; exact derivation and verifier version.
5. **Cross-field linkage:** relation among unresolved reserve, unresolved count, worst-case exposure and liabilities; relation of EEV to the same canonical state/snapshot.
6. **History and transition closure:** where `History` and all data needed by `Accept`, `Ω`, `T`, `Safe` and action availability reside; proof that the implementation-to-canonical mapping is total, functional up to canonical equality, deterministic, versioned and sound for all reachable implementation states.

Missing values cannot be defaulted to zero or treated as irrelevant because they are absent from the Haskell record. Any extension or projection contract must be tied to existing normative authority and an explicit source/refinement record.

## Current disposition

- **Established:** exact eight-field record, integer representation, and the kernel's current field-use/formula can be read directly from source.
- **Not established:** that the eight fields form all of `𝒮`; field units; canonical asset/currency; EEV provenance/temporal binding; History binding; exhaustive disjoint obligation partition; full action/acceptance/Ω/transition/safety state; or refinement correctness.
- **Workflow C status:** C1 remains **PARTIAL / PROFILE INSTANTIATION OPEN**. This is a source inventory, not an economic-model change or certificate. C6-B/C8 remain blocked; C7 remains open.
