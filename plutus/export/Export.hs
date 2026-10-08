{-# LANGUAGE OverloadedStrings #-}

module Main where

import qualified Data.Aeson             as Aeson
import           Data.Aeson             (object, (.=))
import qualified Data.ByteString.Base16 as B16
import qualified Data.ByteString.Lazy   as BSL
import qualified Data.ByteString.Short  as SBS
import           Data.Text              (Text)
import qualified Data.Text.Encoding     as TE
import           System.Directory       (createDirectoryIfMissing, getCurrentDirectory)
import           System.FilePath        (takeFileName)

import           PlutusLedgerApi.Common (serialiseCompiledCode)
import           PlutusTx.Code          (CompiledCode)

import qualified BeaconRegistry
import qualified B1PrizePool
import qualified CounterValidator
import qualified MintPolicy
import qualified PrizeValidator
import qualified Treasury
import qualified GenesisRegimeCarrier
import qualified GenesisCarrierMintPolicy
import qualified V3EconomicStateCarrier
import qualified V3EconomicStateCarrierMintPolicy
import qualified PreRichControlCarrier
import qualified PreRichControlCarrierMintPolicy

compiledCborHex :: CompiledCode a -> Text
compiledCborHex code =
  TE.decodeUtf8
    . B16.encode
    . SBS.fromShort
    $ serialiseCompiledCode code

writeScriptJson
  :: FilePath
  -> Text
  -> Text
  -> IO ()
writeScriptJson path description cborHex = do
  let env =
        object
          [ "type"        .= ("PlutusScriptV2" :: Text)
          , "description" .= description
          , "cborHex"     .= cborHex
          ]

  BSL.writeFile
    path
    (Aeson.encode env)

  putStrLn
    ("wrote " <> path)

main :: IO ()
main = do
  cwd <- getCurrentDirectory

  -- The Cabal package lives in ./plutus. Export paths are therefore
  -- normalized relative to the invocation directory:
  --   repo root  -> plutus/out
  --   repo/plutus -> out
  -- This prevents the accidental repo/plutus/plutus/out layout.
  let outputDir =
        if takeFileName cwd == "plutus"
          then "out"
          else "plutus/out"

  createDirectoryIfMissing True outputDir

  writeScriptJson
    (outputDir <> "/treasury.plutus.json")
    "PreRich Treasury validator"
    (compiledCborHex Treasury.compiledValidator)

  writeScriptJson
    (outputDir <> "/prizeValidatorFactory.plutus.json")
    "PreRich Prize validator factory (apply BeaconRegistry ScriptHash, PrizeTable, Oracle State singleton identity, oracle publisher off-chain)"
    (compiledCborHex PrizeValidator.compiledValidatorFactory)

  writeScriptJson
    (outputDir <> "/counterValidator.plutus.json")
    "PreRich Counter validator"
    (compiledCborHex CounterValidator.compiledValidator)

  writeScriptJson
    (outputDir <> "/mintPolicyFactory.plutus.json")
    "PreRich Mint policy factory (apply CounterHash, PrizeValidatorHash, BeaconRegistryHash, TreasuryHash, B1PrizePoolHash, Oracle State singleton identity, oracle publisher off-chain)"
    (compiledCborHex MintPolicy.compiledPolicyFactory)

  writeScriptJson
    (outputDir <> "/beaconRegistry.plutus.json")
    "PreRich BeaconRegistry validator (B1 authorized beacon publication, one UTxO per round)"
    (compiledCborHex BeaconRegistry.compiledValidator)

  writeScriptJson
    (outputDir <> "/genesisRegimeCarrier.plutus.json")
    "PreRich Genesis regime carrier validator"
    (compiledCborHex GenesisRegimeCarrier.compiledValidator)

  writeScriptJson
    (outputDir <> "/genesisCarrierMintPolicy.plutus.json")
    "PreRich Genesis regime carrier one-shot mint policy factory"
    (compiledCborHex GenesisCarrierMintPolicy.compiledPolicyFactory)

  writeScriptJson
    (outputDir <> "/v3EconomicStateCarrier.plutus.json")
    "PreRich V3 economic state carrier validator"
    (compiledCborHex V3EconomicStateCarrier.compiledValidator)

  writeScriptJson
    (outputDir <> "/v3EconomicStateCarrierMintPolicy.plutus.json")
    "PreRich V3 economic state carrier one-shot mint policy factory"
    (compiledCborHex V3EconomicStateCarrierMintPolicy.compiledPolicyFactory)

  writeScriptJson
    (outputDir <> "/preRichControlCarrier.plutus.json")
    "PreRich authenticated control carrier validator (CurrentActiveClass / HighestClassEverActivated)"
    (compiledCborHex PreRichControlCarrier.compiledValidatorFactory)

  writeScriptJson
    (outputDir <> "/preRichControlCarrierMintPolicy.plutus.json")
    "PreRich authenticated control carrier one-shot mint policy factory"
    (compiledCborHex PreRichControlCarrierMintPolicy.compiledPolicyFactory)

  writeScriptJson
    (outputDir <> "/b1PrizePoolFactory.plutus.json")
    "PreRich B1 PrizePool factory (apply PrizeValidator ScriptHash, Oracle State singleton identity, oracle publisher, pool singleton token off-chain)"
    (compiledCborHex B1PrizePool.compiledValidatorFactory)

  putStrLn
    ("Done. JSON scripts written to " <> outputDir)
