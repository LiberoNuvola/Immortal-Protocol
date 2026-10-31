#!/usr/bin/env bash
# Read-only probe of the official Materios snapshot's retained state window.
# This is not an archive node. RPC-returned authority data remains untrusted.
set -Eeuo pipefail
OUT="$GITHUB_WORKSPACE/poc/materios-grandpa/out/MateriosSnapshotStateProbe.json"
TMP="$RUNNER_TEMP/materios-archive-snapshot-probe"
mkdir -p "$(dirname "$OUT")" "$TMP"
LOG="$TMP/node.log"
STATUS=FAIL
CLASSIFICATION=PROBE_NOT_COMPLETED
DETAIL=""
RPC_URL=""
NODE_PID=""
SNAPSHOT_URL=""
SNAPSHOT_SHA=""
SNAPSHOT_HEAD=""
SNAPSHOT_SIZE=""
NODE_VERSION=""
AUTHORITY_HEX=""
SET_ID_HEX=""
TARGET_HEADER_JSON=""
TARGET_RUNTIME_VERSION=""
DIGEST_WINDOW_JSON="[]"
DIGEST_SCAN_START=""
GRANDPA_STORAGE_JSON="{}"
HISTORICAL_HEADER_PROBES_JSON="[]"
GRANDPA_VOTER_LOGS_JSON="[]"
GRANDPA_VOTER_SET_IDS_JSON="[]"
TARGET_NUMBER=""
TARGET_HASH=""
DB_DIR=""
NODE_BASE_PATH=""
GENESIS_HASH=0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf

finish() {
  local rc=$?
  trap - EXIT
  GRANDPA_VOTER_LOGS_JSON="$(grep -Ei 'Starting new voter with set ID|GRANDPA voter|authority_set_id' "$LOG" 2>/dev/null | tail -n 100 | jq -Rsc 'split("\\n") | map(select(length > 0))' || printf '[]')"
  GRANDPA_VOTER_SET_IDS_JSON="$(grep -Eo 'Starting new voter with set ID [0-9]+' "$LOG" 2>/dev/null | sed -E 's/.* ([0-9]+)$/\\1/' | jq -Rsc 'split("\\n") | map(select(length > 0))' || printf '[]')"
  if [[ "$STATUS" != PASS && -n "$NODE_PID" ]]; then
    kill "$NODE_PID" 2>/dev/null || true
    wait "$NODE_PID" 2>/dev/null || true
  fi
  jq -n \
    --arg status "$STATUS" --arg classification "$CLASSIFICATION" --arg detail "$DETAIL" \
    --arg snapshot_url "$SNAPSHOT_URL" --arg snapshot_sha256 "$SNAPSHOT_SHA" \
    --arg snapshot_head "$SNAPSHOT_HEAD" --arg snapshot_size "$SNAPSHOT_SIZE" \
    --arg node_version "$NODE_VERSION" --arg target_number "$TARGET_NUMBER" --arg target_hash "$TARGET_HASH" \
    --arg db_dir "$DB_DIR" --arg node_base_path "$NODE_BASE_PATH" \
    --arg authorities "$AUTHORITY_HEX" --arg set_id "$SET_ID_HEX" \
    --arg target_header "$TARGET_HEADER_JSON" --arg runtime_version "$TARGET_RUNTIME_VERSION" \
    --arg digest_window "$DIGEST_WINDOW_JSON" --arg digest_scan_start "$DIGEST_SCAN_START" \
    --arg grandpa_storage "$GRANDPA_STORAGE_JSON" \
    --arg historical_header_probes "$HISTORICAL_HEADER_PROBES_JSON" \
    --arg grandpa_voter_logs "$GRANDPA_VOTER_LOGS_JSON" \
    --arg grandpa_voter_set_ids "$GRANDPA_VOTER_SET_IDS_JSON" \
    --arg rpc_url "$RPC_URL" --arg log "$(tail -n 35 "$LOG" 2>/dev/null || true)" \
    '{
      schema_version:"materios-snapshot-state-probe-v1",
      status:$status, classification:$classification, detail:$detail,
      network:"materios_preprod_v6", genesis_hash:"0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf",
      snapshot:{url:$snapshot_url,sha256:$snapshot_sha256,
        head_block_at_publish:($snapshot_head|if .=="" then null else tonumber end),
        size_bytes:($snapshot_size|if .=="" then null else tonumber end),
        rocksdb_directory:(if $db_dir=="" then null else $db_dir end),
        node_base_path:(if $node_base_path=="" then null else $node_base_path end),
        requested_pruning_mode:"Constrained(256)"},
      target:{block_number:($target_number|if .=="" then null else tonumber end),expected_block_hash:$target_hash},
      node_version:$node_version,
      historical_state_query:{authorities_hex:(if $authorities=="" then null else $authorities end),
        set_id_hex:(if $set_id=="" then null else $set_id end)},
      target_header:(if $target_header=="" then null else ($target_header|fromjson) end),
      target_runtime_version:(if $runtime_version=="" then null else ($runtime_version|fromjson) end),
      grandpa_digest_window:{
        start_block:($digest_scan_start|if .=="" then null else tonumber end),
        end_block:($target_number|if .=="" then null else tonumber end),
        blocks_with_frnk_consensus_logs:($digest_window|fromjson)
      },
      grandpa_storage_diagnostic:($grandpa_storage|fromjson),
      historical_header_retention_probes:($historical_header_probes|fromjson),
      grandpa_voter_start_logs:($grandpa_voter_logs|fromjson),
      grandpa_voter_start_set_ids:($grandpa_voter_set_ids|fromjson),
      local_rpc_url:(if $rpc_url=="" then null else $rpc_url end),
      node_log_tail:$log,
      trust_boundary:"Isolated FULL-role diagnostic only: snapshot DB is Constrained(256); USE_MAIN_CHAIN_FOLLOWER_MOCK is used solely to start local RPC; no validator role, no peers, no block import. This proves availability only inside the retained window, not archive history. RPC authority state remains untrusted until independently authenticated."
    }' > "$OUT"
  if [[ -n "$GITHUB_OUTPUT" ]]; then
    printf 'rpc_url=%s\nprobe_status=%s\n' "$RPC_URL" "$STATUS" >> "$GITHUB_OUTPUT"
  fi
  exit "$rc"
}
trap finish EXIT

