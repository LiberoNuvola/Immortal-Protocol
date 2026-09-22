{-# LANGUAGE DataKinds #-}
{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE ScopedTypeVariables #-}

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

import Economic (validOracleTimestamp)
import PreRichGenesisAdmission
  ( GenesisTreasuryObservation (..)
  , genesisPredicate
  )
import Types
  ( OracleDatum (..)
  , OracleStateId (..)
  , TreasuryDatum
  )

data PreRichRegimeDatum = PreRichRegimeDatum
  { prdRegime            :: Integer
  , prdTransitionNonce   :: Integer
  , prdCanonicalTreasury :: ScriptHash
  , prdPrePolicy         :: BuiltinByteString
  , prdPreAssetName      :: BuiltinByteString
  , prdStateVersion      :: Integer
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
  let sh = ownScriptHash ctx
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
findSingleOwnOutput :: ScriptContext -> Maybe PreRichRegimeDatum
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
                Just d -> go os (Just d)
                Nothing -> Nothing
        _ -> go os found
  in go (txInfoOutputs info) Nothing

{-# INLINABLE singletonTokenAmount #-}
singletonTokenAmount :: Value -> BuiltinByteString -> BuiltinByteString -> Integer
singletonTokenAmount val policy name =
  valueOf val (CurrencySymbol policy) (TokenName name)

{-# INLINABLE findSingleTreasuryReference #-}
findSingleTreasuryReference :: ScriptHash -> TxInfo -> Maybe TxOut
findSingleTreasuryReference treasuryHash info =
  go (txInfoReferenceInputs info) Nothing
  where
    go [] found = found
    go (i:is) found =
      case addressCredential (txOutAddress (txInInfoResolved i)) of
        ScriptCredential h | h == treasuryHash ->
          case found of
            Just _ -> Nothing
            Nothing ->
              case decodeTreasuryDatum info (txInInfoResolved i) of
                Just _ -> go is (Just (txInInfoResolved i))
                Nothing -> Nothing
        _ -> go is found

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
            singletonTokenAmount
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

{-# INLINABLE treasuryObservation #-}
treasuryObservation
  :: PreRichRegimeDatum
  -> ScriptHash
  -> OracleStateId
  -> PubKeyHash
  -> TxInfo
  -> Maybe GenesisTreasuryObservation
treasuryObservation datum treasuryHash oracleState publisher info =
  case findSingleTreasuryReference treasuryHash info of
    Nothing -> Nothing
    Just treasury ->
      case findSingleOracleReference
             oracleState
             (prdPrePolicy datum)
             (prdPreAssetName datum)
             publisher
             info of
        Nothing -> Nothing
        Just oracle ->
          Just GenesisTreasuryObservation
            { gtoTreasuryIdentityVerified =
                treasuryHash == prdCanonicalTreasury datum
            , gtoSourceRegimePreGenesis =
                prdRegime datum == preGenesisTag
            , gtoPreAssetVerified =
                singletonTokenAmount
                  (txOutValue treasury)
                  (prdPrePolicy datum)
                  (prdPreAssetName datum) >= 0
            , gtoTreasuryStateVerified = True
            , gtoOracleVerified = True
            , gtoOracleFresh =
                validOracleTimestamp (odTimestamp oracle) info
            , gtoPreQuantity =
                singletonTokenAmount
                  (txOutValue treasury)
                  (prdPrePolicy datum)
                  (prdPreAssetName datum)
            , gtoVerifiedPreUsdmPrice = odPrice oracle
            , gtoOraclePrecision = 100
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

{-# INLINABLE mkValidator #-}
mkValidator
  :: BuiltinByteString
  -> BuiltinByteString
  -> BuiltinByteString
  -> PubKeyHash
  -> ScriptContext
  -> Bool
mkValidator
  poolPolicy
  poolName
  oraclePolicy
  oraclePublisher
  ctx =
  let
    info = scriptContextTxInfo ctx
    before =
      case decodeRegimeDatum info (ownInputResolved ctx) of
        Just d -> d
        Nothing -> traceError "GenesisRegimeCarrier: invalid input datum"
    action =
      case txInfoRedeemer info of
        _ -> ActivateGenesis
    after =
      case findSingleOwnOutput ctx of
        Just d -> d
        Nothing -> traceError "GenesisRegimeCarrier: invalid continuing output"
    oracleState =
      OracleStateId oraclePolicy "ORACLE"
    observation =
      treasuryObservation
        before
        (prdCanonicalTreasury before)
        oracleState
        oraclePublisher
        info
  in
       countOwnInputs ctx == 1
    && prdRegime before == preGenesisTag
    && outputMatchesGenesis before after
    && case observation of
         Nothing -> False
         Just o -> genesisPredicate o
    && singletonTokenAmount
         (txOutValue (ownInputResolved ctx))
         poolPolicy
         poolName == 1
    && singletonTokenAmount
         (txOutValue (ownInputOutput ctx))
         poolPolicy
         poolName == 1

{-# INLINABLE ownInputOutput #-}
ownInputOutput :: ScriptContext -> TxOut
ownInputOutput ctx =
  case findOwnInput ctx of
    Just i -> txInInfoResolved i
    Nothing -> traceError "GenesisRegimeCarrier: missing own input"

{-# INLINABLE wrap #-}
wrap :: BuiltinData -> BuiltinData -> BuiltinData -> BuiltinUnit
wrap d _ ctx =
  check
    (mkValidator
      (unsafeFromBuiltinData d)
      emptyByteString
      emptyByteString
      (unsafeFromBuiltinData ctx)
      )

compiledValidator :: CompiledCode (BuiltinData -> BuiltinData -> BuiltinData -> BuiltinUnit)
compiledValidator = $$(compile [|| wrap ||])
