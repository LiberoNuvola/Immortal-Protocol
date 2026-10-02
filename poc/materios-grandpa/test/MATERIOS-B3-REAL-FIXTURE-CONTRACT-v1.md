# Materios B3 — Real Fixture Contract v1

Status: OPEN — fixture schema only. A conforming file is not itself proof.

This contract defines the minimum evidence packet required before the IMMORTAL Materios/B3 path can claim a real execution/finality witness.

## 1. Fixture identity

Required:
- `fixtureVersion`
- `chainId`
- `runtime/specVersion`
- `nodeCommit`
- `capturedAt`
- `source` (real Materios node RPC endpoint, never a synthetic fixture)

## 2. Finalized checkpoint

Required:
- exact finalized block hash
- exact block number
- canonical raw header bytes
- header state root
- header extrinsics root
- GRANDPA justification bytes
- justification target hash/number
- GRANDPA set id
- authority set used for verification

The checkpoint hash and number MUST match the authority-transition activation block where the transition is being certified.

## 3. Authority-selection context

Required:
- genesis hash
- exact genesis UTxO bytes/context
- sidechain epoch
- Cardano epoch nonce
- exact serialized AuthoritySelectionInputs bytes
- Blake2b-256 commitment of those inputs
- authority-selection regime evidence
- predecessor authority set and set id
- resulting authority set and next set id
- activation block

The fixture MUST preserve the exact upstream semantic inputs. Local reconstruction of the selector is not acceptable evidence.

## 4. Execution-proof witness

Required from `materios_b3_calculateCommitteeProof`:
- exact block hash
- exact runtime method
- exact call data bytes or hash
- execution result bytes
- serialized execution/storage proof
- proof-system identifier/version
- proof hash/commitment

The execution proof is evidence-generation infrastructure. It does not by itself establish GRANDPA finality or canonical authority selection.

## 5. State authentication

When the selection result depends on storage:
- exact storage key(s)
- returned SCALE value(s)
- state root from the finalized header
- storage proof bytes
- independent verification result binding key/value to that state root

A value read from RPC without a proof MUST NOT be promoted to authenticated B3 state.

## 6. Verification outputs

The final evidence packet must record separately:
- execution-proof verification result;
- header/hash verification result;
- GRANDPA justification verification result;
- ancestry verification result;
- authority-transition proof verification result;
- state-root/storage-proof verification result.

No single boolean may collapse these distinct obligations.

## 7. Trust boundary

Production flow:

Materios canonical runtime
→ finalized block + GRANDPA evidence
→ execution proof
→ independent verification
→ VerifiedAuthoritySetTransition
→ PRE-RICH Beacon/registry

The IMMORTAL repository MUST NOT:
- reimplement Materios committee selection as a substitute for proof;
- accept a publisher signature as canonicality proof;
- treat synthetic fixtures as live evidence;
- silently downgrade an unverified B3 result to B2/B1 for the same round.

## 8. Closure rule

This contract becomes a real evidence witness only when:
1. the source is a real Materios node;
2. the block is finalized;
3. the GRANDPA justification is real;
4. the authority-set transition is real;
5. execution proof is produced by the node's native proof path;
6. storage/state-root binding is independently verified where required;
7. all exact hashes/versions/inputs are persisted;
8. the resulting statement crosses the repository's `VerifiedAuthoritySetTransition` boundary.

Until then status remains OPEN.
