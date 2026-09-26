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

{-# INLINABLE mintedExactlyOne #-}
mintedExactlyOne :: CurrencySymbol -> TokenName -> Value -> Bool
mintedExactlyOne cs expectedName value =
  case AssocMap.lookup cs (getValue value) of
    Just tokens ->
      case AssocMap.toList tokens of
        [(name, amount)] -> name == expectedName && amount == 1
        _ -> False
    Nothing -> False

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
wrap :: TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit
wrap seed tokenName _ ctx =
  check
    (mkPolicy seed tokenName () (unsafeFromBuiltinData ctx))

compiledPolicyFactory
  :: CompiledCode
       (TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit)
compiledPolicyFactory = $$(compile [|| wrap ||])
