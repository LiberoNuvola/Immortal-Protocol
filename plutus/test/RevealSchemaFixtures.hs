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
import qualified PlutusTx.Lift as Lift
import PlutusCore.Version (plcVersion100)
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
import Data.List (intercalate)
import System.Environment (getArgs)
import Types
  ( BeaconStatus (..)
  , BeaconTarget (..)
  , B1PrizePoolDatum (..)
  , B1PrizePoolAction (..)
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
       , "playerSecretHex" .= hexBuiltin (rawBytes secretBytes)
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
      (Lift.liftCode plcVersion100 (ScriptHash (rawBytes [10])))
    configured1 = PlutusTx.unsafeApplyCode configured0
      (Lift.liftCode plcVersion100 defaultPrizeTable)
    configured2 = PlutusTx.unsafeApplyCode configured1
      (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData (0 :: Integer)))
    configured3 = PlutusTx.unsafeApplyCode configured2
      (Lift.liftCode plcVersion100 (PubKeyHash (rawBytes [11])))
    configured4 = PlutusTx.unsafeApplyCode configured3
      (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData datum))
    configured5 = PlutusTx.unsafeApplyCode configured4
      (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData (Reveal secret)))
  in PlutusTx.unsafeApplyCode configured5
       (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData context))

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

-- ============================================================
-- Single-fault differential mutation cases
-- ============================================================
--
-- Each case starts from a canonical scenario (valid Reveal), applies exactly
-- one typed change, and is evaluated by the compiled Plutus V2 validator on the
-- same synthetic context as the cases above. The JSON carries the COMPLETE
-- mutated datum/pool snapshots plus the CEK decision, so the Aiken generator
-- never re-applies mutation semantics: it consumes the same data.
--
-- "characterization" marks cases whose expected decision documents what the
-- current validator does (not what the specification necessarily requires).
-- They exist so that any Haskell/Aiken divergence is visible; they are not a
-- statement that the behaviour is desirable.

data MutationCase = MutationCase
  { mutName :: String
  , mutGroup :: String
  , mutExpectedAccepted :: Bool
  , mutCharacterization :: Bool
  , mutSecret :: [Integer]
  , mutUpperBound :: Integer
  , mutInput :: PrizeDatum
  , mutOutput :: PrizeDatum
  , mutPoolBefore :: B1PrizePoolDatum
  , mutPoolAfter :: B1PrizePoolDatum
  }

appendOneByte :: Builtins.BuiltinByteString -> Builtins.BuiltinByteString
appendOneByte b = Builtins.appendByteString b (rawBytes [1])

-- First secret of each distinct (row1Tier,row2Tier) outcome reachable by the
-- canonical scenario, so that positive cases exercise every tier pair found.
distinctTierSecrets :: [([Integer], Integer, Integer)]
distinctTierSecrets = go [] [0 .. 255]
  where
    go _ [] = []
    go seen (first : rest) =
      let secret = [first, 187, 204, 221]
          (_, _, _, _, _, r1, r2) = scenarioForSecret secret
      in if (r1, r2) `elem` seen
           then go seen rest
           else (secret, r1, r2) : go ((r1, r2) : seen) rest

