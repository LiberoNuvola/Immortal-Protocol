#!/usr/bin/env bash
# IMMORTAL Agent B Flux Point Loop DoD pilot.
# Supplemental local gate only; independent CI and ledger evidence remain mandatory.
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

fail() { echo "FPL-IMMORTAL: BLOCKED: $*" >&2; exit 1; }
run() { local label="$1"; shift; printf '\n==> %s\n' "$label"; "$@"; }
need() { command -v "$1" >/dev/null 2>&1 || fail "required command unavailable: $1"; }
need_bin() { [ -x "$1" ] || fail "required binary missing: $1 (install repository dependencies; this gate will not install them)"; }

PY="${FPL_PY:-}"
if [ -z "$PY" ]; then
  for candidate in python3 python; do
    if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -c 'import sys' >/dev/null 2>&1; then PY="$candidate"; break; fi
  done
fi

root_ts() { need_bin node_modules/.bin/tsc; run "Root TypeScript typecheck" ./node_modules/.bin/tsc --noEmit; }
root_tests() { need_bin node_modules/.bin/vitest; run "Root Vitest suites" ./node_modules/.bin/vitest run src Adapter PRE-RICH; }
root_build() { need npm; run "Frontend production build" npm run build; }
boundaries() {
  need node
  run "Layer-boundary audit" node scripts/check-layer-boundaries.mjs
  run "Economic mutator-surface audit" node scripts/check-economic-mutator-surface.mjs
  run "RF8 production-boundary audit" node scripts/check-rf8-production-boundary.mjs
}
materios_ts() {
  need_bin poc/materios-checkpoint/node_modules/.bin/tsc
  run "Materios B3-C typecheck" npm --prefix poc/materios-checkpoint run typecheck
  run "Materios B3-C execution-proof packet tests" npm --prefix poc/materios-checkpoint run test:execution-proof
  run "Materios B3 RPC/block-binding tests" npm --prefix poc/materios-checkpoint run test:rpc-b3
}
finite_model() {
  [ -n "$PY" ] || fail "Python 3 required for verification/finite_model_checks.py"
  run "IMMORTAL finite-model checks" "$PY" verification/finite_model_checks.py
}
docs() { need node; run "Documentation link check" node scripts/docs-link-check.mjs; }

full() {
  root_ts
  root_tests
  root_build
  boundaries
  finite_model
  materios_ts
  docs
  echo "FPL_LOCAL_DOD=PASS"
  echo "Excluded: Haskell/Plutus, generated Haskell-Aiken parity, Yaci/ledger execution, full transaction CBOR/ExUnits, Preprod deployment and Issue."
  echo "Each excluded predicate remains with its existing dedicated workflow/evidence gate."
}
changed() {
  local file="${1:-}"
  [ -n "$file" ] || fail "usage: scripts/harness.sh --changed <file>"
  case "$file" in "$ROOT"/*) file="${file#"$ROOT"/}" ;; /*) fail "file outside repository: $file" ;; esac
  case "$file" in ../*|*/../*|..|"") fail "invalid changed path: $file" ;; esac
  [ -f "$file" ] || fail "changed file not present in checkout: $file"
  case "$file" in
    src/*|Adapter/*|PRE-RICH/*|index.html|vite.config.*|tsconfig*.json)
      root_ts
      if [[ "$file" == *.test.ts || "$file" == *.spec.ts ]]; then
        need_bin node_modules/.bin/vitest
        run "Changed Vitest file" ./node_modules/.bin/vitest run "$file"
      else root_tests; fi
      case "$file" in src/*|index.html|vite.config.*) root_build ;; esac ;;
    poc/materios-checkpoint/*) materios_ts ;;
    poc/materios-execution-verifier/*)
      need cargo
      run "Materios Rust formatting" cargo fmt --manifest-path poc/materios-execution-verifier/Cargo.toml --all -- --check ;;
    poc/aiken-reveal-parity/*)
      need aiken
      ( cd poc/aiken-reveal-parity; run "Reveal Aiken format" aiken fmt --check .; run "Reveal Aiken tests" aiken check ) ;;
    poc/aiken-pyth-ada-usd/*)
      need aiken
      ( cd poc/aiken-pyth-ada-usd; run "Pyth Aiken format" aiken fmt --check .; run "Pyth Aiken tests" aiken check ) ;;
    verification/*.py)
      [ -n "$PY" ] || fail "Python 3 required for $file"
      run "Python syntax check" "$PY" -m py_compile "$file"
      if [ "$file" = "verification/finite_model_checks.py" ]; then finite_model; fi ;;
    docs/*.md|docs/**/*.md|*.md) docs ;;
    scripts/*.mjs|scripts/*.mts|scripts/*.ts)
      need node
      run "Changed script syntax check" node --check "$file"
      boundaries ;;
    *) fail "no scoped runner mapped for $file; add an explicit check rather than reporting green" ;;
  esac
  echo "FPL_CHANGED_DOD=PASS ($file)"
}
case "${1:---full}" in
  --full) full ;;
  --changed) changed "${2:-}" ;;
  *) fail "usage: scripts/harness.sh --changed <file> | --full" ;;
esac
