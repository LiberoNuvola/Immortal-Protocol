{-# LANGUAGE DataKinds #-}
{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TemplateHaskell #-}

-- Diagnostic-only policies. These are never used by the DApp and do not
-- alter the production V3 carrier policy or Reveal semantics.
module V3CarrierDiagnosticPolicies
  ( noContextFactory
  , readInputsFactory
  , compareSeedFactory
  ) where

import PlutusLedgerApi.V2
import PlutusLedgerApi.V2.Contexts
import PlutusTx
import PlutusTx.Prelude

{-# INLINABLE mkNoContext #-}
mkNoContext :: TxOutRef -> TokenName -> () -> ScriptContext -> Bool
mkNoContext _ _ _ _ = True

{-# INLINABLE mkReadInputs #-}
mkReadInputs :: TxOutRef -> TokenName -> () -> ScriptContext -> Bool
mkReadInputs _ _ _ ctx =
  length (txInfoInputs (scriptContextTxInfo ctx)) > 0

{-# INLINABLE mkCompareSeed #-}
mkCompareSeed :: TxOutRef -> TokenName -> () -> ScriptContext -> Bool
mkCompareSeed seed _ _ ctx =
  let
    go [] = False
    go (i:is) = txInInfoOutRef i == seed || go is
  in go (txInfoInputs (scriptContextTxInfo ctx))

{-# INLINABLE wrapNoContext #-}
wrapNoContext :: TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit
wrapNoContext _ _ _ _ = check True
-- The no-context baseline intentionally does not decode ScriptContext.

{-# INLINABLE wrapReadInputs #-}
wrapReadInputs :: TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit
wrapReadInputs seed name _ ctx =
  check (mkReadInputs seed name () (unsafeFromBuiltinData ctx))

{-# INLINABLE wrapCompareSeed #-}
wrapCompareSeed :: TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit
wrapCompareSeed seed name _ ctx =
  check (mkCompareSeed seed name () (unsafeFromBuiltinData ctx))

noContextFactory
  :: CompiledCode (TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit)
noContextFactory = $$(compile [|| wrapNoContext ||])

readInputsFactory
  :: CompiledCode (TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit)
readInputsFactory = $$(compile [|| wrapReadInputs ||])

compareSeedFactory
  :: CompiledCode (TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit)
compareSeedFactory = $$(compile [|| wrapCompareSeed ||])
