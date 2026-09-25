{-# LANGUAGE OverloadedStrings #-}

module Main (main) where

import qualified Data.Aeson as Aeson
import qualified Crypto.Hash.SHA256 as SHA256
import qualified Data.ByteString.Base16 as B16
import qualified Data.Aeson.KeyMap as KeyMap
import qualified Data.ByteString as BS
import qualified Data.ByteString.Char8 as BSC
import qualified Data.Map.Strict as Map
import qualified Data.Text as Text
import qualified Data.Text.Encoding as TE
import Cardano.Ledger.Api (BabbageEra, PParams, Tx)
import Cardano.Ledger.Core (TopTx)
import Cardano.Ledger.State (UTxO)
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
  let evidenceDir =
        case args of
          ["--evidence-dir", dir] -> dir
          _ -> "evidence"

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
        else inspectEvidence evidenceDir

  putStrLn "NO SYNTHETIC CONTEXT: evaluation only runs after exact typed-context decoding."

safeStall :: String -> IO ()
safeStall reason = do
  putStrLn "RESULT: SAFE_STALL"
  putStrLn ("SAFE_STALL_REASON: " <> reason)

inspectEvidence :: FilePath -> IO ()
inspectEvidence evidenceDir = do
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
        else inspectManifest evidenceDir manifestPath


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
      rendered = show report
      reportPath = evidenceDir <> "/ledger-evaluation-report.txt"
      failures = length [ () | Left _ <- Map.elems report ]
      successes = length [ () | Right _ <- Map.elems report ]

      contextDigest bytes =
        BSC.unpack (B16.encode (SHA256.hash bytes))

  BS.writeFile reportPath (TE.encodeUtf8 (Text.pack rendered))
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
          putStrLn "RESULT: LEDGER_ALIGNED_SCRIPT_FAILURE"
          putStrLn "ACCEPTANCE: B — exact artifact produced ledger-originated failure report(s)."


inspectManifest :: FilePath -> FilePath -> IO ()
inspectManifest evidenceDir manifestPath = do
  manifestBytes <- BS.readFile manifestPath

  case Aeson.eitherDecodeStrict' manifestBytes :: Either String Aeson.Value of
    Left err -> do
      safeStall "INVALID_MANIFEST"
      putStrLn ("MANIFEST_ERROR: " <> err)

    Right (Aeson.Object manifest) ->
      case KeyMap.lookup "policy" manifest of
        Just (Aeson.Object policy) ->
          case KeyMap.lookup "typed_context_ready" policy of
            Just (Aeson.Bool False) -> decodeTypedArtifacts evidenceDir
            Just (Aeson.Bool True) -> decodeTypedArtifacts evidenceDir

            _ -> safeStall "INVALID_MANIFEST_TYPED_CONTEXT_FLAG"

        _ -> safeStall "INVALID_MANIFEST_POLICY"

    Right _ -> safeStall "INVALID_MANIFEST_SHAPE"

decodeTypedArtifacts :: FilePath -> IO ()
decodeTypedArtifacts evidenceDir = do
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
                      evaluateLedger tx pp utxo epochInfo systemStart evidenceDir



