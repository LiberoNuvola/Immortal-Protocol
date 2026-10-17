#!/usr/bin/env bash
set +e
probe_dir="$(mktemp -d)"
trap 'rm -rf "$probe_dir"' EXIT
tar --exclude='./build' --exclude='./plutus.json' --exclude='./jev-evidence' --exclude='./aiken-check.log' --exclude='./aiken-build.log' -cf - . | tar -xf - -C "$probe_dir"
if ! grep -q '^plutus = "v3"$' "$probe_dir/aiken.toml"; then
  echo "Expected canonical Plutus V3 target in source package; refusing to rewrite unexpected configuration."
  exit 2
fi
sed -i 's/^plutus = "v3"$/plutus = "v2"/' "$probe_dir/aiken.toml"
(
  cd "$probe_dir"
  echo "Aiken V2 compatibility probe (isolated copy; canonical source remains V3)"
  echo "Compiler: $(aiken --version)"
  echo "Target override: plutus = v2"
  RUST_BACKTRACE=full aiken build
) > aiken-v2-compatibility.log 2>&1
status=$?
cat aiken-v2-compatibility.log
mkdir -p jev-evidence
node -e 'const fs=require("fs"); const status=Number(process.argv[1]); fs.writeFileSync("jev-evidence/aiken-v2-compatibility.json", JSON.stringify({schema:"immortal-aiken-v2-compatibility-probe-v1",canonicalTargetPreserved:"v3",probeTarget:"v2",buildExitCode:status,outcome:status===0?"BUILD_SUCCESS_NOT_LEDGER_PARITY":"BUILD_FAILED",nativeLedgerAcceptance:"NOT_TESTED",productionMigration:"NOT_AUTHORIZED"},null,2)+"\n")' "$status"
exit "$status"
