{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE NumericUnderscores #-}

-- Direct CEK characterization of the canonical B1PrizePool Plutus V2 validator.
-- Synthetic ScriptContext only: this is not a native-ledger or Preprod test.
module Main where

import Prelude

import qualified Data.ByteString as BS
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
import PlutusLedgerApi.V1.Value
  ( Value
  , CurrencySymbol (..)
  , TokenName (..)
  , adaSymbol
  , adaToken
  , singleton
  )
import PlutusLedgerApi.V2 (ScriptHash (..))
import PlutusLedgerApi.V2.Contexts
  ( ScriptContext (..)
  , ScriptPurpose (..)
  , TxInInfo (..)
  , TxInfo (..)
  )
import PlutusLedgerApi.V2.Tx (OutputDatum (..), TxOut (..))
import qualified PlutusTx.AssocMap as AssocMap

import qualified B1PrizePool
import qualified PrizeValidator
import Beacon
  ( deriveBeacon
  , deriveSymbolsSeed
  , deriveTicketSeed
  , encodeBeaconTarget
  , field
  , playerCommitment
  , ticketCommitment
  )
import GameRules
  ( classifyRowTier
  , classifyTier
  , defaultPrizeTable
  , generateSymbols
  , rowPayoutTotal
  )
import Types
  ( B1PrizePoolAction (..)
  , B1PrizePoolDatum (..)
  , BeaconStatus (..)
  , BeaconTarget (..)
  , PrizeAction (..)
  , PrizeDatum (..)
  , PrizeStatus (..)
  )

rawBytes :: [Integer] -> Builtins.BuiltinByteString
rawBytes bytes =
  Builtins.toBuiltin (BS.pack (map fromInteger bytes))

prizeHash :: ScriptHash
prizeHash = ScriptHash (rawBytes (replicate 28 6))

poolHash :: ScriptHash
poolHash = ScriptHash (rawBytes (replicate 28 7))

poolPolicy :: Builtins.BuiltinByteString
poolPolicy = rawBytes (replicate 28 8)

poolName :: Builtins.BuiltinByteString
poolName = rawBytes [80, 79, 79, 76]

ticketPolicy :: Builtins.BuiltinByteString
ticketPolicy = rawBytes (replicate 28 9)

ticketName :: Builtins.BuiltinByteString
ticketName = rawBytes [84, 73, 67, 75, 69, 84]

sampleTarget :: BeaconTarget
sampleTarget =
  BeaconTarget
    { btNetworkId = 0
    , btRound = 1
    , btMainchainRef = rawBytes [1, 2, 3]
    , btVersion = rawBytes [1]
    }

poolValue :: Value
poolValue =
  singleton (CurrencySymbol poolPolicy) (TokenName poolName) 1
    <> singleton adaSymbol adaToken 10_000_000

prizeValue :: Value
prizeValue =
  singleton (CurrencySymbol ticketPolicy) (TokenName ticketName) 1
    <> singleton adaSymbol adaToken 5_000_000

poolDatum :: Integer -> Integer -> Integer -> B1PrizePoolDatum
poolDatum liquidity liabilities unresolved count =
  B1PrizePoolDatum
    { ppTotalLiquidity = liquidity
    , ppPendingLiabilities = liabilities
    , ppUnresolvedReserve = unresolved
    , ppUnresolvedTicketCount = count
    , ppLockedJackpot = 0
    , ppJackpotThreshold = 0
    , ppSuspendedClasses = 0
    , ppPrizeHash = prizeHash
    }

prizeDatum :: Integer -> Integer -> PrizeStatus -> Integer -> PrizeDatum
prizeDatum price nonce status payout =
  PrizeDatum
    { pdTicketPolicy = ticketPolicy
    , pdTicketName = ticketName
    , pdPlayerCommitment = rawBytes [10]
    , pdPriceUsdm = price
    , pdCommitment = rawBytes [11]
    , pdGameVersion = rawBytes [1]
    , pdTicketNonce = nonce
    , pdPrizeAmount = payout
    , pdPaymentPolicy = rawBytes [12]
    , pdPaymentName = rawBytes [13]
    , pdStatus = status
    , pdResult = rawBytes [14]
    , pdPrizeTier = 0
    , pdBeaconTarget = sampleTarget
    , pdBeaconStatus = BeaconReady
    , pdBeaconValue = rawBytes [15]
    , pdMcHash = rawBytes [16]
    , pdMateriosContext = rawBytes [17]
    , pdPrizePoolHash = rawBytes (replicate 28 6)
    , pdIssuedAt = 1_000
    , pdExpiresAt = 9_000
    , pdRow1Tier = 0
    , pdRow2Tier = 0
    }

scriptOut :: ScriptHash -> Value -> PlutusTx.BuiltinData -> TxOut
scriptOut hash value datum =
  TxOut
    (Address (ScriptCredential hash) Nothing)
    value
    (OutputDatum (Datum datum))
    Nothing

makeRevealContext
  :: B1PrizePoolDatum
  -> PrizeDatum
  -> PrizeDatum
  -> B1PrizePoolDatum
  -> ScriptContext
makeRevealContext before inputPrize outputPrize after =
  let
    poolRef = TxOutRef (TxId (rawBytes [41])) 0
    prizeRef = TxOutRef (TxId (rawBytes [42])) 0

    poolInput =
      TxInInfo poolRef
        (scriptOut poolHash poolValue (PlutusTx.toBuiltinData before))

    prizeInput =
      TxInInfo prizeRef
        (scriptOut prizeHash prizeValue (PlutusTx.toBuiltinData inputPrize))

    prizeOutput =
      scriptOut prizeHash prizeValue (PlutusTx.toBuiltinData outputPrize)

    poolOutput =
      scriptOut poolHash poolValue (PlutusTx.toBuiltinData after)

    info =
      TxInfo
        [poolInput, prizeInput]
        []
        [prizeOutput, poolOutput]
        mempty
        mempty
        []
        AssocMap.empty
        (interval (POSIXTime 1_000) (POSIXTime 2_000))
        []
        AssocMap.empty
        AssocMap.empty
        (TxId (rawBytes [43]))
  in ScriptContext info (Spending poolRef)

applyB1Validator datum action context =
  let
    configured0 =
      PlutusTx.unsafeApplyCode B1PrizePool.compiledValidatorFactory
        (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData prizeHash))
    -- The oracle state is not read by TicketRevealed. A typed BuiltinData
    -- placeholder is supplied because the factory ABI carries it for Fund/Claim.
    configured1 =
      PlutusTx.unsafeApplyCode configured0
        (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData (0 :: Integer)))
    configured2 =
      PlutusTx.unsafeApplyCode configured1
        (Lift.liftCode plcVersion100
          (PlutusTx.toBuiltinData (PubKeyHash (rawBytes (replicate 28 10))))
        )
    configured3 =
      PlutusTx.unsafeApplyCode configured2
        (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData poolPolicy))
    configured4 =
      PlutusTx.unsafeApplyCode configured3
        (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData poolName))
    configured5 =
      PlutusTx.unsafeApplyCode configured4
        (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData datum))
    configured6 =
      PlutusTx.unsafeApplyCode configured5
        (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData action))
  in
    PlutusTx.unsafeApplyCode configured6
      (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData context))

