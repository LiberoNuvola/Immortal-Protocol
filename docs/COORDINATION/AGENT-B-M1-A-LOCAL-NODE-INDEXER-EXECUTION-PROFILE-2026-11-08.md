# Agent B — M1-A concrete local-node indexing profile

**Date:** 2026-11-08  
**Branch:** \`work/immortal-green-closure\`  
**Exact baseline HEAD:** a605eedd929619d682aa4f2fc3a140026cdfcad1  
**Classification:** DESIGN / TEST-ENVIRONMENT PROFILE — NON-NORMATIVE; NO IMPLEMENTATION AUTHORITY  
**Parent plan:** \`AGENT-B-M1-PRE-SNAPSHOT-INDEXER-AND-MITHRIL-CERTIFICATION-TEST-PLAN-2026-11-08.md\`

## 1. Decision for the first experiment

Use a real local \`cardano-node\` as the ledger source, a local Ogmios bridge for block streaming, and Kupo as an independent filtered-UTxO comparison implementation. The custom M1 indexer remains the component under test; neither Ogmios nor Kupo becomes a trusted remote PRE publisher.

The first compatible software baseline to evaluate is:

| Component | Test pin | Purpose |
|---|---:|---|
| \`cardano-node\` | \`11.0.1\` | Local ledger, chain selection and full blocks |
| Ogmios | \`7.0.0\` | Local Node-to-Client bridge / JSON-RPC WebSocket |
| Kupo | \`2.12.x\` | Independent filtered UTxO comparison |

This is a compatibility baseline, not a production dependency decision. Ogmios documents v7.0.0 with cardano-node 11.0.1; Kupo documents v2.12.x with cardano-node 11.0.x and Ogmios v7.x. The upstream compatibility table covers the published Cardano networks; the exact local private-testnet configuration still needs a smoke test before it is considered supported. Pin immutable image digests, binary checksums and source revisions in the eventual M1 evidence manifest. Do not use floating \`latest\` tags.

## 2. Local topology

Run two independent Cardano node instances for the test network. Each has its own database, chain selection, local node-to-client socket, Ogmios process and custom indexer process:

\`\`\`text
             isolated Cardano test network
                 /                 \\
        Cardano node A          Cardano node B
             |                       |
        local IPC                local IPC
             |                       |
        Ogmios A                 Ogmios B
             |                       |
       WS chain-sync A         WS chain-sync B
             |                       |
       custom index A           custom index B
             |                       |
        root/message A          root/message B
             \\                       /
              exact byte-for-byte comparison

    Kupo A (local)             Kupo B (local)
          |                         |
     independent filtered-UTxO comparison at same point
\`\`\`

No signer/indexer process may consume a shared remote Ogmios, Kupo, Koios, Blockfrost, hosted database or project-operated holder-list service. Each Ogmios instance binds only to the local node socket and should be exposed only to its local indexer / loopback network segment. Kupo's HTTP API is also local to that node's test environment.

A two-node topology is sufficient for ordinary replica agreement, but it is not by itself proof of a real fork/rollback event. For that acceptance case, the private testnet must be configured so competing valid chain selections can be exercised, or the harness must clearly label a protocol-message rollback simulation as a unit test rather than a node-level fork test.

## 3. Why Ogmios + Kupo is the practical fit

### 3.1 Ogmios — transport, not authority

Cardano Node-to-Client ChainSync streams full blocks. Ogmios exposes that local protocol through a WebSocket JSON interface. Its chain-sync session supports \`findIntersection\`, \`nextBlock\`, forward blocks and rollback points.

The custom indexer must implement the protocol as a durable cursor:

- resume using a list of recently persisted \`(slot, headerHash)\` points, newest first;
- use \`findIntersection\` to find a point shared with the node's current chain selection;
- on roll-forward, decode and apply the full block;
- on rollback, restore the exact index state at the announced ancestor point;
- if no retained intersection exists, stop safely and rebuild from a known bootstrap point; never continue from an unproven cursor.

A chain point is the pair \`(slot, header hash)\`, not a slot alone. The hash distinguishes competing blocks at the same slot.

Do not treat Ogmios HTTP queries as the PRE source of truth. For this experiment its role is to transport the block stream from each local Cardano node. The indexer derives the PRE UTxO state itself.

### 3.2 Kupo — independent comparison, not the certificate source

Kupo is a targeted chain index that retains UTxOs matching configured patterns, including policy-ID patterns. Run one local Kupo instance against each node's local chain source and configure the test PRE policy as narrowly as the supported pattern syntax allows. The consumer must still check the exact policy ID **and asset name**; all other assets under the same policy are excluded from the PRE sum.

Kupo should not be run with \`--prune-utxo\` for this experiment. We need to compare historical creation/spend facts and exercise rollback/replay; pruning can discard information needed to reconstruct earlier UTxO states after a sufficiently old rollback.

Kupo is an independent implementation comparison, not an authority:
- a custom indexer/Kupo mismatch means no M1 result and no Mithril message;
- Kupo does not decide the governance snapshot point or GOV eligibility;
- a Kupo API result is not a cryptographic proof for Plutus;
- both must be at the exact same chain point before comparing.

If the selected Kupo API cannot return enough matched-output history to reproduce the exact point-specific UTxO set, use it only as a current-tip comparison and retain the full replay as the historical reference. Do not claim point-specific parity where the API has not demonstrated it.

## 4. M1-A ingestion and state model

### 4.1 Durable block journal

Persist append-only records keyed by block hash and chain point. At minimum retain:

- network magic / network identity;
- slot, block number, header hash and parent point;
- transaction index and transaction ID;
- consumed input references, with the correct ledger input source;
- newly created output references;
- exact raw address bytes;
- exact test policy ID, asset name and integer quantity;
- block application status and index schema version.

Use \`TxIn = (transaction hash, output index)\` as the output identity. Duplicate block delivery after reconnect must be idempotent. Advance the durable chain cursor only after the block's state writes are committed. Retain several recent points so reconnect can find an intersection even if the last cursor became orphaned.

Do not store only a mutable running total. The rollback-safe source of truth is the set of current unspent output rows derived from the append-only block journal. A running total may be a cache, but it must be recomputable and rollback-reversible.

### 4.2 Transaction semantics — failed phase-2 transactions

The parser must not assume every transaction in a block spends its ordinary inputs and creates its ordinary outputs. Since Alonzo, a transaction whose phase-2 scripts fail can consume collateral inputs instead; Babbage+ may also create a collateral-return output.

Ogmios v7 documents an \`inputSource\` distinction for Alonzo-and-later transaction inputs (\`inputs\` versus \`collaterals\`). The block decoder must pin and test the exact response schema for the selected version and preserve this distinction:

- successful ledger transaction: apply ordinary consumed inputs and ordinary outputs;
- phase-2-invalid ledger transaction: apply collateral consumption and the valid collateral-return output, not the ordinary input/output transition;
- reject unknown or ambiguous transaction shapes rather than approximating their UTxO effect.

This edge case is essential for an index that claims complete native-asset balances. Missing a collateral-return output or incorrectly consuming a normal input can corrupt the PRE snapshot total.

### 4.3 Mint and burn

The index is a UTxO index, so the total at a point is the sum of the exact asset quantity across all currently unspent outputs. Mint/burn is reflected by the ledger-valid outputs of the transaction and the UTxO transition; it must not be added a second time from the transaction's \`mint\` field.

Still record the per-transaction mint field as a reconciliation witness. At each block boundary, assert the conservation equation:

\`\`\`text
UTxO total after block
  = UTxO total before block
  + ledger-valid mint quantity in the block
  - ledger-valid burn quantity in the block
\`\`\`

The exact treatment of failed phase-2 transactions and collateral return must be consistent with the ledger. The block-level total is a diagnostic invariant; the UTxO rows remain the source for the root.

### 4.4 Rollback-safe updates

Use a write protocol equivalent to:

1. receive one complete block and its chain point;
2. verify its parent is the indexer's current tip (otherwise stop or reconcile);
3. apply transactions in ledger order and stage all created/spent output changes;
4. store the block journal and updated index state atomically;
5. commit;
6. only then persist/advance the acknowledged cursor.

For rollback to point P:

1. verify P is in the retained chain-point journal and is an ancestor of the current indexed tip;
2. delete/undo every applied block after P;
3. restore spent outputs and remove outputs created after P;
4. restore the total and index digest;
5. set the durable cursor to P atomically;
6. accept new roll-forward blocks only after this succeeds.

Unknown rollback points, missing undo rows, parent mismatch, database corruption or rollback deeper than retained history must produce a hard fail-closed stop. Recovery is a deterministic replay from a known point, not a best-effort balance patch.

## 5. Full replay, incremental index and Kupo comparison

M1-A must provide three independently comparable results at an exact block point P:

**A — full replay:** start from the private testnet's known origin/genesis point and replay ledger-valid transactions to P, deriving the PRE UTxO set. This is the slow reference path.

**B — checkpoint + incremental:** bootstrap from a whole-UTxO query at one agreed point Q, then follow blocks to P. Checkpoint Q must be on the selected chain and its exact point recorded. This is an experimental bootstrap path, not an on-demand historical query. QueryUTxOWhole is O(n) in both time and space, so the measurement must make the one-time cost visible.

**C — Kupo:** obtain the exact matched PRE UTxO set at P if the retained data/API supports that point. If it cannot prove the same point, classify C as current-tip cross-check only and do not use it to claim historical parity.

Acceptance at P:
- A and B must agree on every TxIn, raw address and quantity, not just on the aggregate total;
- A and B canonical messages must be byte-for-byte identical;
- C must agree on the same exact output set when point-specific comparison is claimed;
- any unexplained mismatch blocks M1 and prevents certification.

The whole-UTxO query is explicitly not a per-proposal production solution. The Cardano API reference documents QueryUTxOWhole as O(n) time and space; the TxIn-filtered query is efficient but requires knowing the TxIn set already. There is no documented constant-time query for all outputs carrying arbitrary policy/name.

## 6. Adversarial acceptance additions

In addition to the parent M1 test matrix, include:

- phase-2-valid transaction consuming a PRE-bearing ordinary input;
- phase-2-invalid transaction whose collateral input carries PRE;
- phase-2-invalid transaction with collateral return carrying PRE;
- phase-2-invalid transaction whose ordinary input/output fields must not be applied;
- block duplicated after WebSocket reconnect;
- crash after data rows are written but before cursor advancement;
- crash after cursor advancement (must be impossible unless state rows were committed);
- rollback to a retained point after a restart;
- rollback point missing from the journal;
- rollback deeper than retained history;
- parent-point mismatch / skipped block;
- Ogmios disconnect and reconnection with a changed chain selection;
- Kupo sync lag relative to the node, which must be detected rather than mistaken for mismatch in ledger state;
- wrong network magic or wrong node socket;
- output with same token name but different policy ID;
- output under same policy with different asset name.

No certificate is issued while any indexer is catching up, is at a different chain point, or has unresolved input-source/era decoding.

## 7. Toolchain and implementation reuse

Repository source review shows:

- \`audit/cardano-integration/package.json\` already pins \`ws@8.18.3\`, so a small Ogmios WebSocket client can be prototyped within the existing Node integration toolchain without adding a new dependency.
- \`audit/cardano-ledger-runner/YaciUTxO.hs\` decodes a Yaci-materialized JSON UTxO packet into a Conway ledger UTxO. It is valuable for the existing typed-context path, but it is not a Node-to-Client ChainSync implementation and does not decode a full chain of multi-era blocks.
- \`audit/cardano-ledger-runner/cardano-ledger-runner.cabal\` pins Cardano ledger packages, but does not currently depend on the complete Node-to-Client/Ouroboros protocol stack.

Therefore the bounded first implementation should use the existing Node/WebSocket integration area for the local Ogmios transport and a separate pure reducer for UTxO/index state. Do not extend the Yaci decoder and label it a real Cardano node indexer. A direct Haskell Node-to-Client implementation remains an alternative only if later resource/maintenance evidence justifies bringing in the full node protocol dependency graph.

## 8. Baseline acceptance and stop rules

M1-A can be marked **PASS — INDEXER CORRECTNESS ONLY** only when:
- two local Cardano nodes have synchronized to the same exact chain point;
- both local indexers agree byte-for-byte;
- full replay and checkpoint+incremental state agree on the full PRE UTxO set;
- Kupo agrees when asked for the same point;
- successful and phase-2-invalid transaction input sources are applied correctly;
- duplicate delivery, restart, rollback and reorg tests pass;
- all source/image hashes, node configuration, network magic, Ogmios/Kupo schemas and evidence are pinned.

This pass does not mean M1-C certificate integration passed, and does not mean production governance snapshot completeness is approved.

Stop / remain BLOCKED if:
- no reproducible real Cardano testnet can be provisioned;
- the two node selections cannot be shown to contain the exact test point;
- Ogmios drops required block/input-source data or an era is unsupported;
- the custom index and full replay diverge;
- Kupo differs at a point it claims to represent;
- rollback/cursor recovery is not atomic;
- any asset-bearing output class is silently omitted;
- resource use grows without a measured recovery/retention plan.

## 9. No production effects

This profile selects a test-only toolchain baseline, not a protocol dependency or security trust root. It does not change:
- production code, Plutus/Aiken validators, token policies, ABI, workflows, CI or deployment;
- GOV-16/17/18, entity mapping, voting snapshot point, eligibility or PRE asset identity;
- Mithril signer set, certificate format, genesis/circuit-key trust anchors or governance adoption;
- V3, Reveal, B1 EEV, first-ticket Issue #37, Registry Issue #43 or BeaconRegistry Issue #49;
- any wallet, transaction, Preprod/Mainnet query or ledger state.

## 10. External references

- Cardano architecture: Node-to-Client ChainSync transfers full blocks; LocalStateQuery queries ledger state: https://docs.cardano.org/about-cardano/explore-more/cardano-architecture
- Ogmios chain synchronization: full block roll-forward, rollback point, intersection and resume semantics: https://ogmios.dev/mini-protocols/local-chain-sync/
- Ogmios v7.0.0 / cardano-node 11.0.1 compatibility and Alonzo+ \`inputSource\` change: https://github.com/CardanoSolutions/ogmios
- Kupo v2.12.x compatibility matrix and filtered-UTxO index description: https://github.com/CardanoSolutions/kupo
- Cardano Developer Portal — indexing/rollback, append-only rows, durable cursors, duplicate deliveries and indexer categories: https://developers.cardano.org/docs/developers/curriculum/production/indexing-and-analytics/
- Cardano API — QueryUTxOWhole O(n) time/space and QueryUTxOByTxIn indexed query: https://cardano-api.cardano.intersectmbo.org/cardano-api/Cardano-Api-Query.html
- Prior M1 parent plan: \`AGENT-B-M1-PRE-SNAPSHOT-INDEXER-AND-MITHRIL-CERTIFICATION-TEST-PLAN-2026-11-08.md\`
