# GOV-C Implementation Gap Matrix — Phase 2

| Requirement | Current skeleton | Required next work |
|---|---|---|
| Snapshot at voting start | Partial | Add immutable snapshot identifier/time and validation |
| Linear PRE | Present | Add aggregation/splitting tests |
| Delegation | Data type only | Implement direct non-recursive weight-conserving accounting |
| Quorum 25% | Present | Bind to `Q=Y+N+A` and snapshot |
| Ordinary >50% | Present | Freeze against active-rule mutation |
| Kernel >=2/3 | Present | Freeze against active-rule mutation |
| Abstention | Enum only | Explicitly count in quorum |
| 7d review | Missing | Add temporal state |
| 5d voting | Missing | Add temporal state and late-vote rejection |
| 3d finality/challenge | Missing | Add challenge/finalization lifecycle |
| Material amendment | Missing | Add proposal version/new lifecycle rule |
| Emergency 72h | Missing | Add activation, expiry and renewal constraints |
| Canonical event schema | Missing | Replace ad-hoc event representation with canonical fields |
| Invalid event rejection | Partial | Enforce every event predicate before mutation |
| Deterministic replay | Present in skeleton | Extend to canonical event history + ruleset |
| Serialization | Missing | Define deterministic encoding and hash/reference construction |
| Cardano integration | Missing | Adapter only after chain-neutral tests pass |
