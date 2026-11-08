# Agent B — M1 PRE snapshot: signer-local ledger index and certification test plan

**Date:** 2026-11-08  
**Branch baseline:** work/immortal-green-closure  
**Exact baseline HEAD:** 6c28685afd6d50142f65fd383e1234c63f8af4b3  
**Classification:** DESIGN / PROTOTYPE EXECUTION CONTRACT — NON-NORMATIVE; NO IMPLEMENTATION AUTHORITY  
**Scope:** turn M1 into a bounded, falsifiable experiment for a custom Mithril PRE-snapshot message, with particular attention to complete ledger-state acquisition, exact-point selection, rollback handling and signer independence.

## 1. Result

M1 should not begin by repeatedly querying and scanning the full Cardano UTxO set at every governance snapshot. The Cardano API exposes a whole-UTxO query, but its documented complexity is O(n) time and O(n) space in the complete UTxO set. That is a useful correctness/reference path for a small test network and potentially a one-time bootstrap; it is not yet a credible repeated production snapshot strategy.

The candidate to test is a **signer-local, incremental PRE UTxO index**:

- each Mithril signer computes the PRE distribution from the Cardano node it already operates;
- the indexer follows that local node's full block stream and maintains only UTxOs carrying the exact test asset;
- every state is bound to a precise block point;
- rollback/reselection is processed explicitly, with undo data or replay;
- no shared remote indexer, publisher, aggregator or project-operated API supplies the PRE holder list or root;
- signers sign only after independently deriving the same canonical message at the same exact test point.

This is a candidate architecture to test, not a decision that a sidecar is the final implementation. It does not solve the still-open production rule mapping GOV EntityId to Cardano credentials, nor does it select PRE asset identity, eligibility or the exact voting-start-to-block rule.

## 2. Repository baseline — confirmed at HEAD

The branch contains the prior feasibility and governance-gap documents, but no Mithril source integration, no PRE snapshot indexer, no Mithril custom signer module, no Plutus Mithril verifier and no dedicated M1 tests.

Relevant source findings:

- IMMORTAL/governance/Governance.hs still defines EntityId as Integer.
- Snapshot.snapshotWeights is a supplied list of entity/weight pairs. snapshotValid checks a non-negative timestamp, positive weights and distinct entity IDs; it does not authenticate credentials, prove the list complete, or prove that each weight equals a PRE balance at a Cardano point.
- GovernanceAuthorization.hs checks actor-class/event-type combinations and non-empty evidence-reference strings; it does not verify the on-chain credential or the referenced snapshot fact.
- relayer/multiOracleRegistrySnapshot.js verifies a canonical payload digest and Ed25519 signature against a caller-supplied trusted public key. It is not a PRE ledger snapshot or a Mithril certificate verifier.
- No current GOV/Plutus state carrier proves that the certified PRE denominator has been frozen once for a proposal.

These are blockers for a production governance integration, not reasons to modify the existing GOV rules in M1.

## 3. Cardano state acquisition constraints

### 3.1 Local state query

Cardano LocalStateQuery lets a local client acquire a ledger state at a chain point and query it. The protocol defines VolatileTip, SpecificPoint and ImmutableTip targets. A SpecificPoint request is not an unlimited historical query: it is constrained to the node's currently available volatile/immutable interval. A late signer therefore cannot assume it can query an arbitrary old governance-start point on demand.

The Cardano API exposes QueryUTxOWhole. Its published API documentation explicitly characterizes whole-UTxO retrieval as O(n) time and O(n) space for a UTxO set of size n. QueryUTxOByAddress is also O(n) time; there is no documented constant-time query by arbitrary native-asset policy/name.

Consequences:

