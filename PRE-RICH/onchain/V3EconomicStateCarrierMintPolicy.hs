{-# LANGUAGE DataKinds #-}
{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TemplateHaskell #-}

module V3EconomicStateCarrierMintPolicy
  ( compiledPolicyFactory
  ) where

import PlutusLedgerApi.V2
import PlutusLedgerApi.V2.Contexts
import PlutusTx
import PlutusTx.Prelude
import qualified PlutusTx.AssocMap as AssocMap

{-# INLINABLE ownMintEntries #-}
ownMintEntries :: CurrencySymbol -> Value -> [(TokenName, Integer)]
ownMintEntries cs value =
  case AssocMap.lookup cs (getValue value) of
    Nothing -> []
    Just tokens -> AssocMap.toList tokens

{-# INLINABLE mintedExactlyOne #-}
mintedExactlyOne :: CurrencySymbol -> TokenName -> Value -> Bool
mintedExactlyOne cs expectedName value =
  case ownMintEntries cs value of
    [(name, amount)] -> name == expectedName && amount == 1
    _ -> False

{-# INLINABLE seedConsumed #-}
seedConsumed :: TxOutRef -> TxInfo -> Bool
seedConsumed seed info =
  let
    go [] = False
    go (i:is) = txInInfoOutRef i == seed || go is
  in go (txInfoInputs info)

{-# INLINABLE mkPolicy #-}
mkPolicy :: TxOutRef -> TokenName -> () -> ScriptContext -> Bool
mkPolicy seed tokenName _ ctx =
  seedConsumed seed (scriptContextTxInfo ctx)
  && mintedExactlyOne (ownCurrencySymbol ctx) tokenName (txInfoMint (scriptContextTxInfo ctx))

{-# INLINABLE wrap #-}
wrap :: BuiltinData -> BuiltinData -> BuiltinData -> BuiltinData -> BuiltinUnit
wrap seedData tokenNameData _ ctxData =
  let
    seed = unsafeFromBuiltinData seedData :: TxOutRef
    tokenName = unsafeFromBuiltinData tokenNameData :: TokenName
    ctx = unsafeFromBuiltinData ctxData :: ScriptContext
  in check (mkPolicy seed tokenName () ctx)

compiledPolicyFactory
  :: CompiledCode
       (BuiltinData -> BuiltinData -> BuiltinData -> BuiltinData -> BuiltinUnit)
compiledPolicyFactory = $$(compile [|| wrap ||])
