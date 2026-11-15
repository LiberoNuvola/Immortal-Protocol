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
  , valueOf
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
import qualified Economic
import qualified PrizeValidator
import GameRules (defaultPrizeTable)
import OracleTypes
  ( OracleDatum (..)
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

oracleLegacyAdaOutput :: TxOut
oracleLegacyAdaOutput =
  TxOut
    (Address (PubKeyCredential oraclePublisher) Nothing)
    (singleton (CurrencySymbol oraclePolicy) (TokenName oracleName) 1)
    (OutputDatum
      (Datum
        (PlutusTx.toBuiltinData
          (OracleDatum
            Builtins.emptyByteString
            Builtins.emptyByteString
            100
            1_500
            oraclePublisher))))
    Nothing

oracleQuote :: Builtins.BuiltinByteString -> Builtins.BuiltinByteString -> Integer -> OracleQuote
oracleQuote policy name price =
  OracleQuote policy name price 1_500 oraclePublisher

adaQuoteAt :: Integer -> OracleQuote
adaQuoteAt =
  oracleQuote Builtins.emptyByteString Builtins.emptyByteString

adaQuote :: OracleQuote
adaQuote = adaQuoteAt 0

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


-- Full shared Reveal fixture with canonical commitment/beacon/game derivation.
-- The Pool input/output baskets are EV3-canonical (singleton + approved tUSDM
-- + ADA) and the whole TxInfo balances exactly. Both compiled validators are
-- evaluated against this same TxInfo. The Pool loses 1,000,000 approved
-- tUSDM atomic units while ppTotalLiquidity remains unchanged; the diverted
-- physical asset is paid to the source PubKey output.
revealPlayerSecret :: Builtins.BuiltinByteString
revealPlayerSecret = rawBytes [33, 34, 35, 36]

revealTarget :: BeaconTarget
revealTarget =
  BeaconTarget
    { btNetworkId = 0
    , btRound = 1
    , btMainchainRef = rawBytes [1, 2, 3]
    , btVersion = rawBytes [1]
    }

revealInputPrizeDatum :: PrizeDatum
revealInputPrizeDatum =
  (prizeDatum Pending 0)
    { pdPlayerCommitment =
        rawBytes
          [ 0x98, 0x7e, 0x4d, 0x42, 0x29, 0x44, 0x22, 0x6f
          , 0xc8, 0x0d, 0xb3, 0x5c, 0x2f, 0x47, 0x84, 0x23
          , 0xe7, 0x21, 0x5d, 0x7f, 0x30, 0x90, 0xb7, 0xd0
          , 0xd0, 0x18, 0x27, 0x7d, 0x00, 0xb5, 0x55, 0x05
          ]
    , pdPriceUsdm = 2
    , pdCommitment =
        rawBytes
          [ 0x8c, 0x2e, 0x25, 0x82, 0xd9, 0x85, 0x49, 0x3c
          , 0xc4, 0x16, 0x6e, 0x17, 0x17, 0xd8, 0x51, 0xc3
          , 0xc6, 0x84, 0x35, 0x0c, 0x99, 0xea, 0x7e, 0xda
          , 0x81, 0x94, 0x92, 0x70, 0xc2, 0x6c, 0xc0, 0x76
          ]
    , pdGameVersion = rawBytes [1]
    , pdTicketNonce = 11
    , pdBeaconTarget = revealTarget
    , pdBeaconStatus = BeaconReady
    , pdBeaconValue =
        rawBytes
          [ 0x69, 0xb5, 0xef, 0xa2, 0xac, 0xfd, 0xab, 0x1e
          , 0x0f, 0x55, 0x79, 0xe9, 0xcf, 0x71, 0xc5, 0x75
          , 0x75, 0x4c, 0x9a, 0x11, 0xe3, 0xf8, 0x38, 0x8a
          , 0xd9, 0xcc, 0x16, 0xc4, 0xd2, 0xc9, 0x82, 0x57
          ]
    , pdMcHash = rawBytes (replicate 32 26)
    , pdMateriosContext = rawBytes [27]
    , pdRow1Tier = 0
    , pdRow2Tier = 0
    }

revealOutputPrizeDatum :: PrizeDatum
revealOutputPrizeDatum =
  revealInputPrizeDatum
    { pdStatus = Revealed
    , pdPrizeAmount = 5
    , pdResult =
        rawBytes
          [ 0x5e, 0x55, 0x0e, 0x86, 0x9d, 0xab, 0x3c, 0x71
          , 0xaf, 0x0a, 0xfe, 0xaa, 0x4e, 0x49, 0x5e, 0x82
          , 0x6a, 0x63, 0x0e, 0xb1, 0x01, 0x66, 0x48, 0xdd
          , 0xb8, 0x36, 0x91, 0xfa, 0xf7, 0x98, 0x82, 0xb3
          ]
    , pdPrizeTier = 2
    , pdRow1Tier = 0
    , pdRow2Tier = 2
    }

revealInputPoolDatum :: B1PrizePoolDatum
revealInputPoolDatum =
  (poolDatum 1_000 0)
    { ppUnresolvedReserve = 2
    , ppUnresolvedTicketCount = 1
    }

revealOutputPoolDatum :: B1PrizePoolDatum
revealOutputPoolDatum =
  (poolDatum 1_000 5)
    { ppUnresolvedReserve = 0
    , ppUnresolvedTicketCount = 0
    }

makeRevealDrainContexts :: (ScriptContext, ScriptContext)
makeRevealDrainContexts =
  let
    poolRef = TxOutRef (TxId (rawBytes [121])) 0
    prizeRef = TxOutRef (TxId (rawBytes [122])) 0
    sourceRef = TxOutRef (TxId (rawBytes [123])) 0

    poolInput =
      TxInInfo poolRef
        (scriptOut poolHash (poolValue 10_000_000 0)
          (PlutusTx.toBuiltinData revealInputPoolDatum))
    prizeInput =
      TxInInfo prizeRef
        (scriptOut prizeHash prizeScriptValue
          (PlutusTx.toBuiltinData revealInputPrizeDatum))
    sourceInput =
      TxInInfo sourceRef
        (pubkeyOut sourcePkh
          (singleton adaSymbol adaToken 5_000_000))

    poolOutput =
      scriptOut poolHash (poolValue 9_000_000 0)
        (PlutusTx.toBuiltinData revealOutputPoolDatum)
    prizeOutput =
      scriptOut prizeHash prizeScriptValue
        (PlutusTx.toBuiltinData revealOutputPrizeDatum)
    divertedOutput =
      pubkeyOut sourcePkh
        (singleton (CurrencySymbol tusdmPolicy) (TokenName tusdmName) 1_000_000
          <> singleton adaSymbol adaToken 5_000_000)

    info =
      TxInfo
        [poolInput, prizeInput, sourceInput]
        []
        [poolOutput, prizeOutput, divertedOutput]
        mempty
        mempty
        []
        AssocMap.empty
        (interval (POSIXTime 1_000) (POSIXTime 2_000))
        [sourcePkh]
        AssocMap.empty
        AssocMap.empty
        (TxId (rawBytes [124]))
  in
    ( ScriptContext info (Spending prizeRef)
    , ScriptContext info (Spending poolRef)
    )


-- EV3-canonical FundTreasury fixture: Pool inputs/outputs contain only the
-- Pool singleton, approved tUSDM and ADA. The ADA quote values the amount
-- above the 1.6 ADA minimum-UTxO floor. The transaction replaces 1 USDM of
-- physical tUSDM (100 accounting subunits) with 1.1 ADA (110 oracle subunits),
-- so the Oracle-valued datum rises by 10 while direct-USDM EEV falls by 100.
makeCanonicalFundAdaContext :: TxOut -> ScriptContext
makeCanonicalFundAdaContext oracleRefOutput =
  let
    poolRef = TxOutRef (TxId (rawBytes [131])) 0
    sourceRef = TxOutRef (TxId (rawBytes [132])) 0

    beforePool = poolDatum 1_000 0
    afterPool = poolDatum 1_010 0

    poolInputValue =
      singleton (CurrencySymbol poolPolicy) (TokenName poolName) 1
        <> singleton (CurrencySymbol tusdmPolicy) (TokenName tusdmName) 10_000_000
        <> singleton adaSymbol adaToken 1_600_000
    poolOutputValue =
      singleton (CurrencySymbol poolPolicy) (TokenName poolName) 1
        <> singleton (CurrencySymbol tusdmPolicy) (TokenName tusdmName) 9_000_000
        <> singleton adaSymbol adaToken 2_700_000

    poolInput =
      TxInInfo poolRef
        (scriptOut poolHash poolInputValue (PlutusTx.toBuiltinData beforePool))
    sourceInput =
      TxInInfo sourceRef
        (pubkeyOut sourcePkh
          (singleton adaSymbol adaToken 3_000_000))

    poolOutput =
      scriptOut poolHash poolOutputValue (PlutusTx.toBuiltinData afterPool)
    sourceChange =
      pubkeyOut sourcePkh
        (singleton (CurrencySymbol tusdmPolicy) (TokenName tusdmName) 1_000_000
          <> singleton adaSymbol adaToken 1_900_000)

    oracleReference =
      TxInInfo
        (TxOutRef (TxId (rawBytes [133])) 0)
        oracleRefOutput

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
        (TxId (rawBytes [134]))
  in
    ScriptContext info (Spending poolRef)

-- Historical Oracle-vs-direct FundTreasury characterization only. Its Pool output
-- deliberately contains a foreign positive asset and is therefore NOT an
-- EV3-canonical basket; it is not evidence of a reachable EV3-qualified attack.
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

applyPrizeReveal datum playerSecret context =
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
        (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData (Reveal playerSecret)))
  in
    PlutusTx.unsafeApplyCode configured5
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
    claimedAmount = 200
    claimInfo = scriptContextTxInfo prizeContext
    poolAddress = Address (ScriptCredential poolHash) Nothing
    poolInputs =
      filter ((== poolAddress) . txOutAddress . txInInfoResolved)
        (txInfoInputs claimInfo)
    poolOutputs =
      filter ((== poolAddress) . txOutAddress) (txInfoOutputs claimInfo)
    poolInputValue =
      foldr ((<>) . txOutValue . txInInfoResolved) mempty poolInputs
    poolOutputValue =
      foldr ((<>) . txOutValue) mempty poolOutputs
    poolInputOracleValue =
      Economic.poolUsdmValue claimInfo oracleState oraclePublisher
        poolPolicy poolName poolInputValue
    poolOutputOracleValue =
      Economic.poolUsdmValue claimInfo oracleState oraclePublisher
        poolPolicy poolName poolOutputValue
    claimDirectDelta =
      directUsdmSubunits
        (valueOf poolOutputValue (CurrencySymbol tusdmPolicy) (TokenName tusdmName))
        - directUsdmSubunits
            (valueOf poolInputValue (CurrencySymbol tusdmPolicy) (TokenName tusdmName))
    ownerAddress = Address (PubKeyCredential ownerPkh) Nothing
    ownerOutputs =
      filter ((== ownerAddress) . txOutAddress) (txInfoOutputs claimInfo)
    ownerValue =
      foldr ((<>) . txOutValue) mempty ownerOutputs
    ownerPhysicalTusdmPaid =
      valueOf ownerValue (CurrencySymbol tusdmPolicy) (TokenName tusdmName)
    ownerOracleEquivalentPayout =
      Economic.totalUsdmValue claimInfo oracleState oraclePublisher ownerValue

    claimPrizeAccepted =
      evalAccepts (applyPrizeClaim prizeInputDatum prizeContext)
    claimPoolAccepted =
      evalAccepts (applyB1Validator poolInputDatum (TicketClaimed claimedAmount) poolContext)

  assert
    (claimPrizeAccepted && claimPoolAccepted)
    ("OBSERVED GAP: compiled PrizeValidator and B1 accept balanced Claim; prizeAccepted="
      ++ show claimPrizeAccepted ++ ", poolAccepted=" ++ show claimPoolAccepted)

  assert
    (poolInputOracleValue == 400
      && poolOutputOracleValue == 200
      && poolInputOracleValue - poolOutputOracleValue == claimedAmount)
    "Claim fixture reconciles Oracle-valued Pool delta and exact 200-subunit crystallized payout"

  assert
    (claimDirectDelta == -200
      && ownerPhysicalTusdmPaid == 0
      && ownerOracleEquivalentPayout == claimedAmount)
    "Claim counterexample: EV3-canonical Pool loses 200 direct subunits while owner receives zero tUSDM and an Oracle-equivalent foreign payout"

  let
    (revealPrizeContext, revealPoolContext) = makeRevealDrainContexts
    revealPrizeAccepted =
      evalAccepts
        (applyPrizeReveal revealInputPrizeDatum revealPlayerSecret revealPrizeContext)
    revealPoolAccepted =
      evalAccepts
        (applyB1Validator revealInputPoolDatum (TicketRevealed 2) revealPoolContext)
    revealInfo = scriptContextTxInfo revealPrizeContext
    revealPoolAddress = Address (ScriptCredential poolHash) Nothing
    revealPoolInputs =
      filter ((== revealPoolAddress) . txOutAddress . txInInfoResolved)
        (txInfoInputs revealInfo)
    revealPoolOutputs =
      filter ((== revealPoolAddress) . txOutAddress) (txInfoOutputs revealInfo)
    revealPoolInputValue =
      foldr ((<>) . txOutValue . txInInfoResolved) mempty revealPoolInputs
    revealPoolOutputValue =
      foldr ((<>) . txOutValue) mempty revealPoolOutputs
    revealOwnerOutputs =
      filter
        ((== Address (PubKeyCredential sourcePkh) Nothing) . txOutAddress)
        (txInfoOutputs revealInfo)
    revealOwnerValue =
      foldr ((<>) . txOutValue) mempty revealOwnerOutputs
    revealPoolInputTusdm =
      valueOf revealPoolInputValue (CurrencySymbol tusdmPolicy) (TokenName tusdmName)
    revealPoolOutputTusdm =
      valueOf revealPoolOutputValue (CurrencySymbol tusdmPolicy) (TokenName tusdmName)
    revealOwnerTusdm =
      valueOf revealOwnerValue (CurrencySymbol tusdmPolicy) (TokenName tusdmName)
    revealTotalInputValue =
      foldr ((<>) . txOutValue . txInInfoResolved) mempty (txInfoInputs revealInfo)
    revealTotalOutputValue =
      foldr ((<>) . txOutValue) mempty (txInfoOutputs revealInfo)

  assert
    (revealPrizeAccepted && revealPoolAccepted)
    ("OBSERVED COMBINED GAP: compiled PrizeValidator Reveal and B1 TicketRevealed accept balanced transaction; prizeAccepted="
      ++ show revealPrizeAccepted ++ ", poolAccepted=" ++ show revealPoolAccepted)

  assert
    (revealPoolInputTusdm - revealPoolOutputTusdm == 1_000_000
      && revealOwnerTusdm == 1_000_000
      && revealTotalInputValue == revealTotalOutputValue)
    "Reveal drain fixture: canonical Prize/Pool Value balances, but 1,000,000 approved tUSDM atomic units leave the Pool and reach a PubKey output"

  let
    canonicalAdaFundContext =
      makeCanonicalFundAdaContext
        (oracleOutput [adaQuoteAt 100, tusdmQuote 100])
    adaOnlyFundContext =
      makeCanonicalFundAdaContext oracleLegacyAdaOutput
    adaOnlyFundAccepted =
      evalAccepts
        (applyB1Validator (poolDatum 1_000 0) FundTreasury adaOnlyFundContext)
    canonicalAdaFundInfo = scriptContextTxInfo canonicalAdaFundContext
    canonicalAdaFundAccepted =
      evalAccepts (applyB1Validator (poolDatum 1_000 0) FundTreasury canonicalAdaFundContext)
    canonicalAdaFundPoolAddress = Address (ScriptCredential poolHash) Nothing
    canonicalAdaFundPoolInputs =
      filter ((== canonicalAdaFundPoolAddress) . txOutAddress . txInInfoResolved)
        (txInfoInputs canonicalAdaFundInfo)
    canonicalAdaFundPoolOutputs =
      filter ((== canonicalAdaFundPoolAddress) . txOutAddress)
        (txInfoOutputs canonicalAdaFundInfo)
    canonicalAdaFundInputValue =
      foldr ((<>) . txOutValue . txInInfoResolved) mempty canonicalAdaFundPoolInputs
    canonicalAdaFundOutputValue =
      foldr ((<>) . txOutValue) mempty canonicalAdaFundPoolOutputs
    canonicalAdaFundInputOracleValue =
      Economic.poolUsdmValue canonicalAdaFundInfo oracleState oraclePublisher
        poolPolicy poolName canonicalAdaFundInputValue
    canonicalAdaFundOutputOracleValue =
      Economic.poolUsdmValue canonicalAdaFundInfo oracleState oraclePublisher
        poolPolicy poolName canonicalAdaFundOutputValue
    canonicalAdaFundInputTusdm =
      valueOf canonicalAdaFundInputValue (CurrencySymbol tusdmPolicy) (TokenName tusdmName)
    canonicalAdaFundOutputTusdm =
      valueOf canonicalAdaFundOutputValue (CurrencySymbol tusdmPolicy) (TokenName tusdmName)
    canonicalAdaFundTotalInputValue =
      foldr ((<>) . txOutValue . txInInfoResolved) mempty
        (txInfoInputs canonicalAdaFundInfo)
    canonicalAdaFundTotalOutputValue =
      foldr ((<>) . txOutValue) mempty (txInfoOutputs canonicalAdaFundInfo)

  assert
    canonicalAdaFundAccepted
    "OBSERVED EV3-CANONICAL GAP: compiled FundTreasury accepts an ADA-for-tUSDM substitution with an Oracle-valued liquidity increase"

  assert
    (canonicalAdaFundInputOracleValue == 1_000
      && canonicalAdaFundOutputOracleValue == 1_010
      && canonicalAdaFundInputTusdm - canonicalAdaFundOutputTusdm == 1_000_000
      && canonicalAdaFundTotalInputValue == canonicalAdaFundTotalOutputValue)
    "Canonical FundTreasury counterexample: Pool loses 1,000,000 tUSDM atoms, receives 1.1 ADA above min-UTxO, Oracle datum rises 10, and Value balances"

  assert
    (not adaOnlyFundAccepted)
    "Legacy ADA-only Oracle datum: FundTreasury fails closed when it tries to value the Pool's non-zero tUSDM without a tUSDM quote"

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
    "HISTORICAL NON-EV3 CASE: compiled FundTreasury accepts Oracle-valued liquidity increase while physical direct tUSDM falls"

  assert
    (fundOutputOracleValue > 1_000
      && fundDirectDelta == -100)
    "Non-EV3 FundTreasury characterization: Oracle accounting rises 10 RU while direct EEV falls 1 RU"

  putStrLn "ALL B1 DIRECT-USDM CLAIM / FUND TREASURY / REVEAL CEK CHARACTERIZATIONS PASSED"

assert :: Bool -> String -> IO ()
assert condition label =
  if condition
    then putStrLn ("PASS: " ++ label)
    else error ("FAIL: " ++ label)