1. A one-time whole-UTxO scan is a possible test oracle or bootstrap experiment.
2. Repeating a full scan for every vote/proposal is not accepted as a production design without strong measured evidence.
3. A specific point must be available to every participating signer; “query whatever each signer currently sees” is not one shared snapshot.
4. If the snapshot point is no longer queryable through the node's LocalStateQuery window, a signer must have retained a verifiable point-specific index state or replay enough canonical history to reconstruct it.
5. If a signer cannot establish the exact requested point or its own index state at that point, it must refuse to sign. No fallback to an aggregator-provided list or root.

### 3.2 Candidate indexer input

The preferred experiment is a local Node-to-Client chain-sync consumer receiving full blocks from each signer node. The Node-to-Client interface is local IPC; its chain-sync protocol provides full blocks, while LocalStateQuery is the separate ledger-state query interface.

Each independent signer-side indexer should maintain:

- exact chain point: network identity, slot, block number and block hash;
- a map keyed by TxIn for every unspent output that carries the test PRE asset;
- exact output address bytes and exact asset quantity;
- an undo journal sufficient to reverse each applied block;
- an index schema/version and a deterministic digest of the indexed state.

The index must not silently classify script outputs, stake credentials, programmable outputs or unsupported eras as ineligible. For M1, retain the raw ledger address bytes as the leaf identity. That is deliberately a test-only address-level identity, not the production GOV entity mapping.

Two bootstrap strategies should be measured against each other:

- **Full replay baseline:** rebuild the asset index from a fixed test-genesis point by replaying the full chain. This gives a simple reproducible reference but may be expensive.
- **Whole-UTxO checkpoint bootstrap:** obtain the complete UTxO state at one agreed test point using the local node query, filter the exact asset once, then follow subsequent blocks incrementally. Compare the resulting PRE index to the full-replay baseline at the same point.

Do not assume that different signers can independently choose their own bootstrap point. The experiment must establish one exact common point, prove that each signer has it on its selected chain, and record how a late or lagging signer is handled.

### 3.3 Applying blocks and rollbacks

For every applied block, process transactions in ledger order:

1. remove every consumed TxIn from the PRE index;
2. add every newly created output that carries the exact test policy/name and positive quantity;
3. update total quantity and deterministic state digest;
4. record enough inverse data to restore the prior state on rollback;
5. bind the resulting state to the exact block point.

The experiment must cover mint, burn, ordinary transfer, split/merge UTxOs, script outputs, and rollback to a common ancestor followed by a different fork. A reselected chain must produce the same root as a clean replay of that chain. A root from an abandoned branch must never remain eligible for certification.

The indexer is not trusted because it is local. It is a deterministic implementation whose output is independently compared between signer replicas and against a separately computed full-state reference. A common software defect remains a risk and requires independent review.

## 4. Test-only canonical PRE snapshot message

M1 should use a synthetic test policy ID and asset name. It must not assume that the repository's eventual PRE policy ID or token-name encoding has already been authoritatively frozen.

For this experiment only, each leaf is:

- raw Cardano address bytes;
- the exact PRE quantity held by that address at the test point.

All UTxOs at the same exact address are aggregated into one leaf. Distinct addresses remain distinct leaves even if they share a stake credential. This intentionally avoids silently choosing how one GOV entity aggregates holdings across addresses.

The canonical message should bind at least:

- module identifier, schema version and canonical encoding version;
- Cardano test network identity;
- exact snapshot slot, block number and block hash;
- test PRE policy ID and asset name;
- test-only identity rule identifier (address-level);
- deterministic Merkle-sum root, leaf count and total quantity;
- eligibility/exclusion rule commitment for the test;
- any test proposal/snapshot domain used to prevent cross-test replay.

Leaves are sorted by the exact canonical address-byte encoding. Quantities use exact integers, never floating point. The tree's sum must equal the sum of all test-asset quantities in all unspent outputs at the same point. The full-replay reference and every signer replica must independently reproduce the exact same canonical message bytes, not merely a human-readable JSON object with semantically similar fields.

No off-chain caller may submit the leaf array or total as the signer input. A caller may identify a pre-agreed test point; the signers must independently establish that point and derive the complete message from their own chain state.

