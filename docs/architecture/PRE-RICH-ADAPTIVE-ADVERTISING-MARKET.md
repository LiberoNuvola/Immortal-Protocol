# PRE-RICH Adaptive Advertising Market — Design Note v0.1

**Status:** APPLICATION-LEVEL / RESEARCH → IMPLEMENTATION DESIGN
**Scope:** PRE-RICH advertising only. This document does not modify IMMORTAL economic semantics or canonical game economics.

## 1. Purpose

PRE-RICH already exposes time-bounded advertising slots. The next iteration makes slot pricing responsive to observed audience demand and bounded future attention trajectories.

The system must not present a forecast as a guarantee. A trajectory-derived price is a pricing function over an observed state and an explicitly bounded future trajectory set.

## 2. Authority boundary

Advertising remains a PRE-RICH application mechanism.

- IMMORTAL defines universal economic semantics and admissibility machinery.
- Cardano Adapter realizes application transitions.
- PRE-RICH owns advertising products, slot inventory, audience observations, pricing policy and campaign lifecycle.
- The browser may display observations and request actions, but must not manufacture authoritative visitor counts, trajectory evidence or economic admission.

## 3. Advertising state

A future implementation may expose an application-level `AttentionState` containing:

- observed visitor count/rate;
- observation window;
- active slot occupancy;
- demand signal;
- trend;
- uncertainty/evidence status;
- observation timestamp/reference.

No field becomes canonical merely because it exists in the browser.

## 4. Trajectory-aware pricing

Conceptual pipeline:

`Observed Attention State → bounded future trajectories → admissible pricing envelope → slot price`

The trajectory layer is inspired by the Economic Trajectory Oracle concept, but is not a new IMMORTAL oracle component and does not claim predictive certainty.

Pricing should remain bounded by application-defined floor/ceiling constraints.

## 5. Current implementation baseline

Existing `src/adSlots.ts` provides:

- 1h / 6h / 1d / 3d packages;
- a dynamic hourly rate;
- floor 1 USDM/hour;
- ceiling 10 USDM/hour;
- 0.5 USDM/hour price step;
- deterministic expiry.

These values remain implementation parameters, not universal IMMORTAL constants.

## 6. Proposed pricing inputs

The first implementation should separate:

1. **Observed demand:** what has actually happened.
2. **Inventory pressure:** how much advertising capacity is occupied.
3. **Trajectory signal:** bounded future attention scenarios.
4. **Uncertainty:** how strongly the trajectory signal is supported.
5. **Package duration:** purchased time window.

A conservative first implementation can use a bounded demand multiplier while keeping the existing floor and ceiling. A later trajectory-aware implementation may replace the multiplier with a certified pricing envelope once the observation source is established.

## 7. Anti-manipulation requirements

The browser must not be the authority for:

- visitor counts;
- campaign settlement;
- slot ownership;
- expiry;
- trajectory certification;
- final price admission.

Every economically material advertising transition should eventually have an evidence/reference chain analogous to the existing PRE-RICH economic admission boundary.

## 8. Lifecycle

`AVAILABLE → PURCHASED → ACTIVE → EXPIRED → AVAILABLE`

Expiry must be deterministic from the accepted campaign state and not depend on the browser remaining online.

## 9. Open decisions

The following remain deliberately OPEN:

- authoritative visitor observation source;
- unique-visitor vs page-view metric;
- observation aggregation window;
- exact trajectory derivation function;
- uncertainty model;
- revenue allocation;
- campaign content policy;
- whether pricing is continuous, epoch-based, or auction-based;
- on-chain vs off-chain storage of campaign creative;
- privacy/compliance requirements.

No value is promoted to normative IMMORTAL economics until separately authorized.

## 10. Closure target

`authenticated observation → application advertising state → bounded pricing derivation → campaign admission → Cardano settlement → observed campaign state → expiry → evidence`

This is an application-level use of the same evidence-first architectural discipline already used by PRE-RICH.

## 11. Implemented v0.1 engine

`src/adSlots.ts` now exposes a pure `calculateAdaptivePriceEnvelope()` function. It accepts an explicit attention observation, bounded future-attention interval, trajectory confidence and freshness window. Malformed or stale observations return `null` (fail closed). The legacy occupancy-only pricing path remains available as the application fallback until an authoritative observation source exists.

Tests cover price bounds, observed-attention monotonicity, trajectory-envelope widening, confidence influence, stale observations, invalid baselines and legacy fallback behavior.


## 12. Observation producer v0.1

`relayer/attentionObservation.js` now provides a privacy-oriented application observation producer. It aggregates coarse visitor buckets into time-windowed attention rates and exposes an explicit observation envelope for the pricing layer.

The producer intentionally does not persist or expose IP addresses, wallet addresses or raw user-agent strings. It is still **not an authoritative production telemetry source**: deployment must supply a trusted ingress and a documented bucket-generation method, and the resulting observation must be bound to the application evidence chain before it can influence economically material settlement.

