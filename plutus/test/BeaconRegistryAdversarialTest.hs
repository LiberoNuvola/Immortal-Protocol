{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TemplateHaskell #-}

-- | B0 adversarial characterization against the real exported Plutus V2
-- wrappers. These are CEK evaluations over synthetic ScriptContext values;
-- they are NOT balanced-ledger, Yaci, Preprod or deployment evidence.
--
-- The tests deliberately retain two current-source acceptances as named
-- CHARACTERIZATION cases. They expose authority/continuity gaps and must not
-- be interpreted as desirable protocol behavior.
module Main where

import Prelude

import PlutusCore.Version (plcVersion100)
import PlutusLedgerApi.V1.Address (Address (..))
import PlutusLedgerApi.V1.Credential (Credential (..), StakingCredential (..))
import PlutusLedgerApi.V1.Crypto (PubKeyHash (..))
import PlutusLedgerApi.V1.Interval (interval)
import PlutusLedgerApi.V1.Scripts (Datum (..))
import PlutusLedgerApi.V1.Time (POSIXTime (..))
import PlutusLedgerApi.V1.Tx (TxId (..), TxOutRef (..))
import PlutusLedgerApi.V1.Value
  ( Value
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
import qualified PlutusTx
import qualified PlutusTx.AssocMap as AssocMap
import qualified PlutusTx.Lift as Lift
import PlutusTx.Prelude
  ( BuiltinByteString
  , BuiltinUnit
  , consByteString
  , emptyByteString
  , toBuiltinData
  )
import PlutusTx.Test.Run.Code
  ( assertEvaluatesSuccessfully
  , assertEvaluatesWithError
  )

import Beacon (deriveBeacon)
import BeaconRegistry (compiledValidator)
import GameRules (defaultPrizeTable)
import PrizeValidator (compiledValidatorFactory)
import Types
  ( BeaconRegistryDatum (..)
  , BeaconRegistryAction (..)
  , BeaconStatus (..)
  , BeaconTarget (..)
  , PrizeAction (..)
  , PrizeDatum (..)
  , PrizeStatus (..)
  )

bytes :: [Integer] -> BuiltinByteString
bytes = foldr consByteString emptyByteString

registryHash, prizeHash :: ScriptHash
registryHash = ScriptHash (bytes [71 .. 98])
prizeHash = ScriptHash (bytes [101 .. 128])

relayerPkh, buyerPkh, lookalikeStakePkh :: PubKeyHash
relayerPkh = PubKeyHash (bytes [131 .. 158])
buyerPkh = PubKeyHash (bytes [161 .. 188])
lookalikeStakePkh = PubKeyHash (bytes [191 .. 218])

target :: BeaconTarget
target = BeaconTarget 0 42 "pre-rich-round-42" "V1"

mcHash, materiosContext :: BuiltinByteString
mcHash = bytes [1, 2, 3, 4]
materiosContext = bytes [5, 6, 7, 8]

expectedBeacon :: BuiltinByteString
expectedBeacon =
  deriveBeacon
    (btNetworkId target)
    (btRound target)
    (btMainchainRef target)
    mcHash
    materiosContext
    (btVersion target)

pendingRegistry :: BeaconRegistryDatum
pendingRegistry =
  BeaconRegistryDatum
    { brRound = btRound target
    , brTarget = target
    , brStatus = BeaconPending
    , brBeaconValue = emptyByteString
    , brMcHash = emptyByteString
    , brMateriosContext = emptyByteString
    , brRelayerPkh = relayerPkh
    }

readyRegistry :: BeaconRegistryDatum
readyRegistry =
  pendingRegistry
    { brStatus = BeaconReady
    , brBeaconValue = expectedBeacon
    , brMcHash = mcHash
    , brMateriosContext = materiosContext
    }

scriptAddress :: ScriptHash -> Address
scriptAddress hash = Address (ScriptCredential hash) Nothing

inlineDatum :: PlutusTx.ToData a => a -> OutputDatum
inlineDatum value = OutputDatum (Datum (PlutusTx.toBuiltinData value))

outputAt :: Address -> Value -> OutputDatum -> TxOut
outputAt address value datum = TxOut address value datum Nothing

registryRef :: TxOutRef
registryRef = TxOutRef (TxId (bytes [31 .. 62])) 0

registryValue :: Value
registryValue = singleton adaSymbol adaToken 2000000

registryContext
  :: BeaconRegistryDatum
  -> BeaconRegistryDatum
  -> [PubKeyHash]
  -> Int
  -> Int
  -> Bool
  -> ScriptContext
registryContext inputDatum outputDatum signatories extraOwnInputs outputCount preserveValue =
  let
    ownAddress = scriptAddress registryHash
    ownInput =
      TxInInfo registryRef
        (outputAt ownAddress registryValue (inlineDatum inputDatum))
    additionalInputs =
      [ TxInInfo
          (TxOutRef (TxId (bytes [63 .. 94])) (fromIntegral n))
          (outputAt ownAddress registryValue (inlineDatum inputDatum))
      | n <- [1 .. extraOwnInputs]
      ]
    nextValue =
      if preserveValue
        then registryValue
        else registryValue <> singleton adaSymbol adaToken 1
    continuing =
      outputAt ownAddress nextValue (inlineDatum outputDatum)
    info =
      TxInfo
        (ownInput : additionalInputs)
        []
        (replicate outputCount continuing)
        mempty
        mempty
        []
        AssocMap.empty
        (interval (POSIXTime 1000) (POSIXTime 1000))
        signatories
        AssocMap.empty
        AssocMap.empty
        (TxId (bytes [95 .. 126]))
  in
    ScriptContext info (Spending registryRef)

applyRegistry
  :: BeaconRegistryDatum
  -> BeaconRegistryAction
  -> ScriptContext
  -> PlutusTx.CompiledCode BuiltinUnit
applyRegistry datum action context =
  let
    p1 = PlutusTx.unsafeApplyCode compiledValidator
      (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData datum))
    p2 = PlutusTx.unsafeApplyCode p1
      (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData action))
  in
    PlutusTx.unsafeApplyCode p2
      (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData context))

