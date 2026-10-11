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

{-# INLINABLE seedConsumed #-}
seedConsumed :: TxOutRef -> TxInfo -> Bool
seedConsumed seed info =
  go (txInfoInputs info)
  where
    go [] = False
    go (i:is) =
      txInInfoOutRef i == seed || go is

{-# INLINABLE mkPolicy #-}
mkPolicy
  :: TxOutRef
  -> TokenName
  -> ()
  -> ScriptContext
  -> Bool
mkPolicy seed tokenName _ ctx =
  let
    info = scriptContextTxInfo ctx
    ownCs = ownCurrencySymbol ctx
    expected = singleton ownCs tokenName 1
  in
       seedConsumed seed info
    && txInfoMint info == expected

{-# INLINABLE wrap #-}
wrap
  :: TxOutRef
  -> TokenName
  -> BuiltinData
  -> BuiltinData
  -> BuiltinUnit
wrap seed tokenName _ ctx =
  check
    (mkPolicy
      seed
      tokenName
      ()
      (unsafeFromBuiltinData ctx))

compiledPolicyFactory
  :: CompiledCode
       ( TxOutRef
         -> TokenName
         -> BuiltinData
         -> BuiltinData
         -> BuiltinUnit
       )
compiledPolicyFactory = $$(compile [|| wrap ||])