fail() { CLASSIFICATION="$1"; DETAIL="$2"; STATUS=FAIL; echo "::warning::$CLASSIFICATION — $DETAIL"; exit 1; }

WS_EVIDENCE="$GITHUB_WORKSPACE/poc/materios-checkpoint/out/MateriosWebSocketRpcProbe.json"
[[ -f "$WS_EVIDENCE" ]] || fail WEBSOCKET_WITNESS_EVIDENCE_MISSING "WebSocket probe artifact is absent"
jq -e '.identity.genesis_hash_match == true and .claims.raw_grandpa_justification_captured == true and .historical_candidate_probe.status == "FRNK_JUSTIFICATION_CAPTURED_UNVERIFIED"' "$WS_EVIDENCE" >/dev/null \
  || fail WEBSOCKET_FRNK_CANDIDATE_UNAVAILABLE "No genesis-matched raw FRNK candidate is available"
TARGET_NUMBER="$(jq -r '.historical_candidate_probe.requested_block_number | tostring' "$WS_EVIDENCE")"
TARGET_HASH="$(jq -r '.historical_candidate_probe.requested_block_hash // empty' "$WS_EVIDENCE" | tr '[:upper:]' '[:lower:]')"
[[ "$TARGET_NUMBER" =~ ^[0-9]+$ ]] || fail WEBSOCKET_TARGET_NUMBER_INVALID "candidate block number is invalid"
[[ "$TARGET_HASH" =~ ^0x[0-9a-f]{64}$ ]] || fail WEBSOCKET_TARGET_HASH_INVALID "candidate block hash is invalid"

rpc_raw() {
  curl --fail --silent --show-error --max-time 15 -H 'content-type: application/json' \
    --data "$(jq -cn --arg m "$1" --argjson p "$2" '{jsonrpc:"2.0",id:1,method:$m,params:$p}')" \
    http://127.0.0.1:9945
}
rpc_result() { local r; r="$(rpc_raw "$1" "$2")" || return 1; jq -er '.result' <<<"$r"; }
rpc_nullable() { local r; r="$(rpc_raw "$1" "$2")" || return 1; jq -c '.result' <<<"$r"; }

