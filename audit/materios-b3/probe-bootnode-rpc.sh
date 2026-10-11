#!/usr/bin/env bash
set -euo pipefail

HOST="bootnode.materios.fluxpointstudios.com"
echo "HOST=$HOST"
getent ahostsv4 "$HOST" | head -n 10 || true

for port in 9945 9944 9933 30333; do
  if timeout 4 bash -c "</dev/tcp/$HOST/$port" 2>/dev/null; then
    echo "TCP_$port=OPEN"
  else
    echo "TCP_$port=CLOSED_OR_UNREACHABLE"
  fi
done

rpc() {
  local port="$1"
  local method="$2"
  local params="${3:-[]}"
  curl -fsS --max-time 8 -X POST "http://$HOST:$port"     -H 'content-type: application/json'     -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"$method\",\"params\":$params}" 2>/dev/null || true
}

for port in 9945 9944 9933; do
  echo "=== PORT $port chain_getFinalizedHead ==="
  rpc "$port" chain_getFinalizedHead
  echo
  echo "=== PORT $port chain_getHeader ==="
  H="$(rpc "$port" chain_getFinalizedHead | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("result",""))' 2>/dev/null || true)"
  if [[ "$H" =~ ^0x[0-9a-fA-F]{64}$ ]]; then
    rpc "$port" chain_getBlock "[\"$H\"]"
    echo
  fi
done