evaluateB1Reveal
  :: B1PrizePoolDatum
  -> Integer
  -> Integer
  -> Integer
  -> Bool
evaluateB1Reveal before price nonce payout =
  let
    inputPrize = prizeDatum price nonce Pending 0
    outputPrize = prizeDatum price nonce Revealed payout
    after =
      before
        { ppPendingLiabilities = ppPendingLiabilities before + payout
        , ppUnresolvedReserve = ppUnresolvedReserve before - price
        , ppUnresolvedTicketCount = ppUnresolvedTicketCount before - 1
        }
    context = makeRevealContext before inputPrize outputPrize after
    evaluated =
      evaluateCompiledCode
        (applyB1Validator before (TicketRevealed price) context)
  in
    case evalResult evaluated of
      Right _ -> True
      Left _ -> False

initialPool :: Integer -> [Integer] -> B1PrizePoolDatum
initialPool liquidity prices =
  poolDatum liquidity 0 (sum prices) (fromIntegral (length prices))

runSequence :: Integer -> [Integer] -> [Integer] -> [Bool]
runSequence liquidity prices payouts =
  go (initialPool liquidity prices) 0 (zip prices payouts)
  where
    go _ _ [] = []
    go state nonce ((price, payout) : rest) =
      let accepted = evaluateB1Reveal state price nonce payout
          next =
            state
              { ppPendingLiabilities = ppPendingLiabilities state + payout
              , ppUnresolvedReserve = ppUnresolvedReserve state - price
              , ppUnresolvedTicketCount = ppUnresolvedTicketCount state - 1
              }
      in accepted : go next (nonce + 1) rest

