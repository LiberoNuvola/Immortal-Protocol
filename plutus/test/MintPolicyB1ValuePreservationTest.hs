{-# LANGUAGE TemplateHaskell #-}

-- | Execute the actual compiled Plutus V2 MintPolicy wrapper against
-- transaction contexts that differ only in the B1 PrizePool Value.
-- The fixture satisfies the other sale-path predicates so the expected
-- failure is specifically the atomic pool Value-preservation guard.
module Main where

import Prelude

import PlutusLedgerApi.V2
import PlutusLedgerApi.V2.Contexts
import qualified PlutusLedgerApi.V1.Interval as Interval
import PlutusLedgerApi.V1.Value (adaSymbol, adaToken, singleton)

import PlutusTx (CompiledCode, ToData, liftCodeDef, unsafeApplyCode)
import PlutusTx.Prelude
  ( BuiltinUnit
  , consByteString
  , emptyByteString
  , toBuiltinData
  )
import qualified PlutusTx.AssocMap as AssocMap
import PlutusTx.Test.Run.Code
  ( assertEvaluatesSuccessfully
  , assertEvaluatesWithError
  )

import Beacon (encodeBeaconTarget, ticketCommitment)
import MintPolicy (compiledPolicyFactory)
import OracleTypes (OracleStateId (..))
import Types
  ( BeaconRegistryDatum (..)
  , BeaconStatus (..)
  , BeaconTarget (..)
  , B1PrizePoolDatum (..)
  , PrizeDatum (..)
  , PrizeStatus (..)
  )

bytes :: [Integer] -> BuiltinByteString
bytes = foldr consByteString emptyByteString

counterHash, prizeHash, registryHash, treasuryHash, poolHash :: ScriptHash
counterHash  = ScriptHash (bytes [11..38])
prizeHash    = ScriptHash (bytes [41..68])
registryHash = ScriptHash (bytes [71..98])
treasuryHash = ScriptHash (bytes [101..128])
poolHash     = ScriptHash (bytes [131..158])

ticketPolicyBytes :: BuiltinByteString
ticketPolicyBytes = bytes [161..188]

ticketPolicy :: CurrencySymbol
ticketPolicy = CurrencySymbol ticketPolicyBytes

ticketNameBytes :: BuiltinByteString
ticketNameBytes = bytes [48]

ticketName :: TokenName
ticketName = TokenName ticketNameBytes

poolAssetPolicy, addedAssetPolicy :: CurrencySymbol
poolAssetPolicy  = CurrencySymbol (bytes [191..218])
addedAssetPolicy = CurrencySymbol (bytes [221..248])

poolAssetName, addedAssetName :: TokenName
poolAssetName  = TokenName (bytes [80, 79, 79, 76])
addedAssetName = TokenName (bytes [65, 68, 68, 69, 68])

poolAda :: Value
poolAda = singleton adaSymbol adaToken 4000000

poolValue :: Value
poolValue = poolAda <> singleton poolAssetPolicy poolAssetName 7

poolValueWithSecondAsset :: Value
poolValueWithSecondAsset =
  poolValue <> singleton addedAssetPolicy addedAssetName 1

ticketPrice :: Integer
ticketPrice = 0

oraclePublisher :: PubKeyHash
oraclePublisher = PubKeyHash (bytes [9..36])

oracleState :: OracleStateId
oracleState = OracleStateId (bytes [37..64]) (bytes [65..92])

target :: BeaconTarget
target = BeaconTarget 0 1 (bytes [1, 2, 3]) (bytes [4, 5, 6])

basePoolDatum :: B1PrizePoolDatum
basePoolDatum =
  B1PrizePoolDatum
    100000
    0
    0
    0
    0
    0
    0
    prizeHash

issuedPoolDatum :: B1PrizePoolDatum
issuedPoolDatum =
  basePoolDatum
    { ppUnresolvedReserve = ticketPrice
    , ppUnresolvedTicketCount = 1
    }

playerCommitment :: BuiltinByteString
playerCommitment = bytes [17, 18, 19, 20]

gameVersion :: BuiltinByteString
gameVersion = bytes [1]

prizeDatum :: PrizeDatum
prizeDatum =
  PrizeDatum
    ticketPolicyBytes
    ticketNameBytes
    playerCommitment
    ticketPrice
    (ticketCommitment
      ticketNameBytes
      playerCommitment
      gameVersion
      0
      ticketPrice
      (encodeBeaconTarget target))
    gameVersion
    0
    0
    emptyByteString
    emptyByteString
    Pending
    emptyByteString
    0
    target
    BeaconPending
    emptyByteString
    emptyByteString
    emptyByteString
    (bytes [131..158])
    0
    1000000000
    0
    0

registryDatum :: BeaconRegistryDatum
registryDatum =
  BeaconRegistryDatum
    1
    target
    BeaconPending
    emptyByteString
    emptyByteString
    emptyByteString
    oraclePublisher

scriptAddress :: ScriptHash -> Address
scriptAddress hash = Address (ScriptCredential hash) Nothing

inlineDatum :: ToData a => a -> OutputDatum
inlineDatum value = OutputDatum (Datum (toBuiltinData value))

output :: ScriptHash -> Value -> OutputDatum -> TxOut
output hash value datum =
  TxOut (scriptAddress hash) value datum Nothing

mkTxInfo :: Value -> Value -> TxInfo
mkTxInfo poolInputValue poolOutputValue =
  TxInfo
    { txInfoInputs =
        [ TxInInfo
            (TxOutRef (TxId (bytes [1..32])) 0)
            (output counterHash mempty (inlineDatum (0 :: Integer)))
        , TxInInfo
            (TxOutRef (TxId (bytes [1..32])) 1)
            (output poolHash poolInputValue (inlineDatum basePoolDatum))
        ]
    , txInfoReferenceInputs =
        [ TxInInfo
            (TxOutRef (TxId (bytes [2..33])) 0)
            (output registryHash mempty (inlineDatum registryDatum))
        ]
    , txInfoOutputs =
        [ output counterHash mempty (inlineDatum (1 :: Integer))
        , output prizeHash mempty (inlineDatum prizeDatum)
        , output treasuryHash mempty (OutputDatum (Datum (toBuiltinData ())))
        , output poolHash poolOutputValue (inlineDatum issuedPoolDatum)
        ]
    , txInfoFee = mempty
    , txInfoMint = singleton ticketPolicy ticketName 1
    , txInfoDCert = []
    , txInfoWdrl = AssocMap.empty
    , txInfoValidRange = Interval.always
    , txInfoSignatories = []
    , txInfoRedeemers = AssocMap.empty
    , txInfoData = AssocMap.empty
    , txInfoId = TxId (bytes [3..34])
    }

-- Apply the real exported script factory and its serialized arguments.
-- The returned CompiledCode is the same compiled wrapper exported by the
-- production script exporter; no predicate is reimplemented in this test.
compiledPolicyFor :: Value -> Value -> CompiledCode BuiltinUnit
compiledPolicyFor poolInputValue poolOutputValue =
  let
    context =
      ScriptContext
        (mkTxInfo poolInputValue poolOutputValue)
        (Minting ticketPolicy)

    p1 = unsafeApplyCode compiledPolicyFactory (liftCodeDef counterHash)
    p2 = unsafeApplyCode p1 (liftCodeDef prizeHash)
    p3 = unsafeApplyCode p2 (liftCodeDef registryHash)
    p4 = unsafeApplyCode p3 (liftCodeDef treasuryHash)
    p5 = unsafeApplyCode p4 (liftCodeDef poolHash)
    p6 = unsafeApplyCode p5 (liftCodeDef (toBuiltinData oracleState))
    p7 = unsafeApplyCode p6 (liftCodeDef (toBuiltinData oraclePublisher))
    p8 = unsafeApplyCode p7 (liftCodeDef (toBuiltinData ()))
  in
    unsafeApplyCode p8 (liftCodeDef (toBuiltinData context))

main :: IO ()
main = do
  assertEvaluatesSuccessfully
    (compiledPolicyFor poolValue poolValue)
  putStrLn "PASS: unchanged ADA + complete native-asset basket is accepted"

  assertEvaluatesWithError
    (compiledPolicyFor poolValue (poolValue <> singleton adaSymbol adaToken 1))
  putStrLn "PASS: changed lovelace quantity is rejected"

  assertEvaluatesWithError
    (compiledPolicyFor
      poolValue
      (poolAda <> singleton poolAssetPolicy poolAssetName 8))
  putStrLn "PASS: changed native-asset quantity is rejected"

  assertEvaluatesWithError
    (compiledPolicyFor poolValue poolValueWithSecondAsset)
  putStrLn "PASS: added native asset is rejected"

  assertEvaluatesWithError
    (compiledPolicyFor poolValueWithSecondAsset poolValue)
  putStrLn "PASS: removed native asset is rejected"

  putStrLn "ALL COMPILED MINTPOLICY B1 VALUE-PRESERVATION TESTS PASSED"
