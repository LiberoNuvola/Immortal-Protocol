# Documentation Authority Matrix

**Status:** editorial control document — non-normative  
**Branch:** `work/immortal-green-closure`  
**Purpose:** make the repository's source-of-truth boundaries explicit and prevent duplicate documents from becoming competing authorities.

## Universal IMMORTAL

| Layer | Canonical authority | Role of secondary documents |
|---|---|---|
| Constitution | `docs/00-normative/01_CONSTITUTION_FINAL.md` | `IMMORTAL/docs/CONSTITUTION.md` is an integrative reader guide |
| Universal economic model | `docs/00-normative/02_UNIVERSAL_ECONOMIC_MODEL.md` | summaries must link here |
| Economic kernel | `docs/00-normative/03_ECONOMIC_KERNEL_FINAL.md` | `IMMORTAL/docs/ECONOMIC-KERNEL.md` is an integrative reader guide |
| State transition | `docs/00-normative/04_STATE_TRANSITION_SPECIFICATION.md` | implementation/design documents explain realization |
| Invariants | `docs/00-normative/05_INVARIANTS_CONSERVATION_FINAL.md` | tests and audits provide evidence only |
| Conformance | `docs/00-normative/07_CONFORMANCE_SPECIFICATION_FINAL.md` | audit matrices track implementation/evidence status |

## Normative contracts and formal records

`docs/01-contracts/` contains normative contracts referenced by the constitutional corpus.

`docs/01-formal-records/` contains proof registers, decision registers and closure matrices. These record reasoning and status; they do not silently override the normative corpus.

## Application profile

`PRE-RICH/docs/` owns PRE-RICH-specific policy and application semantics.

Ticket prices, class ladder, 500× payout, Jackpot lifecycle, application expiry policy, Genesis application regime and game distribution belong to PRE-RICH unless an explicit universal normative source says otherwise.

## Chain adapter

`Adapter/CARDANO/docs/` owns Cardano-specific realization and adapter boundaries.

The adapter must not redefine IMMORTAL economic admissibility or promote PRE-RICH policy into universal semantics.

## Integrative specifications

The following are reader-facing integration documents:

- `IMMORTAL/docs/IMMORTAL-COMPLETE-SYSTEM-SPECIFICATION.md`
- `PRE-RICH/docs/PRE-RICH-COMPLETE-SYSTEM-SPECIFICATION.md`
- `Adapter/CARDANO/docs/CARDANO-ADAPTER-COMPLETE-SYSTEM-SPECIFICATION.md`

They may integrate and cross-reference the system, but must not introduce new normative semantics.

## Evidence and audit

`docs/03-audit/`, `audit/`, CI artifacts and deployment evidence demonstrate what was observed or executed. Evidence does not become normative authority merely because a test is green.

## Historical material

`docs/archive/` and explicitly marked legacy/experimental material remain available for traceability. They are not current authority.

## Decision rule

When two documents appear to disagree:

1. canonical normative source;
2. explicit normative decision;
3. current technical specification;
4. implementation;
5. tests/proofs;
6. runtime/deployment evidence;
7. coordination notes;
8. historical material.

If a secondary document disagrees with a higher layer, the secondary document is the candidate for correction — not the protocol semantics.