runMaximumSequence :: Integer -> [Integer] -> [Bool]
runMaximumSequence liquidity prices =
  runSequence liquidity prices (map (500 *) prices)


-- ---------------------------------------------------------------------------
-- Shared-TxInfo dual-validator CEK characterization.
--
-- The same typed TxInfo is evaluated twice, once with the Prize UTxO as the
-- spending purpose and once with the B1 Pool UTxO as the spending purpose.
-- Each evaluation invokes the canonical compiled Plutus V2 validator.
-- This is still synthetic CEK evidence, not a Cardano-ledger/Yaci submission.
-- ---------------------------------------------------------------------------

poolScriptHashBytes :: Builtins.BuiltinByteString
poolScriptHashBytes = rawBytes (replicate 28 7)

registryHash :: ScriptHash
registryHash = ScriptHash (rawBytes (replicate 28 10))

publisherPkh :: PubKeyHash
publisherPkh = PubKeyHash (rawBytes (replicate 28 11))

ticketNameFor :: Integer -> Builtins.BuiltinByteString
ticketNameFor index =
  rawBytes ([84, 73, 67, 75, 69, 84] ++ [48 + index])

canonicalPrizePair
  :: Integer
  -> Integer
  -> Builtins.BuiltinByteString
  -> Builtins.BuiltinByteString
  -> (PrizeDatum, PrizeDatum, Integer)
canonicalPrizePair price nonce ticketId secret =
  let
    target = sampleTarget
    gameVersion = rawBytes [1]
    mainchainRef = btMainchainRef target
    mcHash = rawBytes [16]
    materiosContext = rawBytes [17]
    player = playerCommitment (btRound target) nonce secret
    targetEncoded = encodeBeaconTarget target
    commitment =
      ticketCommitment ticketId player gameVersion nonce price targetEncoded
    beacon =
      deriveBeacon
        (btNetworkId target)
        (btRound target)
        mainchainRef
        mcHash
        materiosContext
        (btVersion target)
    ticketSeed =
      deriveTicketSeed
        (btRound target)
        nonce
        secret
        beacon
        gameVersion
    symbolsSeed = deriveSymbolsSeed ticketSeed
    symbols = generateSymbols symbolsSeed
    symbolBytes = Builtins.fromBuiltin symbols
    row1Tier =
      classifyRowTier (Builtins.toBuiltin (BS.take 3 symbolBytes))
    row2Tier =
      classifyRowTier (Builtins.toBuiltin (BS.drop 3 symbolBytes))
    summaryTier = classifyTier symbols
    payout = rowPayoutTotal defaultPrizeTable row1Tier row2Tier price
    resultDigest =
      Builtins.sha2_256
        (Builtins.appendByteString
          (field (Builtins.sha2_256 symbolsSeed))
          (field symbols))
    inputPrize =
      PrizeDatum
        { pdTicketPolicy = ticketPolicy
        , pdTicketName = ticketId
        , pdPlayerCommitment = player
        , pdPriceUsdm = price
        , pdCommitment = commitment
        , pdGameVersion = gameVersion
        , pdTicketNonce = nonce
        , pdPrizeAmount = 0
        , pdPaymentPolicy = rawBytes [12]
        , pdPaymentName = rawBytes [13]
        , pdStatus = Pending
        , pdResult = Builtins.emptyByteString
        , pdPrizeTier = 0
        , pdBeaconTarget = target
        , pdBeaconStatus = BeaconReady
        , pdBeaconValue = beacon
        , pdMcHash = mcHash
        , pdMateriosContext = materiosContext
        , pdPrizePoolHash = poolScriptHashBytes
        , pdIssuedAt = 1_000
        , pdExpiresAt = 9_000
        , pdRow1Tier = 0
        , pdRow2Tier = 0
        }
    outputPrize =
      inputPrize
        { pdPrizeAmount = payout
        , pdStatus = Revealed
        , pdResult = resultDigest
        , pdPrizeTier = summaryTier
        , pdRow1Tier = row1Tier
        , pdRow2Tier = row2Tier
        }
  in (inputPrize, outputPrize, payout)

