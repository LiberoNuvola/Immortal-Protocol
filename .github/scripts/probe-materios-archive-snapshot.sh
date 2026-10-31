#!/usr/bin/env bash
# Read-only probe of the official Materios snapshot with archive state pruning.
# RPC-returned authority data remains untrusted; this tests availability only.
set -Eeuo pipefail
OUT="$GITHUB_WORKSPACE/poc/materios-grandpa/out/MateriosArchiveSnapshotProbe.json"
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
TARGET_NUMBER=2519552
TARGET_HASH=0x03174fceb7078f5fbed5de437c03f457e8460645725da883baa712ed55747db7
GENESIS_HASH=0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf

finish() {
  local rc=$?
  trap - EXIT
  if [[ "$STATUS" != PASS && -n "$NODE_PID" ]]; then
    kill "$NODE_PID" 2>/dev/null || true
    wait "$NODE_PID" 2>/dev/null || true
  fi
  jq -n \
    --arg status "$STATUS" --arg classification "$CLASSIFICATION" --arg detail "$DETAIL" \
    --arg snapshot_url "$SNAPSHOT_URL" --arg snapshot_sha256 "$SNAPSHOT_SHA" \
    --arg snapshot_head "$SNAPSHOT_HEAD" --arg snapshot_size "$SNAPSHOT_SIZE" \
    --arg node_version "$NODE_VERSION" --arg target_hash "$TARGET_HASH" \
    --arg authorities "$AUTHORITY_HEX" --arg set_id "$SET_ID_HEX" \
    --arg rpc_url "$RPC_URL" --arg log "$(tail -n 35 "$LOG" 2>/dev/null || true)" \
    '{
      schema_version:"materios-archive-snapshot-probe-v1",
      status:$status, classification:$classification, detail:$detail,
      network:"materios_preprod_v6", genesis_hash:"0x0e46e33f639a56cc8780fd871d9a15e16d99af248526f907cb560cb40849f7bf",
      snapshot:{url:$snapshot_url,sha256:$snapshot_sha256,
        head_block_at_publish:($snapshot_head|if .=="" then null else tonumber end),
        size_bytes:($snapshot_size|if .=="" then null else tonumber end)},
      target:{block_number:2519552,expected_block_hash:$target_hash},
      node_version:$node_version,
      historical_state_query:{authorities_hex:(if $authorities=="" then null else $authorities end),
        set_id_hex:(if $set_id=="" then null else $set_id end)},
      local_rpc_url:(if $rpc_url=="" then null else $rpc_url end),
      node_log_tail:$log,
      trust_boundary:"Availability probe only; RPC authority state is not independently authenticated."
    }' > "$OUT"
  if [[ -n "$GITHUB_OUTPUT" ]]; then
    printf 'rpc_url=%s\nprobe_status=%s\n' "$RPC_URL" "$STATUS" >> "$GITHUB_OUTPUT"
  fi
  exit "$rc"
}
trap finish EXIT

fail() { CLASSIFICATION="$1"; DETAIL="$2"; STATUS=FAIL; echo "::warning::$CLASSIFICATION — $DETAIL"; exit 1; }
rpc_raw() {
  curl --fail --silent --show-error --max-time 15 -H 'content-type: application/json' \
    --data "$(jq -cn --arg m "$1" --argjson p "$2" '{jsonrpc:"2.0",id:1,method:$m,params:$p}')" \
    http://127.0.0.1:9945
}
rpc_result() { local r; r="$(rpc_raw "$1" "$2")" || return 1; jq -er '.result' <<<"$r"; }

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
[[ -d "$TMP/data/chains/materios_preprod_v6/db" ]] || fail SNAPSHOT_LAYOUT_INVALID "RocksDB path absent"

echo "Start node with explicit --state-pruning archive"
"$NODE" --chain "$TMP/chain-spec-v6-raw.json" --base-path "$TMP" \
  --name immortal-b3-archive-probe --port 30334 --rpc-port 9945 \
  --rpc-methods unsafe --state-pruning archive \
  --bootnodes /dns4/bootnode.materios.fluxpointstudios.com/tcp/30333/p2p/12D3KooWPueKoxRAirTTKH4Y2qQAsJDegWMjS4k89Z7izCbZKgkM \
  --out-peers 24 --in-peers 0 --no-telemetry --no-prometheus -linfo >"$LOG" 2>&1 &