mutationCases :: [MutationCase]
mutationCases =
  let
    (winInput, winOutput, winBefore, winAfter, _, _, _) = scenarioForSecret winningSecret
    base name group expected =
      MutationCase name group expected False winningSecret 9000 winInput winOutput winBefore winAfter
    outputCase name f = (base ("output_" <> name) "output_field" False) { mutOutput = f winOutput }
    inputCase name f = (base ("input_" <> name) "input_field" False) { mutInput = f winInput }
    poolAfterCase name expected f =
      (base ("pool_after_" <> name) "pool_after" expected) { mutPoolAfter = f winAfter }
    characterize c = c { mutCharacterization = True }
    tgt = pdBeaconTarget

    outputCases =
      [ outputCase "ticket_policy" (\d -> d { pdTicketPolicy = appendOneByte (pdTicketPolicy d) })
      , outputCase "ticket_name" (\d -> d { pdTicketName = appendOneByte (pdTicketName d) })
      , outputCase "player_commitment" (\d -> d { pdPlayerCommitment = appendOneByte (pdPlayerCommitment d) })
      , outputCase "price_usdm" (\d -> d { pdPriceUsdm = pdPriceUsdm d + 1 })
      , outputCase "commitment" (\d -> d { pdCommitment = appendOneByte (pdCommitment d) })
      , outputCase "game_version" (\d -> d { pdGameVersion = appendOneByte (pdGameVersion d) })
      , outputCase "ticket_nonce" (\d -> d { pdTicketNonce = pdTicketNonce d + 1 })
      , outputCase "prize_amount" (\d -> d { pdPrizeAmount = pdPrizeAmount d + 1 })
      , outputCase "payment_policy" (\d -> d { pdPaymentPolicy = appendOneByte (pdPaymentPolicy d) })
      , outputCase "payment_name" (\d -> d { pdPaymentName = appendOneByte (pdPaymentName d) })
      , outputCase "status_stays_pending" (\d -> d { pdStatus = Pending })
      , outputCase "status_claimed" (\d -> d { pdStatus = Claimed })
      , outputCase "result" (\d -> d { pdResult = appendOneByte (pdResult d) })
      , outputCase "prize_tier" (\d -> d { pdPrizeTier = pdPrizeTier d + 1 })
      , outputCase "target_network_id" (\d -> d { pdBeaconTarget = (tgt d) { btNetworkId = btNetworkId (tgt d) + 1 } })
      , outputCase "target_round" (\d -> d { pdBeaconTarget = (tgt d) { btRound = btRound (tgt d) + 1 } })
      , outputCase "target_mainchain_ref" (\d -> d { pdBeaconTarget = (tgt d) { btMainchainRef = appendOneByte (btMainchainRef (tgt d)) } })
      , outputCase "target_version" (\d -> d { pdBeaconTarget = (tgt d) { btVersion = appendOneByte (btVersion (tgt d)) } })
      , outputCase "beacon_status_pending" (\d -> d { pdBeaconStatus = BeaconPending })
      , outputCase "beacon_value" (\d -> d { pdBeaconValue = appendOneByte (pdBeaconValue d) })
      , outputCase "mc_hash" (\d -> d { pdMcHash = appendOneByte (pdMcHash d) })
      , outputCase "materios_context" (\d -> d { pdMateriosContext = appendOneByte (pdMateriosContext d) })
      , outputCase "prize_pool_hash" (\d -> d { pdPrizePoolHash = appendOneByte (pdPrizePoolHash d) })
      , outputCase "issued_at" (\d -> d { pdIssuedAt = pdIssuedAt d + 1 })
      , outputCase "expires_at" (\d -> d { pdExpiresAt = pdExpiresAt d + 1 })
      , outputCase "row1_tier" (\d -> d { pdRow1Tier = pdRow1Tier d + 1 })
      , outputCase "row2_tier" (\d -> d { pdRow2Tier = pdRow2Tier d + 1 })
      ]

    inputCases =
      [ inputCase "already_revealed" (\d -> d { pdStatus = Revealed })
      , inputCase "beacon_pending" (\d -> d { pdBeaconStatus = BeaconPending })
      , inputCase "beacon_empty" (\d -> d { pdBeaconValue = Builtins.emptyByteString })
      , inputCase "beacon_not_rederivable" (\d -> d { pdBeaconValue = appendOneByte (pdBeaconValue d) })
      , inputCase "ticket_commitment" (\d -> d { pdCommitment = appendOneByte (pdCommitment d) })
      , inputCase "player_commitment" (\d -> d { pdPlayerCommitment = appendOneByte (pdPlayerCommitment d) })
      ]

    poolAfterCases =
      [ poolAfterCase "total_liquidity_changed" False (\p -> p { ppTotalLiquidity = ppTotalLiquidity p + 1 })
      , poolAfterCase "liabilities_short_by_one" False (\p -> p { ppPendingLiabilities = ppPendingLiabilities p - 1 })
      , poolAfterCase "reserve_not_decreased" False (\p -> p { ppUnresolvedReserve = ppUnresolvedReserve winBefore })
      , poolAfterCase "reserve_increased" False (\p -> p { ppUnresolvedReserve = ppUnresolvedReserve winBefore + 1 })
      , poolAfterCase "ticket_count_unchanged" False (\p -> p { ppUnresolvedTicketCount = ppUnresolvedTicketCount winBefore })
      , poolAfterCase "prize_hash_other" False (\p -> p { ppPrizeHash = ScriptHash (rawBytes [99]) })
      -- Characterization: validateReveal does not constrain these pool fields
      -- (validateExpire does). The pool validator may constrain them; unverified.
      , characterize (poolAfterCase "locked_jackpot_changed" True (\p -> p { ppLockedJackpot = ppLockedJackpot p + 1 }))
      , characterize (poolAfterCase "jackpot_threshold_changed" True (\p -> p { ppJackpotThreshold = ppJackpotThreshold p + 1 }))
      , characterize (poolAfterCase "suspended_classes_changed" True (\p -> p { ppSuspendedClasses = ppSuspendedClasses p + 1 }))
      ]

    -- Payout must be affordable: shrink total liquidity (before and after, so
    -- the liquidity-unchanged rule is not the one under test) until the
    -- effective pool is zero while the winning payout is positive.
    exhaustedLiquidity =
      let l = ppPendingLiabilities winBefore + ppUnresolvedReserve winBefore + ppLockedJackpot winBefore
      in (base "pool_effective_liquidity_exhausted" "pool_before" False)
           { mutPoolBefore = winBefore { ppTotalLiquidity = l }
           , mutPoolAfter = winAfter { ppTotalLiquidity = l }
           }
    inputPoolHashOther =
      (base "pool_before_prize_hash_other" "pool_before" False)
        { mutPoolBefore = winBefore { ppPrizeHash = ScriptHash (rawBytes [99]) } }

    baselines =
      [ base "baseline_winning_reveal" "baseline" True
      , (base "baseline_zero_payout_reveal" "baseline" True)
          { mutSecret = losingSecret
          , mutInput = let (i, _, _, _, _, _, _) = scenarioForSecret losingSecret in i
          , mutOutput = let (_, o, _, _, _, _, _) = scenarioForSecret losingSecret in o
          , mutPoolBefore = let (_, _, b, _, _, _, _) = scenarioForSecret losingSecret in b
          , mutPoolAfter = let (_, _, _, a, _, _, _) = scenarioForSecret losingSecret in a
          }
      , (base "boundary_upper_equal_expiry" "boundary" True) { mutUpperBound = 9000 }
      , (base "boundary_upper_one_before_expiry" "boundary" True) { mutUpperBound = 8999 }
      , (base "boundary_upper_one_after_expiry" "boundary" False) { mutUpperBound = 9001 }
      ]

    tierGrid =
      [ MutationCase
          ("positive_tier_pair_" <> show r1 <> "_" <> show r2) "tier_grid" True False secret 9000 i o b a
      | (secret, r1, r2) <- distinctTierSecrets
      , let (i, o, b, a, _, _, _) = scenarioForSecret secret
      ]
  in baselines ++ outputCases ++ inputCases ++ poolAfterCases
       ++ [exhaustedLiquidity, inputPoolHashOther] ++ tierGrid

