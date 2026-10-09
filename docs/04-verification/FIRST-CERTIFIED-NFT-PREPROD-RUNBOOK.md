# First Certified NFT — Cardano Preprod E2E

## Objective

Produce the first real PRE-RICH Ticket NFT in a user CIP-30 wallet and render it as a persistent certified 3D ticket whose receipt is derived from the canonical on-chain PrizeDatum.

Acceptance path:

Verified PRE Treasury >= 4,000 USDM
  -> Genesis automatic activation
  -> Class 1 ACTIVE
  -> authoritative Issue admission
  -> CIP-30 wallet signs
  -> Cardano Issue transaction
  -> Ticket NFT arrives in wallet
  -> exact PrizeDatum observed and identity-certified
  -> BeaconReady / MATERIOS provenance observed
  -> certified 3D ticket receipt rendered
  -> same Ticket NFT Reveal
  -> result / payout settled on-chain

## Certification layers

### Identity certification

A ticket is identity-certified only when:

- the wallet holds exactly one unit of the ticket asset;
- the wallet policy ID and asset name match PrizeDatum;
- PrizeDatum is decoded successfully;
- the verification reference binds to the observed Prize UTxO.

Implementation:

- PRE-RICH/src/PreRichCertifiedTicket.ts
- src/gameFlow.ts
- src/ticket3d.ts

### MATERIOS provenance

When the Beacon registry reaches BeaconReady, the canonical PrizeDatum carries:

- pdBeaconStatus
- pdMcHash
- pdMateriosContext

The 3D ticket back renders these fields as a receipt.

This is provenance display, not an independent B3 proof claim.

### B3 certification

A ticket is B3-verified only after the independent B3 chain is demonstrated:

Materios finalized checkpoint -> GRANDPA finality/authority/ancestry -> StateRoot -> authenticated storage proof -> B3 succinct verification -> canonical Beacon

The current DApp must not display B3 as verified merely because mcHash and materiosContext are present.

## Issue gate

The browser must never manufacture:

- EEV;
- ProtectedCapital;
- viability;
- Omega successor certification;
- class authority;
- economic admission witness.

The first real Issue requires an authoritative producer bound to:

- exact Counter input;
- exact B1 PrizePool input/value;
- exact deployed V3 carrier state;
- authoritative CurrentActiveClass / HighestClassEverActivated and class saleability;
- qualified EEV provenance;
- executable liquidity;
- decision/observation references;
- canonical pre/post/action fingerprints.

Existing boundaries are reusable:

- src/preRichIssueAdmissionBridge.ts
- src/authoritativeIssueAdmissionProducer.ts
- Adapter/CARDANO/observation/HaskellIssueAdmissionProvider.ts
- relayer/preprodIssueObservationReader.js
- relayer/issueAdmissionProvider.js
- plutus/export/IssueAdmission.hs

## Evidence packet

The first real ticket acceptance packet must preserve at least:

- Issue transaction CBOR/hash;
- exact Counter input/output;
- exact B1 PrizePool input/output;
- exact V3 carrier pre/post state references;
- Ticket policy ID + asset name;
- Prize UTxO and decoded PrizeDatum;
- authoritative Issue decision/observation references;
- wallet address;
- Beacon target;
- Beacon status;
- mcHash and materiosContext when Ready;
- later Reveal transaction and post-Reveal PrizeDatum;
- Cardano ledger/runtime evidence required by the applicable P2.8 gate.

## Failure rules

- No synthetic witness is acceptable for the first-user Issue.
- Genesis is never presented as a selectable class.
- Class 1 is the selectable 1 USDM class after Genesis activation.
- Ticket NFT identity must remain immutable.
- The renderer is presentation only.
- Missing or invalid MATERIOS/B3 evidence fails closed rather than being replaced with a local value.
- No economic constant or payout rule is changed as part of the certificate work.

## Current blocker

The repository contains the transport/admission boundaries and the Cardano observation reader, but a qualified concrete authority source for Control State + EEV remains required before the browser can legitimately enable Buy.

Therefore the current branch is ready for the first-user execution once that authority source is qualified, but has not yet produced a real first-user Ticket NFT.

## Current target

Class 1 saleable + authoritative Issue witness + CIP-30 signed transaction + exact Ticket NFT observed in wallet.