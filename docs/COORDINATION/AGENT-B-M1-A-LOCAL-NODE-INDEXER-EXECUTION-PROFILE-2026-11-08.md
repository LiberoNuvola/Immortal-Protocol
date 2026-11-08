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
- consumed input references, with the correct ledger selected input set;
- newly created output references;
- exact raw address bytes;
- exact test policy ID, asset name and integer quantity;
- block application status and index schema version.

Use \`TxIn = (transaction hash, output index)\` as the output identity. Duplicate block delivery after reconnect must be idempotent. Advance the durable chain cursor only after the block's state writes are committed. Retain several recent points so reconnect can find an intersection even if the last cursor became orphaned.

Do not store only a mutable running total. The rollback-safe source of truth is the set of current unspent output rows derived from the append-only block journal. A running total may be a cache, but it must be recomputable and rollback-reversible.

### 4.2 Transaction semantics — failed phase-2 transactions

The parser must not assume every transaction in a block spends its ordinary inputs and creates its ordinary outputs. Since Alonzo, a transaction whose phase-2 scripts fail can consume collateral inputs instead; Babbage+ may also create a collateral-return output.

Ogmios v7 documents an \`spends\` distinction for Alonzo-and-later transaction inputs (\`inputs\` versus \`collaterals\`). The block decoder must pin and test the exact response schema for the selected version and preserve this distinction:

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

No certificate is issued while any indexer is catching up, is at a different chain point, or has unresolved spends/era decoding.

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
- successful and phase-2-invalid transaction selected input sets are applied correctly;
- duplicate delivery, restart, rollback and reorg tests pass;
- all source/image hashes, node configuration, network magic, Ogmios/Kupo schemas and evidence are pinned.

This pass does not mean M1-C certificate integration passed, and does not mean production governance snapshot completeness is approved.

Stop / remain BLOCKED if:
- no reproducible real Cardano testnet can be provisioned;
- the two node selections cannot be shown to contain the exact test point;
- Ogmios drops required block/spends data or an era is unsupported;
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
- Ogmios v7.0.0 / cardano-node 11.0.1 compatibility and Alonzo+ \`spends\` change: https://github.com/CardanoSolutions/ogmios
- Kupo v2.12.x compatibility matrix and filtered-UTxO index description: https://github.com/CardanoSolutions/kupo
- Cardano Developer Portal — indexing/rollback, append-only rows, durable cursors, duplicate deliveries and indexer categories: https://developers.cardano.org/docs/developers/curriculum/production/indexing-and-analytics/
- Cardano API — QueryUTxOWhole O(n) time/space and QueryUTxOByTxIn indexed query: https://cardano-api.cardano.intersectmbo.org/cardano-api/Cardano-Api-Query.html
- Prior M1 parent plan: \`AGENT-B-M1-PRE-SNAPSHOT-INDEXER-AND-MITHRIL-CERTIFICATION-TEST-PLAN-2026-11-08.md\`


## 11. Prototype implementation status — pure reducer only

**Source:** `audit/cardano-integration/preSnapshotUtxoIndex.mjs`  
**Tests:** `audit/cardano-integration/preSnapshotUtxoIndex.test.mjs`  
**Command:** `cd audit/cardano-integration && npm run test:pre-snapshot-index`  
**Package command:** `node --test preSnapshotUtxoIndex.test.mjs`  
**Status:** CORE IMPLEMENTED / NOT YET EXECUTED OR LEDGER-VALIDATED.

The first isolated code increment implements a dependency-light, pure UTxO reducer. It accepts a normalized block contract and supports:

- exact policy ID + asset-name filtering, address-level aggregation for the explicitly test-only identity rule, arbitrary-precision quantities and deterministic SHA-256 Merkle-sum message encoding;
- valid transaction ordinary-input/output application and phase-2-invalid collateral-input/collateral-return application;
- valid mint/burn reconciliation against the net PRE quantity change in each block;
- duplicate TxIn/transaction detection, unknown validity, malformed values, zero target-asset outputs, wrong parent points and skipped block numbers failing closed;
- immutable returned index states and rollback journals, including correct undo when one transaction creates a PRE UTxO and a later transaction in the same block spends it;
- rollback to a retained ancestor and alternate-branch replay.

Twelve Node built-in test cases were authored for bootstrap filtering, split outputs, mint/burn, collateral-return handling, within-block chained transactions, fork/rollback, atomic failure, duplicates, malformed points/assets, immutability, zero quantities and canonical digest determinism. They are **written but not run** in this environment; the repository does not exist as a local checkout here. The command is registered in the integration package so it can be run on a real checkout.

### Exact remaining M1-A work

This increment is not yet a functioning node indexer. It does **not** include:
- Ogmios WebSocket connection, `findIntersection` / `nextBlock` handling or reconnect cursor persistence;
- an Ogmios v7 block/transaction decoder into the normalized reducer contract;
- local node topology, full-UTxO bootstrap, full-chain replay or persistent atomic journal;
- Kupo comparison, real rollback/reorg observation or resource benchmarks;
- a real Cardano block test or evidence manifest.

The decoder must preserve Ogmios `spends` semantics and correctly map outputs, collateral return and native-asset values. Do not interpret a missing `spends` as ordinary inputs; the adapter must pin and validate the exact response shape for the selected node/Ogmios versions. Ogmios ChainSync supplies input references, not resolved historical input outputs; the reducer resolves spends from its own local PRE index.

**Disposition:** M1-A CORE REDUCER = CODE PRESENT; M1-A LEDGER INTEGRATION = OPEN; M1-A CONFORMANCE = NOT RUN. No Mithril certificate or production snapshot claim is made.


## 12. Ogmios v7 decoder and ChainSync client — implementation increment

**Adapter:** `audit/cardano-integration/ogmiosV7PreSnapshotAdapter.mjs`  
**Client:** `audit/cardano-integration/ogmiosV7ChainSyncClient.mjs`  
**Adapter/client tests:** `audit/cardano-integration/ogmiosV7PreSnapshotAdapter.test.mjs`  
**Package dependency:** `@cardanosolutions/json-bigint@1.0.1` (BigInt-safe JSON parsing).

### API correction

The exact Ogmios v7 schema uses `Transaction.spends: "inputs" | "collaterals"`. It does **not** expose a transaction field named `inputSource`; an earlier paragraph in this profile used the wrong name. The adapter now rejects missing/unknown `spends` and selects ordinary inputs or collateral inputs only from this explicit discriminator. It also maps Praos block `id/ancestor/height/slot`, transaction references, nested asset values, mint quantities and collateral-return outputs.

### Implemented in this increment

- Bech32 Shelley output address decoding to exact raw address bytes; Base58 Byron decoding is present for legacy outputs.
- BigInt-safe Ogmios JSON parser and exact nested `value` / `mint` map decoding.
- Praos block/transaction normalization into the reducer contract; unsupported block types/eras, malformed hashes, bad ancestry, unknown `spends`, missing collateral inputs, unexpected collateral return and zero-valued explicit assets fail closed.
- Translation of Ogmios rollback `(slot,id)` to a retained local reducer point (including the block number); rollback to `origin` is allowed only when the index was bootstrapped at the origin sentinel.
- Retained local intersection points ordered newest-first, with an origin fallback reserved when the configured point limit permits.
- Reconnecting WebSocket ChainSync client using one outstanding `nextBlock` request at a time. Each roll-forward / rollback callback must complete before the next block is requested. JSON-RPC IDs are matched, transport errors reconnect, and protocol/decoder/callback errors stop fail-closed.
- Test coverage now includes the Ogmios v7 wire shape, address decoding, asset/mint quantity precision, collateral semantics, optional empty arrays, ancestry, rollback mapping, `origin`, bounded intersection fallback and a deterministic fake-WebSocket backpressure test.

### Current qualification boundary

The adapter and client are **source code only** at this point. The new tests are authored but have not been executed. No Ogmios endpoint, Cardano node, Kupo instance or private testnet has been started. There is no persistent DB / atomic journal / crash recovery adapter yet; callers must commit reducer state durably inside callbacks before resolving. The client deliberately requests one block at a time but does not itself persist the index or configure Node-to-Client sockets.

**M1-A status:** reducer + Ogmios v7 normalization + WebSocket ChainSync client = CODE PRESENT; Node integration and conformance = NOT RUN; M1-C certificate and M2 Plutus verification = NOT STARTED.


## 13. Ogmios v7 schema erratum and remaining parser limits

The official v7 TypeScript schema confirms:
- `Transaction.spends` is required and restricted to `"inputs" | "collaterals"`;
- `inputs` and `collaterals` are transaction-output references;
- the block header has `type: "praos"`, `era`, `id`, `ancestor`, `height`, and `slot`;
- ChainSync responses use `direction: "forward" | "backward"`, and rollback points are `{slot,id}` or `"origin"`.

The prior use of `inputSource` in this report was incorrect for Ogmios v7 and is superseded by the `spends` contract above. This distinction is not cosmetic: only the ledger-selected input set may be consumed by the PRE index.

The adapter currently decodes Base58 Byron address payload bytes, but does not yet verify the Byron CBOR envelope and checksum. Shelley Bech32 addresses have HRP and checksum validation. The Byron path is therefore an explicit hardening limitation: do not use this decoder for a production completeness claim until Byron address validation is independently implemented/tested or the protocol profile proves that no eligible PRE can exist in such outputs.

Official pins inspected:
- v7.0.0 JSON schema: https://raw.githubusercontent.com/CardanoSolutions/ogmios/v7.0.0/docs/static/cardano.json
- v7.0.0 TypeScript schema: https://raw.githubusercontent.com/CardanoSolutions/ogmios/v7.0.0/clients/TypeScript/packages/schema/src/index.ts
- v7.0.0 ChainSynchronization client: https://github.com/CardanoSolutions/ogmios/blob/v7.0.0/clients/TypeScript/packages/client/src/ChainSynchronization/Client.ts
- v7.0.0 ChainSynchronization handlers: https://github.com/CardanoSolutions/ogmios/blob/v7.0.0/clients/TypeScript/packages/client/src/ChainSynchronization/nextBlock.ts


## 14. Final static review of v7 client/test contract

The ChainSync request builder now matches the upstream v7 schema exactly: `findIntersection` carries `params.points`; `nextBlock` has no `params` field. Request IDs are mirrored and matched before callbacks proceed. The fake-WebSocket test asserts this omission and confirms the next request is not sent until the reducer callback has completed.

The intersection-point bound now reserves one slot for the `"origin"` fallback when the local index is genesis-anchored, even when `maxIntersectionPoints = 1`; a dedicated test covers this boundary.

Final authored test inventory:
- `preSnapshotUtxoIndex.test.mjs`: 12 cases;
- `ogmiosV7PreSnapshotAdapter.test.mjs`: 13 cases, including one-block fake-WebSocket sequencing and adapter-to-reducer normal/collateral integration;
- total: **25 authored tests; 0 executed**.

Package commands:
- `npm run test:pre-snapshot-index`
- `npm run test:ogmios-v7-adapter`

No local repository checkout/dependency installation was available for executing these tests. Static GitHub content verification is not a substitute for Node test execution or a live Ogmios/Cardano-node test.


## 15. Persistent WAL, crash recovery and ChainSync integration

**WAL source:** `audit/cardano-integration/preSnapshotJournal.mjs`  
**WAL tests:** `audit/cardano-integration/preSnapshotJournal.test.mjs`  
**Factory:** `createPersistentOgmiosV7ChainSyncClient({ journal, url, ...options })`  
**Commands:** `npm run test:pre-snapshot-journal` / `npm run test:pre-snapshot-index`.

### Implemented

- Dedicated `manifest.json` stores the bootstrap network, asset, anchor point and initial test UTxOs with a SHA-256 digest. Manifest is written through a temporary file, fsynced and atomically renamed.
- `journal.ndjson` records every normalized block and every rollback as a sequence-numbered event chained to the previous record hash. Each append is fsynced before the in-memory index and cursor advance.
- The current cursor is derived from replayed reducer state; there is no separately updated cursor file that could disagree with the event log.
- Reopen verifies the manifest, record sequence, previous-hash chain, record digest and reducer transition. A final incomplete line without newline is truncated and the truncation fsynced; a malformed complete line, invalid digest or replay inconsistency fails closed.
- Single-writer `writer.lock` records PID and hostname. A local stale PID can be reclaimed under a short exclusive reaper lock; a live, foreign-host or unverifiable lock is not removed. A stale reaper file after a process dies during lock recovery still needs manual inspection.
- Block and rollback operations are serialized. Inputs are detached from caller objects before queueing; close drains already-queued writes and rejects new writes. The state is exposed as the reducer's immutable representation.
- `createPersistentOgmiosIndexHandlers` binds forward and rollback callbacks to the WAL. On reconnect, `onIntersection` automatically journals a rollback when the remote common point is earlier than the local cursor, before ChainSync requests the next block.
- `createPersistentOgmiosV7ChainSyncClient` combines the WAL-backed handlers with the Ogmios v7 client. An optional user observer for intersection is called only after the WAL rollback has committed.

### Tests and exact status

The WAL suite contains 11 authored cases: event replay across restart, rollback/alternate branch persistence, incomplete-tail recovery, complete-record corruption, failed transition non-commit, single-writer rejection, forward/rollback callbacks, stale PID lock recovery, foreign-host lock rejection, persistent-client factory construction and queued-write/close ordering.

**Execution 2026-11-08 — current qualified run 42460691746: 53/53 passed, 0 failures, 0 skipped.** The suite consists of 12 reducer + 13 Ogmios adapter/client + 11 WAL + 8 fixed-point replica-comparison + 9 dual-local-runner tests. Node 22 ran `npm run test:pre-snapshot-index`; six M1-A modules passed `node --check`. Run URL: https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42460691746. Earlier 36/36 and 44/44 runs are superseded by this wider suite.

### Deliberate limitations — not production qualified

- The bootstrap manifest stores the initial UTxO set as one JSON payload; large-scale memory/disk and recovery performance are not measured.
- The event log stores normalized full blocks and replays from the anchor on every restart. No snapshot compaction, pruning, bounded undo retention or journal rotation is implemented. Disk, CPU and memory grow with chain history.
- The hash chain/digests detect accidental corruption and torn writes; they are **not authenticated signatures** and do not stop an administrator able to rewrite the entire manifest and journal.
- It is single-writer and intended for a local signer process / dedicated local directory, not a shared network filesystem.
- On Windows, Node does not provide a portable directory-handle fsync here; journal/manifest file contents are fsynced, but directory-entry fsync is skipped. Linux/macOS attempt directory sync.
- Manual recovery is required for an unverifiable lock or orphaned reaper lock. Do not auto-delete those files.
- No live Cardano node, Ogmios endpoint, Kupo, private testnet, Mithril network, benchmark or resource test was run. Byron Base58 CBOR/checksum validation remains open.

**M1-A status:** reducer + Ogmios v7 adapter + reconnecting client + local WAL/replay + fixed-point replica comparator + dual-local-runner = CODE PRESENT; 53/53 unit tests PASS on GitHub Actions; live independent two-node ledger conformance, Kupo parity and resource qualification = OPEN. M1-C and M2 remain NOT STARTED.


### CI entry point

An isolated workflow, `.github/workflows/m1-a-pre-snapshot-tests.yml`, now runs on changes to the M1-A reducer, Ogmios adapter/client, WAL and their tests on `work/immortal-green-closure`, and supports manual `workflow_dispatch`. It has `contents: read` only, does not load secrets, does not start Cardano services, and does not sign or submit transactions. The successful run above is the first qualified execution of the 36-test M1-A unit suite.


## 16. Fixed-point two-replica comparator and local runner

**Comparator:** `audit/cardano-integration/preSnapshotReplicaConformance.mjs`  
**Comparator tests:** `audit/cardano-integration/preSnapshotReplicaConformance.test.mjs` (8 cases)  
**Runner:** `audit/cardano-integration/preSnapshotDualReplicaRunner.mjs`  
**Runner tests:** `audit/cardano-integration/preSnapshotDualReplicaRunner.test.mjs` (9 cases)

### Comparison contract

- `expectedPoint` is mandatory and supplied by the operator/configuration; the runner never decides a governance snapshot point.
- Both reducer states must use the exact expected network and PRE policy ID + asset name.
- Both Ogmios sessions must complete `findIntersection`; a stale local journal by itself cannot produce PASS.
- Both remote tips must be at or beyond the configured point. The local reducer state is compared at that exact point; a replica ahead may be non-mutatingly projected back only if the point remains in retained history.
- PASS requires byte-identical canonical snapshot messages and matching digests. Same-height different header hashes fail as chain-selection divergence; a node behind remains WAITING; missing target history/configuration mismatch fails closed.
- Runner records readiness only after the intersection callback and WAL commit. Any transport/protocol error clears that session readiness until a new intersection is established. A fatal Ogmios RPC/intersection error is an immediate FAIL. Before returning PASS the runner stops both sessions and freezes/rechecks the same target; session loss or target movement at freeze cannot be turned into PASS.
- Two labels / node instance IDs / loopback URLs are still operator-supplied identity declarations; they are not cryptographic attestation that the sockets terminate at two physically independent hosts or processes.

### Local invocation (not run against real nodes yet)

Create a local JSON config with the following fields and operator-supplied values:

```json
{
  "networkId": "<local private testnet identity>",
  "asset": { "policyIdHex": "<56 lowercase hex chars>", "assetNameHex": "<exact asset-name hex>" },
  "anchorPoint": { "slot": 0, "blockNo": 0, "hash": "<64 lowercase hex chars>" },
  "expectedPoint": { "slot": 0, "blockNo": 0, "hash": "<64 lowercase hex chars>" },
  "initialUtxos": [],
  "timeoutMs": 120000,
  "pollIntervalMs": 250,
  "replicas": [
    { "id": "node-a", "nodeInstanceId": "<instance-a>", "url": "ws://127.0.0.1:1337", "journalDirectory": "<absolute-local-dir-a>" },
    { "id": "node-b", "nodeInstanceId": "<instance-b>", "url": "ws://127.0.0.1:1338", "journalDirectory": "<absolute-local-dir-b>" }
  ]
}
```

`initialUtxos` must be the complete bootstrap set at `anchorPoint`, from a separately verified bootstrap/replay procedure; the empty array above is illustrative schema only, not evidence of a zero-supply PRE asset. The policy ID, asset name, network identity, anchor and expected point are deliberately not preselected here. Each Ogmios endpoint must be plain `ws://` on local loopback; separate local journal paths are mandatory. From the integration directory run:

```powershell
node .\\preSnapshotDualReplicaRunner.mjs <path-to-local-config.json>
```

The program is read-only with respect to Cardano nodes: it opens two local Ogmios ChainSync sessions and writes only its two local journals. It does not sign, submit, or select protocol/governance points. A non-PASS result exits nonzero.

## 17. Latest M1-A unit qualification

GitHub Actions run **42460691746** tested exact commit `6158c847545fdefe5b6d6b908b824b7b3279f028` and reported **53 tests, 53 passed, 0 failed, 0 skipped**. It also passed `node --check` for reducer, Ogmios adapter, ChainSync client, WAL, replica comparator and dual-node runner. Two additional runner integration tests use fake Ogmios WebSockets: one reaches an exact fixed-point PASS only after two successful intersections and final freeze; one proves a fatal `findIntersection` error yields FAIL rather than stale-state PASS.

**Qualification boundary:** this does not mean two Cardano nodes were provisioned or contacted. No real Node-to-Client socket, Ogmios instance, Kupo instance, private testnet or Mithril certificate was used by the run. The synthetic tests verify software control flow only. M1-A live acceptance still requires two genuinely independent local node processes, two separate Ogmios instances, an independently verified complete bootstrap UTxO set, a fixed externally chosen point, and Kupo comparison at that exact point; then resource/recovery testing and pinned runtime evidence.