## 5. M1 work packages

### M1-A — ledger/indexer correctness

Build the smallest isolated Cardano test environment capable of producing real blocks and native-asset UTxOs. Do not use Yaci-only transaction fixtures as proof of Cardano node-to-client or LocalStateQuery behavior; Yaci may remain useful for separate adapter tests.

Acceptance:

- full-replay and checkpoint-bootstrap paths produce identical PRE indexes at a common point;
- independent indexer instances produce byte-identical canonical messages;
- the whole-UTxO reference sum and the indexed sum match exactly;
- all supported eras and transaction features used by the fixture are pinned and recorded;
- unsupported or ambiguous encoding fails closed.

### M1-B — adversarial state and rollback matrix

At minimum:

- one holder split across multiple UTxOs at one address;
- multiple addresses holding the asset;
- multiple addresses sharing a stake credential (must remain distinct under the test-only identity rule);
- payment-key, script and other address forms represented in the test;
- unrelated policy/name with similar token name;
- mint, transfer, burn, spend and change output;
- duplicate/unknown input, malformed output and quantity mismatch;
- missing holder, omitted output, duplicate leaf and false total;
- two competing forks, rollback to common ancestor and replay;
- stale, unknown, non-canonical or mismatched block point;
- an indexer that starts too late or misses a block;
- one signer deliberately altered to produce a different root.

Expected outcome for every disagreement or incomplete state: no matching canonical message and no certificate. The aggregator must not be able to repair, substitute or override the signers' message.

### M1-C — Mithril custom certification integration

Only after M1-A and M1-B pass, integrate the custom message with a pinned Mithril test/development network.

Acceptance:

- at least two independently provisioned signer instances compute the same message from their own Cardano node/indexer state;
- the test network's configured stake threshold and signer weights are recorded; the existence of a test certificate must not be described as production Mithril quorum security;
- a real certificate is created for the custom module message;
- an official Mithril client verifies the certificate chain and the exact custom message/artifact;
- a modified message, mismatched point, wrong asset or inconsistent signer result fails verification or prevents certificate aggregation;
- source revision, distribution, module identifier, protocol configuration, genesis verification key and all test keys are pinned as test-only evidence.

Mithril's published certification framework is pluggable, but an end-to-end custom module is not a local-only extension. It requires implementation and deployment across signers (the majority of SPOs registered in that protocol), aggregators and clients. A private test network proves prototype feasibility only. It does not imply that the existing production Mithril signer population will sign this module.

### M1-D — resource and operational report

Measure for both replay and checkpoint bootstrap:

- initial sync/bootstrap time;
- incremental CPU, memory, disk I/O and storage;
- per-block processing latency and rollback cost;
- time to regenerate a snapshot root at an exact point;
- index growth and undo-journal growth;
- time to recover after downtime or a deep rollback;
- behavior when signer replicas are at different chain points.

No production resource target is invented by this plan. The report must contain measurements at increasing test-ledger sizes and identify the extrapolation limits. A design that works only on a tiny fixture does not pass production feasibility.

## 6. M1 pass/fail and stop conditions

M1 passes only if all of the following are evidenced:

1. Full-replay reference, checkpoint-bootstrap path and independent signer indexes agree on the exact UTxO distribution at the same block point.
2. Split outputs, scripts, native-asset mint/burn and rollback/fork scenarios are handled deterministically.
3. A real test Mithril custom-module certificate is produced and verified by the official client.
4. Signer disagreement, late indexing, wrong point or incomplete data fails closed.
5. Resource measurements demonstrate a credible path beyond the small fixture, or explicitly identify the bottleneck and a bounded optimization experiment.

Stop the Mithril route for production consideration if:

