{-# LANGUAGE NumericUnderscores #-}
{-# LANGUAGE OverloadedStrings #-}

-- Synthetic compiled-Plutus CEK characterization only.
-- These cases characterize the current B1 PrizePool and PrizeValidator
-- predicates with Cardano-Value-balanced TxInfo fixtures. They are not
-- native-ledger, Yaci or Preprod transactions and do not implement new rules.
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
import GameRules (defaultPrizeTable)
import OracleTypes
  ( OracleDatum (OracleQuoteSet)
  , OracleQuote (..)
  , OracleStateId (..)
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

registryHash :: ScriptHash
registryHash = ScriptHash (rawBytes (replicate 28 8))

poolPolicy :: Builtins.BuiltinByteString
poolPolicy = rawBytes (replicate 28 9)

poolName :: Builtins.BuiltinByteString
poolName = rawBytes [80, 79, 79, 76]

ticketPolicy :: Builtins.BuiltinByteString
ticketPolicy = rawBytes (replicate 28 10)

ticketName :: Builtins.BuiltinByteString
ticketName = rawBytes [84, 73, 67, 75, 69, 84]

tusdmPolicy :: Builtins.BuiltinByteString
tusdmPolicy = rawBytes (replicate 28 11)

tusdmName :: Builtins.BuiltinByteString
tusdmName = rawBytes [116, 85, 83, 68, 77]

foreignPolicy :: Builtins.BuiltinByteString
foreignPolicy = rawBytes (replicate 28 12)

foreignName :: Builtins.BuiltinByteString
foreignName = rawBytes [70, 79, 82, 69, 73, 71, 78]

oraclePolicy :: Builtins.BuiltinByteString
oraclePolicy = rawBytes (replicate 28 13)

oracleName :: Builtins.BuiltinByteString
oracleName = rawBytes [79, 82, 65, 67, 76, 69]

ownerPkh :: PubKeyHash
ownerPkh = PubKeyHash (rawBytes (replicate 28 14))

sourcePkh :: PubKeyHash
sourcePkh = PubKeyHash (rawBytes (replicate 28 15))

oraclePublisher :: PubKeyHash
oraclePublisher = PubKeyHash (rawBytes (replicate 28 16))

oracleState :: OracleStateId
oracleState = OracleStateId oraclePolicy oracleName

sampleTarget :: BeaconTarget
sampleTarget =
  BeaconTarget
    { btNetworkId = 0
    , btRound = 1
    , btMainchainRef = rawBytes [1, 2, 3]
    , btVersion = rawBytes [1]
    }

poolDatum :: Integer -> Integer -> B1PrizePoolDatum
poolDatum liquidity liabilities =
  B1PrizePoolDatum
    { ppTotalLiquidity = liquidity
    , ppPendingLiabilities = liabilities
    , ppUnresolvedReserve = 0
    , ppUnresolvedTicketCount = 0
    , ppLockedJackpot = 0
    , ppJackpotThreshold = 0
    , ppSuspendedClasses = 0
    , ppPrizeHash = prizeHash
    }

prizeDatum :: PrizeStatus -> Integer -> PrizeDatum
prizeDatum status payout =
  PrizeDatum
    { pdTicketPolicy = ticketPolicy
    , pdTicketName = ticketName
    , pdPlayerCommitment = rawBytes [20]
    , pdPriceUsdm = 1
    , pdCommitment = rawBytes [21]
    , pdGameVersion = rawBytes [1]
    , pdTicketNonce = 7
    , pdPrizeAmount = payout
    , pdPaymentPolicy = rawBytes [22]
    , pdPaymentName = rawBytes [23]
    , pdStatus = status
    , pdResult = rawBytes [24]
    , pdPrizeTier = 1
    , pdBeaconTarget = sampleTarget
    , pdBeaconStatus = BeaconReady
    , pdBeaconValue = rawBytes [25]
    , pdMcHash = rawBytes [26]
    , pdMateriosContext = rawBytes [27]
    , pdPrizePoolHash = rawBytes (replicate 28 7)
    , pdIssuedAt = 1_000
    , pdExpiresAt = 9_000
    , pdRow1Tier = 1
    , pdRow2Tier = 0
    }

scriptOut :: ScriptHash -> Value -> PlutusTx.BuiltinData -> TxOut
scriptOut hash value datum =
  TxOut
    (Address (ScriptCredential hash) Nothing)
    value
    (OutputDatum (Datum datum))
    Nothing

pubkeyOut :: PubKeyHash -> Value -> TxOut
pubkeyOut pkh value =
  TxOut
    (Address (PubKeyCredential pkh) Nothing)
    value
    NoOutputDatum
    Nothing

oracleOutput :: [OracleQuote] -> TxOut
oracleOutput quotes =
  TxOut
    (Address (PubKeyCredential oraclePublisher) Nothing)
    (singleton (CurrencySymbol oraclePolicy) (TokenName oracleName) 1)
    (OutputDatum (Datum (PlutusTx.toBuiltinData (OracleQuoteSet quotes))))
    Nothing

oracleQuote :: Builtins.BuiltinByteString -> Builtins.BuiltinByteString -> Integer -> OracleQuote
oracleQuote policy name price =
  OracleQuote policy name price 1_500 oraclePublisher

adaQuote :: OracleQuote
adaQuote =
  oracleQuote Builtins.emptyByteString Builtins.emptyByteString 0

tusdmQuote :: Integer -> OracleQuote
tusdmQuote = oracleQuote tusdmPolicy tusdmName

foreignQuote :: Integer -> OracleQuote
foreignQuote = oracleQuote foreignPolicy foreignName

ticketQuote :: OracleQuote
ticketQuote = oracleQuote ticketPolicy ticketName 0

poolValue :: Integer -> Integer -> Value
poolValue tusdmAmount foreignAmount =
  singleton (CurrencySymbol poolPolicy) (TokenName poolName) 1
    <> singleton (CurrencySymbol tusdmPolicy) (TokenName tusdmName) tusdmAmount
    <> foreignPart
    <> singleton adaSymbol adaToken 10_000_000
  where
    foreignPart
      | foreignAmount == 0 = mempty
      | otherwise =
          singleton (CurrencySymbol foreignPolicy) (TokenName foreignName) foreignAmount

prizeScriptValue :: Value
prizeScriptValue =
  singleton adaSymbol adaToken 5_000_000

ownerTicketValue :: Value
ownerTicketValue =
  singleton (CurrencySymbol ticketPolicy) (TokenName ticketName) 1
    <> singleton adaSymbol adaToken 5_000_000

-- The claim uses one shared TxInfo and evaluates both compiled spending
-- validators against it. The Pool basket remains EV3-canonical: singleton +
-- approved tUSDM only. All non-reference assets balance exactly:
-- tUSDM 4,000,000 in = 2,000,000 in Pool + 2,000,000 source change;
-- foreign asset 1 in = 1 to the ticket owner; Pool/ticket singleton NFTs continue;
-- ADA inputs and outputs balance. The owner receives no physical tUSDM.
makeClaimContexts
  :: (ScriptContext, ScriptContext)
makeClaimContexts =
  let
    poolRef = TxOutRef (TxId (rawBytes [101])) 0
    prizeRef = TxOutRef (TxId (rawBytes [102])) 0
    ownerRef = TxOutRef (TxId (rawBytes [103])) 0
    sourceRef = TxOutRef (TxId (rawBytes [104])) 0

    beforePool = poolDatum 400 200
    afterPool = poolDatum 200 0
    beforePrize = prizeDatum Revealed 200
    afterPrize = beforePrize { pdStatus = Claimed }

    poolInput =
      TxInInfo poolRef
        (scriptOut poolHash (poolValue 4_000_000 0)
          (PlutusTx.toBuiltinData beforePool))
    prizeInput =
      TxInInfo prizeRef
        (scriptOut prizeHash prizeScriptValue
          (PlutusTx.toBuiltinData beforePrize))
    ownerInput =
      TxInInfo ownerRef
        (pubkeyOut ownerPkh ownerTicketValue)
    sourceInput =
      TxInInfo sourceRef
        (pubkeyOut sourcePkh
          (singleton (CurrencySymbol foreignPolicy) (TokenName foreignName) 1
            <> singleton adaSymbol adaToken 5_000_000))

    poolOutput =
      scriptOut poolHash (poolValue 2_000_000 0)
        (PlutusTx.toBuiltinData afterPool)
    prizeOutput =
      scriptOut prizeHash prizeScriptValue
        (PlutusTx.toBuiltinData afterPrize)
    ownerPayout =
      pubkeyOut ownerPkh
        (ownerTicketValue
          <> singleton (CurrencySymbol foreignPolicy) (TokenName foreignName) 1)
    sourceChange =
      pubkeyOut sourcePkh
        (singleton (CurrencySymbol tusdmPolicy) (TokenName tusdmName) 2_000_000
          <> singleton adaSymbol adaToken 5_000_000)

    quoteSet =
      [ adaQuote
      , tusdmQuote 100
      , foreignQuote 200_000_000
      , ticketQuote
      ]
    oracleReference =
      TxInInfo
        (TxOutRef (TxId (rawBytes [105])) 0)
        (oracleOutput quoteSet)

    sharedInfo =
      TxInfo
        [poolInput, prizeInput, ownerInput, sourceInput]
        [oracleReference]
        [poolOutput, prizeOutput, ownerPayout, sourceChange]
        mempty
        mempty
        []
        AssocMap.empty
        (interval (POSIXTime 1_000) (POSIXTime 2_000))
        [ownerPkh, sourcePkh]
        AssocMap.empty
        AssocMap.empty
        (TxId (rawBytes [106]))
  in
    ( ScriptContext sharedInfo (Spending prizeRef)
    , ScriptContext sharedInfo (Spending poolRef)
    )

makeFundContext :: ScriptContext
makeFundContext =
  let
    poolRef = TxOutRef (TxId (rawBytes [111])) 0
    sourceRef = TxOutRef (TxId (rawBytes [112])) 0

    beforePool = poolDatum 1_000 0
    afterPool = poolDatum 2_000 0

    poolInput =
      TxInInfo poolRef
        (scriptOut poolHash (poolValue 10_000_000 0)
          (PlutusTx.toBuiltinData beforePool))
    sourceInput =
      TxInInfo sourceRef
        (pubkeyOut sourcePkh
          (singleton (CurrencySymbol foreignPolicy) (TokenName foreignName) 1
            <> singleton adaSymbol adaToken 5_000_000))

    poolOutput =
      scriptOut poolHash (poolValue 9_000_000 1)
        (PlutusTx.toBuiltinData afterPool)
    sourceChange =
      pubkeyOut sourcePkh
        (singleton (CurrencySymbol tusdmPolicy) (TokenName tusdmName) 1_000_000
          <> singleton adaSymbol adaToken 5_000_000)

    quoteSet =
      [ adaQuote
      , tusdmQuote 100
      , foreignQuote 1_100_000_000
      ]
    oracleReference =
      TxInInfo
        (TxOutRef (TxId (rawBytes [113])) 0)
        (oracleOutput quoteSet)

    info =
      TxInfo
        [poolInput, sourceInput]
        [oracleReference]
        [poolOutput, sourceChange]
        mempty
        mempty
        []
        AssocMap.empty
        (interval (POSIXTime 1_000) (POSIXTime 2_000))
        [sourcePkh]
        AssocMap.empty
        AssocMap.empty
        (TxId (rawBytes [114]))
  in
    ScriptContext info (Spending poolRef)

applyB1Validator datum action context =
  let
    configured0 =
      PlutusTx.unsafeApplyCode B1PrizePool.compiledValidatorFactory
        (Lift.liftCode plcVersion100
          (PlutusTx.toBuiltinData prizeHash))
    configured1 =
      PlutusTx.unsafeApplyCode configured0
        (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData oracleState))
    configured2 =
      PlutusTx.unsafeApplyCode configured1
        (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData oraclePublisher))
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

applyPrizeClaim datum context =
  let
    configured0 =
      PlutusTx.unsafeApplyCode PrizeValidator.compiledValidatorFactory
        (Lift.liftCode plcVersion100 registryHash)
    configured1 =
      PlutusTx.unsafeApplyCode configured0
        (Lift.liftCode plcVersion100 defaultPrizeTable)
    configured2 =
      PlutusTx.unsafeApplyCode configured1
        (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData oracleState))
    configured3 =
      PlutusTx.unsafeApplyCode configured2
        (Lift.liftCode plcVersion100 oraclePublisher)
    configured4 =
      PlutusTx.unsafeApplyCode configured3
        (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData datum))
    configured5 =
      PlutusTx.unsafeApplyCode configured4
        (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData Claim))
  in
    PlutusTx.unsafeApplyCode configured5
      (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData context))

