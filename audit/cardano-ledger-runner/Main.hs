{-# LANGUAGE OverloadedStrings #-}

module Main (main) where

import qualified Data.Aeson as Aeson
import qualified Crypto.Hash.SHA256 as SHA256
import qualified Data.ByteString.Base16 as B16
import qualified Data.Aeson.Key as Key
import qualified Data.Aeson.KeyMap as KeyMap
import Data.Char (isHexDigit, toLower)
import Data.Time.Clock.POSIX (posixSecondsToUTCTime)
import Data.Time.Format (defaultTimeLocale, formatTime)
import qualified Data.ByteString as BS
import qualified Data.ByteString.Lazy as BSL
import qualified Data.ByteString.Char8 as BSC
import qualified Data.Map.Strict as Map
import qualified Data.Text as Text
import qualified Data.Text.Encoding as TE
import Data.Aeson ((.=), object, toJSON)
import Cardano.Ledger.Api (ConwayEra, PParams, Tx)
import Cardano.Ledger.Core (TopTx)
import Cardano.Ledger.State (UTxO)
import Cardano.Ledger.Alonzo.Plutus.Evaluate
  ( RedeemerReportWithLogs
  , TransactionScriptFailure (..)
  )
import Cardano.Slotting.EpochInfo.API (EpochInfo)
import Cardano.Slotting.Time (SystemStart)
import System.Directory (doesFileExist)
import System.Environment (getArgs, lookupEnv)
import System.Exit (exitFailure)
import TypedPacketDecode
  ( decodeConwayPParams
  , decodeConwayTx
  , decodeConwayUTxO
  , decodeYaciEpochInfo
  , decodeYaciSystemStart
  , evaluateConwayTx
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
  , "reveal-transition.json"
  , "utxo.json"
  , "transaction-metadata.json"
  , "block-metadata.json"
  , "pparams.json"
  , "protocol-parameters-raw.json"
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

hashedEvidence :: [FilePath]
hashedEvidence =
  [ "tx.cbor"
  , "reveal-transition.json"
  , "utxo.json"
  , "transaction-metadata.json"
  , "block-metadata.json"
  , "pparams.json"
  , "protocol-parameters-raw.json"
  , "epoch-info.json"
  , "system-start.json"
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
  exitFailure

inspectEvidence :: FilePath -> Bool -> IO ()
inspectEvidence evidenceDir runEvaluation = do
  let paths = map (\file -> evidenceDir <> "/" <> file) canonicalEvidence
      rawPaths = map (\file -> evidenceDir <> "/" <> file) rawHandoffEvidence
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
          putStrLn
            "Raw Yaci handoff is present, but typed UTxO/PParams/EpochInfo/SystemStart packet files are not materialized."
          putStrLn
            "No synthetic transaction, UTxO, PParams, EpochInfo or SystemStart will be substituted."
          safeStall "LEDGER_TYPED_CONTEXT_NOT_MATERIALIZED"
        else do
          putStrLn
            "No synthetic transaction, UTxO, PParams, EpochInfo or SystemStart will be substituted."
          safeStall "INCOMPLETE_LEDGER_EVIDENCE"
    else do
      nonEmpty <- mapM (fmap (not . BS.null) . BS.readFile) paths
      if not (and nonEmpty)
        then safeStall "EMPTY_LEDGER_EVIDENCE_FILE"
        else inspectManifest evidenceDir manifestPath runEvaluation


renderRedeemerReport :: RedeemerReportWithLogs ConwayEra -> Aeson.Value
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
  Tx TopTx ConwayEra ->
  PParams ConwayEra ->
  UTxO ConwayEra ->
  EpochInfo (Either Text.Text) ->
  SystemStart ->
  FilePath ->
  IO ()
prefixOf :: String -> String -> Bool
prefixOf needle value = take (length needle) value == needle

evaluateLedger tx pp utxo epochInfo systemStart evidenceDir = do
  let report = evaluateConwayTx pp tx utxo epochInfo systemStart
      renderedJson = renderRedeemerReport report
      reportPath = evidenceDir <> "/ledger-evaluation-report.json"
      failures = length [ () | Left _ <- Map.elems report ]
      successes = length [ () | Right _ <- Map.elems report ]
      executionFailures =
        length
          [ ()
          | Left failure <- Map.elems report
          , prefixOf "ValidationFailure" (show failure)
          ]
      contextFailures =
        length
          [ ()
          | Left failure <- Map.elems report
          , prefixOf "ContextError" (show failure)
          ]
      ledgerFailures = failures - executionFailures - contextFailures

      contextDigest bytes =
        TE.decodeUtf8 (B16.encode (SHA256.hash bytes))

  txBytes <- BS.readFile (evidenceDir <> "/tx.cbor")
  ppBytes <- BS.readFile (evidenceDir <> "/pparams.json")
  utxoBytes <- BS.readFile (evidenceDir <> "/utxo.json")
  epochBytes <- BS.readFile (evidenceDir <> "/epoch-info.json")
  systemStartBytes <- BS.readFile (evidenceDir <> "/system-start.json")

  BS.writeFile reportPath (BSL.toStrict (Aeson.encode renderedJson))
  reportBytes <- BS.readFile reportPath
  let reportDigest = TE.decodeUtf8 (B16.encode (SHA256.hash reportBytes))
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
      putStrLn "EVALUATION_STATUS: NOT_EVIDENT"
      safeStall "NO_REDEEMERS_FOUND"
    else do
      putStrLn "EVALUATION_STATUS: COMPLETED"
      if failures == 0
        then do
          putStrLn "RESULT: LEDGER_ALIGNED_EVALUATION_SUCCESS"
          putStrLn "ACCEPTANCE: A — exact artifact evaluated under Cardano-ledger semantics."
        else
          if executionFailures == failures
            then do
              putStrLn "RESULT: LEDGER_ALIGNED_EVALUATION_FAILURE"
              putStrLn
                "ACCEPTANCE: B — every reported redeemer failure is a Cardano-ledger Plutus ValidationFailure for the exact transaction."
            else do
              putStrLn "RESULT: SAFE_STALL"
              putStrLn "ACCEPTANCE: NONE — one or more failures are unresolved script/context/ledger failures, not proven Plutus validator failures."
              safeStall "NON_EXECUTION_LEDGER_FAILURE"


inspectManifest :: FilePath -> FilePath -> Bool -> IO ()
inspectManifest evidenceDir manifestPath runEvaluation = do
  manifestBytes <- BS.readFile manifestPath

  case Aeson.eitherDecodeStrict' manifestBytes :: Either String Aeson.Value of
    Left err -> do
      putStrLn ("MANIFEST_ERROR: " <> err)
      safeStall "INVALID_MANIFEST"

    Right (Aeson.Object manifest) -> do
      validation <- verifyFullManifest evidenceDir manifest
      case validation of
        Left err -> do
          putStrLn ("MANIFEST_VALIDATION_ERROR: " <> err)
          safeStall err
        Right () -> do
          putStrLn "RESULT: MANIFEST_SHA256_BINDING_VERIFIED"
          putStrLn "RESULT: WORKFLOW_COMMIT_RUN_BINDING_VERIFIED"
          putStrLn "RESULT: TRANSACTION_SLOT_TIME_BINDING_VERIFIED"
          putStrLn "RESULT: TRANSACTION_REFERENCE_AND_CBOR_BINDING_VERIFIED"
          case KeyMap.lookup "policy" manifest of
            Just (Aeson.Object policy) ->
              case KeyMap.lookup "typed_context_ready" policy of
                Just (Aeson.Bool False) -> decodeTypedArtifacts evidenceDir runEvaluation
                Just (Aeson.Bool True) -> decodeTypedArtifacts evidenceDir runEvaluation
                _ -> safeStall "INVALID_MANIFEST_TYPED_CONTEXT_FLAG"
            _ -> safeStall "INVALID_MANIFEST_POLICY"

    Right _ -> safeStall "INVALID_MANIFEST_SHAPE"

verifyFullManifest :: FilePath -> Aeson.Object -> IO (Either String ())
verifyFullManifest evidenceDir manifest = do
  hashResult <- verifyManifestFileHashes evidenceDir manifest
  case hashResult of
    Left err -> pure (Left err)
    Right () -> do
      workflowResult <- verifyWorkflowBinding manifest
      case workflowResult of
        Left err -> pure (Left err)
        Right () -> verifyTransactionObservation evidenceDir manifest

verifyWorkflowBinding :: Aeson.Object -> IO (Either String ())
verifyWorkflowBinding manifest =
  case KeyMap.lookup (Key.fromString "workflow_binding") manifest of
    Just (Aeson.Object binding) -> do
      results <- mapM (checkBinding binding)
        [ ("repository", "GITHUB_REPOSITORY")
        , ("workflow", "GITHUB_WORKFLOW")
        , ("ref", "GITHUB_REF")
        , ("commit_sha", "GITHUB_SHA")
        , ("run_id", "GITHUB_RUN_ID")
        , ("run_attempt", "GITHUB_RUN_ATTEMPT")
        ]
      case [err | Left err <- results] of
        [] -> pure (Right ())
        err : _ -> pure (Left err)
    _ -> pure (Left "WORKFLOW_BINDING_MISSING_OR_INVALID")
  where
    checkBinding binding (field, envName) = do
      expected <- lookupEnv envName
      pure $ case (KeyMap.lookup (Key.fromString field) binding, expected) of
        (Just (Aeson.String actual), Just expectedValue)
          | Text.unpack actual == expectedValue -> Right ()
        _ -> Left ("WORKFLOW_BINDING_MISMATCH:" <> field)

verifyTransactionObservation :: FilePath -> Aeson.Object -> IO (Either String ())
verifyTransactionObservation evidenceDir manifest = do
  txBytes <- BS.readFile (evidenceDir <> "/tx.cbor")
  transitionBytes <- BS.readFile (evidenceDir <> "/reveal-transition.json")
  utxoBytes <- BS.readFile (evidenceDir <> "/utxo.json")
  txMetadataBytes <- BS.readFile (evidenceDir <> "/transaction-metadata.json")
  blockMetadataBytes <- BS.readFile (evidenceDir <> "/block-metadata.json")
  pure $ do
    transitionValue <- (Aeson.eitherDecodeStrict' transitionBytes :: Either String Aeson.Value)
    utxoValue <- (Aeson.eitherDecodeStrict' utxoBytes :: Either String Aeson.Value)
    txMetadataValue <- (Aeson.eitherDecodeStrict' txMetadataBytes :: Either String Aeson.Value)
    blockMetadataValue <- (Aeson.eitherDecodeStrict' blockMetadataBytes :: Either String Aeson.Value)
    transition <- expectObject "REVEAL_TRANSITION" transitionValue
    utxoObject <- expectObject "UTXO_CONTEXT" utxoValue
    txMetadata <- expectObject "TRANSACTION_METADATA" txMetadataValue
    blockMetadata <- expectObject "BLOCK_METADATA" blockMetadataValue

    manifestTxHash <- manifestText manifest "transaction_hash"
    transitionTxHash <- manifestText transition "transactionRef"
    transitionTxCborHex <- manifestText transition "txCbor"
    transitionTxCbor <- case B16.decode (BSC.pack transitionTxCborHex) of
      Left _ -> Left "TRANSITION_TX_CBOR_INVALID_HEX"
      Right bytes -> Right bytes
    utxoTxHash <- manifestText utxoObject "transactionRef"
    observation <- manifestObject manifest "transaction_observation"
    observationTxHash <- manifestText observation "transaction_hash"
    txMetadataHash <- manifestText txMetadata "hash"
    txMetadataSlot <- manifestInteger txMetadata "slot"
    txMetadataHeight <- manifestInteger txMetadata "block_height"
    blockMetadataHash <- manifestText blockMetadata "hash"
    blockMetadataSlot <- manifestInteger blockMetadata "slot"
    blockMetadataHeight <- manifestInteger blockMetadata "height"
    blockMetadataNumber <- manifestInteger blockMetadata "number"
    blockMetadataTime <- manifestInteger blockMetadata "time"
    slot <- manifestInteger observation "slot"
    blockSlot <- manifestInteger observation "block_slot"
    blockHeight <- manifestInteger observation "block_height"
    blockNumber <- manifestInteger observation "block_number"
    blockTime <- manifestInteger observation "block_time_unix_seconds"
    blockHash <- manifestText observation "block_hash"
    blockTimeIso <- manifestText observation "block_time_iso"
    acquiredAt <- manifestText manifest "acquired_at"
    observedAt <- manifestText observation "observed_at"

    if length manifestTxHash /= 64 || not (all isHexDigit manifestTxHash)
      then Left "TRANSACTION_REFERENCE_INVALID"
      else pure ()
    if any (\candidate -> map toLower candidate /= map toLower manifestTxHash)
         [transitionTxHash, utxoTxHash, observationTxHash, txMetadataHash]
      then Left "TRANSACTION_REFERENCE_BINDING_MISMATCH"
      else pure ()
    if transitionTxCbor /= txBytes
      then Left "TRANSITION_TX_CBOR_MISMATCH"
      else pure ()
    if slot < 0 || blockHeight < 0
      then Left "TRANSACTION_OBSERVATION_NEGATIVE_SLOT_OR_HEIGHT"
      else pure ()
    if slot /= blockSlot || slot /= txMetadataSlot || slot /= blockMetadataSlot
      then Left "TRANSACTION_BLOCK_SLOT_MISMATCH"
      else pure ()
    if blockHeight /= blockNumber || blockHeight /= txMetadataHeight ||
       blockHeight /= blockMetadataHeight || blockHeight /= blockMetadataNumber
      then Left "TRANSACTION_BLOCK_HEIGHT_MISMATCH"
      else pure ()
    if blockTime <= 0 || blockTime /= blockMetadataTime || null blockTimeIso
      then Left "TRANSACTION_BLOCK_TIME_INVALID"
      else pure ()
    let expectedBlockTimeIso =
          formatTime defaultTimeLocale "%Y-%m-%dT%H:%M:%S"
            (posixSecondsToUTCTime (fromInteger blockTime)) <> ".000Z"
    if blockTimeIso /= expectedBlockTimeIso
      then Left "TRANSACTION_BLOCK_TIME_ISO_MISMATCH"
      else pure ()
    if length blockHash /= 64 || not (all isHexDigit blockHash)
      then Left "TRANSACTION_BLOCK_HASH_INVALID"
      else pure ()
    if map toLower blockHash /= map toLower blockMetadataHash
      then Left "TRANSACTION_BLOCK_HASH_BINDING_MISMATCH"
      else pure ()
    if null acquiredAt || observedAt /= acquiredAt
      then Left "TRANSACTION_OBSERVATION_TIMESTAMP_BINDING_MISMATCH"
      else pure ()

expectObject :: String -> Aeson.Value -> Either String Aeson.Object
expectObject _ (Aeson.Object objectValue) = Right objectValue
expectObject label _ = Left (label <> "_NOT_OBJECT")

manifestValue :: Aeson.Object -> String -> Either String Aeson.Value
manifestValue source field =
  maybe (Left ("MANIFEST_FIELD_MISSING:" <> field)) Right
    (KeyMap.lookup (Key.fromString field) source)

manifestObject :: Aeson.Object -> String -> Either String Aeson.Object
manifestObject source field = do
  value <- manifestValue source field
  case value of
    Aeson.Object objectValue -> Right objectValue
    _ -> Left ("MANIFEST_FIELD_NOT_OBJECT:" <> field)

manifestText :: Aeson.Object -> String -> Either String String
manifestText source field = do
  value <- manifestValue source field
  case value of
    Aeson.String textValue -> Right (Text.unpack textValue)
    _ -> Left ("MANIFEST_FIELD_NOT_TEXT:" <> field)

manifestInteger :: Aeson.Object -> String -> Either String Integer
manifestInteger source field = do
  value <- manifestValue source field
  case Aeson.fromJSON value :: Aeson.Result Integer of
    Aeson.Success number -> Right number
    Aeson.Error _ -> Left ("MANIFEST_FIELD_NOT_INTEGER:" <> field)

verifyManifestFileHashes :: FilePath -> Aeson.Object -> IO (Either String ())
verifyManifestFileHashes evidenceDir manifest = do
  case KeyMap.lookup "sha256" manifest of
    Just (Aeson.Object hashes) -> do
      results <- mapM (verifyOne hashes) hashedEvidence
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

  case decodeConwayPParams ppBytes of
    Left err -> do
      putStrLn ("PPARAMS_ERROR: " <> err)
      safeStall "PPARAMS_NATIVE_DECODE_FAILED"

    Right pp ->
      case decodeConwayTx pp txBytes of
        Left err -> do
          putStrLn ("TX_ERROR: " <> err)
          safeStall "BABBAGE_TX_NATIVE_DECODE_FAILED"

        Right tx ->
          case decodeConwayUTxO pp utxoBytes of
            Left err -> do
              putStrLn ("UTXO_ERROR: " <> err)
              safeStall "YACI_UTXO_NATIVE_DECODE_FAILED"

            Right utxo ->
              case decodeYaciEpochInfo epochBytes of
                Left err -> do
                  putStrLn ("EPOCH_INFO_ERROR: " <> err)
                  safeStall "YACI_EPOCH_INFO_DECODE_FAILED"

                Right epochInfo ->
                  case decodeYaciSystemStart systemStartBytes of
                    Left err -> do
                      putStrLn ("SYSTEM_START_ERROR: " <> err)
                      safeStall "YACI_SYSTEM_START_DECODE_FAILED"

                    Right systemStart -> do
                      putStrLn "RESULT: TYPED_CONWAY_CONTEXT_DECODED"
                      putStrLn
                        "PParams, transaction, consumed UTxO, EpochInfo and SystemStart decoded with native Ledger types."
                      if runEvaluation
                        then evaluateLedger tx pp utxo epochInfo systemStart evidenceDir
                        else putStrLn "EVALUATION_STATUS: NOT_REQUESTED"



