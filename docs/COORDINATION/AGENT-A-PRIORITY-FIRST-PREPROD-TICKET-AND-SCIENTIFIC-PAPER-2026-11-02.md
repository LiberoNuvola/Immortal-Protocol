# Agent A — priority order for first Preprod ticket and scientific paper

**Decision date:** 2026-11-02  
**Scope:** priority and sequencing only. Agent A ownership, fronts, responsibilities, economic rules, and other agents' assignments are unchanged.

## Decision

Agent A keeps the existing mandate (economy, EEV, source evidence/provenance, ProtectedCapital, market/source audit, and first Issue admission). Within that mandate, work is prioritized by contribution to these two outcomes:

1. **First real PRE-RICH ticket on Cardano Preprod, purchased by the project owner from their own connected wallet.**
2. **A defensible scientific paper on IMMORTAL/PRE-RICH, grounded in formal semantics, reproducible implementation evidence, and the real Preprod case study where available.**

The paper is a parallel evidence-and-synthesis track, not a reason to delay the first ticket. The first ticket is the primary execution objective. The paper must not describe planned or simulated work as deployed or experimentally validated.

## Priority 0 — unblock the owner's first real Preprod purchase

Only work that is a direct prerequisite, evidence-producing step, or safety gate for the first real purchase takes precedence.

### P0.1 — establish the exact live deployment perimeter

- Recover and verify the real Preprod deployment identifiers from authoritative repository/deployment records: PrizeValidator address, ticket policy, B1 PrizePool address and exact out-reference, Pool singleton unit, Counter input, B2 control singleton/address/policy/token name, and the configured wallet/network assumptions.
- Never infer deployment identifiers from fixtures, stale workflow logs, or unrelated deployments.
- Reconcile the current branch, deployment profile, and live Preprod observations before reuse of any historical approval.

**Exit evidence:** a versioned deployment manifest with exact identifiers, network, provenance, observation slot/time, and hashes. No secret or wallet key is stored in the repository.

**Historical deployment evidence recovered from GitHub Actions artifact 12324421376 (run 39552468679, 2026-10-21):**

- PrizeValidator address: `addr_test1wzf7ctkjwysu3v94f0ccqjef63kdwy2gc4qj368x3a70lvsq6uygp`
- B1 PrizePool address: `addr_test1wrhru9jt8jm600y2mltw300c9tu7cj5tuyew7lz0ex2p75gja592e`
- B1 PrizePool UTxO: `b84fce37cd31ea6463d2c59fa1c2a7cd0871e1620146fe3741308ab2e610b020#0`
- Pool singleton unit: `9ada0966f747542f84af2bc352d564685d77f3839ec0b053a1b7700e504f4f4c2d444952454354`
- Ticket policy ID: `ca8ef9a7e51e65da526ad4392f8b1919532368c656c7571107a06e71`
- Direct tUSDM unit: `e675b46e4d2242c991a8932a99db3044e80515ae14b4c4ccf6b3f4c90014df10745553444d`
- Historical physical tUSDM quantity: 1,000,000,000 atomic units; derived EEV: 100,000 IMMORTAL USDM subunits (1,000 USDM).
- Historical snapshot: slot 136879045, observed 2026-10-21T05:57:26.613Z; approval run 39552468679.

These are **recovered historical identifiers/evidence, not a current live observation**. The approval explicitly requires LIVE_UTXO_REVALIDATION before Issue admission. Re-query the exact UTxO and bind a fresh snapshot before reuse. The B2 control deployment artifact/identifiers were not present in the recovered EEV artifact and remain to be recovered from its own deployment evidence. The workflow's configured deployment wallet is not presumed to be the owner's purchase wallet; keep those identities separate.

### P0.2 — revalidate the direct-USDM EEV for the exact Pool UTxO

- Re-run the existing PRE-RICH-EEV-USDM-DIRECT-V1 source-set and qualification path against the exact current B1 Pool UTxO.
- Confirm the physical tUSDM asset identity and quantity in that UTxO; bind observation to the exact candidate state and current snapshot.
- Trace TicketIssued settlement/funding separately. Do not assume ticket purchase increases ppTotalLiquidity.
- Do not widen EEV to ADA/PRE or introduce oracle/liquidation assumptions.

**Exit evidence:** fresh, replayable EV1–EV7 packet and applicable deployment approval, bound to the exact Pool UTxO and snapshot. Historical approval is not a substitute for current observation.

### P0.3 — close the ProtectedCapital source and completeness gap

- Continue the existing PA1–PA7 profile mapping and item-level producer contract.
- Use the read-only Preprod PrizeValidator census as an enumerator, not as an independent authority certificate. Resolve source completeness/authority with a defensible ledger/provider evidence chain; preserve the explicit unverified status until then.
- Reconcile exact ticket items, crystallized liabilities, unresolved exposure, locked Jackpot, SafetyCapital, ReserveProtection, and MandatoryFutureCosts against their authoritative sources and the applicable profile.
- Keep unresolved reserve as the accounting representation specified by the existing canonical semantics; do not add it a second time to worst-case exposure.
- Distinguish observed OPEX from protocol-committed future obligations. No invented zeros, estimates, or synthetic source records.
- Prove coverage, disjointness, no omitted exposure, same units/horizon/snapshot, and source provenance for every included component.

**Exit evidence:** complete, replayable item-level ledger and PA1–PA7 evidence for the exact deployment snapshot. Any component without authority remains a blocker.

### P0.4 — bind the authoritative Issue witness

- Join EEV, ProtectedCapital, V3 carrier, B2 control, Counter, exact Pool UTxO, executable liquidity, viability, and Omega obligations on the same candidate/snapshot.
- Validate the existing AuthoritativeIssueAdmission contract and exact deployment bindings; do not manufacture a witness or weaken its fail-closed checks.
- Confirm the actual first-user sale path reaches this one admission boundary, with no frontend or adapter side door.

