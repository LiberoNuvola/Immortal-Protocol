# Gate 41 — acquire historical PRE mint witness-capable artifacts
# Requires: BLOCKFROST_MAINNET_PROJECT_ID environment variable.
# Purpose: acquire transaction CBOR and redeemers separately; never infer witness data from tx_utxos.

$ErrorActionPreference = "Stop"

$txHash = "0235e186550383a53855a9727c02ceeb93d16956b3ae049ac367d85d291c6cf4"
$prePolicy = "1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c4"
$outDir = ".\evidence\pre-snek\gate41-witness"
$base = "https://cardano-mainnet.blockfrost.io/api/v0"

$projectId = $env:BLOCKFROST_MAINNET_PROJECT_ID
if ([string]::IsNullOrWhiteSpace($projectId)) {
    throw "BLOCKFROST_MAINNET_PROJECT_ID is required; do not hard-code credentials."
}

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$acquiredUtc = (Get-Date).ToUniversalTime().ToString("o")

$headers = @{ "project_id" = $projectId }

function Save-RawJson([string]$url, [string]$path) {
    $response = Invoke-WebRequest -Uri $url -Headers $headers -Method Get
    $response.Content | Set-Content -Path $path -Encoding UTF8
    return $response.Content | ConvertFrom-Json
}

# 1. Transaction metadata record for cross-check.
$tx = Save-RawJson "$base/txs/$txHash" "$outDir/tx.raw.json"

# 2. Transaction UTxOs — explicit artifact; do not assume /txs/{hash} contains outputs.
$utxos = Save-RawJson "$base/txs/$txHash/utxos" "$outDir/tx-utxos.raw.json"

# 3. Transaction CBOR — distinct raw artifact from transaction/UTxO JSON.
$cbor = Invoke-WebRequest -Uri "$base/txs/$txHash/cbor" -Headers $headers -Method Get
$cbor.Content | Set-Content -Path "$outDir/tx-cbor.raw.json" -Encoding UTF8

# 4. Transaction redeemers — witness-capable raw artifact.
$redeemers = Save-RawJson "$base/txs/$txHash/redeemers" "$outDir/redeemers.raw.json"

# 5. Preserve an exact mint-policy subset for deterministic review.
$mint = @($redeemers) | Where-Object {
    $_.purpose -eq "mint" -and $_.script_hash -eq $prePolicy
}

[PSCustomObject]@{
    tx_hash = $txHash
    pre_policy = $prePolicy
    mint_redeemer_count = @($mint).Count
    mint_redeemers = @($mint)
    acquired_utc = $acquiredUtc
} | ConvertTo-Json -Depth 100 |
    Set-Content -Path "$outDir/pre-mint-redeemer-selection.json" -Encoding UTF8

# 6. Preserve cryptographic hashes of every raw provider response before interpretation.
Get-ChildItem -Path $outDir -Filter "*.raw.json" | ForEach-Object {
    Get-FileHash -Algorithm SHA256 $_.FullName | Select-Object Path, Hash
} | ConvertTo-Json -Depth 10 | Set-Content -Path "$outDir/raw-artifact-sha256.json" -Encoding UTF8

[PSCustomObject]@{
    provider = "Blockfrost"
    network = "Cardano Mainnet"
    base_url = $base
    tx_hash = $txHash
    pre_policy = $prePolicy
    acquired_utc = $acquiredUtc
    endpoints = @(
        "/txs/$txHash"
        "/txs/$txHash/utxos"
        "/txs/$txHash/cbor"
        "/txs/$txHash/redeemers"
    )
} | ConvertTo-Json -Depth 20 | Set-Content -Path "$outDir/acquisition-provenance.json" -Encoding UTF8

# Fail closed: absence of a mint-purpose redeemer is an acquisition/ledger finding,
# not permission to infer one from later spend redeemers.
if (@($mint).Count -eq 0) {
    Write-Warning "No mint-purpose redeemer for PRE policy was returned by Blockfrost."
    exit 2
}

Write-Host "Gate 41 witness acquisition complete."
Write-Host "Mint redeemer artifacts: $outDir"
