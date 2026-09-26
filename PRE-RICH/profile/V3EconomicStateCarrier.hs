{-# LANGUAGE DataKinds #-}
{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE TemplateHaskell #-}

module V3EconomicStateCarrier
  ( V3EconomicStateDatum (..)
  , V3EconomicStateAction (..)
  , mkValidator
  , compiledValidator
  ) where

import PlutusLedgerApi.V2
import PlutusLedgerApi.V2.Contexts
import PlutusTx
import PlutusTx.Prelude
import qualified PlutusTx.AssocMap as AssocMap

import EconomicStateV3
  ( V3EconomicState (..)
  , TicketClassState (..)
  , EconomicControlState (..)
  , JackpotState (..)
  , JackpotStatus (..)
  )

data V3EconomicStateDatum = V3EconomicStateDatum
  { vesdStateVersion :: Integer
  , vesdState        :: V3EconomicState
  }

PlutusTx.unstableMakeIsData ''V3EconomicStateDatum

data V3EconomicStateAction
  = AdvanceV3State

PlutusTx.unstableMakeIsData ''V3EconomicStateAction

{-# INLINABLE singletonAmount #-}
singletonAmount :: Value -> BuiltinByteString -> BuiltinByteString -> Integer
singletonAmount value policy name =
  case AssocMap.lookup (CurrencySymbol policy) (getValue value) of
    Nothing -> 0
    Just tokens ->
      case AssocMap.lookup (TokenName name) tokens of
        Nothing -> 0
        Just amount -> amount

{-# INLINABLE ownInput #-}
ownInput :: ScriptContext -> TxOut
ownInput ctx =
  case findOwnInput ctx of
    Just i -> txInInfoResolved i
    Nothing -> traceError "V3Carrier: missing own input"

{-# INLINABLE ownHash #-}
ownHash :: ScriptContext -> ScriptHash
ownHash ctx =
  case addressCredential (txOutAddress (ownInput ctx)) of
    ScriptCredential h -> h
    _ -> traceError "V3Carrier: own input is not script"

{-# INLINABLE ownInputCount #-}
ownInputCount :: ScriptContext -> Integer
ownInputCount ctx =
  let sh = ownHash ctx
      go [] = 0
      go (i:is) =
        case addressCredential (txOutAddress (txInInfoResolved i)) of
          ScriptCredential h | h == sh -> 1 + go is
          _ -> go is
  in go (txInfoInputs (scriptContextTxInfo ctx))

{-# INLINABLE ownOutputCount #-}
ownOutputCount :: ScriptContext -> Integer
ownOutputCount ctx =
  let sh = ownHash ctx
      go [] = 0
      go (o:os) =
        case addressCredential (txOutAddress o) of
          ScriptCredential h | h == sh -> 1 + go os
          _ -> go os
  in go (txInfoOutputs (scriptContextTxInfo ctx))

{-# INLINABLE continuingOutput #-}
continuingOutput :: ScriptContext -> TxOut
continuingOutput ctx =
  let
    go [] = traceError "V3Carrier: missing continuing output"
    go (o:os) =
      case addressCredential (txOutAddress o) of
        ScriptCredential h | h == ownHash ctx -> o
        _ -> go os
  in go (txInfoOutputs (scriptContextTxInfo ctx))

{-# INLINABLE decodeDatum #-}
decodeDatum :: TxInfo -> TxOut -> Maybe V3EconomicStateDatum
decodeDatum info out =
  case txOutDatum out of
    OutputDatum d -> fromBuiltinData (getDatum d)
    OutputDatumHash h ->
      case findDatum h info of
        Just d -> fromBuiltinData (getDatum d)
        Nothing -> Nothing
    NoOutputDatum -> Nothing

{-# INLINABLE classValid #-}
classValid :: TicketClassState -> Bool
classValid c =
     tcsClassId c >= 0
  && tcsClassId c < 8
  && tcsIssued c >= 0
  && tcsUnresolved c >= 0
  && tcsUnresolved c <= tcsIssued c
  && tcsExposure c >= 0
  && tcsCap c >= 0
  && tcsExposure c == tcsUnresolved c * classPrice c
  where
    classPrice c =
      case tcsClassId c of
        0 -> 1
        1 -> 2
        2 -> 3
        3 -> 5
        4 -> 10
        5 -> 25
        6 -> 50
        7 -> 100
        _ -> 0

{-# INLINABLE canonicalClassesValid #-}
canonicalClassesValid :: [TicketClassState] -> Integer -> Bool
canonicalClassesValid [] expected = expected == 8
canonicalClassesValid (c:cs) expected =
     tcsClassId c == expected
  && classValid c
  && canonicalClassesValid cs (expected + 1)

{-# INLINABLE activeClassExists #-}
activeClassExists :: TicketClass -> [TicketClassState] -> Bool
activeClassExists _ [] = False
activeClassExists target (c:cs) =
  tcsClassId c == target || activeClassExists target cs

{-# INLINABLE stateValid #-}
stateValid :: V3EconomicState -> Bool
stateValid s =
     v3CrystallizedLiabilities s >= 0
  && v3UnresolvedReserve s >= 0
  && v3UnresolvedTicketCount s >= 0
  && v3SafetyCapital s >= 0
  && v3ReserveProtection s >= 0
  && v3MandatoryFutureCosts s >= 0
  && canonicalClassesValid (v3Classes s) 0
  && v3UnresolvedReserve s == sumExposure (v3Classes s)
  && v3UnresolvedTicketCount s == sumUnresolved (v3Classes s)
  && ecsCurrentActiveClass (v3Control s) >= 0
  && ecsCurrentActiveClass (v3Control s) < 8
  && activeClassExists (ecsCurrentActiveClass (v3Control s)) (v3Classes s)
  && ecsHighestClassEverActivated (v3Control s) >= ecsCurrentActiveClass (v3Control s)
  && ecsHighestClassEverActivated (v3Control s) < 8
  && jsLockedAmount (v3Jackpot s) >= 0
  && jsThreshold (v3Jackpot s) >= 0
  && jsCycle (v3Jackpot s) >= 0
  where
    sumExposure [] = 0
    sumExposure (x:xs) = tcsExposure x + sumExposure xs
    sumUnresolved [] = 0
    sumUnresolved (x:xs) = tcsUnresolved x + sumUnresolved xs

{-# INLINABLE totalTokenInInputs #-}
totalTokenInInputs :: ScriptContext -> BuiltinByteString -> BuiltinByteString -> Integer
totalTokenInInputs ctx policy name =
  let
    go [] = 0
    go (i:is) =
      singletonAmount (txOutValue (txInInfoResolved i)) policy name + go is
  in go (txInfoInputs (scriptContextTxInfo ctx))

{-# INLINABLE totalTokenInOutputs #-}
totalTokenInOutputs :: ScriptContext -> BuiltinByteString -> BuiltinByteString -> Integer
totalTokenInOutputs ctx policy name =
  let
    go [] = 0
    go (o:os) = singletonAmount (txOutValue o) policy name + go os
  in go (txInfoOutputs (scriptContextTxInfo ctx))

{-# INLINABLE sameStateIdentity #-}
sameStateIdentity :: V3EconomicStateDatum -> V3EconomicStateDatum -> Bool
sameStateIdentity before after =
     stateValid (vesdState before)
  && vesdStateVersion after == vesdStateVersion before + 1
  && stateValid (vesdState after)

{-# INLINABLE mkValidator #-}
mkValidator
  :: BuiltinByteString
  -> BuiltinByteString
  -> V3EconomicStateDatum
  -> V3EconomicStateAction
  -> ScriptContext
  -> Bool
mkValidator carrierPolicy carrierName datum action ctx =
  let
    info = scriptContextTxInfo ctx
    inputValue = txOutValue (ownInput ctx)
    output = continuingOutput ctx
    outputDatum = decodeDatum info output
    inputToken = singletonAmount inputValue carrierPolicy carrierName
    outputToken = singletonAmount (txOutValue output) carrierPolicy carrierName
    totalInputToken = totalTokenInInputs ctx carrierPolicy carrierName
    totalOutputToken = totalTokenInOutputs ctx carrierPolicy carrierName
  in
       ownInputCount ctx == 1
    && ownOutputCount ctx == 1
    && inputToken == 1
    && outputToken == 1
    && totalInputToken == 1
    && totalOutputToken == 1
    && txOutValue output == inputValue
    && case outputDatum of
         Nothing -> False
         Just after ->
           case action of
             AdvanceV3State ->
               sameStateIdentity datum after

{-# INLINABLE wrap #-}
wrap
  :: BuiltinByteString
  -> BuiltinByteString
  -> BuiltinData
  -> BuiltinData
  -> BuiltinData
  -> BuiltinUnit
wrap policy name datum action ctx =
  check
    (mkValidator
      policy
      name
      (unsafeFromBuiltinData datum)
      (unsafeFromBuiltinData action)
      (unsafeFromBuiltinData ctx))

compiledValidator
  :: CompiledCode
       (BuiltinByteString
        -> BuiltinByteString
        -> BuiltinData
        -> BuiltinData
        -> BuiltinData
        -> BuiltinUnit)
compiledValidator = $$(compile [|| wrap ||])