**Exit evidence:** complete authoritative Issue witness, deployment binding, decision reference, observation reference, and replayable positive/negative conformance packet.

### P0.5 — owner-purchased first ticket

- Prepare and verify the real connected wallet is on Cardano Preprod and the displayed purchase terms match the approved candidate.
- The owner personally reviews and signs the actual purchase transaction through the wallet. Agent A does not sign, custody funds, or submit on the owner's behalf.
- Verify the confirmed transaction, minted ticket NFT, exact ticket UTxO, datum, policy/name, and resulting Pool/Counter/Control state.
- Persist a redacted, reproducible evidence packet: transaction hash, block/slot, UTxO references, datum/asset identity, source digests, decision/observation references, and post-state reconciliation.

**Exit evidence:** a confirmed owner-purchased Preprod ticket, not a mock, fixture, devnet ticket, or unsubmitted transaction. The ticket's actual lifecycle remains separately evidenced.

## Priority 1 — scientific paper, in parallel with P0 where it does not compete for the same blocking work

### P1.1 — define the paper's research question and contribution

Build the paper around claims the repository and formal model can actually support. Candidate framing to validate against prior work:

- a chain-neutral economic kernel and profile/adapter separation;
- liability-first protection, explicit ProtectedCapital semantics, and the distinction between worst-case and statistical risk;
- evidence/provenance requirements for authoritative EEV and obligations;
- fail-closed admission and refinement/conformance across the universal kernel and Cardano execution;
- a reproducible first-user Preprod experiment, culminating in the owner's first real ticket when P0.5 is achieved.

Do not claim novelty, security, solvency, decentralization, or formal verification beyond the precise proof/evidence actually available.

### P1.2 — prior-art and literature review

- Build a traceable bibliography and comparison matrix for formal methods in smart contracts, economic/solvency invariants, reserve/liability accounting, oracle/data provenance, cross-layer refinement, and Cardano/UTxO execution.
- Separate published peer-reviewed work, standards/specifications, protocol documentation, and project-internal design records.
- Identify the precise research gap; do not assume novelty from implementation complexity.

### P1.3 — formal model and claims

- Freeze notation and definitions from the existing canonical IMMORTAL semantics and PRE-RICH profile without changing them.
- State assumptions, threat model, trust boundaries, invariants, transition rules, and proof obligations.
- Clearly distinguish mathematical proof, executable conformance tests, simulation, provider observation, and live-ledger evidence.
- Include counterexamples and failure modes, not only successful paths.

### P1.4 — reproducible evaluation

- Build an experiment/evidence matrix mapping each paper claim to source files, commit SHA, test, workflow run, artifact digest, and (where applicable) Preprod transaction.
- Report failed and pending experiments accurately, including the 16,384-byte transaction constraint and the difference between builder failure and ledger rejection.
- Use the first owner-purchased ticket as a case study only after P0.5 is confirmed.

### P1.5 — manuscript

The repository already has two distinct explanatory White Papers: root IMMORTAL White Paper (universal protocol scope) and docs/WHITEPAPER.md (PRE-RICH application scope). Preserve that separation and their normative/documentation boundaries; do not merge them or silently create a competing normative source.

The scientific manuscript is a separate research output, not a rewrite of either orientation document. Its working research scope is IMMORTAL's chain-neutral economic protocol and evidence/refinement model, with PRE-RICH/Cardano as the concrete case study. Validate the research gap through prior art before claiming novelty. Prepare a structured article: abstract; problem and research question; related work; system/threat model; formal economic semantics; architecture and trust boundaries; provenance and admission; implementation; experimental method; results; limitations; discussion; conclusion; reproducibility appendix.

The earlier PRE-RICH white-paper outline remains useful as explanatory coverage, but the scientific article must add explicit research question, methodology, prior-art comparison, testable claims, and evidence-backed evaluation. No target venue, language, or authorship convention is assumed until decided.

No results section may promote a planned, simulated, fixture-only, or unverified run into a live result.

## Priority 2 — preserve existing Agent A responsibilities, but defer work not on the two outcome paths

Continue existing Agent A responsibilities when they produce evidence needed for P0 or P1. Otherwise keep them in the backlog without changing ownership. Do not absorb or reassign Agent B/C work.

## Stop conditions and non-regression

- No new branch.
- No changes to frozen economic formulas, coefficients, thresholds, price ladder, expiry semantics, or canonical parameters.
- No V3/Reveal/validator/kernel/consumer changes under this priority decision unless separately assigned and proven necessary through the existing coordination process.
- No Materios/B3 work takeover; no agent-role changes.
- No fabricated deployment IDs, zero-valued protected components, provider authority, source completeness, or paper claims.
- No signing, custody, payment, wallet operation, or on-chain submission on behalf of the owner.
- A missing authority/source remains a visible blocker; do not bypass it to reach the purchase milestone.

## Immediate next execution order

1. Recover exact Preprod deployment identifiers and current branch/workflow state.
2. Revalidate the direct-USDM EEV against the exact current Pool UTxO and trace TicketIssued settlement.
3. Complete the authoritative PA1–PA7/item-level ProtectedCapital evidence path.
4. Bind and replay the authoritative Issue witness, including B2/Counter/viability/liquidity.
5. Run the owner-controlled purchase readiness review; owner signs and submits the real Preprod purchase.
6. In parallel, start the paper's claim/evidence matrix and prior-art review; draft only claims already supported.

**Priority rule:** if a task does not directly advance the first real Preprod purchase or produce a necessary, citable/reproducible component of the scientific paper, it does not displace the above sequence.
