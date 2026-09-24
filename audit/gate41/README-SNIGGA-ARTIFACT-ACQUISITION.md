# Gate 41 — SNIGGA legacy transaction artifact acquisition

## Target

Legacy same-family Snek launch reference:
- tx: 87edffc1405348824bbe75adeb9df21d19e460fd13ed47da1072018bc0665125
- token: SNIGGA
- label in research corpus: legacy launch (Sep 2024)

## Primary acquisition route

Koios Mainnet exposes the Cardano REST API at https://api.koios.rest/. The documented transaction-info route is POST /api/v1/tx_info and accepts transaction hashes in the request body.

Example request:

curl --fail-with-body --silent --show-error -X POST -H 'Content-Type: application/json' --data '[{"_tx_hash":"87edffc1405348824bbe75adeb9df21d19e460fd13ed47da1072018bc0665125"}]' 'https://api.koios.rest/api/v1/tx_info' > snigga-legacy-tx.json

If the public endpoint changes its request schema, consult the live OpenAPI specification before changing this packet.

## Preservation rule

The first retrieved response is an evidence artifact, not an interpretation. Preserve the raw JSON before extracting semantic roles.

Minimum fields to preserve/extract:
- transaction hash
- block hash / block height / absolute slot
- fee
- every input reference
- every output reference, address and value
- every native asset in each output
- mint/burn information
- datum/redeemer information when exposed
- metadata/indexer fields used to identify output roles

## Comparison target

Compare the acquired SNIGGA artifact against historical PRE launch transaction:
0235e186550383a53855a9727c02ceeb93d16956b3ae049ac367d85d291c6cf4

Do not infer that SNIGGA and PRE used identical parameters merely because they belong to the same launchpad family.

## Closure criteria for the PRE residual

The SNIGGA artifact can strengthen the interpretation of PRE's 10 ADA residual only if it supplies transaction-level evidence connecting creator allocation with pool ADA / initial-buy funding, and historical implementation/version evidence supports applying that semantic model to PRE. Same-family topology alone is insufficient.

## Current status
- SNIGGA legacy reference: CONFIRMED
- raw SNIGGA transaction artifact: OPEN
- SNIGGA output topology: OPEN
- PRE 10 ADA attribution: OPEN
- provider info.outputId semantics: OPEN

No normative IMMORTAL/PRE-RICH economics are changed by this acquisition procedure.