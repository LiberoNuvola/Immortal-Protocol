# IMMORTAL — GOV-23

## Independent Replay / Conformance Evidence

GOV-23 is a coherent governance milestone after GOV-22.

### Deliverables

- `verification/governance_gov23_vectors.json`
  - language-neutral positive replay vector
- `verification/gov23_reference_replay.py`
  - independent deterministic replay reference
- `verification/GOV-23-NEGATIVE-CASES.json`
  - explicit negative validation cases
- `docs/GOV-23-INDEPENDENT-REPLAY.md`
  - normative/evidentiary boundary and acceptance criteria

### Run

```text
python3 verification/gov23_reference_replay.py
```

Expected:

```text
GOV-23 independent replay: PASS
events: 2
final proposal status: Classified
```

### Claim boundary

A passing reference replay is mechanical evidence for the published vector.
It is not evidence that the repository's Haskell implementation, Cardano
adapter, or deployment conforms.

### Next grouped milestone

Before governance closure, the project should replace placeholder payload
commitments with a formally frozen canonical UTF-8 serialization and
cryptographic commitment rule, then bind authorization/evidence/ruleset
checks to canonical event validity and prove equivalence between at least two
independent implementations over the full event vocabulary.
