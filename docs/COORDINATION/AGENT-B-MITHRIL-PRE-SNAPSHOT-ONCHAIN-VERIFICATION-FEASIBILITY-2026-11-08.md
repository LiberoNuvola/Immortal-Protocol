# Agent B — Mithril PRE snapshot / Plutus verification feasibility

**Date:** 2026-11-08  
**Branch:** \`work/immortal-green-closure\`  
**Exact reviewed HEAD:** \`0df1b84906c48e88305b9f4902c761b093baf953\`  
**Classification:** DESIGN / EXTERNAL-PROTOCOL FEASIBILITY — NON-NORMATIVE; NO IMPLEMENTATION AUTHORITY  
**Scope:** determine whether a Mithril-style, stake-weighted certificate can authenticate a complete non-custodial PRE holder snapshot and whether Cardano can verify that certificate before governance accepts the snapshot.

## 1. Executive result

The Mithril path is materially stronger than the initial abstract proposal. Current Mithril architecture explicitly supports pluggable certification modules: signers independently compute data messages, aggregators collect and aggregate signatures, and clients verify artifacts and certificate chains. The certificate message map can carry additional data that signers can compute deterministically from Cardano consensus. This makes a custom PRE-balance-snapshot module a legitimate engineering candidate, not a misuse of the protocol.

The missing piece is substantial: the standard modules do **not** currently certify a complete PRE holder/balance distribution. A custom module would need to be deployed consistently across the Mithril signers, aggregators and clients, and all relevant SPO signer nodes would need to compute the same complete PRE snapshot from the same canonical Cardano state. Mithril documentation explicitly warns that custom modules require significant work and deployment across the majority of registered SPO signers.

There is also a plausible on-chain verification direction. Cardano's Plutus V3 includes BLS12-381 pairing operations; protocol version 11 added multi-scalar multiplication builtins (CIP-133) and modular exponentiation support. Mithril has published compact Halo2/SNARK certificate aggregation designs, and the current source documents KZG verifier parameters over BLS12. However:

- the stable concatenation aggregation flavor produces aggregate signatures around 150 KB;
- the compact non-recursive and recursive SNARK flavors are still documented as unstable;
- the recursive proof is approximately 13 KB and is the flavor that can attest to the complete certificate chain back to the genesis certificate in one proof;
- no production-qualified Mithril-to-Plutus verifier or measured PRE-RICH CEK/transaction budget has been demonstrated in this repository.

**Revised disposition:** a custom Mithril PRE snapshot plus a compact recursive certificate verifier on Cardano is the strongest current research candidate for preserving freely transferable, non-custodial PRE without a privileged per-proposal or per-round signer. It is not yet implementable as a production dependency, and it is not “trust without assumptions”: it inherits Cardano consensus, a stake-weighted Mithril signer threshold, Mithril genesis/circuit-key trust anchors, and correctness of the deployed custom snapshot module.

Do not implement a signer, lock, snapshot publisher or governance shortcut. Do not place an off-chain verified root into a Registry/Factory UTxO and call it authenticated unless the on-chain consumer verifies the certificate (or an equivalently authenticated state transition).

## 2. Current Mithril protocol facts (as of 2026-11-08)

### 2.1 Extensible certification modules

The Mithril certification framework is designed around data-specific modules:

1. signer nodes compute module messages from their local chain view;
2. aggregators receive and aggregate signer signatures into a certificate;
3. clients obtain artifacts and verify them against the certificate chain.

The official documentation says custom modules require significant development and must be deployed across signers (the majority of registered SPOs), aggregators and clients before end-to-end certification is possible.

The certificate message is a map that can include additional deterministic Cardano-consensus data, with the certificate-chain design explicitly giving examples such as immutable-file snapshots, UTxO set and stake distribution. This is the right extension point for a PRE balance commitment. It does not mean a PRE-holder module already exists or that the ordinary Mithril client knows how to compute it.

### 2.2 Existing standard artifacts are not a PRE-holder snapshot

| Current Mithril artifact | What it certifies | Why it is insufficient by itself |
|---|---|---|
| Cardano stake distribution | Merkle root over SPO pool IDs and ADA stake delegated to each pool at an epoch | Wrong asset and wrong electorate; not PRE holder balances |
| Cardano node database v2 | Hashes of committed immutable files | Current documentation states that the last immutable file, ledger state and volatile data are not signed because the node does not deterministically compute them |
| Cardano blocks and transactions | Merkle membership of blocks and transactions, with signed latest block number and security offset | Proves membership of selected transactions/blocks; does not directly provide a complete PRE balance tree or prove an off-chain indexer's reconstruction |
| Custom PRE snapshot module | Not a standard artifact today | Requires custom signer-side full-state calculation, canonical encoding, complete-tree commitment and end-to-end deployment |

The new Cardano blocks-and-transactions certification is especially relevant as supporting evidence: distribution 2630 activated its testing phase on release-preprod and pre-release-preview in August 2026. It authenticates transaction/block membership and gives users a signed block-depth value. It does not itself certify the aggregate PRE balances of every eligible governance entity.

A full transaction-history reconstruction could be an auxiliary validation route, but an off-chain indexer cannot simply publish a holder list and claim completeness. The required final output remains an authenticated complete balance commitment at one exact snapshot point.

### 2.3 Certificate chain and trust roots

Mithril certificate verification is not just checking a signature supplied by an aggregator. A client verifies the multi-signature and the stake distribution used to make it, recursively linking the stake distribution to a previous certificate or the valid genesis certificate. The genesis certificate is anchored by a genesis verification key.

This gives a distributed stake-weighted trust model, not an absolute no-trust model:

- a dishonest aggregator cannot forge a valid certificate without the required signer signatures;
- signers operate with trusted Cardano nodes and Mithril signing keys;
- signer availability and a sufficient stake-weighted threshold are required for liveness;
- the genesis verification key and the selected Mithril network/protocol configuration are explicit roots of trust.

Multiple aggregators can serve certificate chains; the aggregator is a coordination/availability service, not the holder of the PRE snapshot authority. Any valid certificate chain is verified from the same Mithril genesis trust root.

### 2.4 Current maturity of compact certificates

The latest relevant rollout is distribution 2642, released on 2026-10-21. It introduced support for compact SNARK certificates and a genesis-signed registry of trusted circuit verification keys, but the release notes classify these capabilities as unstable. The 2026-11-04 Mithril team update still records activation of the SNARK feature by default as work in progress.

Current documented aggregation-flavor comparison:

| Flavor | Approx. aggregate-signature size | Certificate-chain coverage | Maturity |
|---|---:|---|---|
| Concatenation | ~150 KB | One certificate at a time; chain must be followed | Stable |
| Non-recursive SNARK | ~4 KB | One certificate at a time; prior chain/AVK still has to be authenticated | Unstable |
| Recursive SNARK / IVC | ~13 KB | One recursive proof can attest to the certificate chain back to genesis | Unstable |

These are documented approximate aggregate-signature sizes, not complete transaction-size guarantees. A 13 KB proof is already close to Cardano's 16,384-byte transaction-size limit before redeemers, inputs, outputs, witnesses and other data. A reference-input or chunked-data layout may reduce the bytes carried by a single consuming transaction, but it does not remove proof-verification memory, execution-budget, datum-storage and construction-transaction constraints.

The recursive option is the right research target for constant-size verification of the full Mithril certificate history, but its unstable status is a production blocker.

## 3. Candidate PRE snapshot module

### 3.1 Required message semantics

A custom signer module must derive one canonical PRE snapshot message at one exact Cardano ledger point. The signed message should bind, at minimum:

- schema and module version;
- Cardano network / chain identity;
- exact snapshot block number, slot and block hash;
- exact PRE asset identity (policy ID and token name);
- governance snapshot rule/version;
- canonical entity-to-ledger-credential mapping version;
- total PRE quantity represented by the eligible holder set;
- canonical Merkle-sum root;
- leaf count and canonical ordering/encoding identifier;
- explicit exclusions/eligibility rule commitment;
- commitment to the proposal or snapshot domain, where proposal-specific binding is required.

No field may be caller-selected at vote submission. The same PRE balances and same snapshot point must produce exactly the same canonical message on every conforming signer.

### 3.2 Signer-side full-state computation

The hard engineering task is the complete PRE distribution, not signing the resulting hash.

Each signer must obtain the canonical UTxO/ledger state at the same finalized Cardano block and independently:

1. enumerate every UTxO carrying the exact PRE asset;
2. aggregate quantities by the canonical governance entity/credential;
3. apply the frozen eligibility/exclusion rules;
4. handle script-controlled and programmable-token outputs according to the same deterministic rule;
5. reject malformed, unsupported or ambiguous ownership encodings;
6. sort leaves canonically and compute per-leaf balance plus subtree balance sums;
7. verify that the Merkle-sum total equals the complete eligible PRE quantity at that state;
8. emit the exact same snapshot message as other signers.

The current Cardano DB Mithril artifact does not provide this PRE balance result automatically. The custom module needs a deterministic full-UTxO reconstruction/reader at an exact chain point. The node's normal external query API is not itself an authenticity proof; the signer computation must be anchored to its own canonical node state and use identical snapshot selection logic.

A signer disagreement must result in no certificate/quorum for that snapshot, not a fallback to an aggregator-provided or publisher-provided tree.

### 3.3 Merkle-sum membership

A voter should receive a proof for one leaf:

\`(entityCredential, PREBalance, eligibilityFields, path, siblingSums)\`

The verifier checks:

- the leaf hashes to the exact committed root;
- the path and sibling sums reconstruct the certified total;
- the same credential/entity is represented only once under the canonical mapping;
- the proof is for the same asset, network, block point, governance snapshot and proposal;
- the voter signs with the credential bound to the leaf.

The root total must be checked against the total PRE quantity at the snapshot. A plain Merkle root proves membership only; the sum-tree and completeness are provided by the certified signer computation. Do not promote a caller-generated root or a tree whose total is not linked to the complete ledger asset quantity.

### 3.4 Identity mapping remains a normative blocker

The current Haskell model uses \`EntityId = Integer\`; it does not identify a Cardano payment/stake credential. A future snapshot module cannot invent what an “entity” is.

Before implementation, the governance specification must define whether one entity is identified by a stake credential, payment credential or another canonical credential bundle, and how multiple addresses/UTxOs are aggregated. It must decide treatment of:

- multiple payment addresses controlled by one stake credential;
- addresses without a stake credential;
- script credentials and programmable-token custody;
- protocol/Treasury/LP/exchange addresses;
- split or aggregated holdings;
- delegated voting and duplicate entity credentials.

This design must preserve GOV-16/17/18's linear PRE voting rule and direct, non-recursive, weight-conserving delegation. No ADA/DRep replacement, PRE custody or lock is introduced by this document.

## 4. Cardano-side certificate verifier feasibility

### 4.1 Primitive overlap

Plutus V3 supports BLS12-381 group and pairing operations. Cardano protocol version 11 added multi-scalar multiplication builtins (CIP-133) and modular exponentiation support (CIP-109). Mithril's documented compact-certificate work uses Halo2/KZG verifier components over BLS12 in its verifier setup.

This is a promising primitive-level overlap, not proof of direct compatibility. The exact Mithril proof transcript, field encodings, curve operations, KZG verifier parameters, circuit verification-key registry and recursive IVC verification relation must be matched to the Plutus builtins that are actually available on the target network. A Rust Mithril verifier running off-chain does not prove that the equivalent predicate can be executed by a Plutus validator.

### 4.2 Required on-chain statement

A successful Plutus verifier would need to establish, not merely receive as strings:

1. the Mithril recursive proof is valid under the exact approved circuit verification key;
2. the circuit verification key is authorized by the correct genesis-signed registry or pinned by an independently approved deployment commitment;
3. the proof attests to the certificate chain state and links it to the accepted Mithril genesis key;
4. the certificate message contains the exact custom PRE snapshot module identifier/version;
5. the certified message binds the exact Cardano network, snapshot block/slot/hash, PRE policy/name, governance snapshot version, canonical entity mapping, total balance and Merkle-sum root;
6. the proposal's voting snapshot is frozen exactly once and cannot later be replaced or replayed;
7. the subsequent voter membership proof and credential signature refer to that exact frozen root.

The verifier must fail closed for wrong genesis key, wrong circuit key, revoked/unregistered circuit key, unsupported Mithril protocol parameters, wrong module ID, wrong network, wrong PRE asset, wrong snapshot point, stale or duplicate snapshot, malformed proof and changed public input.

The circuit-key registry is itself a trust boundary: the verifier cannot blindly accept a circuit key provided by the certificate submitter. The registry's genesis authentication or the exact versioned key commitment has to be independently checked.

### 4.3 Stable BLS concatenation is not an easy fallback

The stable concatenation flavor uses BLS signature batching and pairing verification, and Plutus has BLS12-381 builtins. However, the aggregate-signature payload is documented at approximately 150 KB. It is therefore not an ordinary datum/redeemer candidate under Cardano's transaction-size ceiling. Splitting or referencing data may help storage/transport but requires an actual on-chain CEK/heap benchmark and does not remove the large signature-verification workload.

Do not classify the BLS path as deployable merely because the relevant curve builtins exist.

### 4.4 Recursive SNARK candidate

The recursive IVC flavor is the most relevant on-chain candidate because it can prove the whole certificate chain back to genesis in one recursive aggregate proof. Its documented approximate size (~13 KB) makes transaction integration more plausible than concatenation, but it remains unstable and close to the Cardano transaction envelope.

A feasibility prototype must measure:
- actual serialized proof size and datum/redeemer encoding;
- public-input size and circuit verification key size;
- CEK CPU and memory under the actual target network protocol parameters;
- maximum proof-data bytes accessible through reference inputs/chunking;
- transaction size including all required governance inputs, outputs and witnesses;
- proof verification plus the PRE Merkle-sum membership check in the same validator transition;
- effect of reference inputs and script size on the actual issue/vote transaction.

No current benchmark supports an on-chain Mithril certificate verifier claim in IMMORTAL/PRE-RICH.

## 5. End-to-end candidate architecture

\`\`\`text
Cardano canonical ledger state at exact snapshot block
                    |
                    v
Mithril signer nodes independently compute
PRE asset -> complete entity balance aggregation
                    |
                    v
canonical Merkle-sum snapshot message
                    |
                    v
Mithril stake-weighted signature + certificate chain
                    |
                    v
permissionless submitter presents recursive proof
                    |
                    v
Cardano Plutus verifier checks:
  genesis / circuit key / recursive chain / snapshot message
                    |
                    v
one immutable governance SnapshotState:
  network + block point + PRE asset + root + total + ruleset
                    |
                    v
voter proves leaf + credential signature
                    |
                    v
GOV-16/17/18 vote/delegation/lifecycle transitions
                    |
                    v
canonical adopted application configuration
                    |
                    v
Factory STT may permissionlessly open next round
\`\`\`

The aggregator is only a data/proof transport and liveness service. Anyone may fetch the certificate, construct the verification transaction and submit it. No per-vote or per-round administrator signature is added. If there is no valid certificate, no sufficient stake threshold, or no acceptable on-chain proof, governance snapshot opening fails closed.

This is separate from B1's external publisher role. It authenticates PRE governance state; it does not decide Materios truth, choose \`BeaconTarget.mainchainRef\`, verify B3 finality, or replace the Beacon trust model.

## 6. Alternatives and disposition

| Route | What it can provide | Main gap | Disposition |
|---|---|---|---|
| Existing Mithril SPO stake-distribution artifact | Authenticated Cardano SPO/ADA stake | Not PRE holder balances | Reject as direct snapshot |
| Existing Cardano DB v2 snapshot | Certified immutable-file hashes for node bootstrap | Ledger state/last immutable/volatile not in signed message; no PRE balance tree | Useful input only, not sufficient |
| Existing Cardano blocks/transactions certification | Membership proof for block/transaction and signed depth | No complete PRE balance aggregation; does not prove an indexer's full holder list | Auxiliary evidence only |
| Custom Mithril PRE snapshot module + off-chain client verification | Could certify a complete PRE balance root | Plutus does not enforce that certificate if only off-chain verifier checks it | Reject as final governance authority |
| Custom PRE module + stable concatenation proof on Plutus | Stake-threshold signed custom root | ~150 KB signature and unmeasured execution cost | Not viable without a materially different proof transport/verifier |
| Custom PRE module + recursive SNARK proof checked by Plutus | Candidate compact proof of stake threshold and certificate chain | Recursive flavor unstable; exact Plutus verifier and CEK/size not proven | **Preferred research prototype** |
| Per-transfer on-ledger Merkle-sum balance tree | Direct state update proof for every movement | Requires mandatory programmable PRE transfer path and global contention; CIP-113 is not deployed as a PRE governance substrate here | Alternative only; not selected |
| ADA/DRep or PRE lock/escrow voting | Different ledger-native mechanisms | Changes the current PRE voting asset or non-custodial model | Not equivalent; reject as shortcut |

## 7. Security model — do not call it assumption-free

If the preferred route is later adopted, its security model must be stated explicitly:

1. **Cardano consensus:** snapshot point and underlying ledger state derive from the canonical Cardano chain.
2. **Mithril stake threshold:** enough registered SPO stake must sign the same deterministic PRE snapshot message. The security assumption is stake-weighted and threshold-based.
3. **Mithril bootstrap:** genesis verification key and genesis-signed circuit-key registry are trust anchors and must be pinned/verified.
4. **Custom module correctness:** signer module code, canonical UTxO reader, entity mapping, asset filtering, sum-tree encoding and eligibility rules must be audited and independently reproduced. A bug shared by all signers can certify a wrong root.
5. **On-chain verifier correctness:** the Plutus verifier, circuit version, protocol parameters and public-input binding must be reproducible and tested against positive/negative Mithril vectors.
6. **Governance correctness:** vote/delegation uniqueness and the canonical GOV lifecycle must still be enforced on Cardano.

This architecture removes a single per-proposal snapshot publisher and a single per-round authority. It does **not** remove the stake-weighted consensus assumption, cryptographic setup roots or implementation correctness assumptions. The most accurate classification is **permissionless submission with stake-threshold certified evidence**, not absolute trustlessness.

## 8. Bounded next work

Do not yet modify production governance, Registry, Factory, V3, Reveal, ticket issuance, voting rules or token transfer semantics.

The next research/prototype work should be split into two independent gates:

### Gate M1 — custom snapshot artifact

- Freeze a test PRE policy/name and a precise test snapshot block/slot in an isolated Mithril dev/test environment.
- Define one canonical entity credential and one aggregation rule for the experiment only; do not treat it as normative PRE governance.
- Implement a deterministic reader for the full test ledger state and produce canonical balance leaves, total and Merkle-sum root.
- Run at least two independently provisioned signer nodes against the same snapshot point and compare exact canonical messages.
- Test wrong asset, missing holder, duplicate entity, split UTxOs, script output, stale block, fork/conflicting point, changed eligibility and total-supply mismatch.
- Obtain a real Mithril certificate for this custom message in a controlled network and verify it using the official client.
- Do not claim production network support until the module is deployed on the required production signer/aggregator/client population.

### Gate M2 — Plutus recursive verifier

- Pin exact Mithril 2642+ source/distribution, recursive circuit, protocol parameters, genesis key and circuit verification-key registry.
- Generate the smallest real recursive certificate-chain proof for a harmless test message.
- Port the exact verification relation to a minimal Plutus V3 validator using available BLS/KZG/MSM primitives only where the encodings match.
- Verify positive and adversarial twins: bad genesis key, circuit key, key registry, proof bytes, message, AVK, protocol parameters, epoch, network and snapshot module.
- Measure CEK CPU/memory and actual Cardano transaction size with real protocol parameters. Keep 16,384-byte transaction limit and all other execution limits as hard gates.
- If the recursive proof cannot be verified within the ledger budget, stop and do not downgrade to an off-chain trust assertion.

Only after M1 and M2 pass can a separate normative/governance decision authorize this security model for PRE governance. Implementation of the live governance state machine remains a later gate.

## 9. Exact blockers / owner decisions

1. Is the Cardano/Mithril stake-threshold security model, with its explicit genesis and circuit-key trust anchors, acceptable for PRE voting snapshot authenticity?
2. What is the canonical governance entity credential and how are multiple addresses/outputs aggregated?
3. What exact PRE policy/name and eligibility perimeter form the snapshot asset and electorate?
4. Is the current Mithril recursive SNARK verifier mature and supportable enough to become a Cardano protocol dependency, or must the project wait for stable upstream support?
5. What exact snapshot point/finality rule is used at voting start?
6. How will the signed PRE root be bound to the proposal, ruleset and one-time snapshot-state UTxO?
7. How will vote/delegation uniqueness and GOV-16/17/18 canonical lifecycle be represented and evaluated on Cardano without introducing a privileged keeper?

No choice is made by this audit. In particular, no snapshot cadence, PRE identity, voter credential mapping, module deployment, quorum, key, trust parameter or governance ABI is selected.

## 10. Sources and version pins inspected

Official Mithril / Cardano documentation:

- Mithril custom certification framework: https://mithril.network/doc/mithril/advanced/mithril-certification/
- Certificate chain and additional consensus-derived message data: https://mithril.network/doc/mithril/advanced/mithril-protocol/certificates/
- Cardano stake distribution: https://mithril.network/doc/mithril/advanced/mithril-certification/cardano-stake-distribution/
- Cardano node database v2: https://mithril.network/doc/mithril/advanced/mithril-certification/cardano-node-database/
- Cardano blocks and transactions: https://mithril.network/doc/mithril/advanced/mithril-certification/cardano-blocks-and-transactions/
- Mithril threat model (explicitly a draft): https://mithril.network/doc/mithril/advanced/threat-model/
- Concatenation: https://mithril.network/doc/mithril/advanced/mithril-protocol/aggregation/concatenation/
- Non-recursive SNARK: https://mithril.network/doc/mithril/advanced/mithril-protocol/aggregation/non-recursive-snark/
- Recursive SNARK: https://mithril.network/doc/mithril/advanced/mithril-protocol/aggregation/recursive-snark/
- Distribution 2642 update, 2026-10-21: https://updates.cardano.intersectmbo.org/2026-10-21-mithril/
- Mithril update, 2026-11-04: https://updates.cardano.intersectmbo.org/2026-11-04-mithril/
- Cardano Plutus BLS12-381 and Plutus builtins: https://developers.cardano.org/docs/developers/curriculum/smart-contracts/advanced/zero-knowledge/
- CIP-0381, BLS12-381 pairings: https://cips.cardano.org/cip/CIP-0381

Repository baseline:

- Branch HEAD: \`0df1b84906c48e88305b9f4902c761b093baf953\`
- Prior governance / target analysis: \`AGENT-B-GOVERNANCE-PRE-SNAPSHOT-AND-BEACON-TARGET-TRUSTLESS-GAP-2026-11-08.md\`
- Prior Issue #49 Factory readiness: \`AGENT-B-ISSUE49-TRUSTLESS-FACTORY-READINESS-2026-11-08.md\`

## 11. Explicit non-effects

- No production source code, Plutus script, Aiken source, datum/redeemer ABI, policy ID, workflow, test, CI run, branch topology or deployment was changed.
- No wallet action, signature, transaction, Preprod/Mainnet query or ledger-state change was performed.
- No PRE token identity, eligibility rule, snapshot point, entity mapping, governance rule, voting mechanism, Mithril module or certificate trust root was selected.
- No V3, Reveal, B1 publisher, B3 target, 500×, Issue #37 first-ticket gate or Issue #43 Registry finding was changed.
- This is a non-normative feasibility audit; no implementation authority is granted.
