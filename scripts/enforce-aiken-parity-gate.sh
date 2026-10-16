#!/usr/bin/env bash
set -euo pipefail

outcome() {
  case "${1:-unknown}" in
    success|failure|cancelled|skipped) printf '%s' "$1" ;;
    *) printf 'unknown' ;;
  esac
}

CACHE_HIT="$(outcome "${CACHE_HIT:-false}")"
HASKELL_FIXTURE_OUTCOME="$(outcome "${HASKELL_FIXTURE_OUTCOME:-unknown}")"
AIKEN_FIXTURE_TESTS_OUTCOME="$(outcome "${AIKEN_FIXTURE_TESTS_OUTCOME:-unknown}")"
AIKEN_FIXTURE_PARITY_OUTCOME="$(outcome "${AIKEN_FIXTURE_PARITY_OUTCOME:-unknown}")"
AIKEN_CHECK_OUTCOME="$(outcome "${AIKEN_CHECK_OUTCOME:-unknown}")"
AIKEN_BUILD_OUTCOME="$(outcome "${AIKEN_BUILD_OUTCOME:-unknown}")"
GATE_TESTS_OUTCOME="$(outcome "${GATE_TESTS_OUTCOME:-unknown}")"

test "$GATE_TESTS_OUTCOME" = success || { echo "BLOCKED: parity gate self-tests did not succeed ($GATE_TESTS_OUTCOME)"; exit 1; }
test "$HASKELL_FIXTURE_OUTCOME" = success || { echo "BLOCKED: canonical Haskell fixtures did not succeed ($HASKELL_FIXTURE_OUTCOME)"; exit 1; }
test "$AIKEN_FIXTURE_TESTS_OUTCOME" = success || { echo "BLOCKED: Aiken test generation did not succeed ($AIKEN_FIXTURE_TESTS_OUTCOME)"; exit 1; }
test "$AIKEN_FIXTURE_PARITY_OUTCOME" = success || { echo "BLOCKED: Haskell-to-Aiken parity was not executed successfully ($AIKEN_FIXTURE_PARITY_OUTCOME)"; exit 1; }
if [ "$CACHE_HIT" != true ]; then
  test "$AIKEN_CHECK_OUTCOME" = success || { echo "BLOCKED: Aiken check did not succeed ($AIKEN_CHECK_OUTCOME)"; exit 1; }
  test "$AIKEN_BUILD_OUTCOME" = success || { echo "BLOCKED: Aiken build did not succeed ($AIKEN_BUILD_OUTCOME)"; exit 1; }
fi
echo "PARITY_EVIDENCE_GATE=success"
