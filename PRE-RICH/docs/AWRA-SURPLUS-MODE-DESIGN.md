# PRE-RICH — AWRA Surplus Mode Design

**Status:** Recovered design / non-normative pending explicit parameterisation  
**Scope:** PRE-RICH application profile  
**Purpose:** record the mature-surplus mechanism recovered from the historical economic-algorithm checkpoints so it is not repeatedly reconstructed from legacy material.

## 1. Why this document exists

PRE-RICH has two distinct ways in which stronger economics can improve the player experience:

1. Before the maximum ticket class is reached, stronger economic capacity can permit a higher `CurrentActiveClass`, which raises the absolute value of every prize because the prize remains proportional to ticket price `P`.
2. After the maximum class and the Jackpot regime are already active, class progression can no longer express additional surplus capacity. The recovered design therefore introduces **AWRA — Adaptive Win Rate Algorithm** as a consumer of genuine residual surplus.

The second mechanism is the one that must not be confused with ordinary class activation.

## 2. Economic boundary

The universal economic sequence remains:

```text
EEV
  ↓
ProtectedCapital
  ↓
RawSurplus = max(0, EEV − ProtectedCapital)
```

The historical checkpoint also used a more explicit safety-capacity view:

```text
C = V − L − E − J − R − M − O
X(P) = 499P + Fs + Fr + Fc
CR(P) = C / X(P)
```

with candidate thresholds:

```text
Activation:  CR(P) >= KA
Maintenance: CR(Pcurrent) >= KC
Distribution floor:
DS = max(0, C − KD × X(Pcurrent))
```

The checkpoint treated `KA = 8`, `KC = 4`, `KD = 4` as working values at that stage. The later repository baseline froze those values, but the **AWRA optimisation itself was never given a final quantitative rule**.

## 3. Mature surplus state

The mature state is reached when the normal class frontier can no longer expand:

```text
CurrentActiveClass = HighestClassEverActivated = maximum class
```

and the required Jackpot state is already active/funded under its applicable protected-liquidity rules.

At that point, additional genuine residual surplus is not represented by opening another ticket class. It becomes candidate capacity for surplus-mode operations, including AWRA.

The key principle is:

```text
RawSurplus > 0
        +
maximum class already active
        +
required Jackpot protection satisfied
        ↓
SURPLUS MODE / AWRA eligibility
```

A positive balance alone is never sufficient; the complete authoritative economic state and post-transition Economic Gate remain decisive.

## 4. What AWRA is

AWRA is an application-level adaptive mechanism intended to improve the experience and/or win rate when surplus is sufficient.

The recovered checkpoint explicitly describes AWRA as a **consumer of surplus**, not an authority over protected capital.

AWRA may therefore adapt the economics of **future, not yet crystallised tickets**, provided the resulting state remains inside the authorised economic envelope.

Potential dimensions identified in the checkpoint are:

- `W = P(payout > 0)`
- `G = P(payout > ticket)`
- `D = P(two row wins)`
- `H = P(payout >= 5×)`
- `EV`
- payout variance / `σ`
- tail risk
- required reserve

## 5. Hard constraints

AWRA MUST NOT:

- consume crystallised liabilities;
- consume unresolved worst-case protection;
- consume locked Jackpot liquidity;
- violate Reserve, Maintenance or mandatory future-cost requirements;
- push a post-transition state outside the Economic/Viability Gate;
- alter already-issued or already-crystallised ticket payouts;
- let an operator choose the winning result or payout;
- increase the normal maximum beyond the current `500 × P` application ceiling unless a separate explicit policy decision changes that ceiling.

For a new ticket, any AWRA-enhanced configuration therefore remains subject to the same lifecycle:

```text
authorised state
    ↓
candidate configuration
    ↓
post-state / risk evaluation
    ↓
Economic Gate + Viability
    ↓
atomic adoption
```

## 6. What was actually decided vs. what was not

**Recovered / well-supported design intent:**

- surplus must not be spent before protected capital is covered;
- class progression expresses surplus capacity until the class ceiling is reached;
- after that ceiling, AWRA is the intended adaptive consumer for improving win rate / player experience;
- AWRA is constrained by the same economic safety machinery;
- the change applies only to future tickets;
- the current payout ceiling remains `500 × P`;
- a deterministic algorithmic selection is required; operator discretion is not.

**Not found as a frozen rule:**

- an exact formula mapping `RawSurplus` to an AWRA factor;
- an exact allocation of surplus between AWRA and other surplus uses;
- the exact candidate configuration family;
- the exact objective ordering among win rate, EV, variance, tail risk and other metrics;
- a final quantitative AWRA budget-per-ticket rule.

The historical checkpoint explicitly says that no unique AWRA optimum had yet been established and that the preferred direction was a Pareto frontier or explicit lexicographic priorities with hard solvency constraints.

## 7. Deterministic formulation to be adopted later

The cleanest implementation model is to treat AWRA as a deterministic selector over a finite, versioned candidate set:

```text
AWRAConfig* = deterministic_best(
    admissible_configs(state, environment, ruleset)
)
```

where a candidate is admissible only when its projected post-state remains economically safe.

The candidate set, objective ordering, bounds and tie-break rules must be explicit and versioned. They must be committed/bound to the application ruleset so the algorithm cannot silently enlarge its own authority.

This section is intentionally **design guidance, not a frozen numerical policy**.

## 8. Relationship to the base prize table

The current base table remains:

```text
Tier 1 → 1 × P
Tier 2 → 2.5 × P
Tier 3 → 5 × P
Tier 4 → 100 × P
Tier 5 → 500 × P
```

The recovered mature-surplus design does **not** mean that this table is irrelevant. It means that, once the mature-surplus policy is explicitly adopted, AWRA may select an authorised enhanced configuration for future tickets inside the bounded application rules.

Until that policy is frozen, the base table is the active canonical game configuration.

## 9. State-machine view

```text
LOW / PROTECTED
      ↓
CLASS GROWTH
      ↓
MAX CLASS
      ↓
JACKPOT MATURE
      ↓
MATURE SURPLUS
      ↓
AWRA candidate evaluation
      ↓
safe enhanced configuration
      ↓
future tickets use enhanced configuration
      ↓
surplus contracts
      ↓
AWRA contracts / returns toward base
```

A deterioration in economics must cause the adaptive mechanism to contract before protected capital is threatened.

## 10. Source provenance

This reconstruction is based primarily on:

- `PRE-RICH_Economic_Algorithm_Full_Checkpoint.docx` — sections on Treasury/surplus, AWRA, reinvestment/flywheel and simulator requirements;
- `PRE-RICH_Economic_Algorithm_Master_Checkpoint.docx` — master formula including `DS = max(0, C − KD × X(Pcurrent))`;
- `PRE-RICH_Economic_Algorithm_State_Summary.docx` — AWRA as a safe consumer of surplus;
- the current PRE-RICH economic specification for the frozen class ladder, payout ceiling and liability-first constraints.

The historical checkpoints are evidence of design reasoning, not proof of current implementation conformance.
