{-# LANGUAGE OverloadedStrings #-}

-- Test-only fixture producer. Values and Plutus Data encodings come from the
-- canonical Types.hs declarations; this executable does not evaluate validator
-- behavior and is not a production artifact.
module Main where

import qualified Data.Aeson as Aeson
import Data.Aeson ((.=), object)
import qualified Data.ByteString.Base16 as B16
import qualified Data.ByteString.Lazy as BSL
import qualified Data.Text.Encoding as TE
import qualified PlutusTx
import qualified PlutusTx.Builtins as Builtins
import PlutusLedgerApi.V2 (ScriptHash (..))
import System.Environment (getArgs)
import Types
  ( BeaconStatus (..)
  , BeaconTarget (..)
  , B1PrizePoolDatum (..)
  , PrizeAction (..)
  , PrizeDatum (..)
  , PrizeStatus (..)
  )

hexData :: PlutusTx.ToData a => a -> String
hexData value =
  let encoded = Builtins.serialiseData (PlutusTx.toBuiltinData value)
      bytes = Builtins.fromBuiltin encoded
  in show (TE.decodeUtf8 (B16.encode bytes))

sampleTarget :: BeaconTarget
sampleTarget =
  BeaconTarget
    { btNetworkId = 0
    , btRound = 42
    , btMainchainRef = "010203"
    , btVersion = "v1"
    }

samplePrizeDatum :: PrizeDatum
samplePrizeDatum =
  PrizeDatum
    { pdTicketPolicy = "a1"
    , pdTicketName = "01"
    , pdPlayerCommitment = "02"
    , pdPriceUsdm = 100
    , pdCommitment = "03"
    , pdGameVersion = "classic-6-v1"
    , pdTicketNonce = 7
    , pdPrizeAmount = 0
    , pdPaymentPolicy = "04"
    , pdPaymentName = "05"
    , pdStatus = Pending
    , pdResult = ""
    , pdPrizeTier = 0
    , pdBeaconTarget = sampleTarget
    , pdBeaconStatus = BeaconReady
    , pdBeaconValue = "06"
    , pdMcHash = "07"
    , pdMateriosContext = "08"
    , pdPrizePoolHash = "09"
    , pdIssuedAt = 1000
    , pdExpiresAt = 9000
    , pdRow1Tier = 0
    , pdRow2Tier = 0
    }

samplePoolDatum :: B1PrizePoolDatum
samplePoolDatum =
  B1PrizePoolDatum
    { ppTotalLiquidity = 100000
    , ppPendingLiabilities = 1000
    , ppUnresolvedReserve = 500
    , ppUnresolvedTicketCount = 8
    , ppLockedJackpot = 2000
    , ppJackpotThreshold = 5000
    , ppSuspendedClasses = 0
    , ppPrizeHash = ScriptHash "06"
    }

main :: IO ()
main = do
  args <- getArgs
  let outputPath = case args of
        [path] -> path
        _ -> "reveal-schema-fixtures.json"
      fixture =
        object
          [ "schema" .= ("pre-rich-reveal-plutus-data-v1" :: String)
          , "producer" .= ("plutus/test/RevealSchemaFixtures.hs" :: String)
          , "canonicalSource" .= ("plutus/Types.hs" :: String)
          , "fixtures" .=
              object
                [ "PrizeDatum.pending" .= hexData samplePrizeDatum
                , "PrizeAction.SyncBeacon" .= hexData SyncBeacon
                , "PrizeAction.Reveal" .= hexData (Reveal "secret")
                , "PrizeAction.Claim" .= hexData Claim
                , "PrizeAction.Expire" .= hexData Expire
                , "BeaconTarget" .= hexData sampleTarget
                , "B1PrizePoolDatum" .= hexData samplePoolDatum
                ]
          ]
  BSL.writeFile outputPath (Aeson.encode fixture <> "\n")
  putStrLn ("Wrote canonical Haskell Plutus Data fixtures: " <> outputPath)
