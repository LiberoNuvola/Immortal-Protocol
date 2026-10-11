#!/usr/bin/env bash
set -euo pipefail
WORK="$RUNNER_TEMP/materios-warp"
mkdir -p "$WORK/db" "$WORK/bin"
curl -fsSL https://materios.fluxpointstudios.com/releases/materios-node-v6-x86_64-linux -o "$WORK/bin/materios-node"
curl -fsSL https://materios.fluxpointstudios.com/releases/chain-spec-v6-raw.json -o "$WORK/chain-spec-v6-raw.json"
chmod +x "$WORK/bin/materios-node"

echo "=== BINARY ==="
"$WORK/bin/materios-node" --version
echo "=== SYNC FLAGS ==="
"$WORK/bin/materios-node" --help | grep -E -- '--sync|warp|state-pruning|rpc-port|bootnodes' | head -n 80 || true

echo "=== START WARP NODE ==="
"$WORK/bin/materios-node"   --chain "$WORK/chain-spec-v6-raw.json"   --base-path "$WORK/db"   --sync warp   --port 40444   --rpc-port 19945   --rpc-cors all   --rpc-methods safe   --bootnodes /dns4/bootnode.materios.fluxpointstudios.com/tcp/30333/p2p/12D3KooWPueKoxRAirTTKH4Y2qQAsJDegWMjS4k89Z7izCbZKgkM   --name immortal-b3-warp   >"$WORK/node.log" 2>&1 &
PID=$!
trap 'kill "$PID" 2>/dev/null || true' EXIT

for i in $(seq 1 30); do
  sleep 2
  if ! kill -0 "$PID" 2>/dev/null; then break; fi
  echo "--- poll $i ---"
  curl -sS --max-time 3 -X POST http://127.0.0.1:19945     -H 'content-type: application/json'     -d '{"jsonrpc":"2.0","id":1,"method":"system_health","params":[]}' || true
  echo
  curl -sS --max-time 3 -X POST http://127.0.0.1:19945     -H 'content-type: application/json'     -d '{"jsonrpc":"2.0","id":2,"method":"chain_getFinalizedHead","params":[]}' || true
  echo
  tail -n 25 "$WORK/node.log" || true
done

echo "=== FINAL LOG ==="
cat "$WORK/node.log" || true