## 18. Kupo parity + HTTP and two-node local devnet runbook

**Kupo parity reducer:** `audit/cardano-integration/preSnapshotKupoParity.mjs`  
**Kupo HTTP client:** `audit/cardano-integration/preSnapshotKupoHttp.mjs`  
**Kupo audit CLI:** `audit/cardano-integration/preSnapshotKupoAudit.mjs`  
**Runbook:** `AGENT-B-M1-A-TWO-NODE-LOCAL-DEVNET-RUNBOOK-2026-11-08.md`

### Implemented and statically verified

- Kupo parity reconstructs a reducer state from the exact unspent matches returned for the exact policy ID + asset name; it validates each out-ref, address, quantity, creation point and spent state, then compares canonical bytes and digest at an externally supplied point.
- The HTTP client is intentionally limited to loopback HTTP, queries `/checkpoints/{slot}?strict` and `/matches/{policy}.{assetName}?unspent`, and requests asset quantities as strings to avoid unsafe JSON number conversion.
- The local Kupo audit reopens one replica's WAL and compares it to one corresponding Kupo endpoint; the runbook requires one Kupo instance per node and distinct workdirs, with `--prune-utxo` omitted.
- Kupo 2.12.0 upstream source confirms `--until` accepts an inclusive slot or point, `--since origin` is supported, and `--prune-utxo` is opt-in (default behavior keeps spent rows marked). Its v2.12.0 OpenAPI schema marks `spent_at` and `created_at` as required match fields and documents string-valued asset quantities via `Accept: application/json;asset-quantity=string`.
- The two-node WSL runbook was checked against the Cardano node 11.0.1 tag: `cardano-testnet create-env` supports `--num-pool-nodes`, `--testnet-magic` and `--output`; `cardano-testnet cardano --node-env` runs the persisted environment. `Cardano.Node.Testnet.Paths` confirms `configuration.yaml`, `socket/nodeN/sock` and `node-data/nodeN/port` paths. Ogmios v7.0.0 and Kupo v2.12.0 both declare/test compatibility with cardano-node 11.0.1, so the runbook pins that common version rather than using an unqualified newer node binary.