NODE_PID=$!
READY=false
for _ in $(seq 1 60); do
  kill -0 "$NODE_PID" 2>/dev/null || break
  if rpc_result system_health '[]' >/dev/null 2>&1; then READY=true; break; fi
  sleep 2
done
[[ "$READY" == true ]] || {
  if grep -Eqi 'prun|database.*(mode|config)|config.*database' "$LOG"; then
    fail SNAPSHOT_PRUNING_MODE_MISMATCH "snapshot DB refused archive pruning mode"
  fi
  fail ARCHIVE_NODE_START_FAILED "node RPC did not become ready"
}
LOCAL_GENESIS="$(rpc_result chain_getBlockHash '[0]')" || fail LOCAL_GENESIS_QUERY_FAILED "genesis RPC failed"
LOCAL_GENESIS="$(tr '[:upper:]' '[:lower:]' <<<"$LOCAL_GENESIS")"
[[ "$LOCAL_GENESIS" == "$GENESIS_HASH" ]] || fail LOCAL_GENESIS_MISMATCH "restored chain genesis differs"

echo "Wait for target witness block to be finalized"
DEADLINE=$((SECONDS+1500))
TARGET_READY=false
while (( SECONDS < DEADLINE )); do
  kill -0 "$NODE_PID" 2>/dev/null || fail ARCHIVE_NODE_EXITED "node exited during sync"
  LOCAL_TARGET="$(rpc_result chain_getBlockHash "[$TARGET_NUMBER]" 2>/dev/null || true)"
  if [[ "$LOCAL_TARGET" =~ ^0x[0-9a-fA-F]{64}$ ]]; then
    LOCAL_TARGET="$(tr '[:upper:]' '[:lower:]' <<<"$LOCAL_TARGET")"
    [[ "$LOCAL_TARGET" == "$TARGET_HASH" ]] || fail TARGET_BLOCK_HASH_MISMATCH "target block hash differs"
    FINALIZED_HASH="$(rpc_result chain_getFinalizedHead '[]' 2>/dev/null || true)"
    if [[ "$FINALIZED_HASH" =~ ^0x[0-9a-fA-F]{64}$ ]]; then
      FINALIZED_HEADER="$(rpc_result chain_getHeader "[\"$FINALIZED_HASH\"]" 2>/dev/null || true)"
      FINALIZED_NUMBER="$(jq -r '.number // empty' <<<"$FINALIZED_HEADER" 2>/dev/null || true)"
      if [[ "$FINALIZED_NUMBER" =~ ^0x[0-9a-fA-F]+$ ]]; then
        FINALIZED_DECIMAL=$((16#$(sed 's/^0x//' <<<"$FINALIZED_NUMBER")))
        if (( FINALIZED_DECIMAL >= TARGET_NUMBER )); then TARGET_READY=true; break; fi
      fi
    fi
  fi
  sleep 15
done
[[ "$TARGET_READY" == true ]] || fail ARCHIVE_SYNC_TIMEOUT "target was not finalized within 25 minutes"

echo "Query GRANDPA authorities and set id at exact target hash"
AUTHORITY_HEX="$(rpc_result state_call "[\"GrandpaApi_grandpa_authorities\",\"0x\",\"$TARGET_HASH\"]")" \
  || fail HISTORICAL_AUTHORITIES_QUERY_FAILED "historical authority state_call failed"
SET_ID_HEX="$(rpc_result state_call "[\"GrandpaApi_current_set_id\",\"0x\",\"$TARGET_HASH\"]")" \
  || fail HISTORICAL_SET_ID_QUERY_FAILED "historical set-id state_call failed"
[[ "$AUTHORITY_HEX" =~ ^0x([0-9a-fA-F]{2})+$ ]] || fail HISTORICAL_AUTHORITIES_ENCODING_INVALID "authority result is not non-empty SCALE hex"
[[ "$SET_ID_HEX" =~ ^0x[0-9a-fA-F]{16}$ ]] || fail HISTORICAL_SET_ID_ENCODING_INVALID "set-id result is not u64 SCALE hex"

STATUS=PASS
CLASSIFICATION=ARCHIVE_HISTORICAL_STATE_QUERY_PASS
DETAIL="Verified snapshot checksum; node started with archive pruning; target hash matched and was finalized; both historical GRANDPA state calls succeeded."
RPC_URL=http://127.0.0.1:9945
echo "PASS: local archive authority RPC available at $RPC_URL"