registryCase :: String -> BeaconRegistryDatum -> BeaconRegistryDatum
  -> [PubKeyHash] -> Int -> Int -> Bool
  -> PlutusTx.CompiledCode BuiltinUnit
registryCase _ inputDatum outputDatum signatories extraInputs outputCount preserveValue =
  applyRegistry inputDatum (RegistryPublish mcHash materiosContext)
    (registryContext inputDatum outputDatum signatories extraInputs outputCount preserveValue)

basePrizeDatum :: PrizeDatum
basePrizeDatum =
  PrizeDatum
    { pdTicketPolicy = bytes [10 .. 37]
    , pdTicketName = bytes [48]
    , pdPlayerCommitment = bytes [40, 41, 42]
    , pdPriceUsdm = 100
    , pdCommitment = bytes [43, 44, 45]
    , pdGameVersion = "V1"
    , pdTicketNonce = 0
    , pdPrizeAmount = 0
    , pdPaymentPolicy = emptyByteString
    , pdPaymentName = emptyByteString
    , pdStatus = Pending
    , pdResult = emptyByteString
    , pdPrizeTier = 0
    , pdBeaconTarget = target
    , pdBeaconStatus = BeaconPending
    , pdBeaconValue = emptyByteString
    , pdMcHash = emptyByteString
    , pdMateriosContext = emptyByteString
    , pdPrizePoolHash = bytes [200 .. 227]
    , pdIssuedAt = 1000
    , pdExpiresAt = 9000
    , pdRow1Tier = 0
    , pdRow2Tier = 0
    }

fakeReadyRegistry :: BuiltinByteString -> BeaconRegistryDatum
fakeReadyRegistry beacon =
  readyRegistry
    { brBeaconValue = beacon
    , brRelayerPkh = buyerPkh
    }

prizeValue :: Value
prizeValue =
  singleton adaSymbol adaToken 5000000
    <> singleton
         (PlutusLedgerApi.V1.Value.CurrencySymbol (bytes [10 .. 37]))
         (PlutusLedgerApi.V1.Value.TokenName (bytes [48]))
         1

prizeRef :: TxOutRef
prizeRef = TxOutRef (TxId (bytes [228 .. 255])) 0

syncContext :: BeaconRegistryDatum -> Address -> ScriptContext
syncContext regDatum regAddress =
  let
    prizeAddress = scriptAddress prizeHash
    inputDatum = basePrizeDatum
    outputDatum =
      inputDatum
        { pdBeaconStatus = BeaconReady
        , pdBeaconValue = brBeaconValue regDatum
        , pdMcHash = brMcHash regDatum
        , pdMateriosContext = brMateriosContext regDatum
        }
    prizeInput =
      TxInInfo prizeRef
        (outputAt prizeAddress prizeValue (inlineDatum inputDatum))
    registryInput =
      TxInInfo
        (TxOutRef (TxId (bytes [10, 11, 12, 13])) 0)
        (outputAt regAddress mempty (inlineDatum regDatum))
    info =
      TxInfo
        [prizeInput]
        [registryInput]
        [outputAt prizeAddress prizeValue (inlineDatum outputDatum)]
        mempty
        mempty
        []
        AssocMap.empty
        (interval (POSIXTime 1000) (POSIXTime 1000))
        []
        AssocMap.empty
        AssocMap.empty
        (TxId (bytes [14 .. 45]))
  in
    ScriptContext info (Spending prizeRef)

