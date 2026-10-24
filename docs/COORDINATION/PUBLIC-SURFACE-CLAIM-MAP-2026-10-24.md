# IMMORTAL — Public Surface Claim Map — 2026-10-24

**Reviewed branch:** work/immortal-green-closure  
**Source HEAD used for this map:** 2199258cba5d8868995164017543506d9ac4fa44  
**Classification:** source-level map for C7/C12; no runtime test, website deployment check, wallet connection, or ledger observation was executed.

## Claim layers and sources

| Surface / component | Exact blob | What it actually says/does | Evidence level | Residual boundary |
|---|---|---|---|---|
| Root index.html | 7465fd119fab5e4059825f938df898e3d0bb81fe | Redirect-only shell to web/index.html. | Navigation only | Not a protocol claim source. |
| web/index.html | 5b4185afa5125751c5fc7a7f39c7ca41c2aa536b | Public front page describes IMMORTAL as experimental, states R&D artifacts are not production certification, links to status and DApp. | Static product description | Interpret with the dated Status page and residual obligations, not as deployment proof. |
| Root live.html | 22bfe72de90572e06ff3e00f1ed792ac40908bb1 | Explicitly separates runtime observations, implementation state and open evidence; blanks are intentional. Its static cards show B3 canonicality, independent witness, Treasury genesis witness and Reveal as open/pending. | Static claim/navigation layer | Text is conservative; interactive wallet observation is a separate provider read. |
| src/live.ts | f8f067910eba8fc3e8124ae3a9f87c615fc8c22d | On user click connects a CIP-30 wallet, queries UTxOs via configured Lucid/Blockfrost, sums configured PRE assets at wallet and configured Treasury address, and labels provider configured/not configured. Missing configuration remains explicit. | User-triggered provider observation | observed-at is a local wall-clock timestamp; no block/hash, UTxO references, StateRoot, authenticated finality or verifier digest is attached to displayed balances. “Observation completed” is not cryptographically final/certified protocol state. |
| web/status.html | 64a2329d36af132945ae11270759d659303328dc | Explicitly labels published view as main @ 8c6873e · 2026-10-02 04:51 UTC, separately labels working evidence as green, and keeps B3, native execution, Genesis/Treasury and governance evidence open. | Dated public status snapshot | It is a frozen October 2 snapshot, not live current-head status; refresh only through authorized public-surface workflow with exact evidence references. |
| web/verification-lab.html | db0a2a42fda31014ce4c774c281cbaf5b0096683 | Describes claim → source → implementation → conformance → execution and says external canonicality remains open. | Method explainer | Not itself a verifier or verification artifact. |
| src/protocolDeclaration.ts | 29b25c2ec9b6f5ab9aa33397ae1910f0797046a0 | Typed model for protocol lifecycle/activity/status/Beacon and evidence references. declarationPublishable checks non-empty fields only. | Data model/shape predicate | Non-empty refs are not cryptographic proof, freshness check or finality. |
| src/protocolDeclarationObservation.ts | e1d67fa177fcf302ff67645ab8f6fda95edd212d | Reads a canonical Prize UTxO via existing gameFlow, observes lifecycle, accepts lifeState, operationalStatus and optional Beacon as caller-supplied input, and creates cardano:tx/<hash>#<index> reference with local timestamp. | Observation adapter source | Does not itself verify block inclusion/finality or authenticate supplied life/operational/Beacon dimensions. Missing/ambiguous Prize fails closed. |
| src/publicProtocolSurface.ts | 7499c2bf3809b59541af63a445a62950005909d0 | Presentation-only formatter/mounter. Uses textContent, does not calculate health, infer Beacon or mutate state. | Presentation utility | Assumes incoming ProtocolDeclaration is already authoritative. |
| src/__tests__/protocolDeclaration.test.ts | 1beeaf64bf535d677d013fa7e6e564d1958c2b4d | Tests closed vocabulary, shape-level publication check and activity mapping. | Unit test source | Not source-authenticity, age/freshness, ledger/finality or runtime wiring evidence. |
| src/__tests__/publicProtocolSurface.test.ts | 2166dca47216df1d68d9974339495b6f1dab8a74 | Two tests check rendering supplied values and not inventing Beacon mode when absent. | Unit test source | Does not exercise DOM production wiring or a real observation. |

## Wiring result

At the reviewed green src/main.ts blob 819b199356c6d407af511ed1dbf7fa1ad5ceddc0, searched for mountProtocolDeclaration, observePreRichProtocolDeclaration, declarationPublishable, protocolDeclarationObservation, and publicProtocolSurface; all occurrence counts are zero. src/ui.ts blob de77a57b5e7609d31a6b3d0612277f43c12a4979 is a wallet balance helper and likewise has zero references.

Therefore the declaration model/observation adapter/public renderer exist as separate source/test artifacts, but they are not wired into the principal DApp entrypoint (src/main.ts) at this source revision. This does not make static live.html or web/status.html false: they are explicit static/observation surfaces with stated limits. It means a dynamic canonical Protocol Declaration is not yet demonstrated as a public user-path feature.

## Claim-to-evidence status

- Static public surfaces: mostly conservative and clearly distinguish theory, implementation, execution and open evidence. web/status.html is a dated snapshot and identifies the date/source.
- Runtime Wallet/Treasury observation: provider-derived, user-triggered and explicit when configuration is absent; no separate cryptographic proof packet for the displayed totals was traced here.
- Protocol Declaration path: types, observation helper, rendering helper and shape tests exist but current DApp entrypoint does not import/call them.
- Verification Lab: explanatory UI, not a crypto verifier.
- B3/GRANDPA: accurately shown as open/research; no status elevation.
- Test execution in this map: NOT_RUN. This review fetched source at immutable blob identities and counted call-site references in the current entrypoint; it did not run browser/Playwright, connect a wallet, call Blockfrost, check deployed website or query a current Cardano block.

## C7/C12 status and next closure criteria

**C7 Public observability: PARTIAL. C12 Public surface: PARTIAL.**

No static public claim in these inspected pages warranted an unapproved UI copy change: the pages explicitly mark open evidence, blank runtime data and dated publication source. The concrete gap is the unattached dynamic Protocol Declaration path plus the non-finalized nature of the display-only wallet/Treasury observation.

Closure requires (1) either deliberate integration or an explicit “not wired” classification for the declaration utility; (2) observation payloads that carry exact network/contract/state references and source block/slot with verifier freshness status; (3) independent inclusion/finality verification before an OBSERVED or VERIFIED badge makes a stronger claim; (4) negative tests for stale, missing, ambiguous and mismatched-source evidence; and (5) an exact-SHA published-site inspection. No protocol/security semantics should be changed to close a presentation gap.