prizeValueFor :: Builtins.BuiltinByteString -> Value
prizeValueFor ticketId =
  singleton (CurrencySymbol ticketPolicy) (TokenName ticketId) 1
    <> singleton adaSymbol adaToken 5_000_000

makeDualRevealContexts
  :: B1PrizePoolDatum
  -> PrizeDatum
  -> PrizeDatum
  -> B1PrizePoolDatum
  -> Builtins.BuiltinByteString
  -> (ScriptContext, ScriptContext)
makeDualRevealContexts before inputPrize outputPrize after ticketId =
  let
    poolRef = TxOutRef (TxId (rawBytes [51])) 0
    prizeRef = TxOutRef (TxId (rawBytes [52])) 0
    poolInput =
      TxInInfo poolRef
        (scriptOut poolHash poolValue (PlutusTx.toBuiltinData before))
    prizeInput =
      TxInInfo prizeRef
        (scriptOut prizeHash (prizeValueFor ticketId)
          (PlutusTx.toBuiltinData inputPrize))
    prizeOutput =
      scriptOut prizeHash (prizeValueFor ticketId)
        (PlutusTx.toBuiltinData outputPrize)
    poolOutput =
      scriptOut poolHash poolValue (PlutusTx.toBuiltinData after)
    -- This TxInfo value is constructed once and shared verbatim by both
    -- contexts. Only the ScriptPurpose differs.
    sharedInfo =
      TxInfo
        [poolInput, prizeInput]
        []
        [prizeOutput, poolOutput]
        mempty
        mempty
        []
        AssocMap.empty
        (interval (POSIXTime 1_000) (POSIXTime 2_000))
        []
        AssocMap.empty
        AssocMap.empty
        (TxId (rawBytes [53]))
  in
    ( ScriptContext sharedInfo (Spending prizeRef)
    , ScriptContext sharedInfo (Spending poolRef)
    )

applyPrizeValidator
  :: PrizeDatum
  -> Builtins.BuiltinByteString
  -> ScriptContext
  -> PlutusTx.CompiledCode Bool
applyPrizeValidator datum secret context =
  let
    configured0 =
      PlutusTx.unsafeApplyCode PrizeValidator.compiledValidatorFactory
        (Lift.liftCode plcVersion100 registryHash)
    configured1 =
      PlutusTx.unsafeApplyCode configured0
        (Lift.liftCode plcVersion100 defaultPrizeTable)
    configured2 =
      PlutusTx.unsafeApplyCode configured1
        (Lift.liftCode plcVersion100
          (PlutusTx.toBuiltinData (0 :: Integer)))
    configured3 =
      PlutusTx.unsafeApplyCode configured2
        (Lift.liftCode plcVersion100 publisherPkh)
    configured4 =
      PlutusTx.unsafeApplyCode configured3
        (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData datum))
    configured5 =
      PlutusTx.unsafeApplyCode configured4
        (Lift.liftCode plcVersion100
          (PlutusTx.toBuiltinData (Reveal secret)))
  in
    PlutusTx.unsafeApplyCode configured5
      (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData context))