- the signers cannot independently derive the same complete PRE distribution;
- a signer needs an external indexer/publisher to supply authoritative holders or balances;
- the custom module cannot be adopted by a sufficient signer population for the chosen Mithril network;
- historical point reconstruction cannot be made deterministic and rollback-safe;
- the only working output is an off-chain verified root that Plutus does not verify;
- M2 cannot verify the actual certificate proof within Cardano's real resource and transaction limits.

Do not weaken completeness or authenticity to obtain a green prototype.

## 7. M2 remains an independent gate

M1 proves that a custom PRE message can be derived and stake-threshold certified in a controlled test environment. It does not prove Cardano can validate the recursive Mithril certificate proof.

M2 must use a real M1 certificate and the exact pinned Mithril recursive proof relation, genesis key and circuit-key registry. It must verify the proof and the message binding in a minimal Plutus V3 validator, test adversarial mutations, and measure CEK CPU/memory and full transaction size. The approximate 13 KB recursive proof size remains a warning, not a guarantee of fitting the 16,384-byte transaction envelope.

If the verifier does not fit the ledger resource limits, the certificate cannot be converted into an unsigned root plus off-chain trust assertion. That would fail the intended trust boundary.

## 8. Production choices deliberately left open

This M1 plan does not select:

- whether Mithril's stake-weighted threshold and genesis/circuit-key roots satisfy the protocol owner's meaning of permissionless/trustless;
- the production PRE policy ID and token name;
- whether GOV EntityId maps to a payment credential, stake credential or another canonical credential bundle;
- how an entity's balances across multiple addresses are aggregated;
- script-controlled and programmable-token eligibility;
- Treasury, exchange, LP and other exclusions;
- the exact rule translating voting start into one immutable Cardano block point;
- the proposal/ruleset binding and one-time on-chain SnapshotState transition;
- whether production Mithril SPOs would adopt the custom module.

The frozen GOV-16/17/18 semantics remain unchanged: linear PRE voting weight, snapshot at voting start, direct non-recursive weight-conserving delegation, quorum of at least 25%, ordinary approval strictly greater than 50% of Yes+No, and separate challenge/finality/adoption/conformance/canonicalization stages.

## 9. Scope and non-effects

- This is a design/test contract only. No production source, signer, indexer, verifier, test, workflow, CI or deployment was changed or run.
- No Mithril private/test network was provisioned and no certificate was produced.
- No production SPO, aggregator, client or node was contacted or asked to adopt a module.
- No PRE asset identity, governance credential rule, eligibility rule, snapshot point, trust root or voting rule was selected.
- No wallet action, signature, transaction, Preprod/Mainnet query or ledger-state change was performed.
- V3, Reveal, B1 EEV, Issue #37 first-ticket gates, Issue #43 Registry security and Issue #49 BeaconRegistry design are untouched and remain separate.

## 10. Technical sources

- Mithril certification framework and custom-module deployment requirement: https://mithril.network/doc/mithril/advanced/mithril-certification/
- Cardano API QueryUTxO / QueryUTxOWhole complexity: https://cardano-api.cardano.intersectmbo.org/cardano-api/Cardano-Api-Query.html
- Ouroboros LocalStateQuery target and point-acquisition model: https://ouroboros-network.cardano.intersectmbo.org/ouroboros-network/protocols/Ouroboros-Network-Protocol-LocalStateQuery-Type.html
- Cardano architecture / Node-to-Client full blocks and local ledger-state query: https://docs.cardano.org/about-cardano/explore-more/cardano-architecture
- Mithril team update 2026-11-04 (SNARK default activation remained in progress): https://updates.cardano.intersectmbo.org/2026-11-04-mithril/
- Prior repository feasibility report: AGENT-B-MITHRIL-PRE-SNAPSHOT-ONCHAIN-VERIFICATION-FEASIBILITY-2026-11-08.md
- Prior repository governance/source boundary report: AGENT-B-GOVERNANCE-PRE-SNAPSHOT-AND-BEACON-TARGET-TRUSTLESS-GAP-2026-11-08.md