echo "Fetch snapshot manifest"
curl -fsSL --retry 3 https://materios.fluxpointstudios.com/operator-snapshots/preprod/latest.json -o "$TMP/latest.json" \
  || fail SNAPSHOT_MANIFEST_UNAVAILABLE "latest.json unavailable"
jq -e '.chain=="materios_preprod_v6" and (.url|type=="string") and (.sha256|type=="string") and (.size_bytes|type=="number") and (.head_block_at_publish|type=="number")' "$TMP/latest.json" >/dev/null \
  || fail SNAPSHOT_MANIFEST_INVALID "manifest schema or chain id invalid"
SNAPSHOT_URL="$(jq -r .url "$TMP/latest.json")"
SNAPSHOT_SHA="$(jq -r .sha256 "$TMP/latest.json")"
SNAPSHOT_HEAD="$(jq -r .head_block_at_publish "$TMP/latest.json")"
SNAPSHOT_SIZE="$(jq -r .size_bytes "$TMP/latest.json")"
[[ "$SNAPSHOT_SHA" =~ ^[0-9a-fA-F]{64}$ ]] || fail SNAPSHOT_CHECKSUM_INVALID "bad sha256"
(( SNAPSHOT_SIZE > 0 && SNAPSHOT_SIZE <= 10000000000 )) || fail SNAPSHOT_SIZE_OUT_OF_POLICY "snapshot exceeds 10 GB"
(( SNAPSHOT_HEAD >= TARGET_NUMBER )) || fail TARGET_AFTER_SNAPSHOT_HEAD "candidate block is newer than the snapshot"
(( SNAPSHOT_HEAD - TARGET_NUMBER <= 256 )) || fail TARGET_OUTSIDE_RETAINED_WINDOW "candidate is more than 256 blocks behind snapshot head"

echo "Fetch official checksums and verify node + chain spec"
curl -fsSL --retry 3 https://materios.fluxpointstudios.com/releases/SHA256SUMS -o "$TMP/SHA256SUMS" \
  || fail RELEASE_CHECKSUM_MANIFEST_UNAVAILABLE "SHA256SUMS unavailable"
verify_asset() {
  local name="$1" url="$2"
  curl -fLsS --retry 3 "$url" -o "$TMP/$name" || return 1
  awk -v n="$name" 'NF>=2 {f=$2; sub(/^\*/,"",f); sub(/^\.\//,"",f); if(f==n) print}' \
    "$TMP/SHA256SUMS" > "$TMP/$name.sha"
  [[ -s "$TMP/$name.sha" ]] && (cd "$TMP" && sha256sum -c "$name.sha")
}
verify_asset materios-node-v6-x86_64-linux https://materios.fluxpointstudios.com/releases/materios-node-v6-x86_64-linux \
  || fail NODE_BINARY_CHECKSUM_FAILED "node binary missing or checksum mismatch"
verify_asset chain-spec-v6-raw.json https://materios.fluxpointstudios.com/releases/chain-spec-v6-raw.json \
  || fail CHAIN_SPEC_CHECKSUM_FAILED "chain spec missing or checksum mismatch"
NODE="$TMP/materios-node-v6-x86_64-linux"
chmod +x "$NODE"
NODE_VERSION="$("$NODE" --version 2>&1 | head -n 1)"
"$NODE" --help 2>&1 | grep -q -- --state-pruning || fail ARCHIVE_FLAG_UNAVAILABLE "released binary lacks --state-pruning"

echo "Download and verify snapshot ($SNAPSHOT_SIZE bytes, head $SNAPSHOT_HEAD)"
curl -fLsS --retry 3 --retry-delay 5 "$SNAPSHOT_URL" -o "$TMP/snapshot.tar.gz" \
  || fail SNAPSHOT_DOWNLOAD_FAILED "snapshot download failed"
printf '%s  %s\n' "$SNAPSHOT_SHA" "$TMP/snapshot.tar.gz" | sha256sum -c - \
  || fail SNAPSHOT_CHECKSUM_FAILED "snapshot checksum mismatch"
tar -xzf "$TMP/snapshot.tar.gz" -C "$TMP" || fail SNAPSHOT_EXTRACTION_FAILED "tar extraction failed"
rm -f "$TMP/snapshot.tar.gz"

