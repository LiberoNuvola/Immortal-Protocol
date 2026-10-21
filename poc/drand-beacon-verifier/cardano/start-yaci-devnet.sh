#!/usr/bin/env bash
# Work around the Yaci DevKit v0.12.0-beta5 "up" flag interaction:
# --enable-yaci-store sets Ogmios disabled in that release, even when
# --enable-kupomios is also passed. Start Ogmios/Kupo first, then enable and
# start Yaci Store from the same CLI process so its evaluator mode can be Ogmios.
set -Eeuo pipefail

ROOT="${GITHUB_WORKSPACE:-$(pwd)}"
OUT="$ROOT/poc/drand-beacon-verifier/cardano/out"
LOG="$OUT/yaci.log"
FIFO="$OUT/yaci-cli.input"
STATUS="$OUT/yaci-startup-status.txt"
mkdir -p "$OUT"
rm -f "$FIFO" "$STATUS"
mkfifo "$FIFO"
printf 'YACI_STARTUP=starting\n' > "$STATUS"

nohup yaci-devkit up --enable-kupomios --interactive < "$FIFO" > "$LOG" 2>&1 &
cli_pid=$!
printf '%s\n' "$cli_pid" > "$OUT/yaci.pid"

# Open the FIFO writer only after the CLI reader has started. Keep FD 3 open
# for the lifetime of the interactive CLI so the shell does not receive EOF.
exec 3> "$FIFO"

ogmios_ready=0
for i in $(seq 1 180); do
  if curl --connect-timeout 1 --max-time 2 --fail --silent http://127.0.0.1:1337/health >/dev/null; then
    ogmios_ready=1
    break
  fi
  if ! kill -0 "$cli_pid" 2>/dev/null; then
    printf 'YACI_STARTUP=failed_cli_exited_before_ogmios\n' > "$STATUS"
    tail -200 "$LOG" || true
    exit 1
  fi
  sleep 2
done

if [ "$ogmios_ready" -ne 1 ]; then
  printf 'YACI_STARTUP=failed_ogmios_not_ready\n' > "$STATUS"
  tail -200 "$LOG" || true
  exit 1
fi
printf 'YACI_STARTUP=ogmios_ready\n' > "$STATUS"

# Do not use --enable-yaci-store on "up" in beta5: that option forcibly turns
# Ogmios off. Enable/start the store only after Ogmios is healthy.
printf 'enable-yaci-store\n' >&3
store_enabled=0
for i in $(seq 1 15); do
  if grep -q 'Yaci Store Status: Enable' "$LOG"; then
    store_enabled=1
    break
  fi
  if ! kill -0 "$cli_pid" 2>/dev/null; then
    printf 'YACI_STARTUP=failed_cli_exited_enabling_store\n' > "$STATUS"
    tail -200 "$LOG" || true
    exit 1
  fi
  sleep 1
done

if [ "$store_enabled" -ne 1 ]; then
  printf 'YACI_STARTUP=failed_store_enable_command\n' > "$STATUS"
  tail -200 "$LOG" || true
  exit 1
fi

printf 'yaci-store-start\n' >&3
store_ready=0
for i in $(seq 1 120); do
  if grep -Fq 'Yaci Store tx evaluator mode: ogmios' "$LOG"; then
    store_ready=1
    break
  fi
  if grep -Eqi 'Yaci Store tx evaluator mode: scalus|Ogmios.*not responding|Ogmios.*not running' "$LOG"; then
    printf 'YACI_STARTUP=failed_non_ogmios_evaluator\n' > "$STATUS"
    tail -200 "$LOG" || true
    exit 1
  fi
  if ! kill -0 "$cli_pid" 2>/dev/null; then
    printf 'YACI_STARTUP=failed_cli_exited_starting_store\n' > "$STATUS"
    tail -200 "$LOG" || true
    exit 1
  fi
  sleep 2
done

if [ "$store_ready" -ne 1 ]; then
  printf 'YACI_STARTUP=failed_store_evaluator_not_ogmios\n' > "$STATUS"
  tail -200 "$LOG" || true
  exit 1
fi

printf 'YACI_STARTUP=ready_ogmios_evaluator\n' > "$STATUS"

# Keep both the CLI process and its input pipe alive across Actions steps.
while kill -0 "$cli_pid" 2>/dev/null; do
  sleep 5
done

printf 'YACI_STARTUP=failed_cli_exited\n' > "$STATUS"
exit 1
