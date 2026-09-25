{-# LANGUAGE OverloadedStrings #-}

module Main (main) where

import qualified Data.Aeson as Aeson
import qualified Crypto.Hash.SHA256 as SHA256
import qualified Data.ByteString.Base16 as B16
import qualified Data.Aeson.Key as Key
import qualified Data.Aeson.KeyMap as KeyMap
import qualified Data.ByteString as BS
import qualified Data.ByteString.Lazy as BSL
import qualified Data.ByteString.Char8 as BSC
import qualified Data.Map.Strict as Map
import qualified Data.Text as Text
import qualified Data.Text.Encoding as TE
import Data.Aeson ((.=), object, toJSON)
import Cardano.Ledger.Api (BabbageEra, PParams, Tx)
import Cardano.Ledger.Core (TopTx)
import Cardano.Ledger.State (UTxO)
import Cardano.Ledger.Api.Scripts.ExUnits
  ( RedeemerReportWithLogs
  , TransactionScriptFailure (..)
  )
import Cardano.Slotting.EpochInfo.API (EpochInfo)
import Cardano.Slotting.Time (SystemStart)
import System.Directory (doesFileExist)
import System.Environment (getArgs)
import TypedPacketDecode
  ( decodeBabbagePParams
  , decodeBabbageTx
  , decodeBabbageUTxO
  , decodeYaciEpochInfo
  , decodeYaciSystemStart
  , evaluateBabbageTx
  )

parseArgs :: [String] -> (FilePath, Bool)
parseArgs args =
  case args of
    ["--evidence-dir", dir] -> (dir, False)
    ["--evidence-dir", dir, "--evaluate"] -> (dir, True)
    ["--evaluate", "--evidence-dir", dir] -> (dir, True)
    ["--evaluate"] -> ("evidence", True)
    _ -> ("evidence", False)

artifactPaths :: [FilePath]
artifactPaths =
  [ "../../src/plutusScripts/prizeValidatorFactory.plutus.json"
  , "../../src/plutusScripts/b1PrizePoolFactory.plutus.json"
  ]

canonicalEvidence :: [FilePath]
canonicalEvidence =
  [ "tx.cbor"
  , "utxo.json"
  , "pparams.json"
  , "epoch-info.json"
  , "system-start.json"
  , "manifest.json"
  ]

rawHandoffEvidence :: [FilePath]
rawHandoffEvidence =
  [ "reveal-tx.cbor"
  , "reveal-transition.json"
  , "reveal-protocol-parameters.json"
  , "epoch-latest.json"
  , "manifest.txt"
  ]

main :: IO ()
main = do
  args <- getArgs
  let (evidenceDir, runEvaluation) = parseArgs args

  putStrLn "P2.8-B.1 Cardano-ledger runner"
  putStrLn "mode: ledger-aligned / fail-closed"
  putStrLn ("evidence_dir: " <> evidenceDir)

  artifactPresent <- mapM doesFileExist artifactPaths
  if not (and artifactPresent)
    then safeStall "EXACT_PLUTUS_ARTIFACT_MISSING"
    else do
      sizes <- mapM (fmap BS.length . BS.readFile) artifactPaths
      putStrLn ("artifact bytes: " <> show sizes)

      if any (== 0) sizes
        then safeStall "EMPTY_EXACT_PLUTUS_ARTIFACT"
        else inspectEvidence evidenceDir runEvaluation

  putStrLn "NO SYNTHETIC CONTEXT: evaluation only runs after exact typed-context decoding."

safeStall :: String -> IO ()
safeStall reason = do
  putStrLn "RESULT: SAFE_STALL"
  putStrLn ("SAFE_STALL_REASON: " <> reason)

inspectEvidence :: FilePath -> Bool -> IO ()
inspectEvidence evidenceDir runEvaluation = do
  let paths = map (evidenceDir <> "/") canonicalEvidence
      rawPaths = map (evidenceDir <> "/") rawHandoffEvidence
      manifestPath = evidenceDir <> "/manifest.json"

  present <- mapM doesFileExist paths
  rawPresent <- mapM doesFileExist rawPaths

  mapM_
    (\(path, ok) ->
      putStrLn (path <> if ok then " [present]" else " [missing]"))
    (zip paths present)

  mapM_
    (\(path, ok) ->
      putStrLn ("raw/" <> path <> if ok then " [present]" else " [missing]"))
    (zip rawPaths rawPresent)

  if not (and present)
    then
      if and rawPresent
        then do
          safeStall "LEDGER_TYPED_CONTEXT_NOT_MATERIALIZED"
          putStrLn
            "Raw Yaci handoff is present, but typed UTxO/PParams/EpochInfo/SystemStart packet files are not materialized."
          putStrLn
            "No synthetic transaction, UTxO, PParams, EpochInfo or SystemStart will be substituted."
        else do
          safeStall "INCOMPLETE_LEDGER_EVIDENCE"
          putStrLn
            "No synthetic transaction, UTxO, PParams, EpochInfo or SystemStart will be substituted."
    else do
      nonEmpty <- mapM (fmap (not . BS.null) . BS.readFile) paths
      if not (and nonEmpty)
        then safeStall "EMPTY_LEDGER_EVIDENCE_FILE"
        else inspectManifest evidenceDir manifestPath runEvaluation


renderRedeemerReport :: RedeemerReportWithLogs BabbageEra -> Aeson.Value
renderRedeemerReport report =
  Aeson.toJSON
    [ case result of
        Left failure ->
          object
            [ "redeemer" .= toJSON purpose
            , "status" .= ("failure" :: String)
            , "failure" .= show failure
            ]
        Right (logs, exUnits) ->
          object
            [ "redeemer" .= toJSON purpose
            , "status" .= ("success" :: String)
            , "logs" .= logs
            , "ex_units" .= toJSON exUnits
            ]
    | (purpose, result) <- Map.toAscList report
    ]
evaluateLedger ::
  Tx TopTx BabbageEra ->
  PParams BabbageEra ->
  UTxO BabbageEra ->
  EpochInfo (Either Text.Text) ->
  SystemStart ->
  FilePath ->
  IO ()
evaluateLedger tx pp utxo epochInfo systemStart evidenceDir = do
  let report = evaluateBabbageTx pp tx utxo epochInfo systemStart
      renderedJson = renderRedeemerReport report
      reportPath = evidenceDir <> "/ledger-evaluation-report.json"
      failures = length [ () | Left _ <- Map.elems report ]
      successes = length [ () | Right _ <- Map.elems report ]
      executionFailures =
        length
          [ ()
          | Left (ValidationFailure {}) <- Map.elems report
          ]
      contextFailures =
        length
          [ ()
          | Left (ContextError {}) <- Map.elems report
          ]
      ledgerFailures = failures - executionFailures - contextFailures

      contextDigest bytes =
        BSC.unpack (B16.encode (SHA256.hash bytes))

  txBytes <- BS.readFile (evidenceDir <> "/tx.cbor")
  ppBytes <- BS.readFile (evidenceDir <> "/pparams.json")
  utxoBytes <- BS.readFile (evidenceDir <> "/utxo.json")
  epochBytes <- BS.readFile (evidenceDir <> "/epoch-info.json")
  systemStartBytes <- BS.readFile (evidenceDir <> "/system-start.json")

  BS.writeFile reportPath (BSL.toStrict (Aeson.encode renderedJson))
  reportBytes <- BS.readFile reportPath
  let reportDigest = BSC.unpack (B16.encode (SHA256.hash reportBytes))
  BS.writeFile
    (evidenceDir <> "/ledger-evaluation-binding.txt")
    (TE.encodeUtf8
      (Text.unlines
        [ "transaction_cbor_sha256=" <> contextDigest txBytes
        , "pparams_sha256=" <> contextDigest ppBytes
        , "utxo_sha256=" <> contextDigest utxoBytes
        , "epoch_info_sha256=" <> contextDigest epochBytes
        , "system_start_sha256=" <> contextDigest systemStartBytes
        , "evaluation_report_sha256=" <> reportDigest
        ]))
  putStrLn ("EVALUATION_REPORT: " <> reportPath)
  putStrLn ("EVALUATION_BINDING: " <> evidenceDir <> "/ledger-evaluation-binding.txt")
  putStrLn ("REDEEMER_ENTRIES: " <> show (Map.size report))
  putStrLn ("REDEEMER_SUCCESSES: " <> show successes)
  putStrLn ("REDEEMER_FAILURES: " <> show failures)
  putStrLn ("PLUTUS_EXECUTION_FAILURES: " <> show executionFailures)
  putStrLn ("LEDGER_CONTEXT_FAILURES: " <> show contextFailures)
  putStrLn ("OTHER_LEDGER_FAILURES: " <> show ledgerFailures)
  if Map.null report
    then do
      safeStall "NO_REDEEMERS_FOUND"
      putStrLn "EVALUATION_STATUS: NOT_EVIDENT"
    else do
      putStrLn "EVALUATION_STATUS: COMPLETED"
      if failures == 0
        then do
          putStrLn "RESULT: LEDGER_ALIGNED_EVALUATION_SUCCESS"
          putStrLn "ACCEPTANCE: A — exact artifact evaluated under Cardano-ledger semantics."
        else do
          putStrLn "RESULT: LEDGER_ALIGNED_EVALUATION_FAILURE"
          putStrLn
            "ACCEPTANCE: B — Cardano-ledger produced a typed failure report; failure class is recorded above and in the per-redeemer JSON."


inspectManifest :: FilePath -> FilePath -> Bool -> IO ()
inspectManifest evidenceDir manifestPath runEvaluation = do
  manifestBytes <- BS.readFile manifestPath

  case Aeson.eitherDecodeStrict' manifestBytes :: Either String Aeson.Value of
    Left err -> do
      safeStall "INVALID_MANIFEST"
      putStrLn ("MANIFEST_ERROR: " <> err)

    Right (Aeson.Object manifest) ->
      case verifyManifestFileHashes evidenceDir manifest of
        Left err -> safeStall err
        Right () -> do
          putStrLn "RESULT: MANIFEST_SHA256_BINDING_VERIFIED"
          case KeyMap.lookup "policy" manifest of
            Just (Aeson.Object policy) ->
              case KeyMap.lookup "typed_context_ready" policy of
                Just (Aeson.Bool False) -> decodeTypedArtifacts evidenceDir runEvaluation
                Just (Aeson.Bool True) -> decodeTypedArtifacts evidenceDir runEvaluation

                _ -> safeStall "INVALID_MANIFEST_TYPED_CONTEXT_FLAG"

            _ -> safeStall "INVALID_MANIFEST_POLICY"

    Right _ -> safeStall "INVALID_MANIFEST_SHAPE"

verifyManifestFileHashes :: FilePath -> Aeson.Object -> IO (Either String ())
verifyManifestFileHashes evidenceDir manifest = do
  case KeyMap.lookup "sha256" manifest of
    Just (Aeson.Object hashes) -> do
      results <- mapM (verifyOne hashes) canonicalEvidence
      case [err | Left err <- results] of
        [] -> pure (Right ())
        err : _ -> pure (Left err)
    _ -> pure (Left "MANIFEST_SHA256_MISSING_OR_INVALID")
  where
    verifyOne hashes file =
      case KeyMap.lookup (Key.fromString file) hashes of
        Nothing -> pure (Left ("MANIFEST_SHA256_MISSING:" <> file))
        Just (Aeson.String expectedText) -> do
          bytes <- BS.readFile (evidenceDir <> "/" <> file)
          let expected = Text.unpack (Text.toLower expectedText)
              actual = BSC.unpack (B16.encode (SHA256.hash bytes))
          if expected == actual
            then pure (Right ())
            else pure (Left ("MANIFEST_SHA256_MISMATCH:" <> file))
        _ -> pure (Left ("MANIFEST_SHA256_INVALID:" <> file))

decodeTypedArtifacts :: FilePath -> Bool -> IO ()
decodeTypedArtifacts evidenceDir runEvaluation = do
  txBytes <- BS.readFile (evidenceDir <> "/tx.cbor")
  ppBytes <- BS.readFile (evidenceDir <> "/pparams.json")
  utxoBytes <- BS.readFile (evidenceDir <> "/utxo.json")
  epochBytes <- BS.readFile (evidenceDir <> "/epoch-info.json")
  systemStartBytes <- BS.readFile (evidenceDir <> "/system-start.json")

  case decodeBabbagePParams ppBytes of
    Left err -> do
      safeStall "PPARAMS_NATIVE_DECODE_FAILED"
      putStrLn ("PPARAMS_ERROR: " <> err)

    Right pp ->
      case decodeBabbageTx pp txBytes of
        Left err -> do
          safeStall "BABBAGE_TX_NATIVE_DECODE_FAILED"
          putStrLn ("TX_ERROR: " <> err)

        Right tx ->
          case decodeBabbageUTxO utxoBytes of
            Left err -> do
              safeStall "YACI_UTXO_NATIVE_DECODE_FAILED"
              putStrLn ("UTXO_ERROR: " <> err)

            Right utxo ->
              case decodeYaciEpochInfo epochBytes of
                Left err -> do
                  safeStall "YACI_EPOCH_INFO_DECODE_FAILED"
                  putStrLn ("EPOCH_INFO_ERROR: " <> err)

                Right epochInfo ->
                  case decodeYaciSystemStart systemStartBytes of
                    Left err -> do
                      safeStall "YACI_SYSTEM_START_DECODE_FAILED"
                      putStrLn ("SYSTEM_START_ERROR: " <> err)

                    Right systemStart -> do
                      putStrLn "RESULT: TYPED_BABBAGE_CONTEXT_DECODED"
                      putStrLn
                        "PParams, transaction, consumed UTxO, EpochInfo and SystemStart decoded with native Ledger types."
                      if runEvaluation
                        then evaluateLedger tx pp utxo epochInfo systemStart evidenceDir
                        else putStrLn "EVALUATION_STATUS: NOT_REQUESTED"