echo "Locate RocksDB database and derive the node base path"
DB_DIR="$(find "$TMP" -type d -path '*/chains/materios_preprod_v6/db' -print -quit)"
if [[ -z "$DB_DIR" ]]; then
  CURRENT_FILE="$(find "$TMP" -type f -name CURRENT -print -quit)"
  [[ -n "$CURRENT_FILE" ]] || fail SNAPSHOT_LAYOUT_INVALID "No RocksDB CURRENT marker found in snapshot"
  CURRENT_DIR="$(dirname "$CURRENT_FILE")"
  case "$CURRENT_DIR" in
    */db/full) DB_DIR="$(dirname "$CURRENT_DIR")" ;;
    */db) DB_DIR="$CURRENT_DIR" ;;
    *) fail SNAPSHOT_LAYOUT_UNRECOGNIZED "CURRENT marker is not under a Materios RocksDB db directory" ;;
  esac
fi
if [[ "$DB_DIR" == */chains/materios_preprod_v6/db ]]; then
  NODE_BASE_PATH="$(sed 's#/chains/materios_preprod_v6/db$##' <<<"$DB_DIR")"
else
  NODE_BASE_PATH="$TMP/data"
  mkdir -p "$NODE_BASE_PATH/chains/materios_preprod_v6"
  mv "$DB_DIR" "$NODE_BASE_PATH/chains/materios_preprod_v6/db" \
    || fail SNAPSHOT_DB_RELOCATION_FAILED "Could not place RocksDB under the expected Materios base path"
  DB_DIR="$NODE_BASE_PATH/chains/materios_preprod_v6/db"
fi
[[ -d "$DB_DIR" ]] || fail SNAPSHOT_LAYOUT_INVALID "RocksDB directory absent after normalization"
[[ -f "$DB_DIR/CURRENT" || -f "$DB_DIR/full/CURRENT" ]] || fail SNAPSHOT_LAYOUT_INVALID "RocksDB CURRENT marker absent after normalization"

echo "Start isolated FULL node: no validator role, no peers, no block import"
printf '[]\n' > "$TMP/registrations.json"
nohup env \
  USE_MAIN_CHAIN_FOLLOWER_MOCK=true \
  MAIN_CHAIN_FOLLOWER_MOCK_REGISTRATIONS_FILE="$TMP/registrations.json" \
  MC__FIRST_EPOCH_TIMESTAMP_MILLIS=1654041600000 \
  MC__EPOCH_DURATION_MILLIS=432000000 \
  MC__FIRST_EPOCH_NUMBER=0 \
  MC__FIRST_SLOT_NUMBER=0 \
  MC__SLOT_DURATION_MILLIS=1000 \
  CARDANO_SECURITY_PARAMETER=2160 \
  CARDANO_ACTIVE_SLOTS_COEFF=0.05 \
  BLOCK_STABILITY_MARGIN=0 \
  "$NODE" --chain "$TMP/chain-spec-v6-raw.json" --base-path "$NODE_BASE_PATH" \
  --name immortal-b3-snapshot-probe --rpc-port 9945 --rpc-methods unsafe \
  --state-pruning 256 --reserved-only --in-peers 0 --out-peers 0 --in-peers-light 0 \
  --listen-addr /ip4/127.0.0.1/tcp/0 --no-mdns --no-telemetry --no-prometheus -linfo,grandpa=debug \
  >"$LOG" 2>&1 </dev/null &
NODE_PID=$!
echo "Waiting for local RPC (maximum five minutes)"
READY=false
READY_DEADLINE=$((SECONDS+300))
while (( SECONDS < READY_DEADLINE )); do
  NODE_STATE="$(ps -p "$NODE_PID" -o stat= 2>/dev/null | tr -d ' ' || true)"
  [[ -z "$NODE_STATE" || "$NODE_STATE" == Z* ]] && break
  if curl --fail --silent --show-error --max-time 2 -H 'content-type: application/json' \
    --data '{"jsonrpc":"2.0","id":1,"method":"system_health","params":[]}' \
    http://127.0.0.1:9945 >/dev/null 2>&1; then
    READY=true
    break
  fi
  sleep 2