mutationActualAccepted :: MutationCase -> Bool
mutationActualAccepted c =
  evaluateCanonicalReveal
    (mutInput c)
    (rawBytes (mutSecret c))
    (makeRevealContext (mutInput c) (mutOutput c) (mutPoolBefore c) (mutPoolAfter c)
       (mutUpperBound c) 1 1 1 True)

mutationEvaluationsFixture :: Aeson.Value
mutationEvaluationsFixture =
  object
    [ "schema" .= ("pre-rich-reveal-mutation-cases-v1" :: String)
    , "engine" .= ("Plutus V2 CEK via compiledValidatorFactory" :: String)
    , "baseOwnPrizeScriptHashHex" .= hexBuiltin (rawBytes [6])
    , "basePoolScriptHashHex" .= hexBuiltin (rawBytes [9])
    , "cases" .=
        [ object
            [ "name" .= mutName c
            , "group" .= mutGroup c
            , "characterization" .= mutCharacterization c
            , "expectedAccepted" .= mutExpectedAccepted c
            , "actualAccepted" .= mutationActualAccepted c
            , "playerSecretHex" .= hexBuiltin (rawBytes (mutSecret c))
            , "upperBound" .= mutUpperBound c
            , "inputPrizeDatum" .= prizeDatumSnapshot (mutInput c)
            , "outputPrizeDatum" .= prizeDatumSnapshot (mutOutput c)
            , "poolBefore" .= poolDatumSnapshot (mutPoolBefore c)
            , "poolAfter" .= poolDatumSnapshot (mutPoolAfter c)
            ]
        | c <- mutationCases
        ]
    ]

