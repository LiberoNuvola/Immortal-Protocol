{-# LANGUAGE OverloadedStrings #-}

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
import Types
  ( B1PrizePoolAction (..)
  , B1PrizePoolDatum (..)
  , BeaconStatus (..)
  , BeaconTarget (..)
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
  putStrLn "ALL B1 REVEAL HEADROOM CEK TESTS PASSED"