done
[[ "$READY" == true ]] || {
  if grep -Eqi 'prun|database.*(mode|config)|config.*database' "$LOG"; then
    fail SNAPSHOT_PRUNING_MODE_MISMATCH "snapshot DB pruning mode did not match --state-pruning 256"
  fi
  fail SNAPSHOT_NODE_START_FAILED "local RPC did not become ready within five minutes"
}
LOCAL_GENESIS="$(rpc_result chain_getBlockHash '[0]')" || fail LOCAL_GENESIS_QUERY_FAILED "genesis RPC failed"
LOCAL_GENESIS="$(tr '[:upper:]' '[:lower:]' <<<"$LOCAL_GENESIS")"
[[ "$LOCAL_GENESIS" == "$GENESIS_HASH" ]] || fail LOCAL_GENESIS_MISMATCH "restored chain genesis differs"

echo "Check the snapshot's already-finalized historical block; no P2P sync is permitted"
HEALTH_JSON="$(rpc_raw system_health '[]')" || fail ARCHIVE_NODE_HEALTH_FAILED "system_health failed"
PEERS="$(jq -r '.result.peers // -1' <<<"$HEALTH_JSON")"
[[ "$PEERS" == "0" ]] || fail ARCHIVE_PROBE_NOT_ISOLATED "isolated probe unexpectedly has peers"
LOCAL_TARGET="$(rpc_result chain_getBlockHash "[$TARGET_NUMBER]")" \
  || fail SNAPSHOT_TARGET_BLOCK_UNAVAILABLE "snapshot does not contain the candidate block"
LOCAL_TARGET="$(tr '[:upper:]' '[:lower:]' <<<"$LOCAL_TARGET")"
[[ "$LOCAL_TARGET" == "$TARGET_HASH" ]] || fail TARGET_BLOCK_HASH_MISMATCH "local snapshot hash differs from WebSocket candidate"
FINALIZED_HASH="$(rpc_result chain_getFinalizedHead '[]')" \
  || fail SNAPSHOT_FINALIZED_HEAD_UNAVAILABLE "snapshot finalized head is unavailable"
FINALIZED_HEADER="$(rpc_result chain_getHeader "[\"$FINALIZED_HASH\"]")" \
  || fail SNAPSHOT_FINALIZED_HEADER_UNAVAILABLE "snapshot finalized header is unavailable"
