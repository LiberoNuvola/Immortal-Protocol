{-# LANGUAGE DataKinds #-}
{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TemplateHaskell #-}

module PreRichControlCarrier
  ( PreRichControlDatum (..)
  , PreRichControlAction (..)
  , mkValidator
  , compiledValidatorFactory
  ) where

import PlutusLedgerApi.V2
import PlutusLedgerApi.V2.Contexts
import PlutusTx
import PlutusTx.Prelude

data PreRichControlDatum = PreRichControlDatum
  { prcdCurrentActiveClass :: Integer
  , prcdHighestClassEverActivated :: Integer
  , prcdStateVersion :: Integer
  , prcdTransitionNonce :: Integer
  , prcdControlPolicy :: BuiltinByteString
  , prcdControlTokenName :: BuiltinByteString
  }

PlutusTx.unstableMakeIsData ''PreRichControlDatum

data PreRichControlAction
  = ActivateControl
      { pcaNewCurrentActiveClass :: Integer
      , pcaNewHighestClassEverActivated :: Integer
      , pcaDecisionReference :: BuiltinByteString
      , pcaObservationReference :: BuiltinByteString
      }
  | ContractControl
      { pcaNewCurrentActiveClass :: Integer
      , pcaDecisionReference :: BuiltinByteString
      , pcaObservationReference :: BuiltinByteString
      }

PlutusTx.unstableMakeIsData ''PreRichControlAction

{-# INLINABLE ownInputResolved #-}
ownInputResolved :: ScriptContext -> TxOut
ownInputResolved ctx =
  case findOwnInput ctx of
    Just i -> txInInfoResolved i
    Nothing -> traceError "B2Control: missing own input"

{-# INLINABLE ownScriptHash #-}
ownScriptHash :: ScriptContext -> ScriptHash
ownScriptHash ctx =
  case addressCredential (txOutAddress (ownInputResolved ctx)) of
    ScriptCredential h -> h
    _ -> traceError "B2Control: own input is not script"

{-# INLINABLE ownOutputResolved #-}
ownOutputResolved :: ScriptContext -> TxOut
ownOutputResolved ctx =
  let
    sh = ownScriptHash ctx
    go [] = traceError "B2Control: missing continuing output"
    go (o:os) =
      case addressCredential (txOutAddress o) of
        ScriptCredential h
          | h == sh -> o
        _ -> go os
  in go (txInfoOutputs (scriptContextTxInfo ctx))

{-# INLINABLE countOwnInputs #-}
countOwnInputs :: ScriptContext -> Integer
countOwnInputs ctx =
  let
    sh = ownScriptHash ctx
    go [] = 0
    go (i:is) =
      case addressCredential (txOutAddress (txInInfoResolved i)) of
        ScriptCredential h
          | h == sh -> 1 + go is
        _ -> go is
  in go (txInfoInputs (scriptContextTxInfo ctx))

{-# INLINABLE countOwnOutputs #-}
countOwnOutputs :: ScriptContext -> Integer
countOwnOutputs ctx =
  let
    sh = ownScriptHash ctx
    go [] = 0
    go (o:os) =
      case addressCredential (txOutAddress o) of
        ScriptCredential h
          | h == sh -> 1 + go os
        _ -> go os
  in go (txInfoOutputs (scriptContextTxInfo ctx))

{-# INLINABLE assetAmount #-}
assetAmount :: Value -> CurrencySymbol -> TokenName -> Integer
assetAmount value cs tn =
  valueOf value cs tn

{-# INLINABLE singletonAmountInputs #-}
singletonAmountInputs :: ScriptContext -> CurrencySymbol -> TokenName -> Integer
singletonAmountInputs ctx cs tn =
  let
    go [] = 0
    go (i:is) =
      assetAmount (txOutValue (txInInfoResolved i)) cs tn + go is
  in go (txInfoInputs (scriptContextTxInfo ctx))

{-# INLINABLE singletonAmountOutputs #-}
singletonAmountOutputs :: ScriptContext -> CurrencySymbol -> TokenName -> Integer
singletonAmountOutputs ctx cs tn =
  let
    go [] = 0
    go (o:os) =
      assetAmount (txOutValue o) cs tn + go os
  in go (txInfoOutputs (scriptContextTxInfo ctx))

{-# INLINABLE boundedClass #-}
boundedClass :: Integer -> Bool
boundedClass x = x >= 0 && x <= 7

{-# INLINABLE datumValid #-}
datumValid :: BuiltinByteString -> BuiltinByteString -> PreRichControlDatum -> Bool
datumValid configuredPolicy configuredToken datum =
     boundedClass (prcdCurrentActiveClass datum)
  && boundedClass (prcdHighestClassEverActivated datum)
  && prcdCurrentActiveClass datum <= prcdHighestClassEverActivated datum
  && prcdStateVersion datum >= 0
  && prcdTransitionNonce datum >= 0
  && prcdControlPolicy datum == configuredPolicy
  && prcdControlTokenName datum == configuredToken

{-# INLINABLE actionValid #-}
actionValid :: PreRichControlDatum -> PreRichControlDatum -> PreRichControlAction -> Bool
actionValid before after action =
  case action of
    ActivateControl newCurrent newHighest decisionRef observationRef ->
         newCurrent == prcdCurrentActiveClass after
      && newHighest == prcdHighestClassEverActivated after
      && newCurrent >= prcdCurrentActiveClass before
      && newHighest >= prcdHighestClassEverActivated before
      && newHighest >= newCurrent
      && lengthOfByteString decisionRef > 0
      && lengthOfByteString observationRef > 0

    ContractControl newCurrent decisionRef observationRef ->
         newCurrent == prcdCurrentActiveClass after
      && prcdHighestClassEverActivated after == prcdHighestClassEverActivated before
      && newCurrent <= prcdCurrentActiveClass before
      && lengthOfByteString decisionRef > 0
      && lengthOfByteString observationRef > 0

{-# INLINABLE decodeDatum #-}
decodeDatum :: TxInfo -> TxOut -> Maybe PreRichControlDatum
decodeDatum info out =
  case txOutDatum out of
    OutputDatum d -> fromBuiltinData (getDatum d)
    OutputDatumHash h ->
      case findDatum h info of
        Just d -> fromBuiltinData (getDatum d)
        Nothing -> Nothing
    NoOutputDatum -> Nothing

{-# INLINABLE mkValidator #-}
mkValidator
  :: BuiltinByteString
  -> BuiltinByteString
  -> PreRichControlDatum
  -> PreRichControlAction
  -> ScriptContext
  -> Bool
mkValidator configuredPolicy configuredToken before action ctx =
  let
    output = ownOutputResolved ctx
    inputValue = txOutValue (ownInputResolved ctx)
    outputValue = txOutValue output
    outputDatum = decodeDatum (scriptContextTxInfo ctx) output
    cs = CurrencySymbol configuredPolicy
    tn = TokenName configuredToken
    inputToken = singletonAmountInputs ctx cs tn
    outputToken = singletonAmountOutputs ctx cs tn
  in
       countOwnInputs ctx == 1
    && countOwnOutputs ctx == 1
    && inputToken == 1
    && outputToken == 1
    && outputValue == inputValue
    && datumValid configuredPolicy configuredToken before
    && case outputDatum of
         Nothing -> False
         Just after ->
              datumValid configuredPolicy configuredToken after
           && prcdStateVersion after == prcdStateVersion before + 1
           && prcdTransitionNonce after == prcdTransitionNonce before + 1
           && actionValid before after action

{-# INLINABLE wrap #-}
wrap
  :: BuiltinByteString
  -> BuiltinByteString
  -> BuiltinData
  -> BuiltinData
  -> BuiltinData
  -> BuiltinUnit
wrap policy token datum action ctx =
  check
    (mkValidator
      policy
      token
      (unsafeFromBuiltinData datum)
      (unsafeFromBuiltinData action)
      (unsafeFromBuiltinData ctx))

compiledValidatorFactory
  :: CompiledCode
       ( BuiltinByteString
         -> BuiltinByteString
         -> BuiltinData
         -> BuiltinData
         -> BuiltinData
         -> BuiltinUnit
       )
compiledValidatorFactory = $$(compile [|| wrap ||])
