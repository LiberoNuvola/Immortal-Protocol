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
  in check (not (null (txInfoInputs info)))

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
  $$(compile [|| typedTokenNameParamOnlyWrap ||])
