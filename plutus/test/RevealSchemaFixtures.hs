{-# LANGUAGE OverloadedStrings #-}

-- Test-only fixture producer and canonical Plutus V2 CEK conformance harness.
-- Fixtures use canonical Types.hs/GameRules/Beacon functions. No production
-- validator or protocol rule is changed by this executable.
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
import PlutusTx.Test (EvalResult (..), evaluateCompiledCode)
import PlutusLedgerApi.V1.Address (Address (..))
import PlutusLedgerApi.V1.Credential (Credential (..))
import PlutusLedgerApi.V1.Crypto (PubKeyHash (..))
import PlutusLedgerApi.V1.Interval (interval)
import PlutusLedgerApi.V1.Scripts (Datum (..))
import PlutusLedgerApi.V1.Time (POSIXTime (..))
import PlutusLedgerApi.V1.Tx (TxId (..), TxOutRef (..))
import PlutusLedgerApi.V1.Value (Value, CurrencySymbol (..), TokenName (..), adaSymbol, adaToken, singleton)
import PlutusLedgerApi.V2 (ScriptHash (..))
import PlutusLedgerApi.V2.Contexts (ScriptContext (..), ScriptPurpose (..), TxInInfo (..), TxInfo (..))
import PlutusLedgerApi.V2.Tx (OutputDatum (..), TxOut (..))
import qualified PlutusTx.AssocMap as AssocMap
import PrizeValidator (compiledValidatorFactory)
import Beacon (deriveBeacon, deriveSymbolsSeed, deriveTicketSeed, encodeBeaconTarget, field, playerCommitment, ticketCommitment)
import GameRules (classifyRowTier, classifyTier, defaultPrizeTable, generateSymbols, prizeAmountForTier, rowOutcomeIndex, rowPayoutTotal)
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

symbolsVectorCase :: String -> [Integer] -> Aeson.Value
symbolsVectorCase name seedBytes =
  let seed = Builtins.toBuiltin (BS.pack (map fromInteger seedBytes))
      symbols = generateSymbols seed
  in object
       [ "name" .= name
       , "seedHex" .= T.unpack (TE.decodeUtf8 (B16.encode (BS.pack (map fromInteger seedBytes))))
       , "symbolsHex" .= hexBuiltin symbols
       , "row1OutcomeIndex" .= rowOutcomeIndex seed 1
       , "row2OutcomeIndex" .= rowOutcomeIndex seed 2
       , "row1FirstDraw" .= firstDraw seed 1
       ]
  where
    firstDraw seed row =
      let digest = Builtins.sha2_256
            (Builtins.appendByteString
              (Builtins.consByteString row (Builtins.consByteString 0 Builtins.emptyByteString))
              seed)
      in Builtins.indexByteString digest 0 * 256 + Builtins.indexByteString digest 1

rawBytes :: [Integer] -> Builtins.BuiltinByteString
rawBytes bytes = Builtins.toBuiltin (BS.pack (map fromInteger bytes))

statusName :: PrizeStatus -> String
statusName status = case status of
  Pending -> "Pending"
  Revealed -> "Revealed"
  Claimed -> "Claimed"

beaconStatusName :: BeaconStatus -> String
beaconStatusName status = case status of
  BeaconPending -> "BeaconPending"
  BeaconReady -> "BeaconReady"

prizeDatumSnapshot :: PrizeDatum -> Aeson.Value
prizeDatumSnapshot d =
  object
    [ "dataHex" .= hexData d
    , "fields" .= object
        [ "ticketPolicyHex" .= hexBuiltin (pdTicketPolicy d)
        , "ticketNameHex" .= hexBuiltin (pdTicketName d)
        , "playerCommitmentHex" .= hexBuiltin (pdPlayerCommitment d)
        , "priceUsdm" .= pdPriceUsdm d
        , "commitmentHex" .= hexBuiltin (pdCommitment d)
        , "gameVersionHex" .= hexBuiltin (pdGameVersion d)
        , "ticketNonce" .= pdTicketNonce d
        , "prizeAmount" .= pdPrizeAmount d
        , "paymentPolicyHex" .= hexBuiltin (pdPaymentPolicy d)
        , "paymentNameHex" .= hexBuiltin (pdPaymentName d)
        , "status" .= statusName (pdStatus d)
        , "resultHex" .= hexBuiltin (pdResult d)
        , "prizeTier" .= pdPrizeTier d
        , "beaconTarget" .= object
            [ "networkId" .= btNetworkId (pdBeaconTarget d)
            , "round" .= btRound (pdBeaconTarget d)
            , "mainchainRefHex" .= hexBuiltin (btMainchainRef (pdBeaconTarget d))
            , "versionHex" .= hexBuiltin (btVersion (pdBeaconTarget d))
            ]
        , "beaconStatus" .= beaconStatusName (pdBeaconStatus d)
        , "beaconValueHex" .= hexBuiltin (pdBeaconValue d)
        , "mcHashHex" .= hexBuiltin (pdMcHash d)
        , "materiosContextHex" .= hexBuiltin (pdMateriosContext d)
        , "prizePoolHashHex" .= hexBuiltin (pdPrizePoolHash d)
        , "issuedAt" .= pdIssuedAt d
        , "expiresAt" .= pdExpiresAt d
        , "row1Tier" .= pdRow1Tier d
        , "row2Tier" .= pdRow2Tier d
        ]
    ]

poolDatumSnapshot :: B1PrizePoolDatum -> Aeson.Value
poolDatumSnapshot d =
  let ScriptHash prizeHash = ppPrizeHash d
  in object
    [ "dataHex" .= hexData d
    , "fields" .= object
        [ "totalLiquidity" .= ppTotalLiquidity d
        , "pendingLiabilities" .= ppPendingLiabilities d
        , "unresolvedReserve" .= ppUnresolvedReserve d
        , "unresolvedTicketCount" .= ppUnresolvedTicketCount d
        , "lockedJackpot" .= ppLockedJackpot d
        , "jackpotThreshold" .= ppJackpotThreshold d
        , "suspendedClasses" .= ppSuspendedClasses d
        , "prizeHashHex" .= hexBuiltin prizeHash
        ]
    ]

-- Construct transition snapshots from the canonical Haskell crypto and game
-- functions. This deliberately does not evaluate mkValidator/ScriptContext.
scenarioForSecret
  :: [Integer]
  -> (PrizeDatum, PrizeDatum, B1PrizePoolDatum, B1PrizePoolDatum, Integer, Integer, Integer)
scenarioForSecret secretBytes =
  let
    secret = rawBytes secretBytes
    ticketId = rawBytes [222, 173, 190, 239]
    mainchainRef = rawBytes [1, 2, 3]
    mcHash = rawBytes [17, 34, 51, 68]
    materiosContext = rawBytes [85, 102, 119]
    gameVersion = "classic-6-v1"
    target = BeaconTarget
      { btNetworkId = 0
      , btRound = 42
      , btMainchainRef = mainchainRef
      , btVersion = "v1"
      }
    player = playerCommitment 42 7 secret
    targetEncoded = encodeBeaconTarget target
    ticket = ticketCommitment ticketId player gameVersion 7 100 targetEncoded
    beacon = deriveBeacon 0 42 mainchainRef mcHash materiosContext "v1"
    ticketSeed = deriveTicketSeed 42 7 secret beacon gameVersion
    symbolsSeed = deriveSymbolsSeed ticketSeed
    symbols = generateSymbols symbolsSeed
    symbolsBytes = Builtins.fromBuiltin symbols
    row1Tier = classifyRowTier (Builtins.toBuiltin (BS.take 3 symbolsBytes))
    row2Tier = classifyRowTier (Builtins.toBuiltin (BS.drop 3 symbolsBytes))
    summaryTier = classifyTier symbols
    payout = rowPayoutTotal defaultPrizeTable row1Tier row2Tier 100
    result = Builtins.sha2_256
      (Builtins.appendByteString
        (field (Builtins.sha2_256 symbolsSeed))
        (field symbols))
    inputDatum = PrizeDatum
      { pdTicketPolicy = rawBytes [161]
      , pdTicketName = ticketId
      , pdPlayerCommitment = player
      , pdPriceUsdm = 100
      , pdCommitment = ticket
      , pdGameVersion = gameVersion
      , pdTicketNonce = 7
      , pdPrizeAmount = 0
      , pdPaymentPolicy = rawBytes [4]
      , pdPaymentName = rawBytes [5]
      , pdStatus = Pending
      , pdResult = Builtins.emptyByteString
      , pdPrizeTier = 0
      , pdBeaconTarget = target
      , pdBeaconStatus = BeaconReady
      , pdBeaconValue = beacon
      , pdMcHash = mcHash
      , pdMateriosContext = materiosContext
      , pdPrizePoolHash = rawBytes [9]
      , pdIssuedAt = 1000
      , pdExpiresAt = 9000
      , pdRow1Tier = 0
      , pdRow2Tier = 0
      }
    outputDatum = inputDatum
      { pdStatus = Revealed
      , pdPrizeAmount = payout
      , pdResult = result
      , pdPrizeTier = summaryTier
      , pdRow1Tier = row1Tier
      , pdRow2Tier = row2Tier
      }
    poolBefore = B1PrizePoolDatum
      { ppTotalLiquidity = 100000
      , ppPendingLiabilities = 1000
      , ppUnresolvedReserve = 500
      , ppUnresolvedTicketCount = 8
      , ppLockedJackpot = 2000
      , ppJackpotThreshold = 5000
      , ppSuspendedClasses = 0
      , ppPrizeHash = ScriptHash (rawBytes [6])
      }
    poolAfter = poolBefore
      { ppPendingLiabilities = ppPendingLiabilities poolBefore + payout
      , ppUnresolvedReserve = ppUnresolvedReserve poolBefore - 100
      , ppUnresolvedTicketCount = ppUnresolvedTicketCount poolBefore - 1
      }
  in (inputDatum, outputDatum, poolBefore, poolAfter, payout, row1Tier, row2Tier)

transitionCase :: String -> [Integer] -> Aeson.Value
transitionCase name secretBytes =
  let (inputDatum, outputDatum, poolBefore, poolAfter, payout, row1Tier, row2Tier) =
        scenarioForSecret secretBytes
      ScriptHash ownPrizeHash = ppPrizeHash poolBefore
  in object
       [ "name" .= name
       , "inputPrizeDatum" .= prizeDatumSnapshot inputDatum
       , "outputPrizeDatum" .= prizeDatumSnapshot outputDatum
       , "poolBefore" .= poolDatumSnapshot poolBefore
       , "poolAfter" .= poolDatumSnapshot poolAfter
       , "expectedPoolScriptHashHex" .= hexBuiltin (pdPrizePoolHash inputDatum)
       , "expectedOwnPrizeScriptHashHex" .= hexBuiltin ownPrizeHash
       , "payout" .= payout
       , "row1Tier" .= row1Tier
       , "row2Tier" .= row2Tier
       ]

transitionFixtures :: Aeson.Value
transitionFixtures =
  let
    winningSecret = head
      [ [first, 187, 204, 221]
      | first <- [0 .. 255]
      , let (_, _, _, _, payout, _, _) = scenarioForSecret [first, 187, 204, 221]
      , payout > 0
      ]
    losingSecret = head
      [ [first, 187, 204, 221]
      | first <- [0 .. 255]
      , let (_, _, _, _, payout, _, _) = scenarioForSecret [first, 187, 204, 221]
      , payout == 0
      ]
  in object
       [ "successfulReveal" .= transitionCase "successful_reveal" winningSecret
       , "zeroPayoutLoss" .= transitionCase "zero_payout_loss" losingSecret
       , "expiryBoundary" .= object
           [ "expiresAt" .= (9000 :: Integer)
           , "revealUpperBefore" .= (8999 :: Integer)
           , "revealUpperEqual" .= (9000 :: Integer)
           , "revealUpperAfter" .= (9001 :: Integer)
           , "expireLowerBefore" .= (8999 :: Integer)
           , "expireLowerEqual" .= (9000 :: Integer)
           , "expireLowerAfter" .= (9001 :: Integer)
           ]
       ]


-- Evaluate the compiled Plutus V2 script wrapper with typed fixture arguments.
-- Right means the on-chain CEK evaluation returned successfully; Left means
-- the validator rejected/errored. The test-only context is not a ledger submission.
applyValidatorParameters datum secret context =
  let
    configured0 = PlutusTx.unsafeApplyCode compiledValidatorFactory
      (PlutusTx.liftCodeDef (ScriptHash (rawBytes [10])))
    configured1 = PlutusTx.unsafeApplyCode configured0
      (PlutusTx.liftCodeDef defaultPrizeTable)
    configured2 = PlutusTx.unsafeApplyCode configured1
      (PlutusTx.liftCodeDef (PlutusTx.toBuiltinData (0 :: Integer)))
    configured3 = PlutusTx.unsafeApplyCode configured2
      (PlutusTx.liftCodeDef (PubKeyHash (rawBytes [11])))
    configured4 = PlutusTx.unsafeApplyCode configured3
      (PlutusTx.liftCodeDef (PlutusTx.toBuiltinData datum))
    configured5 = PlutusTx.unsafeApplyCode configured4
      (PlutusTx.liftCodeDef (PlutusTx.toBuiltinData (Reveal secret)))
  in PlutusTx.unsafeApplyCode configured5
       (PlutusTx.liftCodeDef (PlutusTx.toBuiltinData context))

evaluateCanonicalReveal datum secret context =
  case evalResult (evaluateCompiledCode (applyValidatorParameters datum secret context)) of
    Right _ -> True
    Left _ -> False

scriptOut :: ScriptHash -> Value -> PlutusTx.BuiltinData -> TxOut
scriptOut hash value datum =
  TxOut
    (Address (ScriptCredential hash) Nothing)
    value
    (OutputDatum (Datum datum))
    Nothing

makeRevealContext
  :: PrizeDatum -> PrizeDatum -> B1PrizePoolDatum -> B1PrizePoolDatum
  -> Integer -> Int -> Int -> Int -> Bool -> ScriptContext
makeRevealContext inputDatum outputDatum poolBefore poolAfter upperBound poolInputCount poolOutputCount prizeOutputCount preservePrizeValue =
  let
    prizeScriptHash = ScriptHash (rawBytes [6])
    poolScriptHash = ScriptHash (rawBytes [9])
    ownRef = TxOutRef (TxId (rawBytes [42])) 0
    poolValue = singleton adaSymbol adaToken 10000000
    prizeInputValue =
      singleton adaSymbol adaToken 5000000
        <> singleton (CurrencySymbol (rawBytes [161]))
             (TokenName (pdTicketName inputDatum)) 1
    prizeOutputValue =
      if preservePrizeValue
        then prizeInputValue
        else prizeInputValue <> singleton adaSymbol adaToken 1
    poolInputOut = scriptOut poolScriptHash poolValue (PlutusTx.toBuiltinData poolBefore)
    poolOutput = scriptOut poolScriptHash poolValue (PlutusTx.toBuiltinData poolAfter)
    prizeInputOut = scriptOut prizeScriptHash prizeInputValue (PlutusTx.toBuiltinData inputDatum)
    prizeOutput = scriptOut prizeScriptHash prizeOutputValue (PlutusTx.toBuiltinData outputDatum)
    poolInputs =
      [ TxInInfo (TxOutRef (TxId (rawBytes [43])) (fromIntegral index)) poolInputOut
      | index <- [1 .. poolInputCount]
      ]
    inputs = TxInInfo ownRef prizeInputOut : poolInputs
    outputs = replicate prizeOutputCount prizeOutput <> replicate poolOutputCount poolOutput
    info =
      TxInfo
        inputs
        []
        outputs
        mempty
        mempty
        []
        AssocMap.empty
        (interval (POSIXTime 1000) (POSIXTime upperBound))
        []
        AssocMap.empty
        AssocMap.empty
        (TxId (rawBytes [44]))
  in ScriptContext info (Spending ownRef)

data ValidatorOutcome = ValidatorOutcome
  { validatorCaseName :: String
  , validatorExpectedAccepted :: Bool
  , validatorActualAccepted :: Bool
  }
  deriving Show

validatorOutcome name expected secretBytes upperBound inputDatum outputDatum poolBefore poolAfter poolInputCount poolOutputCount prizeOutputCount preservePrizeValue =
  let context = makeRevealContext inputDatum outputDatum poolBefore poolAfter upperBound poolInputCount poolOutputCount prizeOutputCount preservePrizeValue
      actual = evaluateCanonicalReveal inputDatum (rawBytes secretBytes) context
  in ValidatorOutcome name expected actual

winningSecret :: [Integer]
winningSecret = head
  [ [first, 187, 204, 221]
  | first <- [0 .. 255]
  , let (_, _, _, _, payout, _, _) = scenarioForSecret [first, 187, 204, 221]
  , payout > 0
  ]

losingSecret :: [Integer]
losingSecret = head
  [ [first, 187, 204, 221]
  | first <- [0 .. 255]
  , let (_, _, _, _, payout, _, _) = scenarioForSecret [first, 187, 204, 221]
  , payout == 0
  ]

validatorOutcomes :: [ValidatorOutcome]
validatorOutcomes =
  let
    (winInput, winOutput, winPoolBefore, winPoolAfter, _, _, _) = scenarioForSecret winningSecret
    (lossInput, lossOutput, lossPoolBefore, lossPoolAfter, _, _, _) = scenarioForSecret losingSecret
    badPoolAfter = winPoolAfter { ppPendingLiabilities = ppPendingLiabilities winPoolAfter + 1 }
    badIdentityOutput = winOutput { pdTicketNonce = pdTicketNonce winOutput + 1 }
    badPoolHashAfter = winPoolAfter { ppPrizeHash = ScriptHash (rawBytes [99]) }
  in
    [ validatorOutcome "successful_reveal" True winningSecret 9000 winInput winOutput winPoolBefore winPoolAfter 1 1 1 True
    , validatorOutcome "zero_payout_loss" True losingSecret 9000 lossInput lossOutput lossPoolBefore lossPoolAfter 1 1 1 True
    , validatorOutcome "wrong_player_secret_rejected" False [0, 0, 0, 0] 9000 winInput winOutput winPoolBefore winPoolAfter 1 1 1 True
    , validatorOutcome "reveal_after_expiry_rejected" False winningSecret 9001 winInput winOutput winPoolBefore winPoolAfter 1 1 1 True
    , validatorOutcome "wrong_pool_liability_delta_rejected" False winningSecret 9000 winInput winOutput winPoolBefore badPoolAfter 1 1 1 True
    , validatorOutcome "changed_prize_identity_rejected" False winningSecret 9000 winInput badIdentityOutput winPoolBefore winPoolAfter 1 1 1 True
    , validatorOutcome "prize_value_not_preserved_rejected" False winningSecret 9000 winInput winOutput winPoolBefore winPoolAfter 1 1 1 False
    , validatorOutcome "duplicate_pool_input_rejected" False winningSecret 9000 winInput winOutput winPoolBefore winPoolAfter 2 1 1 True
    , validatorOutcome "missing_pool_output_rejected" False winningSecret 9000 winInput winOutput winPoolBefore winPoolAfter 1 0 1 True
    , validatorOutcome "duplicate_prize_output_rejected" False winningSecret 9000 winInput winOutput winPoolBefore winPoolAfter 1 1 2 True
    , validatorOutcome "pool_script_hash_binding_rejected" False winningSecret 9000 winInput winOutput winPoolBefore badPoolHashAfter 1 1 1 True
    ]

validatorEvaluationsFixture :: Aeson.Value
validatorEvaluationsFixture =
  object
    [ "engine" .= ("Plutus V2 CEK via compiledValidatorFactory" :: String)
    , "cases" .=
        [ object
            [ "name" .= validatorCaseName outcome
            , "expectedAccepted" .= validatorExpectedAccepted outcome
            , "actualAccepted" .= validatorActualAccepted outcome
            ]
        | outcome <- validatorOutcomes
        ]
    ]

requireExpectedValidatorOutcome :: ValidatorOutcome -> IO ()
requireExpectedValidatorOutcome outcome =
  if validatorExpectedAccepted outcome == validatorActualAccepted outcome
    then putStrLn ("PASS canonical Plutus V2 validator: " <> validatorCaseName outcome)
    else fail
      ( "FAIL canonical Plutus V2 validator: " <> validatorCaseName outcome
          <> " expected=" <> show (validatorExpectedAccepted outcome)
          <> " actual=" <> show (validatorActualAccepted outcome)
      )

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
      resultDigest = Builtins.sha2_256
        (Builtins.appendByteString (field (Builtins.sha2_256 symbolsSeed)) (field symbols))
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
       , "row1OutcomeIndex" .= rowOutcomeIndex symbolsSeed 1
       , "row2OutcomeIndex" .= rowOutcomeIndex symbolsSeed 2
       , "resultDigestHex" .= hexBuiltin resultDigest
       ]

main :: IO ()
main = do
  args <- getArgs
  let outputPath = case args of
        [path] -> path
        _ -> "reveal-schema-fixtures.json"
      fixture =
        object
          [ "schema" .= ("pre-rich-reveal-plutus-data-v2" :: String)
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
          , "cryptoFixtures" .= cryptoFixtures
          , "transitionFixtures" .= transitionFixtures
          , "validatorEvaluations" .= validatorEvaluationsFixture
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
                , "symbolsVectorCases" .=
                    [ symbolsVectorCase "alternate_seed_a" [0, 1, 2, 3, 4, 5, 6, 7]
                    , symbolsVectorCase "alternate_seed_b" [255, 0, 128, 64, 32, 16, 8, 4]
                    , symbolsVectorCase "alternate_seed_c" [9, 9, 9, 9, 9, 9, 9, 9, 9, 9]
                    , symbolsVectorCase "rejection_retry_seed" [0, 0, 0, 6]
                    ]
                ]
          ]
  mapM_ requireExpectedValidatorOutcome validatorOutcomes
  BSL.writeFile outputPath (Aeson.encode fixture <> "\n")
  putStrLn ("Wrote canonical Haskell Plutus Data fixtures: " <> outputPath)