### CI execution

Workflow run **42462349216** tested commit `bc4cbb72b91467adad90286c2928a7ca4f56265a`: **69 tests / 69 passed / 0 failed / 0 skipped**. This inventory includes reducer, Ogmios adapter/client, WAL, dual-replica comparator/runner and Kupo parity/HTTP cases. Run URL: https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/42462349216.

The current branch HEAD `5fd0267c297e2d9d6d58d3226ae38cfa7e982027` differs from the tested commit only by the new two-node runbook document; no executable source, test, package script or M1-A workflow file changed after the 69/69 run. Therefore the 69-test result still applies to the code at current HEAD.

### Live acceptance remains open

No cardano-node, Ogmios or Kupo process has yet been started by this work. The runbook is a manual, local WSL2 procedure; synthetic CI does not prove the node binaries, sockets, Kupo database or two replicas actually operate together. Live PASS still requires two independently identified local node processes, two node sockets, two Ogmios sessions, independently verified complete bootstrap, a single operator-fixed point, 2/2 Kupo exact-point parity, and retained resource/restart/rollback evidence. The testnet-local pool nodes share an operator and genesis environment; this is not multi-operator or adversarial trustlessness.

**Updated status:** 69/69 M1-A unit tests PASS; source flags/paths statically checked against pinned upstream release tags; real two-node + two-Kupo execution, Byron CBOR/checksum validation, bootstrap provenance and resource/recovery benchmarks remain OPEN. M1-C Mithril and M2 Plutus verification remain NOT STARTED. No production governance, asset identity, V3, Reveal, B1/EEV, Issue #37, Issue #43, Issue #49 or economic semantics changed.


### 18.1 Private-devnet asset-scope correction

The local runbook is deliberately a **zero-state plumbing smoke test** in its current no-transaction form. A freshly generated private Cardano testnet does not contain the production PRE token or its Preprod/Mainnet UTxO history. Supplying the real production policy ID/name to this private chain would therefore produce an empty index; a 2-node + 2-Kupo PASS at supply zero must not be described as a non-zero PRE distribution or full PRE index correctness.

For non-zero live UTxO behavior, the private network needs a clearly labelled test-only native asset minted by ephemeral test keys through a transaction that stays on that private chain. Such a local-only fixture is not the production PRE identity and has not yet been added or executed. An actual production PRE distribution check is a distinct, read-only run against the relevant public Cardano network, and requires the exact PRE policy/name and governed eligibility/identity inputs. Do not silently substitute between these two tracks.
