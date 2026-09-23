# CAES Prior-Art Research Notes — 2026-09-23

Non-normative research notes for the isolated CAES transition lab. These notes do not alter IMMORTAL or PRE-RICH economics.

## 1. Strongest new precedent: deployed-bytecode refinement certificates

Lazaropoulos & Paraskevopoulou, "Foundational Refinement Proofs for Deployed Bytecode, at the Price of Tokens" (2026), presents EquiVM: a Lean framework where deployed EVM bytecode is related to a high-level specification by a replayable, machine-checked refinement certificate. The key lesson for this lab is not the EVM machinery; it is the per-artifact refinement certificate and the reduction of the trusted base to formal semantics + specification + proof facts.

Source: https://arxiv.org/abs/2607.26306

Implication for IMMORTAL:
- strengthen C14 from artifact hashes/provenance toward a replayable refinement witness where feasible;
- distinguish artifact identity from artifact semantic refinement;
- do not claim IMMORTAL already has foundational bytecode refinement proof.

## 2. Plutus-specific prior art: translation certification

Krijnen, Chakravarty, Keller & Swierstra, "Translation certification for smart contracts" (Science of Computer Programming, 2024) describes translation relations for most Plutus Tx compiler passes, formalized in Coq, and frames certification as a way to connect source semantics to the low-level contract committed to the blockchain.

Source: https://doi.org/10.1016/j.scico.2023.103051

Implication:
- C14 should distinguish compiler/translation correctness from protocol/economic refinement;
- Plutus translation certification is a direct precedent for the high-level model -> concrete executable artifact boundary;
- IMMORTAL's potential differentiator is that the high-level object is an economic transition/state semantics, not merely contract source semantics.

## 3. Economic formalization precedent

Bartoletti, Marchesin & Zunino, "A formal framework for the economic security of DeFi compositions" (2026) defines MEV non-interference and local MEV to reason about economic attacks in composed DeFi systems.

Source: https://arxiv.org/abs/2606.05418

Implication:
- do not claim that formal economic security is new;
- compare IMMORTAL's ProtectedCapital / viability / admission semantics against economic-security frameworks;
- potential differentiator remains the use of a normative economic state-transition object as the primary refinement target.

## 4. DeFi semantic-gap precedent

A 2026 systematic survey, "A Systematic Survey of DeFi Composability: From Code Correctness to Protocol Robustness", proposes a three-layer model: Implementation, Composition and Protocol, and identifies a semantic gap between layers. It reports that protocol-level economic assumptions have weaker evidence than implementation-level properties.

Source: https://www.sciencedirect.com/science/article/pii/S2096720926001156

Implication:
- this strongly supports making the IMMORTAL refinement/evidence chain explicit;
- introduce a semantic-gap checklist in the lab: economic model -> V3 -> adapter representation -> validator -> ledger observation;
- C13/C14 can be framed as closing specific semantic gaps, not merely adding more tests.

## 5. Recursive proof-carrying state

Proof-Carrying Data literature establishes recursive proofs where participants carry evidence that a new message/state is consistent with prior computation. Recent state-transition systems similarly make each transition prove the relationship between authenticated prior and next state.

Useful sources:
- Recursive Composition and Bootstrapping / PCD: https://eprint.iacr.org/2012/095.pdf
- zkCoins specification, proof-carrying state transitions: https://docs.zkcoins.com/specification/
- recent proof-carrying state synchronization discussion: https://lab.parano1d.org/research/proof-carrying-state-sync/

Implication:
- model an EconomicTransitionWitness(preHash, action, postHash, ruleId, boundary witnesses);
- consider recursive history witness later;
- do not add ZK/recursive proof machinery to the normative protocol merely because the pattern is useful.

## 6. Liveness/enabledness

Schiffl & Beckert's FMBC work argues that many smart-contract liveness claims are more accurately described as enabledness because real liveness depends on fairness and actor assumptions.

Source: https://drops.dagstuhl.de/entities/document/10.4230/OASIcs.FMBC.2024.8

Implication:
- keep IMMORTAL R4's explicit liveness hypotheses;
- represent hypotheses as certificate data rather than silently mixing them with safety;
- useful form: Enabled(state, action, hypotheses).

## 7. Formal state-transition/refinement is not itself novel

A 2026 Event-B blockchain verification paper combines FSM abstraction, invariant proofs, refinement and temporal logic for blockchain consensus.

Source: https://pubmed.ncbi.nlm.nih.gov/42184222/

Implication:
- remove novelty language based only on FSM + invariants + refinement + liveness;
- the CAES novelty hypothesis must remain compositional and economic.

## 8. Solvency-proof precedent

ERC-7893 specifies explicit assets/liabilities, solvency ratio, timestamps and solvency history.

Source: https://eips.ethereum.org/EIPS/eip-7893

Implication:
- asset/liability solvency is not new;
- IMMORTAL should continue to distinguish ordinary solvency ratios from ProtectedCapital / worst-case exposure / viability-preserving admission;
- no ERC-7893 risk metrics should be imported as new IMMORTAL economics.

## 9. Proposed research distinction

The lab should test the following stronger statement:

> A CAES transition certificate is not a new proof system. It is a composition witness tying together existing economic-transition validity, concrete refinement, semantic serialization, explicit liveness hypotheses, artifact identity, and eventually authenticated ledger observation.

The interesting question is therefore:

Can one independently checkable witness preserve the identity of the same economic transition across all refinement boundaries without granting authority to the adapter?

This is the current experimental target.

## 10. Evidence discipline

Prior-art evidence is not implementation evidence.

A literature match may establish that a mechanism is known; it does not establish that IMMORTAL implements that mechanism correctly.

Likewise:
- model witness != deployed bytecode proof;
- artifact hash != semantic refinement;
- C13 representation test != ledger equivalence;
- liveness hypotheses != network liveness proof;
- CI green != universal correctness.