evaluatePrizeReveal
  :: PrizeDatum
  -> Builtins.BuiltinByteString
  -> ScriptContext
  -> Bool
evaluatePrizeReveal datum secret context =
  case evalResult (evaluateCompiledCode
         (applyPrizeValidator datum secret context)) of
    Right _ -> True
    Left _ -> False

runDualValidatorSequence
  :: Integer
  -> [Integer]
  -> [[Integer]]
  -> [(Bool, Bool)]
runDualValidatorSequence liquidity prices secrets =
  go (initialPool liquidity prices)
    (zip3 [0 ..] prices secrets)
  where
    go _ [] = []
    go state ((index, price, secretBytes) : rest) =
      let
        nonce = 7 + index
        ticketId = ticketNameFor index
        secret = rawBytes secretBytes
        (inputPrize, outputPrize, payout) =
          canonicalPrizePair price nonce ticketId secret
        after =
          state
            { ppPendingLiabilities = ppPendingLiabilities state + payout
            , ppUnresolvedReserve = ppUnresolvedReserve state - price
            , ppUnresolvedTicketCount = ppUnresolvedTicketCount state - 1
            }
        (prizeContext, poolContext) =
          makeDualRevealContexts
            state inputPrize outputPrize after ticketId
        prizeAccepted =
          evaluatePrizeReveal inputPrize secret prizeContext
        poolAccepted =
          case evalResult (evaluateCompiledCode
                 (applyB1Validator state (TicketRevealed price) poolContext)) of
            Right _ -> True
            Left _ -> False
      in
        (prizeAccepted, poolAccepted) : go after rest

assertDualOutcomes :: [(Bool, Bool)] -> [Bool] -> String -> IO ()
assertDualOutcomes actual expected label =
  assert
    ( map fst actual == expected
      && map snd actual == expected
      && all (uncurry (==)) actual
    )
    (label ++ " actual=" ++ show actual
      ++ " expectedBoth=" ++ show expected)

assert :: Bool -> String -> IO ()
assert condition label =
  if condition
    then putStrLn ("PASS: " ++ label)
    else error ("FAIL: " ++ label)

assertOutcomes :: [Bool] -> [Bool] -> String -> IO ()
assertOutcomes actual expected label =
  assert (actual == expected) (label ++ " actual=" ++ show actual ++ " expected=" ++ show expected)