evalAccepts compiled =
  case evalResult (evaluateCompiledCode compiled) of
    Right _ -> True
    Left _ -> False

directUsdmSubunits :: Integer -> Integer
directUsdmSubunits atomicAmount =
  div (atomicAmount * 100) 1_000_000

main :: IO ()
main = do
  let
    (prizeContext, poolContext) = makeClaimContexts
    prizeInputDatum = prizeDatum Revealed 200
    poolInputDatum = poolDatum 400 200
    poolOutputOracleValue = 200
    claimedAmount = 200
    claimDirectDelta =
      directUsdmSubunits 2_000_000 - directUsdmSubunits 4_000_000
    ownerPhysicalTusdmPaid = 0
    ownerOracleEquivalentPayout = 200

    claimPrizeAccepted =
      evalAccepts (applyPrizeClaim prizeInputDatum prizeContext)
    claimPoolAccepted =
      evalAccepts (applyB1Validator poolInputDatum (TicketClaimed claimedAmount) poolContext)

  assert
    (claimPrizeAccepted && claimPoolAccepted)
    ("OBSERVED GAP: compiled PrizeValidator and B1 accept balanced Claim; prizeAccepted="
      ++ show claimPrizeAccepted ++ ", poolAccepted=" ++ show claimPoolAccepted)

  assert
    (poolOutputOracleValue == 200
      && 400 - poolOutputOracleValue == claimedAmount)
    "Claim fixture reconciles Oracle-valued Pool delta and exact 200-subunit crystallized payout"

  assert
    (claimDirectDelta == -200
      && ownerPhysicalTusdmPaid == 0
      && ownerOracleEquivalentPayout == claimedAmount)
    "Claim counterexample: EV3-canonical Pool loses 200 direct subunits while owner receives zero tUSDM and an Oracle-equivalent foreign payout"

  let
    fundContext = makeFundContext
    fundInputDatum = poolDatum 1_000 0
    fundOutputOracleValue = 2_000
    fundAccepted =
      evalAccepts (applyB1Validator fundInputDatum FundTreasury fundContext)
    fundDirectDelta =
      directUsdmSubunits 9_000_000 - directUsdmSubunits 10_000_000

  assert
    fundAccepted
    "OBSERVED GAP: compiled FundTreasury accepts Oracle-valued liquidity increase while physical direct tUSDM falls"

  assert
    (fundOutputOracleValue > 1_000
      && fundDirectDelta == -100)
    "FundTreasury counterexample: Oracle accounting rises 10 RU while direct EEV falls 1 RU"

  putStrLn "ALL B1 DIRECT-USDM CLAIM / FUND TREASURY CEK CHARACTERIZATIONS PASSED"

assert :: Bool -> String -> IO ()
assert condition label =
  if condition
    then putStrLn ("PASS: " ++ label)
    else error ("FAIL: " ++ label)