FINALIZED_NUMBER="$(jq -r '.number // empty' <<<"$FINALIZED_HEADER")"
[[ "$FINALIZED_NUMBER" =~ ^0x[0-9a-fA-F]+$ ]] || fail SNAPSHOT_FINALIZED_HEIGHT_INVALID "snapshot finalized height is malformed"
FINALIZED_DECIMAL=$((16#$(sed 's/^0x//' <<<"$FINALIZED_NUMBER")))
(( FINALIZED_DECIMAL >= TARGET_NUMBER )) || fail SNAPSHOT_FINALIZED_HEAD_BEHIND_TARGET "snapshot is not finalized through candidate block"

echo "Capture target header digest and runtime version"
TARGET_PARAMS="$(jq -cn --arg hash "$TARGET_HASH" '[$hash]')"
TARGET_HEADER_JSON="$(rpc_result chain_getHeader "$TARGET_PARAMS")" \
  || fail TARGET_HEADER_QUERY_FAILED "target header query failed"
TARGET_RUNTIME_VERSION="$(rpc_result state_getRuntimeVersion "$TARGET_PARAMS")" \
  || fail TARGET_RUNTIME_VERSION_QUERY_FAILED "target runtime version query failed"
DIGEST_SCAN_START=$(( TARGET_NUMBER > 255 ? TARGET_NUMBER - 255 : 0 ))
echo "Scan retained headers for FRNK consensus digest logs: $DIGEST_SCAN_START..$TARGET_NUMBER"
for ((block_number=DIGEST_SCAN_START; block_number<=TARGET_NUMBER; block_number++)); do
  block_hash="$(rpc_result chain_getBlockHash "[$block_number]")" || continue
  header_params="$(jq -cn --arg hash "$block_hash" '[$hash]')"
  block_header="$(rpc_result chain_getHeader "$header_params")" || continue
  frnk_logs="$(jq -c '[.digest.logs[]? | select((ascii_downcase | contains("46524e4b")))]' <<<"$block_header")"
  if [[ "$frnk_logs" != "[]" ]]; then
    DIGEST_WINDOW_JSON="$(jq -cn --argjson acc "$DIGEST_WINDOW_JSON" --argjson n "$block_number" --arg hash "$block_hash" --argjson logs "$frnk_logs" '$acc + [{block_number:$n,block_hash:$hash,logs:$logs}]')"
  fi
done

echo "Probe historical block/header retention beyond the 256-block state window"
for delta in 1000 10000 100000 500000 1000000; do
  probe_number=$(( TARGET_NUMBER - delta ))
  (( probe_number >= 0 )) || continue
  probe_hash_json="$(rpc_nullable chain_getBlockHash "[$probe_number]")" || probe_hash_json="null"
  probe_hash="$(jq -r 'if type=="string" then . else empty end' <<<"$probe_hash_json")"
  if [[ ! "$probe_hash" =~ ^0x[0-9a-fA-F]{64}$ ]]; then
    HISTORICAL_HEADER_PROBES_JSON="$(jq -cn --argjson acc "$HISTORICAL_HEADER_PROBES_JSON" --argjson n "$probe_number" '$acc + [{block_number:$n,status:"BLOCK_HASH_UNAVAILABLE"}]')"
    continue
  fi
  probe_header_params="$(jq -cn --arg hash "$probe_hash" '[$hash]')"
  probe_header_json="$(rpc_nullable chain_getHeader "$probe_header_params")" || probe_header_json="null"
  if [[ "$probe_header_json" == "null" ]]; then
    HISTORICAL_HEADER_PROBES_JSON="$(jq -cn --argjson acc "$HISTORICAL_HEADER_PROBES_JSON" --argjson n "$probe_number" --arg hash "$probe_hash" '$acc + [{block_number:$n,block_hash:$hash,status:"HEADER_UNAVAILABLE"}]')"
    continue
  fi
  probe_digest_logs="$(jq -c '.digest.logs // []' <<<"$probe_header_json")"
  probe_frnk_logs="$(jq -c '[.digest.logs[]? | select((ascii_downcase | contains("46524e4b")))]' <<<"$probe_header_json")"
  HISTORICAL_HEADER_PROBES_JSON="$(jq -cn --argjson acc "$HISTORICAL_HEADER_PROBES_JSON" --argjson n "$probe_number" --arg hash "$probe_hash" --argjson digest "$probe_digest_logs" --argjson frnk "$probe_frnk_logs" '$acc + [{block_number:$n,block_hash:$hash,status:"HEADER_AVAILABLE",digest_logs:$digest,frnk_consensus_logs:$frnk}]')"
done

echo "Query GRANDPA authorities and set id at exact target hash"
AUTHORITY_HEX="$(rpc_result state_call "[\"GrandpaApi_grandpa_authorities\",\"0x\",\"$TARGET_HASH\"]")" \
  || fail HISTORICAL_AUTHORITIES_QUERY_FAILED "historical authority state_call failed"
SET_ID_HEX="$(rpc_result state_call "[\"GrandpaApi_current_set_id\",\"0x\",\"$TARGET_HASH\"]")" \
  || fail HISTORICAL_SET_ID_QUERY_FAILED "historical set-id state_call failed"
[[ "$AUTHORITY_HEX" =~ ^0x([0-9a-fA-F]{2})+$ ]] || fail HISTORICAL_AUTHORITIES_ENCODING_INVALID "authority result is not non-empty SCALE hex"
[[ "$SET_ID_HEX" =~ ^0x[0-9a-fA-F]{16}$ ]] || fail HISTORICAL_SET_ID_ENCODING_INVALID "set-id result is not u64 SCALE hex"

echo "Cross-check GRANDPA runtime APIs against raw storage at the exact target state"
GRANDPA_CURRENT_SET_ID_KEY=0x5f9cc45b7a00c5899361e1c6099678dc8a2d09463effcc78a22d75b9cb87dffc
GRANDPA_AUTHORITIES_KEY=0x5f9cc45b7a00c5899361e1c6099678dc5e0621c4869aa60c02be9adcc98a0d1d
GRANDPA_PENDING_CHANGE_KEY=0x5f9cc45b7a00c5899361e1c6099678dc2ff65991b1c915dd6cc8d4825eacfcb4
GRANDPA_STALLED_KEY=0x5f9cc45b7a00c5899361e1c6099678dc7ddd013461b72c3004f9c0ca3faf9ebe
SESSION_CURRENT_INDEX_KEY=0x0cfd083eaa944b95833ee029c0bdffe372763800a36a99fdfc7c10f6415f6ee6
STORAGE_PARAMS="$(jq -cn --arg key "$GRANDPA_CURRENT_SET_ID_KEY" --arg hash "$TARGET_HASH" '[$key,$hash]')"
CURRENT_SET_STORAGE="$(rpc_nullable state_getStorage "$STORAGE_PARAMS")" \
  || fail GRANDPA_CURRENT_SET_STORAGE_QUERY_FAILED "CurrentSetId raw storage query failed"
STORAGE_PARAMS="$(jq -cn --arg key "$GRANDPA_AUTHORITIES_KEY" --arg hash "$TARGET_HASH" '[$key,$hash]')"
AUTHORITIES_STORAGE="$(rpc_nullable state_getStorage "$STORAGE_PARAMS")" \
  || fail GRANDPA_AUTHORITIES_STORAGE_QUERY_FAILED "Grandpa Authorities raw storage query failed"
STORAGE_PARAMS="$(jq -cn --arg key "$GRANDPA_PENDING_CHANGE_KEY" --arg hash "$TARGET_HASH" '[$key,$hash]')"
PENDING_CHANGE_STORAGE="$(rpc_nullable state_getStorage "$STORAGE_PARAMS")" \
  || fail GRANDPA_PENDING_CHANGE_QUERY_FAILED "PendingChange raw storage query failed"
STORAGE_PARAMS="$(jq -cn --arg key "$GRANDPA_STALLED_KEY" --arg hash "$TARGET_HASH" '[$key,$hash]')"
STALLED_STORAGE="$(rpc_nullable state_getStorage "$STORAGE_PARAMS")" \
  || fail GRANDPA_STALLED_QUERY_FAILED "Stalled raw storage query failed"
STORAGE_PARAMS="$(jq -cn --arg key "$SESSION_CURRENT_INDEX_KEY" --arg hash "$TARGET_HASH" '[$key,$hash]')"
SESSION_INDEX_STORAGE="$(rpc_nullable state_getStorage "$STORAGE_PARAMS")" \
  || fail SESSION_CURRENT_INDEX_QUERY_FAILED "Session CurrentIndex raw storage query failed"
GRANDPA_STORAGE_JSON="$(jq -cn \
  --arg current_set_id_runtime_api "$SET_ID_HEX" \
  --arg current_set_id_storage "$CURRENT_SET_STORAGE" \
  --arg authorities_runtime_api "$AUTHORITY_HEX" \
  --arg authorities_storage "$AUTHORITIES_STORAGE" \
  --arg pending_change_storage "$PENDING_CHANGE_STORAGE" \
  --arg stalled_storage "$STALLED_STORAGE" \
  --arg session_current_index_storage "$SESSION_INDEX_STORAGE" \
  '{
    current_set_id_runtime_api:$current_set_id_runtime_api,
    current_set_id_raw_storage:($current_set_id_storage|fromjson),
    current_set_id_api_matches_storage:($current_set_id_runtime_api==($current_set_id_storage|fromjson)),
    authorities_runtime_api:$authorities_runtime_api,
    authorities_raw_storage:($authorities_storage|fromjson),
    authorities_api_matches_storage:($authorities_runtime_api==($authorities_storage|fromjson)),
    pending_change_raw_storage:($pending_change_storage|fromjson),
    stalled_raw_storage:($stalled_storage|fromjson),
    session_current_index_raw_storage:($session_current_index_storage|fromjson),
    storage_key_derivation:"Twox128(pallet name) ++ Twox128(storage item name); all reads at exact target block hash"
  }')"

STATUS=PASS
CLASSIFICATION=SNAPSHOT_WINDOW_HISTORICAL_STATE_QUERY_PASS
DETAIL="Verified snapshot checksum; normalized RocksDB path; node started with the stored Constrained(256) pruning mode; WebSocket FRNK candidate matched a finalized block inside the retained snapshot window; both historical GRANDPA state calls succeeded."
RPC_URL=http://127.0.0.1:9945
echo "PASS: local archive authority RPC available at $RPC_URL"
