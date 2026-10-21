[CmdletBinding()]
param(
    [Parameter()]
    [string]$CardanoCli = "cardano-cli",

    [Parameter()]
    [string]$OutputDir = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$started = [DateTime]::UtcNow
$runStamp = $started.ToString("yyyyMMddTHHmmssZ")
if ([string]::IsNullOrWhiteSpace($OutputDir)) {
    $OutputDir = Join-Path ([System.IO.Path]::GetTempPath()) "immortal-dijkstra-cli-wire-preflight-$runStamp"
}
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

$script:CardanoCliPath = $null
$script:Steps = New-Object 'System.Collections.Generic.List[object]'
$script:Evidence = [ordered]@{
    schema = "IMMORTAL-DIJKSTRA-CLI-WIRE-PREFLIGHT-V1"
    status = "RUNNING"
    startedAtUtc = $started.ToString("o")
    completedAtUtc = $null
    cliExecutable = $null
    cliVersion = $null
    classification = "OFFLINE_SYNTHETIC_CLI_WIRE_FORMAT_ONLY"
    networkSubmissionAttempted = $false
    ledgerEvaluationAttempted = $false
    protocolParametersLoaded = $false
    actualUtxosVerified = $false
    maxTxSizeCompared = $false
    feeSponsorshipProven = $false
    plutusV4GuardExercised = $false
    topLevelGuardMode = "PAYMENT_KEY_HASH_ONLY"
    subTransactionIdStableAcrossSigning = $false
    subTransactionIdUnsigned = $null
    subTransactionIdSigned = $null
    topLevelTransactionId = $null
    subTransactionCborBytes = $null
    topLevelBodyCborBytes = $null
    topLevelSignedTransactionCborBytes = $null
    artifacts = @()
    steps = @()
    failure = $null
    limitations = @(
        "All transaction inputs use synthetic transaction IDs and are not verified UTxOs.",
        "No network connection, submission, ledger evaluation, protocol-parameter query, or actual fee calculation is performed.",
        "The byte counts are serialization measurements only; maxTxSize compliance is not asserted without the target protocol parameters.",
        "This exercises a key-guard path only. It does not exercise Plutus V4 scripts or the currently failing Plutus V4 top-level Guard submission path.",
        "A PASS means the CLI build/sign/txid/embed pipeline ran; it is not evidence of ledger acceptance, a sponsored-fee economic result, or production readiness.",
        "Never submit the generated transaction. Its inputs and value flow are intentionally synthetic."
    )
}

function Invoke-CardanoCli {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Label,

        [Parameter(Mandatory = $true)]
        [string[]]$CliArgs
    )

    $output = & $script:CardanoCliPath @CliArgs 2>&1
    $exitCode = $LASTEXITCODE
    $outputText = (@($output | ForEach-Object { "$_" }) -join "\`n").Trim()
    $step = [ordered]@{
        name = $Label
        exitCode = $exitCode
        status = $(if ($exitCode -eq 0) { "PASS" } else { "FAIL" })
    }
    [void]$script:Steps.Add($step)

    if ($exitCode -ne 0) {
        throw "CLI stage '$Label' exited with code $exitCode. Output: $outputText"
    }
    return $outputText
}

function Get-EnvelopeCborByteLength {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $envelope = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
    $hex = [string]$envelope.cborHex
    if ([string]::IsNullOrWhiteSpace($hex)) {
        throw "Text envelope '$([System.IO.Path]::GetFileName($Path))' has no cborHex field."
    }
    $hex = $hex -replace '\s', ''
    if (($hex.Length % 2) -ne 0 -or $hex -notmatch '^[0-9a-fA-F]+$') {
        throw "Text envelope '$([System.IO.Path]::GetFileName($Path))' has malformed cborHex."
    }
    return [int]($hex.Length / 2)
}

$signingKey = Join-Path $OutputDir "ephemeral-payment.skey"
$verificationKey = Join-Path $OutputDir "ephemeral-payment.vkey"
$unsignedSubTx = Join-Path $OutputDir "sub-transaction.unsigned"
$signedSubTx = Join-Path $OutputDir "sub-transaction.signed"
$topLevelBody = Join-Path $OutputDir "top-level.body"
$signedTopLevel = Join-Path $OutputDir "top-level.signed"
$evidencePath = Join-Path $OutputDir "evidence.json"

