{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TemplateHaskell #-}

-- | B0 adversarial characterization against the real exported Plutus V2
-- wrappers. These are CEK evaluations over synthetic ScriptContext values;
-- they are NOT balanced-ledger, Yaci, Preprod or deployment evidence.
--
-- The tests deliberately retain several current-source acceptances as named
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

import Beacon (deriveBeacon, encodeBeaconTarget, ticketCommitment)
import BeaconRegistry (compiledValidator)
import GameRules (defaultPrizeTable)
import MintPolicy (compiledPolicyFactory)
import OracleTypes (OracleDatum (..), OracleStateId (..))
import PrizeValidator (compiledValidatorFactory)
import Types
  ( BeaconRegistryDatum (..)
  , BeaconRegistryAction (..)
  , BeaconStatus (..)
  , BeaconTarget (..)
  , B1PrizePoolDatum (..)
  , PrizeAction (..)
  , PrizeDatum (..)
  , PrizeStatus (..)
  )

bytes :: [Integer] -> BuiltinByteString
bytes = foldr consByteString emptyByteString

registryHash, prizeHash, counterHash, treasuryHash, poolHash :: ScriptHash
registryHash = ScriptHash (bytes [71 .. 98])
prizeHash = ScriptHash (bytes [101 .. 128])
counterHash = ScriptHash (bytes [11 .. 38])
treasuryHash = ScriptHash (bytes [41 .. 68])
poolHash = ScriptHash (bytes [131 .. 158])

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
         (CurrencySymbol (bytes [10 .. 37]))
         (TokenName (bytes [48]))
         1

prizeRef :: TxOutRef
prizeRef = TxOutRef (TxId (bytes [228 .. 255])) 0

syncContext :: BeaconRegistryDatum -> Address -> ScriptContext
syncContext regDatum regAddress =
  syncContextWithReferences [(regDatum, regAddress)]

syncContextWithReferences :: [(BeaconRegistryDatum, Address)] -> ScriptContext
syncContextWithReferences registryReferences =
  let
    prizeAddress = scriptAddress prizeHash
    inputDatum = basePrizeDatum
    outputDatum =
      inputDatum
        { pdBeaconStatus = BeaconReady
        , pdBeaconValue = brBeaconValue (fst (head registryReferences))
        , pdMcHash = brMcHash (fst (head registryReferences))
        , pdMateriosContext = brMateriosContext (fst (head registryReferences))
        }
    prizeInput =
      TxInInfo prizeRef
        (outputAt prizeAddress prizeValue (inlineDatum inputDatum))
    registryInputs =
      [ TxInInfo
          (TxOutRef (TxId (bytes [10, 11, 12, 13])) index)
          (outputAt registryAddress mempty (inlineDatum registryDatum))
      | (index, (registryDatum, registryAddress)) <- zip [0 ..] registryReferences
      ]
    info =
      TxInfo
        [prizeInput]
        registryInputs
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


-- T00 positive-price MintPolicy wrapper fixture. The Registry is a reference
-- input only: it has not been spent through BeaconRegistry, and its nominated
-- relayer is the buyer. The quote is synthetic and exists only to make the
-- real Economic.totalUsdmValue path evaluate to exactly 100 sub-units.
ticketPolicyBytes :: BuiltinByteString
ticketPolicyBytes = bytes [161 .. 188]

ticketPolicy :: CurrencySymbol
ticketPolicy = CurrencySymbol ticketPolicyBytes

ticketNameBytes :: BuiltinByteString
ticketNameBytes = bytes [48] -- canonical integerToBytes 0 = UTF-8 "0"

ticketName :: TokenName
ticketName = TokenName ticketNameBytes

oraclePolicy, oracleName :: BuiltinByteString
oraclePolicy = bytes [37 .. 64]
oracleName = bytes [65 .. 92]

oraclePublisher :: PubKeyHash
oraclePublisher = relayerPkh

oracleState :: OracleStateId
oracleState = OracleStateId oraclePolicy oracleName

oracleNow :: Integer
oracleNow = 10000000

ticketPlayerCommitment :: BuiltinByteString
ticketPlayerCommitment = bytes [17, 18, 19, 20]

ticketPrice :: Integer
ticketPrice = 100

salePrizeDatum :: PrizeDatum
salePrizeDatum =
  PrizeDatum
    { pdTicketPolicy = ticketPolicyBytes
    , pdTicketName = ticketNameBytes
    , pdPlayerCommitment = ticketPlayerCommitment
    , pdPriceUsdm = ticketPrice
    , pdCommitment =
        ticketCommitment
          ticketNameBytes
          ticketPlayerCommitment
          "V1"
          0
          ticketPrice
          (encodeBeaconTarget target)
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
    , pdPrizePoolHash = bytes [131 .. 158]
    , pdIssuedAt = 1000
    , pdExpiresAt = 9000
    , pdRow1Tier = 0
    , pdRow2Tier = 0
    }

salePoolBefore :: B1PrizePoolDatum
salePoolBefore =
  B1PrizePoolDatum
    { ppTotalLiquidity = 100000
    , ppPendingLiabilities = 1000
    , ppUnresolvedReserve = 0
    , ppUnresolvedTicketCount = 0
    , ppLockedJackpot = 2000
    , ppJackpotThreshold = 5000
    , ppSuspendedClasses = 0
    , ppPrizeHash = prizeHash
    }

salePoolAfter :: B1PrizePoolDatum
salePoolAfter =
  salePoolBefore
    { ppUnresolvedReserve = ticketPrice
    , ppUnresolvedTicketCount = 1
    }

saleOracleReference :: TxInInfo
saleOracleReference =
  TxInInfo
    (TxOutRef (TxId (bytes [46 .. 77])) 0)
    (TxOut
      (Address (PubKeyCredential oraclePublisher) Nothing)
      (singleton (CurrencySymbol oraclePolicy) (TokenName oracleName) 1)
      (inlineDatum (OracleDatum emptyByteString emptyByteString ticketPrice oracleNow oraclePublisher))
      Nothing)

saleRegistryReference :: BeaconRegistryDatum -> TxInInfo
saleRegistryReference registryDatum =
  TxInInfo
    (TxOutRef (TxId (bytes [78 .. 109])) 0)
    (outputAt (scriptAddress registryHash) mempty (inlineDatum registryDatum))

saleTxInfo :: BeaconRegistryDatum -> TxInfo
saleTxInfo registryDatum =
  let
    poolValue = singleton adaSymbol adaToken 10000000
    ticketOutputValue = singleton adaSymbol adaToken 3000000
    oracleReference = saleOracleReference
    treasuryOutput =
      outputAt (scriptAddress treasuryHash)
        (singleton adaSymbol adaToken 2600000)
        (inlineDatum ())
    poolInput =
      TxInInfo
        (TxOutRef (TxId (bytes [110 .. 141])) 0)
        (outputAt (scriptAddress poolHash) poolValue (inlineDatum salePoolBefore))
  in
    TxInfo
      [ TxInInfo
          (TxOutRef (TxId (bytes [142 .. 173])) 0)
          (outputAt (scriptAddress counterHash) mempty (inlineDatum (0 :: Integer)))
      , poolInput
      ]
      [saleRegistryReference registryDatum, oracleReference]
      [ outputAt (scriptAddress counterHash) mempty (inlineDatum (1 :: Integer))
      , outputAt (scriptAddress prizeHash) ticketOutputValue (inlineDatum salePrizeDatum)
      , treasuryOutput
      , outputAt (scriptAddress poolHash) poolValue (inlineDatum salePoolAfter)
      , outputAt (Address (PubKeyCredential buyerPkh) Nothing)
          (singleton ticketPolicy ticketName 1)
          (inlineDatum ())
      ]
      mempty
      (singleton ticketPolicy ticketName 1)
      []
      AssocMap.empty
      (interval (POSIXTime oracleNow) (POSIXTime oracleNow))
      [buyerPkh]
      AssocMap.empty
      AssocMap.empty
      (TxId (bytes [174 .. 205]))

applyPositivePriceMint :: BeaconRegistryDatum -> PlutusTx.CompiledCode BuiltinUnit
applyPositivePriceMint registryDatum =
  let
    context = ScriptContext (saleTxInfo registryDatum) (Minting ticketPolicy)
    p1 = PlutusTx.unsafeApplyCode compiledPolicyFactory
      (Lift.liftCode plcVersion100 counterHash)
    p2 = PlutusTx.unsafeApplyCode p1
      (Lift.liftCode plcVersion100 prizeHash)
    p3 = PlutusTx.unsafeApplyCode p2
      (Lift.liftCode plcVersion100 registryHash)
    p4 = PlutusTx.unsafeApplyCode p3
      (Lift.liftCode plcVersion100 treasuryHash)
    p5 = PlutusTx.unsafeApplyCode p4
      (Lift.liftCode plcVersion100 poolHash)
    p6 = PlutusTx.unsafeApplyCode p5
      (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData oracleState))
    p7 = PlutusTx.unsafeApplyCode p6
      (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData oraclePublisher))
    p8 = PlutusTx.unsafeApplyCode p7
      (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData ()))
  in
    PlutusTx.unsafeApplyCode p8
      (Lift.liftCode plcVersion100 (PlutusTx.toBuiltinData context))

