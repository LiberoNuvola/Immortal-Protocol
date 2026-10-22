#!/usr/bin/env bash
set -euo pipefail

# Fetch exact hosted Materios v6 release bytes and compare them with the
# publisher's manifest. This is an integrity check against that manifest,
# NOT an independent authenticity anchor: the manifest and file share a host.

BASE_URL="https://materios.fluxpointstudios.com/releases"
OUT_DIR="${1:-artifacts/materios-genesis-v6}"
SPEC_NAME="chain-spec-v6-raw.json"
MANIFEST_NAME="SHA256SUMS"

command -v curl >/dev/null || { echo "ERROR: curl is required" >&2; exit 2; }
command -v sha256sum >/dev/null || { echo "ERROR: sha256sum is required" >&2; exit 2; }

mkdir -p "$OUT_DIR"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

curl --fail --location --silent --show-error --retry 3 \
  "$BASE_URL/$MANIFEST_NAME" -o "$TMP_DIR/$MANIFEST_NAME"
curl --fail --location --silent --show-error --retry 3 \
  "$BASE_URL/$SPEC_NAME" -o "$TMP_DIR/$SPEC_NAME"

# Require an exact manifest filename match; do not guess a digest.
MATCHES="$(awk -v f="$SPEC_NAME" '
  {
    name=$2
    sub(/^\*/, "", name)
    if (name == f) print $1
  }
' "$TMP_DIR/$MANIFEST_NAME")"

if [[ "$(printf '%s\n' "$MATCHES" | sed '/^$/d' | wc -l | tr -d ' ')" != "1" ]]; then
  echo "ERROR: expected exactly one SHA256SUMS entry for $SPEC_NAME" >&2
  echo "Manifest was saved to $OUT_DIR/$MANIFEST_NAME for inspection." >&2
  cp "$TMP_DIR/$MANIFEST_NAME" "$OUT_DIR/$MANIFEST_NAME"
  exit 3
fi

EXPECTED="$(printf '%s' "$MATCHES" | tr '[:upper:]' '[:lower:]')"
if [[ ! "$EXPECTED" =~ ^[0-9a-f]{64}$ ]]; then
  echo "ERROR: manifest entry is not a full SHA-256 digest" >&2
  exit 4
fi

ACTUAL="$(sha256sum "$TMP_DIR/$SPEC_NAME" | awk '{print tolower($1)}')"
if [[ "$ACTUAL" != "$EXPECTED" ]]; then
  echo "ERROR: checksum mismatch" >&2
  echo "expected=$EXPECTED" >&2
  echo "actual=$ACTUAL" >&2
  exit 5
fi

cp "$TMP_DIR/$MANIFEST_NAME" "$OUT_DIR/$MANIFEST_NAME"
cp "$TMP_DIR/$SPEC_NAME" "$OUT_DIR/$SPEC_NAME"
BYTES="$(wc -c < "$OUT_DIR/$SPEC_NAME" | tr -d ' ')"
UTC_NOW="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
cat > "$OUT_DIR/ACQUISITION.txt" <<EOF
artifact=$SPEC_NAME
source_url=$BASE_URL/$SPEC_NAME
manifest_url=$BASE_URL/$MANIFEST_NAME
acquired_at_utc=$UTC_NOW
bytes=$BYTES
sha256_expected_from_manifest=$EXPECTED
sha256_computed=$ACTUAL
manifest_match=PASS
trust_note=Manifest and artifact are served by the same host; this does not independently authenticate either.
next_step=Reproduce genesis header/state root and extract GRANDPA genesis authorities with pinned Substrate SDK; preserve toolchain and logs.
EOF

echo "PASS: exact bytes match the publisher manifest"
echo "artifact=$OUT_DIR/$SPEC_NAME"
echo "manifest=$OUT_DIR/$MANIFEST_NAME"
echo "bytes=$BYTES"
echo "sha256=$ACTUAL"
echo "NOTE: this is not an independent authenticity proof."
