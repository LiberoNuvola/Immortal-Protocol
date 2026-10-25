{-# LANGUAGE DataKinds #-}
{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TemplateHaskell #-}

-- Test-only diagnostic policies for the isolated Yaci integration lab.
-- These are not deployment artifacts and must never be used on Preprod.
module V3EconomicStateCarrierMintPolicyDiagnostics
  ( compiledAlwaysPassFactory
  , compiledSeedOnlyFactory
  , compiledMintOnlyFactory
  , compiledSeedParamOnlyFactory
  , compiledTokenNameParamOnlyFactory
  , compiledContextInputsOnlyFactory
  , compiledTypedSeedParamOnlyFactory
  , compiledTypedTokenNameParamOnlyFactory
  , compiledDecodedParamsOnlyFactory
  , compiledDecodedPolicyFactory
  ) where

import PlutusLedgerApi.V2
import PlutusLedgerApi.V2.Contexts
import PlutusTx
import PlutusTx.Prelude
import qualified PlutusTx.AssocMap as AssocMap

{-# INLINABLE seedConsumed #-}
seedConsumed :: TxOutRef -> TxInfo -> Bool
seedConsumed seed info =
  let
    go [] = False
    go (i:is) = txInInfoOutRef i == seed || go is
  in go (txInfoInputs info)

{-# INLINABLE mintedExactlyOne #-}
mintedExactlyOne :: CurrencySymbol -> TokenName -> Value -> Bool
mintedExactlyOne cs expectedName value =
  case AssocMap.lookup cs (getValue value) of
    Nothing -> False
    Just tokens ->
      case AssocMap.toList tokens of
        [(name, amount)] -> name == expectedName && amount == 1
        _ -> False

{-# INLINABLE alwaysPassWrap #-}
alwaysPassWrap :: TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit
alwaysPassWrap _ _ _ _ = check True

{-# INLINABLE seedOnlyWrap #-}
seedOnlyWrap :: TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit
seedOnlyWrap seed _ _ ctx =
  check (seedConsumed seed (scriptContextTxInfo (unsafeFromBuiltinData ctx)))

{-# INLINABLE mintOnlyWrap #-}
mintOnlyWrap :: TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit
mintOnlyWrap _ tokenName _ ctx =
  let decoded = unsafeFromBuiltinData ctx
  in check (mintedExactlyOne (ownCurrencySymbol decoded) tokenName
       (txInfoMint (scriptContextTxInfo decoded)))

compiledAlwaysPassFactory =
  $$(compile [|| alwaysPassWrap ||])

compiledSeedOnlyFactory =
  $$(compile [|| seedOnlyWrap ||])

compiledMintOnlyFactory =
  $$(compile [|| mintOnlyWrap ||])

-- These extra probes separate parameter decoding from ScriptContext decoding.
-- They are intentionally small and remain test-only artifacts.
{-# INLINABLE seedParamOnlyWrap #-}
seedParamOnlyWrap :: BuiltinData -> BuiltinData -> BuiltinData -> BuiltinData -> BuiltinUnit
seedParamOnlyWrap seedData _ _ _ =
  let seed = unsafeFromBuiltinData seedData :: TxOutRef
  in check (txOutRefIdx seed >= 0)

{-# INLINABLE tokenNameParamOnlyWrap #-}
tokenNameParamOnlyWrap :: BuiltinData -> BuiltinData -> BuiltinData -> BuiltinData -> BuiltinUnit
tokenNameParamOnlyWrap _ tokenNameData _ _ =
  let tokenName = unsafeFromBuiltinData tokenNameData :: TokenName
  in check (tokenName == TokenName "ECONOMICSTATE")

{-# INLINABLE contextInputsOnlyWrap #-}
contextInputsOnlyWrap :: BuiltinData -> BuiltinData -> BuiltinData -> BuiltinData -> BuiltinUnit
contextInputsOnlyWrap _ _ _ ctx =
  let info = scriptContextTxInfo (unsafeFromBuiltinData ctx :: ScriptContext)
  in case txInfoInputs info of
       [] -> check False
       _  -> check True

compiledSeedParamOnlyFactory =
  $$(compile [|| seedParamOnlyWrap ||])

compiledTokenNameParamOnlyFactory =
  $$(compile [|| tokenNameParamOnlyWrap ||])

compiledContextInputsOnlyFactory =
  $$(compile [|| contextInputsOnlyWrap ||])

{-# INLINABLE typedSeedParamOnlyWrap #-}
typedSeedParamOnlyWrap :: TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit
typedSeedParamOnlyWrap seed _ _ _ =
  check (txOutRefIdx seed >= 0)

{-# INLINABLE typedTokenNameParamOnlyWrap #-}
typedTokenNameParamOnlyWrap :: TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit
typedTokenNameParamOnlyWrap _ tokenName _ _ =
  check (tokenName == TokenName "ECONOMICSTATE")

compiledTypedSeedParamOnlyFactory =
  $$(compile [|| typedSeedParamOnlyWrap ||])

compiledTypedTokenNameParamOnlyFactory =
  $(compile [|| typedTokenNameParamOnlyWrap ||])

-- Corrected probes model Lucid's external parameter application: parameters
-- arrive as BuiltinData and must be decoded explicitly. TokenName is encoded
-- as a bytestring Data value, not Constr 0 [bytestring].
{-# INLINABLE decodedParamsOnlyWrap #-}
decodedParamsOnlyWrap :: BuiltinData -> BuiltinData -> BuiltinData -> BuiltinData -> BuiltinUnit
decodedParamsOnlyWrap seedData tokenNameData _ _ =
  let
    seed = unsafeFromBuiltinData seedData :: TxOutRef
    tokenName = unsafeFromBuiltinData tokenNameData :: TokenName
  in check (txOutRefIdx seed >= 0 && tokenName == TokenName "ECONOMICSTATE")

{-# INLINABLE decodedPolicyWrap #-}
decodedPolicyWrap :: BuiltinData -> BuiltinData -> BuiltinData -> BuiltinData -> BuiltinUnit
decodedPolicyWrap seedData tokenNameData _ ctxData =
  let
    seed = unsafeFromBuiltinData seedData :: TxOutRef
    tokenName = unsafeFromBuiltinData tokenNameData :: TokenName
    ctx = unsafeFromBuiltinData ctxData :: ScriptContext
    info = scriptContextTxInfo ctx
  in check
       (seedConsumed seed info
         && mintedExactlyOne (ownCurrencySymbol ctx) tokenName (txInfoMint info))

compiledDecodedParamsOnlyFactory =
  $(compile [|| decodedParamsOnlyWrap ||])

compiledDecodedPolicyFactory =
  $(compile [|| decodedPolicyWrap ||])
