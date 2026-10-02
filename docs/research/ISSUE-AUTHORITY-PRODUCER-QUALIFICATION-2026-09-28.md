# ISSUE AUTHORITY PRODUCER QUALIFICATION — 2026-09-28

**Status:** RESEARCH / NON-NORMATIVE / IMPLEMENTATION BOUNDARY  
**Branch:** `work/immortal-green-closure`  
**Purpose:** close the remaining authority-contract ambiguity before any concrete first-user Issue producer is implemented.

> This document does not choose an oracle, invent an EEV formula, promote Pool value to EEV, or change PRE-RICH economics.

## 1. Current conclusion

The repository already has the transport boundary for an authoritative Issue admission witness. The remaining gap is not another TypeScript interface.

The producer must prove provenance for two coupled inputs:

1. **PRE-RICH control state**
   - `CurrentActiveClass`
   - `HighestClassEverActivated`
   - class-level issued/cap/saleability evidence required by the profile

2. **Economic truth used by the gate**
   - authoritative EEV for the declared perimeter/horizon;
   - ProtectedCapital inputs/provenance;
   - executable liquidity bound to the exact candidate Pool UTxO;
   - freshness and source identity required by the adopted evidence contract.

A producer that merely copies values from the browser, relayer, legacy B1 Pool datum, displayed PRE price, market cap, or an operator-selected state is not authoritative.

## 2. Control-state qualification

The PRE-RICH profile already defines:

`CurrentActiveClass` may contract.

`HighestClassEverActivated` is monotonic.

The implementation also contains a deterministic hysteresis reference that can recompute the expected result from a verified capacity state.

That computation is **not itself an authority source**.

The required closure chain is:

`canonical economic state → authenticated observation → deterministic PRE-RICH hysteresis → observed control state → Issue admission`

Minimum checks:

- exact class set/version is identified;
- class IDs are unique and complete;
- capacity inputs are authenticated;
- the previous control state is authenticated when needed for monotonic history;
- `HighestClassEverActivated(t+1) >= HighestClassEverActivated(t)`;
- `CurrentActiveClass <= HighestClassEverActivated`;
- observed control equals the deterministic profile result;
- provenance is bound to an observation/state reference;
- browser/relayer cannot replace the observed values.

A type named `AuthoritativeClassState` is therefore an **evidence carrier**, not an authority by naming convention.

## 3. EEV qualification

The current EEV model requires, for each asset contributing to EEV:

`AssetIdentity ∧ HeldQuantity ∧ LiquidationRoute ∧ VerifiableExecutionData ∧ VerifiedUSDMConversion ∧ ExecutionCostModel ∧ τ`

with quantity limited to what can actually be liquidated within `τ`.

Therefore the following are explicitly insufficient on their own:

- current B1 Pool USDM balance;
- displayed PRE price;
- PRE market capitalization;
- theoretical curve price;
- arbitrary liquidity haircut;
- relayer-produced valuation;
- a local TypeScript calculation.

The producer must consume a qualified observation whose source/perimeter/horizon are already defined and authenticated.

**Important:** the current Notion EHSE record leaves asset perimeter, `τ`, oracle/data source and execution-cost model open. PRE is not currently demonstrated as an EEV-liquidatable asset. No producer may silently promote PRE into EEV.

## 4. Executable liquidity is a separate witness

Immediate executable liquidity is not synonymous with EEV.

The already-materialized Cardano observation boundary requires:

`observed spendable UTxOs → exact Pool identity → declared liquidity → candidate transaction binding`

For the Issue path the current binding is intentionally strict:

- exact B1 PrizePool input reference;
- exactly that Pool UTxO as liquidity source;
- observed value equals declared liquidity;
- source UTxO is spendable and not ring-fenced;
- observation is fresh under a caller-supplied horizon;
- candidate transaction actually consumes the observed source.

This is an execution witness, not a new economic formula.

## 5. Producer contract

Once the three evidence layers above exist, the producer may construct the already-defined `EconomicAdmissionWitness`.

The producer may:

- package authenticated observations;
- bind them to exact runtime inputs;
- bind action class = `Issue`;
- expose observation/state references;
- provide the candidate-state decision produced by the authoritative economic boundary.

The producer must not:

- derive a new EEV formula;
- choose an arbitrary PRE oracle;
- manufacture class state;
- infer authority from UI selection;
- substitute Pool balance for EEV;
- bypass ProtectedCapital;
- downgrade a rejected Gate decision;
- sign or submit the economic transaction.

The browser remains fail-closed until the witness is available.

## 6. First-user dependency

The shortest safe path remains:

`P2.8 native packet → real Preprod Reveal → authenticated Genesis carrier → qualified control/EEV producer → Issue → Claim/Expire evidence`

The Issue producer cannot legitimately be implemented as a mock merely to unblock the UI.

## 7. Closure tests required before live Issue

### CLASS-AUTH

Negative cases:

- missing class;
- duplicate class;
- stale class observation;
- current class above highest-ever;
- highest-ever regression;
- observed control differs from deterministic hysteresis result;
- unbound state/observation reference.

### EEV

Negative cases:

- missing asset identity;
- unverified held quantity;
- no liquidation route;
- missing execution evidence;
- missing USDM conversion;
- missing execution-cost model;
- missing/invalid `τ`;
- stale source;
- PRE valuation supplied without qualified liquidation evidence.

### LIQUIDITY

Negative cases:

- wrong Pool UTxO;
- duplicate source;
- ring-fenced source;
- non-spendable source;
- declared/observed value mismatch;
- source not consumed by candidate Issue transaction;
- stale observation.

### PRODUCER

Negative cases:

- provider unavailable;
- wrong action class;
- witness bound to different Pool;
- witness state hash/reference mismatch;
- witness supplied without required authority evidence.

## 8. Decision

**Do not implement the concrete authoritative producer yet.**

The repository is ready for that implementation only after the authority source itself is qualified.

The next evidence-bearing implementation target is therefore not another economic formula. It is the authenticated source/binding layer for:

`control state + EEV perimeter/horizon + executable Pool liquidity`

Once those are real, the existing `AuthoritativeIssueAdmissionProvider` boundary can be instantiated without changing economic semantics.
