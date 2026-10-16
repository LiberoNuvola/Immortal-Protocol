{-# LANGUAGE OverloadedStrings #-}

-- Test-only fixture producer. Values and Plutus Data encodings come from the
-- canonical Types.hs declarations; this executable does not evaluate validator
-- behavior and is not a production artifact.
module Main where

import qualified Data.Aeson as Aeson
import Data.Aeson ((.=), object)
import qualified Data.ByteString as BS
import qualified Data.ByteString.Base16 as B16
import qualified Data.ByteString.Lazy as BSL
import qualified Data.Text as T
import qualified Data.Text.Encoding as TE
import qualified PlutusTx
import qualified PlutusTx.Builtins as Builtins
import PlutusLedgerApi.V2 (ScriptHash (..))
import Beacon (deriveBeacon, deriveSymbolsSeed, deriveTicketSeed, encodeBeaconTarget, playerCommitment, ticketCommitment)
import GameRules (classifyRowTier, defaultPrizeTable, generateSymbols, prizeAmountForTier, rowPayoutTotal)
import System.Environment (getArgs)
import Types
  ( BeaconStatus (..)
  , BeaconTarget (..)
  , B1PrizePoolDatum (..)
  , PrizeAction (..)
  , PrizeDatum (..)
  , PrizeStatus (..)
  )

hexBuiltin :: Builtins.BuiltinByteString -> String
hexBuiltin bytes = T.unpack (TE.decodeUtf8 (B16.encode (Builtins.fromBuiltin bytes)))

hexData :: PlutusTx.ToData a => a -> String
hexData value =
  let encoded = Builtins.serialiseData (PlutusTx.toBuiltinData value)
      bytes = Builtins.fromBuiltin encoded
  in T.unpack (TE.decodeUtf8 (B16.encode bytes))

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

rowTierCase :: String -> [Integer] -> Aeson.Value
rowTierCase name symbols =
  let rowBytes = BS.pack (map fromInteger symbols)
      row = Builtins.toBuiltin rowBytes
  in object
       [ "name" .= name
       , "rowHex" .= T.unpack (TE.decodeUtf8 (B16.encode rowBytes))
       , "expectedTier" .= classifyRowTier row
       ]

prizeAmountCase :: String -> Integer -> Integer -> Aeson.Value
prizeAmountCase name tier price =
  object
    [ "name" .= name
    , "tier" .= tier
    , "priceUsdm" .= price
    , "expectedAmount" .= prizeAmountForTier defaultPrizeTable tier price
    ]

payoutCase :: String -> Integer -> Integer -> Integer -> Aeson.Value
payoutCase name row1Tier row2Tier price =
  object
    [ "name" .= name
    , "row1Tier" .= row1Tier
    , "row2Tier" .= row2Tier
    , "priceUsdm" .= price
    , "expectedPayout" .= rowPayoutTotal defaultPrizeTable row1Tier row2Tier price
    ]

cryptoFixtures :: Aeson.Value
cryptoFixtures =
  let raw bytes = Builtins.toBuiltin (BS.pack bytes)
      playerSecret = raw [170, 187, 204, 221]
      ticketId = raw [222, 173, 190, 239]
      mainchainRef = raw [1, 2, 3]
      mcHash = raw [17, 34, 51, 68]
      materiosContext = raw [85, 102, 119]
      gameVersion = "classic-6-v1"
      target = BeaconTarget
        { btNetworkId = 0
        , btRound = 42
        , btMainchainRef = mainchainRef
        , btVersion = "v1"
        }
      player = playerCommitment 42 7 playerSecret
      targetEncoded = encodeBeaconTarget target
      ticket = ticketCommitment ticketId player gameVersion 7 100 targetEncoded
      beacon = deriveBeacon 0 42 mainchainRef mcHash materiosContext "v1"
      ticketSeed = deriveTicketSeed 42 7 playerSecret beacon gameVersion
      symbolsSeed = deriveSymbolsSeed ticketSeed
      symbols = generateSymbols symbolsSeed
  in object
       [ "playerSecretHex" .= ("aabbccdd" :: String)
       , "ticketIdHex" .= ("deadbeef" :: String)
       , "mainchainRefHex" .= ("010203" :: String)
       , "mcHashHex" .= ("11223344" :: String)
       , "materiosContextHex" .= ("556677" :: String)
       , "gameVersionHex" .= ("636c61737369632d362d7631" :: String)
       , "targetEncodedHex" .= hexBuiltin targetEncoded
       , "playerCommitmentHex" .= hexBuiltin player
       , "ticketCommitmentHex" .= hexBuiltin ticket
       , "beaconHex" .= hexBuiltin beacon
       , "ticketSeedHex" .= hexBuiltin ticketSeed
       , "symbolsSeedHex" .= hexBuiltin symbolsSeed
       , "symbolsHex" .= hexBuiltin symbols
       ]

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
          , "semanticFixtures" .=
              object
                [ "rowTierCases" .=
                    [ rowTierCase "tier_one_triple" [1, 1, 1]
                    , rowTierCase "tier_five_triple" [5, 5, 5]
                    , rowTierCase "mixed_row_loss" [1, 2, 1]
                    , rowTierCase "out_of_range_symbol_loss" [6, 6, 6]
                    , rowTierCase "short_row_loss" [2, 2]
                    ]
                , "prizeAmountCases" .=
                    [ prizeAmountCase "tier_one_odd_price" 1 101
                    , prizeAmountCase "tier_four" 4 100
                    , prizeAmountCase "tier_five" 5 100
                    , prizeAmountCase "invalid_tier" 6 100
                    , prizeAmountCase "zero_price" 5 0
                    ]
                , "payoutCases" .=
                    [ payoutCase "loss_zero_payout" 0 0 100
                    , payoutCase "single_tier_one_win" 1 0 100
                    , payoutCase "tier_one_and_two_win" 1 2 100
                    , payoutCase "maximum_payout_cap" 4 5 100
                    ]
                ]
          ]
  BSL.writeFile outputPath (Aeson.encode fixture <> "\n")
  putStrLn ("Wrote canonical Haskell Plutus Data fixtures: " <> outputPath)