-- Report every mismatch before failing, so one run lists all divergences.
requireExpectedMutationOutcomes :: IO ()
requireExpectedMutationOutcomes =
  let mismatches =
        [ mutName c <> " expected=" <> show (mutExpectedAccepted c)
            <> " actual=" <> show (mutationActualAccepted c)
        | c <- mutationCases
        , mutExpectedAccepted c /= mutationActualAccepted c
        ]
  in if null mismatches
       then putStrLn ("PASS canonical Plutus V2 mutation cases: " <> show (length mutationCases))
       else fail ("FAIL canonical Plutus V2 mutation cases:\n  " <> intercalate "\n  " mismatches)

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
          [ "schema" .= ("pre-rich-reveal-plutus-data-v3" :: String)
          , "producer" .= ("plutus/test/RevealSchemaFixtures.hs" :: String)
          , "canonicalSource" .= ("plutus/Types.hs" :: String)
          , "fixtures" .=
              object
                [ "PrizeDatum.pending" .= hexData samplePrizeDatum
                , "PrizeStatus.Pending" .= hexData Pending
                , "PrizeStatus.Revealed" .= hexData Revealed
                , "PrizeStatus.Claimed" .= hexData Claimed
                , "BeaconStatus.BeaconPending" .= hexData BeaconPending
                , "BeaconStatus.BeaconReady" .= hexData BeaconReady
                , "PrizeAction.SyncBeacon" .= hexData SyncBeacon
                , "PrizeAction.Reveal" .= hexData (Reveal "secret")
                , "PrizeAction.Claim" .= hexData Claim
                , "PrizeAction.Expire" .= hexData Expire
                , "BeaconTarget" .= hexData sampleTarget
                , "B1PrizePoolDatum" .= hexData samplePoolDatum
                , "B1PrizePoolAction.FundTreasury" .= hexData FundTreasury
                , "B1PrizePoolAction.TicketIssued" .= hexData (TicketIssued 100)
                , "B1PrizePoolAction.TicketRevealed" .= hexData (TicketRevealed 100)
                , "B1PrizePoolAction.TicketClaimed" .= hexData (TicketClaimed 250)
                , "B1PrizePoolAction.TicketExpired" .= hexData TicketExpired
                ]
          , "cryptoFixtures" .= cryptoFixtures
          , "transitionFixtures" .= transitionFixtures
          , "validatorEvaluations" .= validatorEvaluationsFixture
          , "mutationEvaluations" .= mutationEvaluationsFixture
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
  requireExpectedMutationOutcomes
  BSL.writeFile outputPath (Aeson.encode fixture <> "\n")
  putStrLn ("Wrote canonical Haskell Plutus Data fixtures: " <> outputPath)