A dedicated CI workflow covers the adaptive pricing and observation-producer tests.

## 13. Remaining authority boundary

The browser is still not trusted to declare its own visitor count. The next integration boundary is:

`trusted ingress → observation aggregation → authenticated AttentionState → trajectory derivation → pricing envelope → campaign admission`

Until that boundary is implemented, adaptive pricing remains a deterministic application capability rather than an authoritative economic input.


## 14. Observation authority v0.1

`relayer/attentionAuthority.js` now defines the producer boundary for advertising observations. A sealed observation carries an explicit producer identity, observation reference, freshness timestamp/window and deterministic content hash. Verification rejects malformed observations and any post-production change to the measured attention value.

This hash is an integrity binding, not a claim of cryptographic authenticity of the ingress itself. Production deployment still requires an authenticated trusted ingress/producer identity and evidence that the producer measured the observation as declared. The browser remains outside the authority boundary.

The design deliberately mirrors the repository's evidence discipline: explicit reference, producer, observation, binding and fail-closed verification, while keeping advertising separate from IMMORTAL economic authority.


## 15. Signed producer ingress v0.1

The advertising observation boundary now supports an Ed25519-signed observation envelope through `relayer/attentionSignature.js`. The signed payload includes producer identity, observation reference, timestamp/window, measured attention values, source and the observation integrity hash. Verification requires the producer identity declared by the observation to match the authorized producer identity and rejects invalid signatures or modified measurements.

This follows the repository's existing trust-boundary pattern: cryptographic verification establishes a trusted observation candidate; it does not make the producer itself economically authoritative. Advertising remains PRE-RICH application infrastructure and does not become part of the IMMORTAL economic kernel.

### Remaining ingress closure

A production deployment still needs an authenticated producer-key registry and replay state (for example, a monotonically advancing producer sequence or equivalent unique observation ledger). A valid signature alone does not prevent an old valid observation from being replayed.


## 16. Producer registry and replay protection v0.1

Advertising observations now have a dedicated `AttentionProducerRegistry`. A producer must be explicitly registered with its Ed25519 public key before its observations are accepted. Each observation carries a non-negative monotonic `sequence`, and that sequence is included in the signed payload.

The registry accepts an observation only when:

- the producer is registered;
- the sequence is strictly newer than the last accepted sequence for that producer;
- the observation timestamp is not in the future;
- the observation is within the configured freshness horizon;
- the Ed25519 signature verifies against the registered producer key.

Therefore a previously valid observation cannot simply be replayed after acceptance, and a valid but stale observation cannot enter the adaptive pricing path.

The registry is an application infrastructure boundary, not IMMORTAL economic authority. Production deployment still needs durable persistence for producer registrations and last-accepted sequence state; the in-memory implementation is intentionally not presented as deployment-grade durable storage.


## 17. Provenance-bound pricing v0.1

`src/adPricingDecision.ts` now forms the explicit application boundary between trusted attention state and the adaptive advertising price. The pricing decision carries the producer identity, observation reference, observation hash and monotonic sequence together with the resulting price envelope.

The decision function is fail-closed for missing provenance or stale/malformed attention state. It does not authenticate the producer itself; producer authentication remains the responsibility of the signed-ingress/registry layer.

The resulting chain is therefore:

`producer -> signed observation -> registered/fresh observation -> TrustedAttentionState -> pricing envelope + provenance -> campaign decision`

This keeps the price derivation deterministic and auditable without turning the pricing function into an economic oracle or adding advertising rules to IMMORTAL.


## 18. Campaign admission v0.1

`src/adCampaignAdmission.ts` is the application-level admission boundary for purchasing an advertising package from a pricing decision. It freezes the package, rate, total price, admission time, expiry, pricing validity, and the complete observation provenance carried by the pricing decision.

Admission fails closed after the pricing envelope expires or when required provenance is malformed. The campaign price is taken only from the already-derived pricing decision; a caller cannot supply a second client-side price to override it.

This remains PRE-RICH application logic. It does not modify IMMORTAL economic rules and does not constitute on-chain settlement or payment authorization.


## 19. Settlement boundary v0.1

Advertising settlement is deliberately kept outside the current IMMORTAL `EconomicAdmission` action vocabulary. That vocabulary is currently canonical for `Issue`, `Reveal`, `Claim`, and `Expire`; introducing an `Advertising` action solely to reuse the gate would silently add PRE-RICH semantics to the protocol layer.

`src/adSettlement.ts` therefore provides the PRE-RICH application settlement boundary. It requires a valid `AdCampaignAdmission`, rejects missing/expired/malformed provenance before signing, and delegates the actual signing/submission to the existing Cardano adapter boundary.

This establishes the current safe composition:

`trusted attention -> pricing decision -> campaign admission -> application settlement -> Cardano adapter`

A future on-chain advertising transition may acquire a protocol `EconomicAdmission` path only after PRE-RICH formally defines that transition and its canonical economic semantics. Until then, no protocol action class is fabricated for advertising.