main :: IO ()
main = do
  assertEvaluatesSuccessfully
    (applyPositivePriceMint (pendingRegistry { brRelayerPkh = buyerPkh }))
  putStrLn "CHARACTERIZATION: positive-price MintPolicy CEK accepts a buyer-controlled Pending Registry reference without Registry spending or relayer authorization; synthetic Oracle quote only"

  assertEvaluatesWithError
    (applyPositivePriceMint (pendingRegistry { brRound = btRound target - 1 }))
  putStrLn "PASS: positive-price MintPolicy rejects a Pending Registry with a mismatched round"

  let publish = RegistryPublish mcHash materiosContext
  assertEvaluatesSuccessfully
    (applyRegistry pendingRegistry publish
      (registryContext pendingRegistry readyRegistry [relayerPkh] 0 1 True))
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

  let secondFakeReady = fakeReadyRegistry (bytes [9, 8, 7, 6])
  assertEvaluatesSuccessfully
    (applySyncBeacon
      (syncContextWithReferences
        [ (fakeReady, canonicalRegistryAddress)
        , (secondFakeReady, canonicalRegistryAddress)
        ]))
  putStrLn "CHARACTERIZATION: SyncBeacon accepts multiple matching Registry references and selects the first"

  putStrLn "B0 CEK characterization suite completed; CHARACTERIZATION passes are documented gaps, not security approvals."
