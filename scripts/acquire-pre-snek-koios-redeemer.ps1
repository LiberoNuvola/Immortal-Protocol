# Gate 41 — public Koios PRE mint-redeemer probe
# Purpose: use Koios' public script_redeemers endpoint as a second acquisition path.
# This is provider-indexed redeemer evidence, not a serialized transaction witness set.
# Fail closed: exact tx hash + purpose=mint + PRE policy must all match.
#
# Koios pagination is implemented with HTTP Range headers. The public Koios CLI
# exposes --page/--page-size for this endpoint, and the Go client maps those
# options to Range. We therefore acquire pages explicitly instead of assuming
# the first/default page is exhaustive.

$ErrorActionPreference = "Stop"

$txHash = "0235e186550383a53855a9727c02ceeb93d16956b3ae049ac367d85d291c6cf4"
$prePolicy = "1b29fda97d0fd321398c5b7b3285fdaadd519a0d002932853311f02c4"
$base = "https://api.koios.rest/api/v1"
$outDir = ".\evidence\pre-snek\gate41-koios-redeemer"
$pageSize = 1000
$maxPages = 100

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$acquiredUtc = (Get-Date).ToUniversalTime().ToString("o")

function Normalize-Records($decoded) {
    if ($decoded -is [System.Array]) { return @($decoded) }
    if ($null -ne $decoded.data) { return @($decoded.data) }
    if ($null -ne $decoded.response) { return @($decoded.response) }
    return @($decoded)
}

function Flatten-Redeemers($records) {
    $flat = @()
    foreach ($record in $records) {
        $scriptHash = $record.script_hash
        $redeemers = @($record.redeemers)
        if ($redeemers.Count -eq 0 -and $null -ne $record.tx_hash) {
            $redeemers = @($record)
        }
        foreach ($r in $redeemers) {
            $flat += [PSCustomObject]@{
                script_hash = if ($null -ne $scriptHash) { $scriptHash } else { $r.script_hash }
                tx_hash = $r.tx_hash
                tx_index = $r.tx_index
                unit_mem = $r.unit_mem
                unit_steps = $r.unit_steps
                fee = $r.fee
                purpose = $r.purpose
                datum_hash = $r.datum_hash
                datum_value = $r.datum_value
            }
        }
    }
    return @($flat)
}

$allRedeemers = @()
$pageSummaries = @()

for ($page = 1; $page -le $maxPages; $page++) {
    $start = ($page - 1) * $pageSize
    $end = $start + $pageSize - 1
    $url = "$base/script_redeemers?_script_hash=$prePolicy"
    $pagePath = "$outDir/script-redeemers-page-$page.raw.json"

    try {
        $headers = @{ "Range" = "$start-$end" }
        $response = Invoke-WebRequest -Uri $url -Method Get -Headers $headers
        $response.Content | Set-Content -Path $pagePath -Encoding UTF8
    } catch {
        if ($page -gt 1 -and $allRedeemers.Count -gt 0) {
            $pageSummaries += [PSCustomObject]@{
                page = $page
                range = "$start-$end"
                status = "terminal-range-response"
                error = $_.Exception.Message
            }
            break
        }
        throw
    }

    $decoded = Get-Content -Raw -Path $pagePath | ConvertFrom-Json
    $records = Normalize-Records $decoded
    $pageRedeemers = Flatten-Redeemers $records
    $allRedeemers += $pageRedeemers

    $pageSummaries += [PSCustomObject]@{
        page = $page
        range = "$start-$end"
        status = "retrieved"
        redeemer_count = @($pageRedeemers).Count
    }

    if (@($pageRedeemers).Count -lt $pageSize) { break }
}

$matching = @($allRedeemers | Where-Object {
    $_.script_hash -eq $prePolicy -and
    $_.tx_hash -eq $txHash -and
    $_.purpose -eq "mint"
})

[PSCustomObject]@{
    provider = "Koios"
    network = "Cardano Mainnet"
    endpoint = "$base/script_redeemers"
    tx_hash = $txHash
    pre_policy = $prePolicy
    page_size = $pageSize
    pages_retrieved = @($pageSummaries | Where-Object { $_.status -eq "retrieved" }).Count
    total_redeemers_acquired = @($allRedeemers).Count
    matching_mint_redeemer_count = @($matching).Count
    matching_mint_redeemers = @($matching)
    acquired_utc = $acquiredUtc
} | ConvertTo-Json -Depth 100 |
    Set-Content -Path "$outDir/pre-mint-redeemer-selection.json" -Encoding UTF8

$pageSummaries | ConvertTo-Json -Depth 30 |
    Set-Content -Path "$outDir/page-acquisition-index.json" -Encoding UTF8

Get-ChildItem -Path $outDir -Filter "script-redeemers-page-*.raw.json" | ForEach-Object {
    Get-FileHash -Algorithm SHA256 $_.FullName | Select-Object Path, Hash
} | ConvertTo-Json -Depth 10 |
    Set-Content -Path "$outDir/raw-artifact-sha256.json" -Encoding UTF8

[PSCustomObject]@{
    provider = "Koios"
    network = "Cardano Mainnet"
    base_url = $base
    endpoint = "/script_redeemers"
    query_script_hash = $prePolicy
    tx_hash_target = $txHash
    page_size = $pageSize
    max_pages = $maxPages
    acquired_utc = $acquiredUtc
    evidence_class = "provider-indexed-redeemer"
    note = "Not a serialized transaction witness-set artifact. Pagination uses HTTP Range headers as implemented by the Koios client."
} | ConvertTo-Json -Depth 20 |
    Set-Content -Path "$outDir/acquisition-provenance.json" -Encoding UTF8

if (@($matching).Count -eq 0) {
    Write-Warning "No exact PRE mint redeemer for transaction $txHash was returned by Koios."
    exit 2
}

Write-Host "Exact historical PRE mint redeemer found via Koios."
Write-Host "Artifacts: $outDir"
