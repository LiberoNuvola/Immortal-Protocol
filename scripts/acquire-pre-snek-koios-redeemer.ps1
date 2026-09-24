# Gate 41 — public Koios PRE mint-redeemer probe
# Purpose: use Koios' public script_redeemers endpoint as a second acquisition path.
# This is provider-indexed redeemer evidence, not a serialized transaction witness set.
# Fail closed: exact tx hash + purpose=mint + PRE policy must all match.

$ErrorActionPreference = "Stop"

$txHash = "0235e186550383a53855a9727c02ceeb93d16956b3ae049ac367d85d291c6cf4"
$prePolicy = "1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c4"
$base = "https://api.koios.rest/api/v1"
$outDir = ".\evidence\pre-snek\gate41-koios-redeemer"

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$acquiredUtc = (Get-Date).ToUniversalTime().ToString("o")

# Koios exposes GET /script_redeemers for a specific script hash.
# Keep the provider response raw before any filtering/interpretation.
$url = "$base/script_redeemers?_script_hash=$prePolicy"
$response = Invoke-WebRequest -Uri $url -Method Get
$response.Content | Set-Content -Path "$outDir/script-redeemers.raw.json" -Encoding UTF8

$decoded = $response.Content | ConvertFrom-Json

# Normalize the common Koios response shapes without changing the raw artifact.
$records = @()
if ($decoded -is [System.Array]) {
    $records = @($decoded)
} elseif ($null -ne $decoded.data) {
    $records = @($decoded.data)
} elseif ($null -ne $decoded.response) {
    $records = @($decoded.response)
} else {
    $records = @($decoded)
}

# The endpoint is script-scoped, but require the returned script hash when present.
$matching = @()
foreach ($record in $records) {
    $scriptHash = $record.script_hash
    $redeemers = @($record.redeemers)
    if ($redeemers.Count -eq 0 -and $null -ne $record.tx_hash) {
        $redeemers = @($record)
    }

    foreach ($r in $redeemers) {
        $candidateHash = if ($null -ne $scriptHash) { $scriptHash } else { $r.script_hash }
        if (
            $candidateHash -eq $prePolicy -and
            $r.tx_hash -eq $txHash -and
            $r.purpose -eq "mint"
        ) {
            $matching += $r
        }
    }
}

[PSCustomObject]@{
    provider = "Koios"
    network = "Cardano Mainnet"
    endpoint = $url
    tx_hash = $txHash
    pre_policy = $prePolicy
    acquired_utc = $acquiredUtc
    matching_mint_redeemer_count = @($matching).Count
    matching_mint_redeemers = @($matching)
} | ConvertTo-Json -Depth 100 |
    Set-Content -Path "$outDir/pre-mint-redeemer-selection.json" -Encoding UTF8

Get-FileHash -Algorithm SHA256 "$outDir/script-redeemers.raw.json" |
    Select-Object Path, Hash |
    ConvertTo-Json -Depth 10 |
    Set-Content -Path "$outDir/raw-artifact-sha256.json" -Encoding UTF8

[PSCustomObject]@{
    provider = "Koios"
    network = "Cardano Mainnet"
    base_url = $base
    endpoint = "/script_redeemers"
    query_script_hash = $prePolicy
    tx_hash_target = $txHash
    acquired_utc = $acquiredUtc
    evidence_class = "provider-indexed-redeemer"
    note = "Not a serialized transaction witness-set artifact."
} | ConvertTo-Json -Depth 20 |
    Set-Content -Path "$outDir/acquisition-provenance.json" -Encoding UTF8

if (@($matching).Count -eq 0) {
    Write-Warning "No exact PRE mint redeemer for transaction $txHash was returned by Koios."
    exit 2
}

Write-Host "Exact historical PRE mint redeemer found via Koios."
Write-Host "Artifacts: $outDir"
