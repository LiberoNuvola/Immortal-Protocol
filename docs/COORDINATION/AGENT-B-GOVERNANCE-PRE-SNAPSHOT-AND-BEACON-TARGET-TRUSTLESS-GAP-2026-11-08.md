# Agent B — Governance PRE snapshot and BeaconTarget trustless gap

**Date:** 2026-11-08  
**Branch:** \`work/immortal-green-closure\`  
**Exact reviewed HEAD:** \`fdc9f8f3533efffdbf4bf8f69ded7ae8b7bc1d65\`  
**Classification:** DESIGN / SOURCE AUDIT — NON-NORMATIVE; NO IMPLEMENTATION AUTHORITY  
**Scope:** the two prerequisites blocking a trustless Issue #49 Factory: (1) authentic and complete PRE voting-start snapshot plus canonical governance state; (2) deterministic authentication of the complete \`BeaconTarget\`.

## 1. Executive conclusion

The repository already has a meaningful chain-neutral governance model: immutable ruleset registration, canonical event payloads, SHA-256 event commitments, deterministic replay, decision/adoption/conformance/canonicalization witnesses, and bounded Haskell/independent replay evidence.

What it does **not** yet have is a Cardano-verifiable proof that the governance inputs were true and complete:

- PRE balances and the eligible-entity denominator at the exact voting-start snapshot;
- the binding between each governance entity and a Cardano credential;
- the authenticity of each vote/delegation actor;
- the authenticity and completeness of evidence references;
- the adopted PRE-RICH application configuration as a ledger state that a Factory can consume.

A deterministic replay of supplied data is not proof that the supplied balances, voters, weights or evidence were complete and genuine.

The second independent blocker is the Beacon target. \`BeaconTarget\` contains opaque \`mainchainRef\` bytes. The current Pending builder accepts the complete target from its caller. Materios' inspected \`OrinqReceipts::Anchors\` storage takes \`anchor_id\` as an explicit caller-supplied key. The Orynq SDK convention \`SHA256(rootHash || manifestHash)\` is observed producer behavior, not a canonical PRE-RICH round-to-anchor rule. A storage proof can authenticate a selected \`AnchorRecord\`; it cannot, by itself, prove that this is the canonical anchor for a PRE-RICH round.

**No mechanism in the current repository closes both prerequisites while retaining the current non-custodial linear-PRE voting model and rejecting privileged per-round authorities.** There are research directions, but none is implementation-ready.

For Issue #49, retain the Factory STT as the uniqueness/replay-prevention candidate. Do not implement or deploy it as a trustless OpenRound until the governance snapshot/configuration and target-derivation proof boundaries are separately specified and reviewed.

## 2. Exact source baseline

The branch resolved to \`fdc9f8f3533efffdbf4bf8f69ded7ae8b7bc1d65\`. The latest commit before this document changed only the coordination checkpoint; the following relevant source blobs were confirmed unchanged:

| Path | Blob SHA | Finding |
|---|---|---|
| \`IMMORTAL/governance/Governance.hs\` | \`982b8fc6e1cc7a703ddb3a9f01487d5cecba317d\` | \`EntityId = Integer\`; snapshot stores supplied \`(EntityId, Weight)\`; \`snapshotValid\` checks timestamp, positive weights and distinct IDs only |
| \`IMMORTAL/governance/GovernanceEventSchema.hs\` | \`3f933e727b4316e44bc2f456470410b3a8c635bc\` | Canonical events carry actor class and semantic payload, but no Cardano credential witness / transaction context |
| \`IMMORTAL/governance/GovernanceAuthorization.hs\` | \`8a2716ed368e7403fbac82c7121369bc95ae53d1\` | Actor authorization maps event types to actor classes; evidence authenticity is reduced to non-empty references |
| \`IMMORTAL/governance/GovernanceCommitment.hs\` | \`e3704095931de89216b0a227699a1f276685f326\` | SHA-256 over canonical UTF-8 commitment bytes is implemented; it authenticates byte content, not truth or provenance |
| \`IMMORTAL/governance/GovernanceCanonicalReplay.hs\` | \`deb2d0ebe2299ac8bc49841182e3f11979a5b041\` | Canonical event replay applies proposal/vote/delegation and dedicated finalization/adoption/conformance/canonicalization handlers |
| \`IMMORTAL/governance/GovernanceDecisionWitness.hs\` | \`492fa30161230812857aadaab2377ccd50979900\` | Recomputes quorum/approval from the supplied snapshot and votes; does not prove source snapshot completeness |
| \`IMMORTAL/governance/GovernanceCanonicalizationWitness.hs\` | \`8957b631183e5f69f759fddae0070d35815fb4ec\` | Canonicalization is represented as a Haskell witness/projection, not a Cardano state proof |
| \`IMMORTAL/governance/README.md\` | \`312175e57cb9e94972662353a2775f8fb545de44\` | Explicitly says standalone Haskell conformance does not authenticate production actors/credentials or certify on-chain governance |
| \`plutus/export/Export.hs\` | \`b33cd08b2d9dc6800215e771f18d561c87bc34c7\` | Exports current application scripts; no governance validator/configuration carrier is exported |
| \`docs/00-normative/GOVERNANCE_IMPLEMENTATION_CONTRACT_PHASE2.md\` | \`bf42cf1c465cf9b6be768efed99594159793c2b9\` | Freezes voting weight \`V(P)=P\`, voting-start snapshot, direct non-recursive delegation, 25% quorum and strict >50% ordinary approval |
| \`src/createRound.ts\` | \`4112d87b7b6d88d77da0bbaee5ed2e172527609e\` | Accepts caller-supplied \`BeaconTarget\` and \`relayerPkh\`; creates Pending by ordinary payment to Registry address |
| \`src/beacon.ts\` | \`4ad58dedb68bb3db1b52900b113126105dcd8766\` | \`BeaconTarget\` consists of networkId, round, mainchainRef and version |
| \`docs/research/B3-C-POC2-MATERIOS-ANCHOR-KEY-TRIANGULATION-2026-09-27.md\` | \`ebc464d9839fdfd523b2cb5806e0aa63a53c144a\` | Storage-key layout known; canonical round/checkpoint-to-anchor relation remains open |

**Correction to older status notes:** SHA-256 canonical commitment verification now exists in \`GovernanceCommitment.hs\`. The remaining problem is not merely hashing; it is proving the source data, actor credentials and snapshot completeness.

## 3. Governance rules that must remain unchanged

The current implementation contract requires:

- eligible ledger entities at voting start;
- linear PRE voting weight \`V(P)=P\`;
- direct, non-recursive, weight-conserving, snapshot-bound delegation;
- quorum at least 25% of eligible snapshot weight;
- ordinary approval strictly greater than 50% of Yes+No;
- abstention contributes to quorum but not to the approval denominator;
- fixed snapshot and voting windows; challenge/finality, adoption, conformance and canonicalization remain distinct.

Do not silently replace this with ADA/DRep voting, custodial PRE staking, escrow/lock voting, an off-chain holder list, a publisher signature or a committee-selected tally.

The PRE-RICH snapshot-reward specification is a separate application feature. It explicitly distinguishes reward weight from governance voting weight unless a future governance specification composes them. It is not authority to borrow a reward cadence, eligibility rule or weight function for GOV-16/17/18.

Cardano Plutus validators receive the datum, redeemer and \`ScriptContext\` for the transaction being validated; that context is not an arbitrary historical UTxO-set query. A caller-supplied reference UTxO/root or an indexer-calculated holder list therefore needs an independent mechanism that proves both authenticity and completeness. A hash or Merkle root alone does not establish either.

## 4. PRE snapshot mechanism analysis

### 4.1 Candidate A — on-ledger maintained PRE balance commitment

A possible architecture would require every PRE balance-changing path (mint, burn, transfer, programmable-token transfer and permitted UTxO restructuring) to update an authenticated balance commitment. One representation is a Merkle-sum tree keyed by canonical ledger entity/credential, with one aggregate PRE balance per entity.

At voting start, the proposal could freeze the commitment, total PRE quantity, asset identity and exact ledger boundary. Later, voters prove their balance against that frozen commitment without locking their PRE.

Necessary invariants:

1. Every PRE mint/burn and every transfer path updates the balance commitment atomically.
2. No alternate native-token, script, programmable-token or restructuring path can move PRE without updating the commitment.
3. Leaves use one canonical identity mapping and aggregate every PRE-bearing output attributable to that entity.
4. Canonical ordering and unique-leaf rules prevent split/duplicate identities.
5. The Merkle-sum root's total equals the complete PRE quantity in the ledger at the snapshot; exclusions and controlled-address treatment are proven, not assumed.
6. The proposal freezes one root/boundary; later transfers update only the live root.
7. A voter proves the leaf balance and signs with the credential bound to that leaf.
8. Delegation and one-vote-per-entity rules are enforced independently; splitting token UTxOs cannot multiply voting weight.

**Cost / incompatibility:** ordinary native-asset transfers do not invoke the asset's minting policy. Enforcing updates on every transfer therefore requires PRE to use a mandatory programmable transfer/custody/validator path or an equivalent compulsory ledger mechanism. A single global balance-tree state UTxO also serializes all PRE transfers and creates a global contention/liveness point.

This could leave token balances user-controlled in a narrow custody sense, but materially changes transfer architecture and user transaction requirements. The existing CIP-113 Cardano Adapter work does not establish a deployed PRE-RICH transfer regime that already provides this root.

**Disposition:** technically conceivable, not present, not a small governance adapter, and not authorized. Do not infer CIP-113 currently supplies this property.

### 4.2 Candidate B — Mithril-style certified PRE distribution snapshot

Mithril is a relevant Cardano-native research candidate because it uses stake-weighted multi-signatures over certified Cardano data; a client verifies a certificate chain rooted in a genesis verification key. This is materially different from trusting one API or one named snapshot operator.

However, the standard artifacts have distinct limits:

- The standard Cardano stake-distribution message commits to SPO pool IDs and ADA stake delegated to those pools at a Cardano epoch. It is **not** a Merkle tree of arbitrary PRE holders and balances.
- The standard Cardano node database artifact certifies hashes of immutable files. Its current documented boundary excludes the latest immutable file, ledger state and volatile data from the signed artifact.
- Neither standard artifact can therefore be treated as a ready-made proof of the exact PRE holder distribution at the GOV voting-start boundary.
- The certificate chain uses a genesis verification key to anchor the initial stake distribution and recursively authenticates later stake distributions. This is an explicit bootstrap and stake-threshold trust model, not an absence of all trust assumptions.

A **custom PRE snapshot artifact** would need a separate specification and implementation:

1. exact network, PRE policy ID + asset name, snapshot boundary (slot/epoch and block identity);
2. independent computation from canonical ledger state (or a separately verified deterministic replay), not from an API-supplied holder list;
3. canonical leaf definition: ledger entity/credential and aggregated PRE quantity;
4. sorted leaves and Merkle-sum commitment, with one unique leaf per entity;
5. proof that committed total equals complete PRE quantity at the boundary and that eligibility/exclusions are applied correctly;
6. voter membership/balance proof plus signature from the credential bound to the leaf;
7. proposal binding to certified root, snapshot point, PRE asset identity, ruleset version and proposal identity;
8. verification of certificate chain, signer-stake threshold and PRE-root message; reject stale, wrong-network, wrong-asset, replayed or incomplete roots.

**Critical limitation:** this custom PRE Merkle-sum artifact is a proposal, not a feature found in standard Mithril or this repository. Off-chain Mithril verification followed by passing an unsigned root to Plutus is not sufficient. The certificate proof must itself be carried into an on-chain-verifiable state/transition or the governance and Factory trust boundary remains off-chain. Cardano Plutus execution cost and an implementable verifier for the chosen Mithril aggregate signature/certificate relation must also be measured.

**Disposition:** best research candidate to investigate if freely transferable, non-custodial PRE is a hard requirement. Its honest label would be *Cardano-consensus-backed / stake-threshold verified*, not “absolute trustlessness.” It is not selected or authorized here; owner approval of that security model is required.

### 4.3 Candidate C — ADA/DRep snapshot

Not equivalent to current governance. ADA/DRep voting uses another voting asset and electorate; substituting it changes the distribution of authority.

**Disposition:** reject as a shortcut unless a separate constitutional/governance change explicitly changes the voting asset and rules.

### 4.4 Candidate D — PRE lock/escrow voting

Locking PRE or moving it into escrow may simplify a ledger-visible voting snapshot, but changes the current snapshot-bound non-custodial voting representation, transferability and custody threat model.

**Disposition:** not an implementation workaround; it requires a separate normative decision and is not recommended for this dependency.

## 5. Minimum Cardano governance state after the snapshot boundary exists

A correct PRE root is only one input. The Factory must consume an authenticated adopted application configuration, not a JSON event or a Haskell replay result.

Minimum conceptual separation:

- **Governance/genesis anchor:** immutable constitution/ruleset genesis commitment and exact initial application namespace.
- **Proposal/voting state:** canonical lifecycle, frozen snapshot root, credential-bound votes/delegations, unique proposal/event identities and finite time boundaries.
- **Canonical governance state:** replay predecessor/sequence and canonicalized decision reference; preserve the existing GOV lifecycle stage boundaries.
- **Application configuration state:** currently adopted PRE-RICH configuration commitment, game/deployment namespace, Registry credential, B1 publisher identity, immutable B1 trust profile, round progression and target-derivation contract.
- **Factory state:** reads the canonical application configuration and its current version; it cannot rewrite governance-owned fields.

Canonicalization must prove the exact adopted proposal and conformance result and atomically advance the application configuration state under the existing governance rules. An ordinary round opening does not need a new governance vote; it reads the adopted configuration and applies a deterministic next-round predicate.

A remaining execution/liveness design choice is how to record votes and replay events without a privileged keeper. One per-proposal UTxO serializes ballot updates; partitioned event/ballot UTxOs need a completeness proof that no vote or delegation was omitted, duplicated or counted twice. This cannot change GOV-16/17/18 semantics.

## 6. BeaconTarget — source facts and missing semantic relation

### 6.1 Current producer boundary

Current \`src/createRound.ts\` accepts caller-supplied \`BeaconTarget\` and \`relayerPkh\`, constructs the seven-field Pending datum and pays it directly to the Registry script address. Current Registry validator governs Pending → Ready; it does not authenticate Pending creation.

The target tuple is:

\`(networkId, round, mainchainRef, version)\`.

The TypeScript/Plutus Beacon derivation binds these fields together with later \`mcHash\` and Materios context. Deterministic hashing binds supplied bytes; it does not authenticate how \`mainchainRef\` was selected.

### 6.2 Materios AnchorRecord boundary

The inspected Materios \`OrinqReceipts::Anchors\` is a \`StorageMap\` keyed by \`H256 anchor_id\`. The \`submit_anchor\` extrinsic accepts \`anchor_id\` explicitly and inserts the record under that key. Its raw FRAME storage key is:

\`\`\`text
Twox128("OrinqReceipts")
|| Twox128("Anchors")
|| Blake2_128(anchorId)
|| anchorId
\`\`\`

A separate Orynq SDK inspection observed this producer convention:

\`anchorId = SHA256(rootHash_bytes || manifestHash_bytes)\`.

This is an observed application/SDK convention only. The pallet accepts a caller-supplied key; the inspected source does not establish this formula as a consensus rule. The repository's B3 research explicitly leaves this semantic relation open:

\`roundId / checkpointRef → canonical anchorId → AnchorRecord.root_hash\`.

A valid storage proof establishes that an exact key/value exists under an authenticated StateRoot. It does not prove that the selected key is the canonical anchor for the PRE-RICH round.

### 6.3 Required target contract

Before Factory OpenRound can be trustless, the application specification must define exactly what \`mainchainRef\` means. It must not silently assume it is one of:

- Materios finalized block hash;
- Orinq \`anchor_id\`;
- AnchorRecord \`root_hash\`;
- checkpoint/manifest commitment;
- another external reference.

Only after choosing that semantic meaning can a deterministic relation be defined. The complete target must then be verified:

1. \`networkId\` is bound to immutable deployment/application network configuration.
2. \`round\` equals the Factory's deterministic next-round value.
3. \`version\` is taken from authenticated adopted application configuration, not caller input.
4. \`mainchainRef\` is derived from an authenticated source under a rule bound to the same round/config.
5. External proof establishes the required Materios block/header/finality/state membership as applicable.
6. The relation checkpoint → AnchorRecord key/root is independently authenticated; no SDK convention or caller-supplied ID is promoted to protocol law without adoption and evidence.
7. The resulting target is immutable before B1 publisher observation is submitted.

The existing B3 decomposition gives the right publisher-independent proof shape:

\`finalized header + GRANDPA/authority/ancestry proof → StateRoot → storage proof → exact AnchorRecord\`.

But B3-A finality/authority-transition and B3-C Cardano verification remain open. No B3 evidence can be inferred from the existing B1 publisher signature.

### 6.4 B1 and B3 remain separate

- B1 may use its configured authorized publisher to publish \`mcHash\` and Materios context **for a target already determined by the application protocol**.
- The B1 publisher cannot choose the target, select the round anchor, change network/version or create the Registry.
- B3 is the separate publisher-independent canonicality path. It is not silently substituted into B1, and B1 is not relabelled publisher-independent by adding a Factory token.
- If target proof is unavailable, OpenRound fails closed. No operator-generated target fallback is allowed.

## 7. Combined target architecture

\`\`\`text
immutable governance/application genesis
                |
                v
certified PRE snapshot + credential-bound votes
                |
                v
verified GOV-16/17/18 lifecycle + canonicalization
                |
                v
authenticated application-config state
                |
                +---- deterministic round progression
                |
                +---- authenticated Materios checkpoint/anchor relation
                |
                v
complete canonical BeaconTarget
                |
                v
Factory STT: permissionless OpenRound
                |
                v
one authenticated round identity + one Pending Registry
                |
                v
B1 publisher may publish only for this fixed target
\`\`\`

The Factory solves singleton uniqueness and replay prevention. It does not replace governance, derive unverified external truth, or make the B1 observation publisher-independent.

## 8. Decision matrix

| Candidate | Non-custodial PRE | Complete snapshot proof | Avoids per-round privileged signer | Main cost / trust boundary | Disposition |
|---|---|---|---|---|---|
| Off-chain indexer/list + root | Yes | No, absent independent completeness/authenticity | Submission only | Indexer/publisher can omit or forge entities | Reject |
| Standard Mithril SPO stake distribution | Not applicable | No, concerns SPO ADA stake | Yes | Wrong asset/weight domain | Reject as direct solution |
| Standard Mithril Cardano DB snapshot | In principle | Not directly for exact ledger-state PRE balances | Yes | Standard artifact excludes ledger state; requires independent replay or custom artifact | Research input only |
| Custom Mithril PRE Merkle-sum artifact | Yes | Potentially, if independently computed from canonical state | Yes | Stake-threshold/genesis-key trust model; custom artifact and on-chain verifier | Best research candidate, NOT selected |
| Mandatory on-ledger PRE balance tree | Yes, in custody sense | Potentially, if every movement is forced through it | Yes | Transfer-architecture change and global UTxO serialization | Technically conceivable, NOT selected |
| ADA/DRep snapshot | Yes | Not for PRE voting weight | Yes | Changes voting asset/electorate | Not equivalent |
| PRE lock/escrow | No | Easier to represent but changes governance | Yes | Custody/lock and new normative rules | Not recommended |

## 9. Required evidence and decisions — no assumptions

1. Determine whether a Cardano stake-threshold certificate model (e.g. Mithril's distributed signer model) is acceptable for the PRE snapshot, or whether only an on-ledger balance commitment enforced on every PRE transfer meets the trust requirement. Do not use a single publisher/committee key or off-chain indexer either way.
2. Define the canonical mapping from GOV \`EntityId\` to Cardano credential/ledger entity, and how one entity's PRE across addresses/outputs is aggregated without splitting or double counting.
3. Define exact PRE asset identity and governance snapshot boundary; do not borrow PRE reward-snapshot parameters or presume the reward snapshot is the voting snapshot.
4. Define how the snapshot artifact proves completeness, total quantity, eligibility, exclusions and credential uniqueness.
5. Specify the Cardano-verifiable vote/delegation/event/canonicalization state machine preserving GOV-16/17/18, including signer identity and omission resistance.
6. Define the semantic meaning of \`BeaconTarget.mainchainRef\`.
7. Define the canonical Materios checkpoint/round-to-anchor relation. The Orynq SDK formula remains an observed convention, not adopted protocol law.
8. Establish the full Materios B3-A/B/C proof chain or another explicitly selected target-derivation contract that does not let the B1 publisher choose the target.
9. Only after review, specify exact Factory/config state datums, verifier contracts, dependency graph and implementation/resource gates.

No voting threshold, snapshot cadence, token identity, target schedule, checkpoint selector, anchor hash formula, new trust mode or publisher/authority role is selected by this document.

## 10. Implementation boundary and non-effects

- No production source code, tests, datum/redeemer ABI, scripts, policy IDs, transaction builders, workflows, CI runs or branch topology were changed.
- No wallet action, signature, transaction, deployment, Preprod/Mainnet query or ledger-state change was performed.
- No Materios consensus/authority selection, B3 proof status, Beacon derivation or current B1 trust mode was changed.
- No PRE snapshot cadence/eligibility rule, governance threshold, voting representation or PRE asset identity was changed.
- Issue #43 Registry security findings remain release-blocking.
- Issue #37 first-ticket admission/EEV/R1/Kc gates remain separate and unchanged.
- The Factory STT remains a uniqueness design candidate, not implementation-ready or deployable as trustless.
