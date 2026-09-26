# PRE-RICH — V3 Initial State Admission Gap

Date: 2026-09-26
Scope: first real PRE-RICH Issue on Cardano Preprod
Status: OPEN — live carrier deployment and evidence required

## Finding

The repository now contains an explicit PRE-RICH Preprod initial-state declaration in:

`PRE-RICH/profile/PreRichPreprodDeploymentProfile.ts`

This is a deployment/application declaration, not IMMORTAL universal law.

It specifies:

- stateVersion = 0;
- classCap = 10 for each of the eight canonical classes;
- CurrentActiveClass = 0;
- HighestClassEverActivated = 0;
- crystallizedLiabilities = 0;
- unresolvedReserve = 0;
- unresolvedTicketCount = 0;
- SafetyCapital = 0;
- ReserveProtection = 0;
- MandatoryFutureCosts = 0;
- Jackpot lockedAmount = 0;
- Jackpot threshold = 0;
- Jackpot status = inactive;
- Jackpot cycle = 0;
- only class 0 saleable initially.

The profile also asserts exactly eight canonical classes 0..7.

Therefore the former **"missing initial-state declaration"** portion of this gap is closed at the design/deployment-profile layer.

## What remains open

The profile is not itself a live Cardano authority.

The real first-user Issue still requires:

1. deterministic serialization of this exact declared state;
2. deployment of the V3 carrier singleton;
3. exact singleton UTxO and datum observation;
4. authenticated lifecycle/version boundary;
5. binding of the observed carrier state to Issue admission;
6. real Preprod transaction execution;
7. post-transaction carrier and B1 Pool evidence.

No browser, fixture, GoldenVectors state, or inferred default may substitute for the deployed carrier.

## Non-regression

Do not:

- move these deployment values into IMMORTAL universal constants;
- copy GoldenVectors.baseState as live authority;
- derive protected-capital fields from Treasury balance;
- derive V3 state from the browser;
- use B1PrizePool as a lossless V3 substitute;
- add a second economic algorithm in TypeScript.

## Current consequence

The architecture has crossed from **"initial state undefined"** to **"initial state explicitly declared, awaiting materialization."**

The executable sequence is now:

`declared PRE-RICH initial V3 state
→ deterministic datum encoding
→ deployment seed UTxO
→ one-shot carrier mint
→ exact singleton UTxO observation
→ Issue admission binding
→ DEMETER/CIP-30 first Issue
→ post-state evidence`

Until the singleton exists on Preprod, the first-user Issue path remains correctly fail-closed.
