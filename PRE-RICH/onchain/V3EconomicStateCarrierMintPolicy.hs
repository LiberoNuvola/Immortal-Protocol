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
-- The factory is parameterized off-chain with Plutus Data constants.
-- Decode those constants at the boundary before calling the typed policy logic.
-- This keeps the mint predicate unchanged while making the applied parameters
-- match the UPLC factory ABI used by Lucid's applyParamsToScript.
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
compiledPolicyFactory = $(compile [|| wrap ||])
