# Materios B3-B live storage evidence — certification-indexed capture

Status: **PASS — live Preprod storage proof verified; certificate indexer corroboration captured.** This is not a GRANDPA proof or an independent cryptographic verification of signer signatures/quorum.

## Exact-head evidence

- IMMORTAL branch: work/immortal-green-closure
- Source commit: c0b42f005ae13ab1a756c7abdc04cb6d2ccd6cb5
- Workflow: [Materios B3 execution-proof verifier #41006875990](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41006875990)
- B3-B artifact: [materios-b3b-live-storage-proof, artifact 12956085640](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/41006875990/artifacts/12956085640)

The exact-head workflow jobs completed:
- checkpoint-typescript: **SUCCESS** — checkpoint/B3-C typecheck, execution packet tests, and B3 RPC tests.
- verifier: **SUCCESS** — cargo fmt --all -- --check; 10 Rust library tests and 3 execution-proof CLI tests passed.
- live-storage-proof: **SUCCESS** — certification-indexed capture, native Rust storage proof verification, and artifact upload.
- finalized-state-capture: **SUCCESS** — capture only; its payload does not include a usable GRANDPA witness.
- real-grandpa-witness: **FAILURE** — public RPC endpoints do not expose the required justifications/proof methods.
- live-execution-proof: **SKIPPED** — manual dispatch input was false. No B3-C live execution proof was attempted.

The overall workflow is **FAILURE** solely because the independent GRANDPA witness job failed; do not mark the full B3 workflow green.

## Capture contract now enforced

The previous auto-discovery path selected a ReceiptRecord using a non-zero availability certificate hash and used the current finalized observation block as a stand-in certification block, setting signer count to zero. That path has been replaced.

The capture now:

1. Discovers a recent on-chain receipt whose record has a non-zero availability certificate hash, or accepts explicit receipt/block/hash inputs.
2. Fetches /receipt-attestors?receiptId=... from the configured Materios events indexer.
3. Requires certified=true, exact receipt_id, a valid certified_at_block, certified_at_hash, cert_hash, positive signer_count, and a signer list with valid SS58 addresses and decimal reward fields.
4. Rejects duplicate signer identities and rejects any mismatch between signer_count and the signer-list length.
5. Calls chain_getBlockHash(certified_at_block) and requires it to match the indexer's certified_at_hash; then checks that the block header reports the same height.
6. Requires the node-reported finalized head to cover the certification block.
7. Reads the ReceiptRecord at the exact certification block and checks that its availability_cert_hash equals the indexer's cert_hash.
8. Acquires the storage read proof at that exact block and verifies the key/value against the header's state root with the existing native Rust Substrate trie verifier.

The receipt-attestors response contract is implemented by the Flux Point gateway's trace route; see [materios-gateway src/routes/trace.ts](https://github.com/Flux-Point-Studios/materios-gateway/blob/main/src/routes/trace.ts). The route decodes certified_at_block, certified_at_hash, cert_hash, signer_count, and the signer list. The live response used by this exact run returned three distinct attester identities.

## Artifact facts

- Receipt ID: 0x279c26e797ac8aab732344a7702ba5e985e420c0677232a833bff60c2d1791b7
- Certification block: 2507143
- Certification block hash: 0xb61e01165006e4b5ab56fb90a0fbc726fcf62d65179121eed1788899d0763f6c
- Certificate hash: 0x289e0df9266767040b43682f6a9e122f79034cbefe7e449db5ac8b4aef59164d
- Header state root: 0x15d3bd860ec9f9b6ce04da19f13eefecd7c00e687e9e3241eb912b37656fa1e7
- Node-reported latest finalized observation: block 2507237, hash 0xaf7da3415e63e0e03d6655de11ac21f8ece8d7d445d1389f3806db324834e971
- Indexer-reported signer count: **3**, matching three distinct SS58 identities in the response.
- Storage proof: 10 trie proof nodes; native verifier emitted B3_B_STORAGE_PROOF_VALID=true, B3_B_STORAGE_KEY_EXISTS=true, B3_B_STORAGE_VALUE_MATCH=true, B3_B_STATE_ROOT_BOUND=true, and B3_B_RESULT=PASS.

The evidence packet also records:
- certified_at_hash_matches_chain_hash_at_height=true;
- certified_at_hash_header_number_matches_indexer_block=true;
- indexer_cert_hash_matches_authenticated_receipt_storage=true;
- indexer_signer_count_matches_signer_list=true.

## Trust boundary and remaining work

This is stronger than checking for a non-zero storage field: the event indexer, block-height/hash mapping, exact-block storage record, and native storage proof are now bound together in the capture packet.

It is still not a trustless certificate/quorum proof:

- the signer identities and count are supplied by the events indexer; the capture checks their shape, uniqueness, and count consistency but does not independently verify their signatures;
- the capture does not independently derive or verify the runtime's active quorum threshold;
- the node's finalized-head observation and chain_getBlockHash result are RPC observations, not an independently verified GRANDPA justification;
- full B3-A finality and B3 checkpoint composition remain open.

Therefore classify this as **INDEXER-CORROBORATED CERTIFICATE + NATIVE STORAGE PROOF VERIFIED**, not as **SIGNATURE QUORUM CRYPTOGRAPHICALLY VERIFIED** or **GRANDPA FINALITY VERIFIED**.

## Next closure predicates

1. Verify the indexer signer evidence independently against the corresponding on-chain attestation records/signatures and the exact committee at that block.
2. Derive the active quorum rule from the deployed runtime/configuration and verify the returned signer set satisfies it.
3. Obtain a real GRANDPA justification and verify it independently against the trusted authority-set history.
4. Keep B3-C execution proof as a separate gate until the Materios node deploys the native execution-proof RPC described in MATERIOS-B3-EXECUTION-PROOF-RPC.md.