try {
    $command = Get-Command -Name $CardanoCli -ErrorAction Stop
    if ($command.CommandType -ne "Application") {
        throw "'$CardanoCli' did not resolve to an executable application."
    }
    $script:CardanoCliPath = $command.Source
    $script:Evidence.cliExecutable = [System.IO.Path]::GetFileName($script:CardanoCliPath)

    $versionOutput = Invoke-CardanoCli -Label "cli_version" -CliArgs @("--version")
    $script:Evidence.cliVersion = $versionOutput
    $versionMatch = [regex]::Match($versionOutput, '(?<!\d)(\d+\.\d+\.\d+\.\d+)(?!\d)')
    if (-not $versionMatch.Success) {
        throw "Could not parse a four-part cardano-cli version from: $versionOutput"
    }
    $actualVersion = [version]$versionMatch.Groups[1].Value
    if ($actualVersion -lt [version]"11.4.0.0") {
        throw "cardano-cli 11.4.0.0 or later is required for the Dijkstra sub-transaction commands; found $actualVersion."
    }

    [void](Invoke-CardanoCli -Label "ephemeral_key_generation" -CliArgs @(
        "address", "key-gen",
        "--signing-key-file", $signingKey,
        "--verification-key-file", $verificationKey
    ))

    $keyHashOutput = Invoke-CardanoCli -Label "payment_key_hash" -CliArgs @(
        "address", "key-hash",
        "--payment-verification-key-file", $verificationKey
    )
    $keyHashMatch = [regex]::Match($keyHashOutput, '(?i)(?<![0-9a-f])[0-9a-f]{56}(?![0-9a-f])')
    if (-not $keyHashMatch.Success) {
        throw "Could not extract a 28-byte payment key hash from the CLI output."
    }
    $paymentKeyHash = $keyHashMatch.Value.ToLowerInvariant()

    $addressOutput = Invoke-CardanoCli -Label "synthetic_test_address" -CliArgs @(
        "address", "build",
        "--payment-verification-key-file", $verificationKey,
        "--testnet-magic", "42"
    )
    $addressLine = @($addressOutput -split "\`r?\`n" | Where-Object { $_ -match '^addr_test1[0-9a-z]+$' } | Select-Object -Last 1)
    if ($addressLine.Count -ne 1) {
        throw "Could not extract a bech32 testnet address from cardano-cli address build output."
    }
    $testAddress = [string]$addressLine[0]

    # Synthetic input IDs: distinct indexes of a deliberately nonexistent tx.
    # These transactions are for offline encoding only and must never be submitted.
    $syntheticTxHash = "0" * 64
    $subTxInput = "$syntheticTxHash#1"
    $topLevelInput = "$syntheticTxHash#0"

    [void](Invoke-CardanoCli -Label "sub_transaction_build_raw" -CliArgs @(
        "dijkstra", "sub-transaction", "build-raw",
        "--tx-in", $subTxInput,
        "--tx-out", "$testAddress+5000000",
        "--invalid-hereafter", "99999",
        "--guard-key-hash", $paymentKeyHash,
        "--top-level-guard-key-hash", $paymentKeyHash,
        "--out-file", $unsignedSubTx
    ))

    [void](Invoke-CardanoCli -Label "sub_transaction_sign" -CliArgs @(
        "dijkstra", "sub-transaction", "sign",
        "--sub-tx-file", $unsignedSubTx,
        "--signing-key-file", $signingKey,
        "--out-file", $signedSubTx
    ))

    $unsignedId = (Invoke-CardanoCli -Label "sub_transaction_txid_unsigned" -CliArgs @(
        "dijkstra", "sub-transaction", "txid",
        "--sub-tx-file", $unsignedSubTx,
        "--output-text"
    )).Trim()

    $signedId = (Invoke-CardanoCli -Label "sub_transaction_txid_signed" -CliArgs @(
        "dijkstra", "sub-transaction", "txid",
        "--signed-sub-tx-file", $signedSubTx,
        "--output-text"
    )).Trim()

    if ([string]::IsNullOrWhiteSpace($unsignedId) -or $unsignedId -ne $signedId) {
        throw "Sub-transaction ID changed across signing or an ID could not be parsed. unsigned='$unsignedId', signed='$signedId'."
    }
    $script:Evidence.subTransactionIdStableAcrossSigning = $true
    $script:Evidence.subTransactionIdUnsigned = $unsignedId
    $script:Evidence.subTransactionIdSigned = $signedId
    $script:Evidence.subTransactionCborBytes = Get-EnvelopeCborByteLength -Path $signedSubTx

    [void](Invoke-CardanoCli -Label "top_level_build_raw_with_signed_subtx" -CliArgs @(
        "dijkstra", "transaction", "build-raw",
        "--tx-in", $topLevelInput,
        "--tx-out", "$testAddress+10000000",
        "--fee", "200000",
        "--signed-sub-tx-file", $signedSubTx,
        "--out-file", $topLevelBody
    ))
    $script:Evidence.topLevelBodyCborBytes = Get-EnvelopeCborByteLength -Path $topLevelBody

    [void](Invoke-CardanoCli -Label "top_level_sign_offline" -CliArgs @(
        "dijkstra", "transaction", "sign",
        "--tx-body-file", $topLevelBody,
        "--signing-key-file", $signingKey,
        "--testnet-magic", "42",
        "--out-file", $signedTopLevel
    ))
    $script:Evidence.topLevelSignedTransactionCborBytes = Get-EnvelopeCborByteLength -Path $signedTopLevel

    $topLevelId = (Invoke-CardanoCli -Label "top_level_txid" -CliArgs @(
        "dijkstra", "transaction", "txid",
        "--tx-file", $signedTopLevel,
        "--output-text"
    )).Trim()
    if ([string]::IsNullOrWhiteSpace($topLevelId)) {
        throw "Could not obtain the top-level transaction ID from the CLI."
    }
    $script:Evidence.topLevelTransactionId = $topLevelId
    $script:Evidence.status = "PASS"
}
catch {
    $script:Evidence.status = "FAIL"
    $script:Evidence.failure = $_.Exception.Message
}
finally {
    # Never retain a generated private signing key in the evidence directory.
    if (Test-Path -LiteralPath $signingKey) {
        Remove-Item -LiteralPath $signingKey -Force -ErrorAction SilentlyContinue
    }

    $script:Evidence.completedAtUtc = [DateTime]::UtcNow.ToString("o")
    $script:Evidence.steps = @($script:Steps.ToArray())
    $script:Evidence.artifacts = @(
        $unsignedSubTx, $signedSubTx, $topLevelBody, $signedTopLevel
    ) | Where-Object { Test-Path -LiteralPath $_ } | ForEach-Object {
        [ordered]@{
            name = [System.IO.Path]::GetFileName($_)
            sizeBytes = (Get-Item -LiteralPath $_).Length
        }
    }

    $script:Evidence |
        ConvertTo-Json -Depth 8 |
        Set-Content -LiteralPath $evidencePath -Encoding UTF8
}

Write-Host "Status: $($script:Evidence.status)"
Write-Host "Classification: $($script:Evidence.classification)"
Write-Host "Evidence: $evidencePath"
if ($script:Evidence.status -eq "PASS") {
    Write-Host "Sub-transaction ID stable across signing: $($script:Evidence.subTransactionIdStableAcrossSigning)"
    Write-Host "Signed sub-transaction CBOR bytes: $($script:Evidence.subTransactionCborBytes)"
    Write-Host "Top-level body CBOR bytes: $($script:Evidence.topLevelBodyCborBytes)"
    Write-Host "Top-level signed transaction CBOR bytes: $($script:Evidence.topLevelSignedTransactionCborBytes)"
    Write-Host "Top-level transaction ID: $($script:Evidence.topLevelTransactionId)"
    Write-Host "No network submission or ledger evaluation was attempted."
    exit 0
}

Write-Error "Dijkstra CLI wire-format preflight failed: $($script:Evidence.failure)"
exit 1
