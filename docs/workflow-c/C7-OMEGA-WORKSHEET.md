# Workflow C — C7 Ω Completeness Worksheet

**Status:** checklist prepared from normative R3 / `16_OMEGA_COMPLETENESS_CONTRACT.md`; profile instantiation and evidence remain OPEN.

## Required declaration

For the selected profile, publish:
- the environment perimeter E, including boundary conditions;
- exclusions and why they are outside E;
- the authority that fixes Ω and prevents callers/operators/frontends/adapters from narrowing it;
- the residual-risk statement;
- the discovery procedure for a newly found omitted event class;
- the fail-closed/enlarge-E/Ω/re-certification response;
- the abstraction-soundness argument if the checker uses a finite abstraction.

The required condition is containment of all materially distinct successors permitted by E in Ω. Exact equality is not required; sound over-approximation is permitted and conservative. Narrowing Ω is unsound.

## Thirteen normative contract elements

| # | Element | Required profile evidence | Current state |
|---:|---|---|---|
| 1 | Authority source | identify who/what fixes Ω; show it is not self-selected by caller, operator, frontend or interested adapter | OPEN |
| 2 | Event-domain definition | enumerate/schema event classes in E | OPEN |
| 3 | Actor independence | show no actor can select a convenient sub-envelope for its own action | OPEN |
| 4 | Adaptive adversaries | represent worst-case adversarial resolution; not a benign probability distribution | OPEN |
| 5 | Repeated events | include repetition, including unbounded repetition where allowed by E | OPEN |
| 6 | Correlated events | represent joint/correlated occurrence; justify any product-form independence assumption | OPEN |
| 7 | Timing | include delay, reordering, expiry-boundary timing and freshness lapse | OPEN |
| 8 | Concurrency | include interleavings and races of coupled changes | OPEN |
| 9 | Liquidity shocks | include adverse EEV and protected-content valuation changes | OPEN |
| 10 | External truth / oracle failure | include unavailability, staleness, equivocation and fail-closed consequences | OPEN |
| 11 | Environment boundary | enumerate what E deliberately excludes and why | OPEN |
| 12 | Unknown / out-of-model events | explicitly state events outside E are uncovered | OPEN |
| 13 | Failure behaviour | define response when completeness cannot be established for a class | OPEN |

## Acceptance tests for C7

C7 cannot close from this table alone. The independent checker/auditor must establish:
1. every required element is instantiated with source-bound values, not placeholders;
2. the event envelope contains every economically distinct successor permitted by E, or is soundly over-approximated;
3. product-form Ω, if used, has a justified independence argument;
4. residual risk and out-of-perimeter classes are published;
5. newly discovered incompleteness triggers enlargement plus re-certification, fail-closed behavior, or explicit perimeter contraction and disclosure;
6. Ω completeness is not used as evidence for itself.

**Normative warning:** a finite published list of event names is not proof that the envelope is complete. Evidence must justify successor coverage relative to the declared perimeter.
