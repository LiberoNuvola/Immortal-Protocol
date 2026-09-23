# CAES Prior-Art Findings — New Deep Pass

## A. Refinement can encode liveness as safety, but only with explicit state

LiDO shows a powerful pattern: add a pacemaker state so liveness properties of Byzantine state-machine implementations can be expressed as safety properties and then proved by refinement. It is mechanized in Coq for Jolteon.

Source: https://flint.cs.yale.edu/certikos/publications/lido.html

Use for IMMORTAL:
- investigate whether R4 liveness hypotheses can remain an explicit environment/state component of a refinement witness;
- do not collapse IMMORTAL liveness into ordinary safety unless the required environment state is represented explicitly;
- this suggests a possible future LivenessContext rather than an opaque boolean certificate.

## B. DeepSpec / layered refinement is a direct architectural precedent

CertiKOS uses certified abstraction layers, deep specifications, contextual refinement and vertical/horizontal composition. Its framework explicitly describes layers as triples and supports composing local proofs into whole-system guarantees.

Source: https://flint.cs.yale.edu/certikos/framework.html

Use for IMMORTAL:
- distinguish a local proof obligation from the composition rule that makes the whole stack meaningful;
- IMMORTAL -> V3 -> Adapter -> Ledger can be studied as a refinement stack, but this is not itself novel;
- the research question becomes whether the economic object being refined is materially different from the usual program/module object.

## C. New 2026 certificate-carrying transformation precedent

Certificate-Carrying Transformation of Event-Driven Block Programs uses an untrusted optimizer and a trusted, fail-closed checker that recomputes every semantic side condition under an explicit observation lens.

Source: https://arxiv.org/abs/2607.00563

This is directly useful to the audit experiment.

The previous prototype had a transitionValid boolean supplied by the witness producer. That was too trusting.

HARDENING APPLIED: removed transitionValid from the certificate type and made the checker rely only on the existing boundary witnesses plus structural identity/liveness fields.

This is a lab improvement, not a protocol change.

The key design lesson is: producer proposes -> checker validates -> checker grants acceptance.

## D. Observation lens is a useful concept for C13

The 2026 certificate-carrying transformation work parameterizes correctness by an explicit observation lens.

Possible IMMORTAL adaptation:
- define which parts of economic state/action are observable at each boundary;
- require the same observation mapping when comparing V3, adapter and ledger witnesses;
- reject a witness that is valid under one observation mapping but claimed equivalent under another.

This may provide a clean formal vocabulary for semantic conformance without adding economic policy.

## E. Translation certification remains a separate layer

Plutus translation certification formalizes compiler translation relations, not IMMORTAL's economic semantics.

Source: https://doi.org/10.1016/j.scico.2023.103051

Therefore C14 should distinguish:
1. source-to-compiled translation correctness;
2. economic-model-to-Cardano refinement;
3. artifact provenance;
4. ledger-event identity.

## F. Experimental consequence

The CAES lab should evolve from certificates containing validity claims to certificates containing identities plus independently checkable local witnesses.

The intended shape is:

pre identity + action identity + post identity + rule/profile identity + local boundary witnesses + liveness context

and acceptance only after the checker establishes consistency.

No new economic rule is introduced.