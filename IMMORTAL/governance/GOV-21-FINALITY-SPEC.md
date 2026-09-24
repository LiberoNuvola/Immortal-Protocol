# GOV-21 — Challenge, Finality & Canonicalization Closure

Status: implementation package prepared against `b1-hardening` commit
`7a1a3b0fe9a7775d54009872d0d72468eb1ec578`.

## Purpose

GOV-21 closes the finality boundary defined by GOV-18.

A governance decision is not itself canonical. After the decision is
recorded, the proposal enters a deterministic challenge/finality window.
Only after that window has expired, and only if no challenge remains open
or upheld, may the proposal become `Canonical`.

## Normative state relation

```text
DecisionRecorded
      |
      v
ChallengePeriod
      |
      +---- open challenge ----> ChallengeOpen
      |                              |
      |                     +--------+--------+
      |                     |                 |
      |                     v                 v
      |                Rejected          Upheld
      |                     |                 |
      |                     |                 v
      |                     |              Blocked
      |                     |
      +---------------------+
                |
                v
        finality expiry
                |
                v
            Canonical
```

## Finalization predicate

For proposal `p`, challenge set `C`, and time `t`:

`CanFinalize(p,C,t)` holds iff:

1. `p.status = DecisionRecorded`;
2. the finality window has expired;
3. every challenge belongs to `p`;
4. challenge identifiers are unique and non-empty;
5. every challenge was opened inside the finality window;
6. every challenge has status `Rejected`.

An `Upheld` challenge therefore blocks canonicalization.

An `Open` challenge also blocks canonicalization.

An already `Canonical` proposal cannot be finalized a second time.

## Boundary rules

- Challenges cannot be opened before `DecisionRecorded`.
- Challenges cannot be opened after the finality window closes.
- A challenge can transition only once from `Open` to either `Upheld`
  or `Rejected`.
- Duplicate challenge identifiers are invalid.
- Finalization is deterministic and idempotence is deliberately rejected
  as a second state-changing operation.
- `finalizationAt` is assigned only by finalization; recording a decision
  does not itself make the proposal canonical.

## Separation of concerns

GOV-21 does not decide:

- who owns the protocol;
- whether PRE is the governance asset;
- the exact PRE-to-governance weight mapping;
- implementation merge policy;
- trademark status.

Those remain separate governance/application concerns.

## Traceability to GOV-18

- GOV-C-12: deterministic finite challenge window.
- GOV-C-13: finalization only after challenge resolution or expiry.
- GOV-C-14: emergency expiry remains separately time-bounded.
- GOV-C-15: emergency semantics cannot become permanent canonical semantics.
- GOV-C-19: conformance remains distinct from governance approval.
- GOV-C-20: canonicalization remains distinct from implementation merge.

## Closure criterion

GOV-21 is complete when the implementation and tests demonstrate that
every admissible challenge/finality boundary above is enforced by the
authoritative governance transition layer.
