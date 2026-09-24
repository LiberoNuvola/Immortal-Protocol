{-# LANGUAGE OverloadedStrings #-}

module Main (main) where

import qualified Data.ByteString as BS
import System.Directory (doesFileExist)
import System.Environment (getArgs)
import TypedPacketDecode (decodeBabbagePParams, decodeBabbageTx)

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
    then do
      putStrLn "RESULT: SAFE_STALL"
      putStrLn "SAFE_STALL_REASON: EXACT_PLUTUS_ARTIFACT_MISSING"
    else do
      sizes <- mapM (fmap BS.length . BS.readFile) artifactPaths
      putStrLn ("artifact bytes: " <> show sizes)
      if any (== 0) sizes
        then do
          putStrLn "RESULT: SAFE_STALL"
          putStrLn "SAFE_STALL_REASON: EMPTY_EXACT_PLUTUS_ARTIFACT"
        else do
          let paths = map (evidenceDir <> "/") canonicalEvidence
              rawPaths = map (evidenceDir <> "/") rawHandoffEvidence
              manifestPath = evidenceDir <> "/manifest.json"
          present <- mapM doesFileExist paths
          rawPresent <- mapM doesFileExist rawPaths
          mapM_ (\(p, ok) -> putStrLn (p <> if ok then " [present]" else " [missing]"))
                (zip paths present)
          mapM_ (\(p, ok) -> putStrLn ("raw/" <> p <> if ok then " [present]" else " [missing]"))
                (zip rawPaths rawPresent)

          if not (and present)
            then do
              if and rawPresent
                then do
                  putStrLn "RESULT: SAFE_STALL"
                  putStrLn "SAFE_STALL_REASON: LEDGER_TYPED_CONTEXT_NOT_MATERIALIZED"
                  putStrLn "Raw Yaci handoff is present, but typed UTxO/PParams/EpochInfo/SystemStart packet files are not materialized."
                  putStrLn "No synthetic transaction, UTxO, PParams, EpochInfo or SystemStart will be substituted."
                else do
                  putStrLn "RESULT: SAFE_STALL"
                  putStrLn "SAFE_STALL_REASON: INCOMPLETE_LEDGER_EVIDENCE"
                  putStrLn "No synthetic transaction, UTxO, PParams, EpochInfo or SystemStart will be substituted."
            else do
              nonEmpty <- mapM (fmap (not . BS.null) . BS.readFile) paths
              if not (and nonEmpty)
                then do
                  putStrLn "RESULT: SAFE_STALL"
                  putStrLn "SAFE_STALL_REASON: EMPTY_LEDGER_EVIDENCE_FILE"
                else do
                  manifest <- BS.readFile manifestPath
                  if BS.isInfixOf "\"typed_context_ready\": false" manifest
                    then do
                      putStrLn "RESULT: SAFE_STALL"
                      putStrLn "SAFE_STALL_REASON: LEDGER_TYPED_CONTEXT_NOT_READY"
                      putStrLn "Manifest explicitly records raw Yaci materialization only; UTxO/EpochInfo/SystemStart are not typed ledger objects."
                      putStrLn "No synthetic transaction, UTxO, PParams, EpochInfo or SystemStart will be substituted."
                    else do
                      txBytes <- BS.readFile (evidenceDir <> "/tx.cbor")
                      ppBytes <- BS.readFile (evidenceDir <> "/pparams.json")
                      case decodeBabbagePParams ppBytes of
                        Left err -> do
                          putStrLn "RESULT: SAFE_STALL"
                          putStrLn ("SAFE_STALL_REASON: PPARAMS_NATIVE_DECODE_FAILED: " <> err)
                        Right pp ->
                          case decodeBabbageTx pp txBytes of
                            Left err -> do
                              putStrLn "RESULT: SAFE_STALL"
                              putStrLn ("SAFE_STALL_REASON: BABBAGE_TX_NATIVE_DECODE_FAILED: " <> err)
                            Right _ -> do
                              putStrLn "RESULT: TYPED_BABBAGE_TX_PPARAMS_DECODED"
                              putStrLn "NEXT: materialize exact UTxO, EpochInfo and SystemStart, then invoke ledger-aligned evalTxExUnitsWithLogs."

  putStrLn "NO NORMATIVE A/B VERDICT: parsing/evaluation is intentionally not bypassed."
