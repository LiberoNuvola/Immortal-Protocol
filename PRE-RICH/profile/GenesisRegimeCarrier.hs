{-# LANGUAGE DataKinds #-}
{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE TemplateHaskell #-}

module GenesisRegimeCarrier
  ( PreRichRegimeDatum (..)
  , GenesisRegimeAction (..)
  , mkValidator
  , compiledValidator
  ) where

import PlutusLedgerApi.V2
import PlutusLedgerApi.V2.Contexts
import PlutusTx
import PlutusTx.Prelude
import qualified PlutusTx.AssocMap as AssocMap

import Economic (validOracleTimestamp)
import PreRichGenesisAdmission
  ( GenesisTreasuryObservation (..)
  , genesisPredicate
  )
import Types
  ( TreasuryDatum
  )
import OracleTypes
  ( OracleDatum (..)
  , OracleStateId (..)
  , precision
  )

-- | Application-owned singleton lifecycle carrier.
-- The carrier is deliberately separate from Treasury and B1PrizePool.
data PreRichRegimeDatum = PreRichRegimeDatum
  { prdRegime             :: Integer
  , prdTransitionNonce    :: Integer
  , prdCanonicalTreasury  :: ScriptHash
  , prdPrePolicy          :: BuiltinByteString
  , prdPreAssetName       :: BuiltinByteString
  , prdOraclePolicy       :: BuiltinByteString
  , prdOracleName         :: BuiltinByteString
  , prdOraclePublisher    :: PubKeyHash
  , prdCarrierPolicy      :: BuiltinByteString
  , prdCarrierName        :: BuiltinByteString
  , prdPrizePoolHash      :: ScriptHash
  , prdStateVersion       :: Integer
  }

PlutusTx.unstableMakeIsData ''PreRichRegimeDatum

data GenesisRegimeAction
  = ActivateGenesis

PlutusTx.unstableMakeIsData ''GenesisRegimeAction

preGenesisTag :: Integer
preGenesisTag = 0

genesisTag :: Integer
genesisTag = 1

{-# INLINABLE ownInputResolved #-}
ownInputResolved :: ScriptContext -> TxOut
ownInputResolved ctx =
  case findOwnInput ctx of
    Just i -> txInInfoResolved i
    Nothing -> traceError "GenesisRegimeCarrier: missing own input"

{-# INLINABLE ownScriptHash #-}
ownScriptHash :: ScriptContext -> ScriptHash
ownScriptHash ctx =
  case addressCredential (txOutAddress (ownInputResolved ctx)) of
    ScriptCredential h -> h
    _ -> traceError "GenesisRegimeCarrier: own input not script"

{-# INLINABLE countOwnInputs #-}
countOwnInputs :: ScriptContext -> Integer
countOwnInputs ctx =
  let
    sh = ownScriptHash ctx
    go [] = 0
    go (i:is) =
      case addressCredential (txOutAddress (txInInfoResolved i)) of
        ScriptCredential h | h == sh -> 1 + go is
        _ -> go is
  in go (txInfoInputs (scriptContextTxInfo ctx))

{-# INLINABLE decodeRegimeDatum #-}
decodeRegimeDatum :: TxInfo -> TxOut -> Maybe PreRichRegimeDatum
decodeRegimeDatum info out =
  case txOutDatum out of
    OutputDatum d -> fromBuiltinData (getDatum d)
    OutputDatumHash dh ->
      case findDatum dh info of
        Just d -> fromBuiltinData (getDatum d)
        Nothing -> Nothing
    NoOutputDatum -> Nothing

{-# INLINABLE findSingleOwnOutput #-}
findSingleOwnOutput :: ScriptContext -> Maybe (TxOut, PreRichRegimeDatum)
findSingleOwnOutput ctx =
  let
    info = scriptContextTxInfo ctx
    sh = ownScriptHash ctx
    go [] found = found
    go (o:os) found =
      case addressCredential (txOutAddress o) of
        ScriptCredential h | h == sh ->
          case found of
            Just _ -> Nothing
            Nothing ->
              case decodeRegimeDatum info o of
                Just d -> go os (Just (o, d))
                Nothing -> Nothing
        _ -> go os found
  in go (txInfoOutputs info) Nothing

{-# INLINABLE singletonAmount #-}
singletonAmount :: Value -> BuiltinByteString -> BuiltinByteString -> Integer
singletonAmount val policy name =
  case AssocMap.lookup (CurrencySymbol policy) (getValue val) of
    Nothing -> 0
    Just tokens ->
      case AssocMap.lookup (TokenName name) tokens of
        Nothing -> 0
        Just amount -> amount

{-# INLINABLE totalTokenAmountInputs #-}
totalTokenAmountInputs :: TxInfo -> BuiltinByteString -> BuiltinByteString -> Integer
totalTokenAmountInputs info policy name =
  go (txInfoInputs info)
  where
    go [] = 0
    go (i:is) =
      singletonAmount
        (txOutValue (txInInfoResolved i))
        policy
        name
      + go is

{-# INLINABLE totalTokenAmountOutputs #-}
totalTokenAmountOutputs :: TxInfo -> BuiltinByteString -> BuiltinByteString -> Integer
totalTokenAmountOutputs info policy name =
  go (txInfoOutputs info)
  where
    go [] = 0
    go (o:os) =
      singletonAmount (txOutValue o) policy name + go os

{-# INLINABLE anyScriptInput #-}
anyScriptInput :: ScriptHash -> [TxInInfo] -> Bool
anyScriptInput _ [] = False
anyScriptInput sh (i:is) =
  case addressCredential (txOutAddress (txInInfoResolved i)) of
    ScriptCredential h -> h == sh || anyScriptInput sh is
    _ -> anyScriptInput sh is

{-# INLINABLE anyScriptOutput #-}
anyScriptOutput :: ScriptHash -> [TxOut] -> Bool
anyScriptOutput _ [] = False
anyScriptOutput sh (o:os) =
  case addressCredential (txOutAddress o) of
    ScriptCredential h -> h == sh || anyScriptOutput sh os
    _ -> anyScriptOutput sh os

{-# INLINABLE decodeTreasuryDatum #-}
decodeTreasuryDatum :: TxInfo -> TxOut -> Maybe TreasuryDatum
decodeTreasuryDatum info out =
  case txOutDatum out of
    OutputDatum d -> fromBuiltinData (getDatum d)
    OutputDatumHash dh ->
      case findDatum dh info of
        Just d -> fromBuiltinData (getDatum d)
        Nothing -> Nothing
    NoOutputDatum -> Nothing

{-# INLINABLE findSingleTreasuryReference #-}
findSingleTreasuryReference :: ScriptHash -> TxInfo -> Maybe TxOut
findSingleTreasuryReference treasuryHash info =
  go (txInfoReferenceInputs info) Nothing
  where
    go [] found = found
    go (i:is) found =
      case addressCredential (txOutAddress (txInInfoResolved i)) of
        ScriptCredential h
          | h == treasuryHash ->
              case found of
                Just _ -> Nothing
                Nothing ->
                  case decodeTreasuryDatum info (txInInfoResolved i) of
                    Just _ -> go is (Just (txInInfoResolved i))
                    Nothing -> Nothing
        _ -> go is found

{-# INLINABLE decodeOracleDatum #-}
decodeOracleDatum :: TxInfo -> TxOut -> Maybe OracleDatum
decodeOracleDatum info out =
  case txOutDatum out of
    OutputDatum d -> fromBuiltinData (getDatum d)
    OutputDatumHash dh ->
      case findDatum dh info of
        Just d -> fromBuiltinData (getDatum d)
        Nothing -> Nothing
    NoOutputDatum -> Nothing

{-# INLINABLE findSingleOracleReference #-}
findSingleOracleReference
  :: OracleStateId
  -> BuiltinByteString
  -> BuiltinByteString
  -> PubKeyHash
  -> TxInfo
  -> Maybe OracleDatum
findSingleOracleReference stateId assetPolicy assetName publisher info =
  go (txInfoReferenceInputs info) Nothing
  where
    go [] found = found
    go (i:is) found =
      let out = txInInfoResolved i
          singletonOk =
            singletonAmount
              (txOutValue out)
              (osiPolicy stateId)
              (osiName stateId) == 1
      in
      case decodeOracleDatum info out of
        Just od
          | singletonOk
          && odAssetPolicy od == assetPolicy
          && odAssetName od == assetName
          && odPublisher od == publisher
          && validOracleTimestamp (odTimestamp od) info
          && odPrice od >= 0 ->
            case found of
              Just _ -> Nothing
              Nothing -> go is (Just od)
        _ -> go is found

{-# INLINABLE authenticatedObservation #-}
authenticatedObservation
  :: PreRichRegimeDatum
  -> TxInfo
  -> Maybe GenesisTreasuryObservation
authenticatedObservation datum info =
  case findSingleTreasuryReference (prdCanonicalTreasury datum) info of
    Nothing -> Nothing
    Just treasury ->
      case findSingleOracleReference
             (OracleStateId (prdOraclePolicy datum) (prdOracleName datum))
             (prdPrePolicy datum)
             (prdPreAssetName datum)
             (prdOraclePublisher datum)
             info of
        Nothing -> Nothing
        Just oracle ->
          let quantity =
                singletonAmount
                  (txOutValue treasury)
                  (prdPrePolicy datum)
                  (prdPreAssetName datum)
          in
          Just GenesisTreasuryObservation
            { gtoTreasuryIdentityVerified = True
            , gtoSourceRegimePreGenesis = prdRegime datum == preGenesisTag
            , gtoPreAssetVerified = quantity >= 0
            , gtoTreasuryStateVerified = True
            , gtoOracleVerified = True
            , gtoOracleFresh =
                validOracleTimestamp (odTimestamp oracle) info
            , gtoPreQuantity = quantity
            , gtoVerifiedPreUsdmPrice = odPrice oracle
            , gtoOraclePrecision = precision
            }

{-# INLINABLE outputMatchesGenesis #-}
outputMatchesGenesis :: PreRichRegimeDatum -> PreRichRegimeDatum -> Bool
outputMatchesGenesis before after =
     prdRegime before == preGenesisTag
  && prdRegime after == genesisTag
  && prdTransitionNonce after == prdTransitionNonce before + 1
  && prdStateVersion after == prdStateVersion before + 1
  && prdCanonicalTreasury after == prdCanonicalTreasury before
  && prdPrePolicy after == prdPrePolicy before
  && prdPreAssetName after == prdPreAssetName before
  && prdOraclePolicy after == prdOraclePolicy before
  && prdOracleName after == prdOracleName before
  && prdOraclePublisher after == prdOraclePublisher before
  && prdCarrierPolicy after == prdCarrierPolicy before
  && prdCarrierName after == prdCarrierName before
  && prdPrizePoolHash after == prdPrizePoolHash before

{-# INLINABLE mkValidator #-}
mkValidator :: PreRichRegimeDatum -> GenesisRegimeAction -> ScriptContext -> Bool
mkValidator datum action ctx =
  case action of
    ActivateGenesis ->
      let
        info = scriptContextTxInfo ctx
        before = datum
        after =
          case findSingleOwnOutput ctx of
            Just (_, d) -> d
            Nothing -> traceError "GenesisRegimeCarrier: expected one continuing output"
        ownIn =
          ownInputResolved ctx
        ownOut =
          case findSingleOwnOutput ctx of
            Just (o, _) -> o
            Nothing -> traceError "GenesisRegimeCarrier: missing output"
        observation = authenticatedObservation before info
        carrierInputs =
          totalTokenAmountInputs info (prdCarrierPolicy before) (prdCarrierName before)
        carrierOutputs =
          totalTokenAmountOutputs info (prdCarrierPolicy before) (prdCarrierName before)
      in
           countOwnInputs ctx == 1
        && outputMatchesGenesis before after
        && carrierInputs == 1
        && carrierOutputs == 1
        && singletonAmount
             (txOutValue ownIn)
             (prdCarrierPolicy before)
             (prdCarrierName before) == 1
        && singletonAmount
             (txOutValue ownOut)
             (prdCarrierPolicy before)
             (prdCarrierName before) == 1
        && txOutValue ownIn == txOutValue ownOut
        && not (anyScriptInput (prdPrizePoolHash before) (txInfoInputs info))
        && not (anyScriptOutput (prdPrizePoolHash before) (txInfoOutputs info))
        && case observation of
             Nothing -> False
             Just o -> genesisPredicate o

{-# INLINABLE wrap #-}
wrap :: BuiltinData -> BuiltinData -> BuiltinData -> BuiltinUnit
wrap d r ctx =
  check
    (mkValidator
      (unsafeFromBuiltinData d)
      (unsafeFromBuiltinData r)
      (unsafeFromBuiltinData ctx))

compiledValidator :: CompiledCode (BuiltinData -> BuiltinData -> BuiltinData -> BuiltinUnit)
compiledValidator = $$(compile [|| wrap ||])
