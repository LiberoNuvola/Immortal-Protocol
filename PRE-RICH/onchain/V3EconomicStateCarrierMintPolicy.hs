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
-- Lucid applyParamsToScript supplies Plutus Data constants. Decode the seed
-- and token name at the ABI boundary before entering the typed policy logic.
wrap
  :: BuiltinData
  -> BuiltinData
  -> BuiltinData
  -> BuiltinData
  -> BuiltinUnit
wrap seedData tokenNameData _ ctx =
  check
    (mkPolicy
      (unsafeFromBuiltinData seedData)
      (unsafeFromBuiltinData tokenNameData)
      ()
      (unsafeFromBuiltinData ctx))

compiledPolicyFactory
  :: CompiledCode
       ( BuiltinData
         -> BuiltinData
         -> BuiltinData
         -> BuiltinData
         -> BuiltinUnit
       )
compiledPolicyFactory = $$(compile [|| wrap ||])