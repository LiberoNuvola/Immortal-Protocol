# B3-C Research Addendum — Additional Production References

**Role:** standalone addendum to the B3-C succinct-proof research pass. **Status: research / non-normative.** It does not alter B3, select a proof system, or promote an external primitive to IMMORTAL authority.

## Why an addendum

This artifact preserves the provenance of the existing B3-C research pass while adding two references that materially sharpen the engineering comparison: IBC light clients and Midnight/Halo2.

## Addendum 1 — IBC light clients

IBC light clients are a production precedent for publisher-independent remote-chain verification without requiring a succinct proof in the base design.

The IBC specification separates the client from the application: the client tracks counterparty consensus state and exposes membership/non-membership verification against a stored commitment root. The security model is explicit and can range from a fully verified consensus client to a multisignature committee; the initial trusted consensus state is axiomatically trusted. citeturn0search0

For GRANDPA specifically, the IBC ICS-010 specification defines client state, authority sets, consensus roots, headers and GRANDPA justifications containing commit messages and ancestry proofs. Its current status is **draft**, not a production conformance claim for Materios. citeturn0search2turn0search1

### Relevance to B3-C

IBC is directly relevant to the verification-logic side of the B3-A/B3-B relation:

`VerifyRootProof(checkpointRef, root, context, proof) = true => Canonical(checkpointRef, root, context)`

It demonstrates a mature engineering pattern in which a receiving execution environment verifies a remote consensus state and then verifies state membership against a commitment root.

However, IBC does **not** resolve the Cardano-specific execution-economics question. IBC client implementations target environments and budgets different from a Plutus validator, and the GRANDPA client specification remains draft. Therefore:

- IBC is evidence for the **verification-logic category**;
- it is not evidence that a Materios verifier fits within Cardano's transaction/script budget;
- it is not evidence that a succinct proof is unnecessary;
- it is not evidence that B3-C is complete.

## Addendum 2 — Midnight as a Halo2 production reference

Midnight provides a Cardano-adjacent production reference for Halo2. Its public testnet release notes state that the ledger adopted a modified Halo2 proving system, including recursion and pairing-friendly curves, and that the proving system was designed to support SNARK upgrades without resetting the chain. citeturn1search16

Midnight mainnet is live: its March 2026 State of the Network reports genesis on March 17, 2026 and describes a federated-node launch model with an intended transition toward greater decentralization. citeturn1search13

Midnight's current FAQ states that the network uses AURA for block production and GRANDPA as its finality gadget, and that mainnet launched with permissioned nodes operated by Shielded Technologies, followed by an expansion to 13 federated node operators during bootstrapping. citeturn1search11

Earlier roadmap material described Kūkolu as the federated-mainnet phase and later phases as progressively broadening participation. The roadmap is explicitly subject to revision, so this addendum does not infer that a later Cardano-SPO security-root transition has already occurred. citeturn1search0turn1search11

### Relevance to B3-C

Midnight strengthens the evidence that Halo2 is not merely a research-library candidate: a Cardano-adjacent live network has exercised a modified Halo2 proving stack in its ledger architecture.

It is still a reference for the **proving technology**, not a B3-C solution. Midnight's privacy/state-management problem is different from IMMORTAL's Materios finality + state-root verification problem. No Midnight contract or proof artifact is assumed reusable for B3-C.

Zcash/Orchard remains a valid secondary Halo2 production reference. This addendum simply gives the Cardano-adjacent Midnight deployment higher relevance for the specific engineering question in this repository.

## What this addendum changes

Nothing in the B3-C conclusion changes:

> B3-C is not blocked by the absence of cryptographic primitives. The open problem remains the complete proof relation and its execution economics.

The required experiment order remains:

1. complete Materios POC-0;
2. complete independent finality verification;
3. complete storage/state-root proof;
4. compose the complete RootProof relation;
5. adversarial cases;
6. only then benchmark a succinct circuit.

## Updated evidence classification

| Reference | What it establishes | What it does not establish |
|---|---|---|
| IBC light clients | production verification architecture for remote consensus/state proofs | Cardano Plutus feasibility or B3-C completion |
| IBC GRANDPA client spec | concrete GRANDPA verification model | current production Materios conformance; spec is draft |
| Midnight + modified Halo2 | production/Cardano-adjacent use of Halo2 proving technology | Materios finality/state-root proof equivalence |
| Zcash Orchard/Halo2 | independent production Halo2 maturity | Cardano-specific trust/budget equivalence |

## Non-normative boundary

No proof system is selected.
No B3 authority is changed.
No IMMORTAL canonical semantics are changed.
No Materios claim is promoted from OPEN to CLOSED.
No external validator/federation becomes an IMMORTAL authority by inclusion in this research note.

## Sources

- IBC specification and light-client architecture: https://github.com/cosmos/ibc
- IBC GRANDPA client specification: https://github.com/cosmos/ibc/blob/main/spec/client/ics-010-grandpa-client/README.md
- Midnight testnet release notes: https://docs.midnight.network/assets/files/midnight-testnet-relnotes-04cd2e8c59377cb5554ed776195c2203.pdf
- Midnight State of the Network — March 2026: https://midnight.network/blog/state-of-the-network-march-2026
- Midnight FAQ / current consensus and validator model: https://midnight.network/faq
- Zcash Halo2: https://github.com/zcash/halo2