main :: IO ()
main = do
  -- Accounting values are in USDM sub-units: 100 = 1.00 USDM.
  let genesis = 100
      eightGenesis = replicate 8 genesis
      mixedPrices = [genesis, 10_000] -- 1 USDM and 100 USDM

  assertOutcomes
    (runMaximumSequence 400_000 eightGenesis)
    (replicate 7 True ++ [False])
    "canonical B1 CEK: exact 4,000-USDM WCE boundary blocks only the eighth 500x Reveal"

  assertOutcomes
    (runMaximumSequence 400_100 eightGenesis)
    (replicate 8 True)
    "canonical B1 CEK: 4,001 USDM supports all eight 500x Reveals"

  let mixedWce = 500 * sum mixedPrices
      mixedBuffer = mixedWce + 10_000
  assertOutcomes
    (runMaximumSequence mixedWce mixedPrices)
    [True, False]
    "canonical B1 CEK: mixed-price exact WCE boundary blocks final 100-USDM ticket"
  assertOutcomes
    (runMaximumSequence mixedWce (reverse mixedPrices))
    [True, False]
    "canonical B1 CEK: reverse mixed-price order also blocks final Reveal"

  assertOutcomes
    (runMaximumSequence mixedBuffer mixedPrices)
    [True, True]
    "canonical B1 CEK: largest ticket price headroom supports mixed order 1"
  assertOutcomes
    (runMaximumSequence mixedBuffer (reverse mixedPrices))
    [True, True]
    "canonical B1 CEK: largest ticket price headroom supports mixed order 2"

  -- A legitimate loss has payout zero. At the exact 2-ticket WCE boundary,
  -- that lower first payout leaves enough effectivePool for the later 500x win.
  assertOutcomes
    (runSequence 100_000 [genesis, genesis] [0, 500 * genesis])
    [True, True]
    "canonical B1 CEK: loss before maximum payout remains revealable at exact WCE"

  -- The following nonce-specific secrets are deterministic valid Reveal
  -- inputs for defaultPrizeTable and sampleTarget. Each produces a genuine
  -- 500x payout from a tier-5 row under the canonical GameRules functions.
  let maxSecrets =
        [ [0, 0, 52, 207]  -- nonce 7: 000034cf
        , [0, 0, 43, 14]   -- nonce 8: 00002b0e
        , [0, 0, 115, 161] -- nonce 9: 000073a1
        , [0, 0, 35, 34]  -- nonce 10: 00002322
        , [0, 0, 86, 233] -- nonce 11: 000056e9
        , [0, 0, 1, 219]  -- nonce 12: 000001db
        , [0, 0, 42, 38]  -- nonce 13: 00002a26
        , [0, 0, 48, 47]  -- nonce 14: 0000302f
        ]
      mixedPrices = [genesis, 10_000]
      mixedSecrets = take 2 maxSecrets
      dualExactWce = 500 * sum eightGenesis
      dualMixedWce = 500 * sum mixedPrices

  assertDualOutcomes
    (runDualValidatorSequence dualExactWce eightGenesis maxSecrets)
    (replicate 7 True ++ [False])
    "shared TxInfo dual CEK: canonical PrizeValidator and B1 agree on eight 1-USDM max Reveals at exact WCE"

  assertDualOutcomes
    (runDualValidatorSequence (dualExactWce + genesis) eightGenesis maxSecrets)
    (replicate 8 True)
    "shared TxInfo dual CEK: one ticket price of headroom allows all eight 1-USDM max Reveals"

  assertDualOutcomes
    (runDualValidatorSequence dualMixedWce mixedPrices mixedSecrets)
    [True, False]
    "shared TxInfo dual CEK: mixed 1/100-USDM price order 1 blocks final max Reveal at exact WCE"

  assertDualOutcomes
    (runDualValidatorSequence dualMixedWce (reverse mixedPrices) mixedSecrets)
    [True, False]
    "shared TxInfo dual CEK: mixed 1/100-USDM price order 2 blocks final max Reveal at exact WCE"

  assertDualOutcomes
    (runDualValidatorSequence (dualMixedWce + maximum mixedPrices)
       mixedPrices mixedSecrets)
    [True, True]
    "shared TxInfo dual CEK: maximum-ticket-price headroom supports mixed order 1"

  assertDualOutcomes
    (runDualValidatorSequence (dualMixedWce + maximum mixedPrices)
       (reverse mixedPrices) mixedSecrets)
    [True, True]
    "shared TxInfo dual CEK: maximum-ticket-price headroom supports mixed order 2"

  let lossSecret = [0, 187, 204, 221] -- nonce 7 yields two LOSS rows
  assertDualOutcomes
    (runDualValidatorSequence (500 * 2 * genesis)
       [genesis, genesis] [lossSecret, maxSecrets !! 1])
    [True, True]
    "shared TxInfo dual CEK: canonical LOSS before a later 500x payout remains valid at exact WCE"

  putStrLn "ALL B1 AND DUAL-VALIDATOR REVEAL HEADROOM CEK TESTS PASSED"