applySyncBeacon
  :: ScriptContext
  -> PlutusTx.CompiledCode BuiltinUnit
applySyncBeacon context =
  let
    p1 = PlutusTx.unsafeApplyCode compiledValidatorFactory
      (Lift.liftCode plcVersion100 registryHash)
    p2 = PlutusTx.unsafeApplyCode p1
      (Lift.liftCode plcVersion100 defaultPrizeTable)
    p3 = PlutusTx.unsafeApplyCode p2
      (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData (0 :: Integer)))
    p4 = PlutusTx.unsafeApplyCode p3
      (Lift.liftCode plcVersion100 buyerPkh)
    p5 = PlutusTx.unsafeApplyCode p4
      (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData basePrizeDatum))
    p6 = PlutusTx.unsafeApplyCode p5
      (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData SyncBeacon))
  in
    PlutusTx.unsafeApplyCode p6
      (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData context))

main :: IO ()
main = do
  let publish = RegistryPublish mcHash materiosContext
      valid = registryCase "valid_publish" pendingRegistry readyRegistry
        [relayerPkh] 0 1 True

  assertEvaluatesSuccessfully valid
  putStrLn "PASS: RegistryPublish accepts derived Beacon with designated signer"

  assertEvaluatesWithError
    (applyRegistry pendingRegistry publish
      (registryContext pendingRegistry readyRegistry [] 0 1 True))
  putStrLn "PASS: RegistryPublish rejects missing relayer signature"

  assertEvaluatesWithError
    (applyRegistry pendingRegistry publish
      (registryContext pendingRegistry
        (readyRegistry { brBeaconValue = bytes [250, 251] })
        [relayerPkh] 0 1 True))
  putStrLn "PASS: RegistryPublish rejects a Beacon not derived from the supplied context"

  assertEvaluatesWithError
    (applyRegistry pendingRegistry publish
      (registryContext pendingRegistry readyRegistry [relayerPkh] 1 1 True))
  putStrLn "PASS: RegistryPublish rejects a second input at its own full address"

  assertEvaluatesWithError
    (applyRegistry pendingRegistry publish
      (registryContext pendingRegistry readyRegistry [relayerPkh] 0 2 True))
  putStrLn "PASS: RegistryPublish rejects duplicate continuing outputs"

  assertEvaluatesWithError
    (applyRegistry pendingRegistry (RegistryPublish emptyByteString materiosContext)
      (registryContext pendingRegistry readyRegistry [relayerPkh] 0 1 True))
  putStrLn "PASS: RegistryPublish rejects an empty receipt commitment"

  -- These two passing CEK cases intentionally document existing gaps.
  -- Their synthetic contexts are not balanced and make no ledger claim.
  let roundMismatchInput =
        pendingRegistry { brRound = btRound target - 1 }
      roundMismatchOutput =
        readyRegistry { brRound = btRound target - 1 }
  assertEvaluatesSuccessfully
    (applyRegistry roundMismatchInput publish
      (registryContext roundMismatchInput roundMismatchOutput [relayerPkh] 0 1 True))
  putStrLn "CHARACTERIZATION: current RegistryPublish accepts brRound /= btRound(target)"

  assertEvaluatesSuccessfully
    (applyRegistry pendingRegistry publish
      (registryContext pendingRegistry readyRegistry [relayerPkh] 0 1 False))
  putStrLn "CHARACTERIZATION: current RegistryPublish accepts a continuing-output Value delta (CEK only; unbalanced context)"

  -- A Registry reference input is data, not a Registry validator invocation.
  -- SyncBeacon currently accepts a non-derived fake Ready beacon, no relayer
  -- signature, and a lookalike full Address sharing only the payment ScriptHash.
  let nonDerivedBeacon = bytes [222, 173, 190, 239]
      fakeReady = fakeReadyRegistry nonDerivedBeacon
      canonicalRegistryAddress = scriptAddress registryHash
      lookalikeRegistryAddress =
        Address
          (ScriptCredential registryHash)
          (Just (StakingHash (PubKeyCredential lookalikeStakePkh)))

  assertEvaluatesSuccessfully
    (applySyncBeacon (syncContext fakeReady canonicalRegistryAddress))
  putStrLn "CHARACTERIZATION: SyncBeacon accepts a non-derived fake Ready Beacon without Registry execution or relayer signature"

  assertEvaluatesSuccessfully
    (applySyncBeacon (syncContext fakeReady lookalikeRegistryAddress))
  putStrLn "CHARACTERIZATION: SyncBeacon accepts same-payment-ScriptHash Registry lookalike with a different staking credential"

  putStrLn "B0 CEK characterization suite completed; CHARACTERIZATION passes are documented gaps, not security approvals."
