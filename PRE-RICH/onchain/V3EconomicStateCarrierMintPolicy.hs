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

-- Diagnostic Probe B:
-- remove every TxInfo/Value/ScriptContext field access from the policy body.
-- This probe intentionally tests only whether the compiled mint-policy
-- wrapper/evaluator accepts the carrier policy shape.
{-# INLINABLE mkPolicy #-}
mkPolicy :: TxOutRef -> TokenName -> () -> ScriptContext -> Bool
mkPolicy _seed _tokenName _ctx = True

{-# INLINABLE wrap #-}
wrap :: TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit
wrap seed tokenName _ ctx =
  check
    (mkPolicy seed tokenName () (unsafeFromBuiltinData ctx))

compiledPolicyFactory
  :: CompiledCode
       (TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit)
compiledPolicyFactory = $$(compile [|| wrap ||])
