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
  , decodeSeedFactory
  ) where

import PlutusLedgerApi.V2
import PlutusLedgerApi.V2.Contexts
import PlutusTx
import PlutusTx.Prelude

{-# INLINABLE mkReadInputs #-}
mkReadInputs :: TxOutRef -> TokenName -> () -> ScriptContext -> Bool
mkReadInputs _ _ _ ctx =
  case txInfoInputs (scriptContextTxInfo ctx) of
    [] -> False
    _ -> True

{-# INLINABLE mkCompareSeed #-}
mkCompareSeed :: BuiltinData -> TokenName -> () -> ScriptContext -> Bool
mkCompareSeed seedData _ _ ctx =
  let
    go [] = False
    go (i:is) = toBuiltinData (txInInfoOutRef i) == seedData || go is
  in go (txInfoInputs (scriptContextTxInfo ctx))

-- Decode the same raw parameter into TxOutRef explicitly, separating the
-- IsData decoder from the compiler-generated parameter application path.
{-# INLINABLE mkDecodeSeed #-}
mkDecodeSeed :: BuiltinData -> TokenName -> () -> ScriptContext -> Bool
mkDecodeSeed seedData name unit ctx =
  mkCompareSeed (toBuiltinData (unsafeFromBuiltinData seedData :: TxOutRef)) name unit ctx

{-# INLINABLE wrapNoContext #-}
wrapNoContext :: TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit
wrapNoContext _ _ _ _ = check True

{-# INLINABLE wrapReadInputs #-}
wrapReadInputs :: TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit
wrapReadInputs seed name _ ctx =
  check (mkReadInputs seed name () (unsafeFromBuiltinData ctx))

{-# INLINABLE wrapCompareSeed #-}
wrapCompareSeed :: BuiltinData -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit
wrapCompareSeed seedData name _ ctx =
  check (mkCompareSeed seedData name () (unsafeFromBuiltinData ctx))

{-# INLINABLE wrapDecodeSeed #-}
wrapDecodeSeed :: BuiltinData -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit
wrapDecodeSeed seedData name _ ctx =
  check (mkDecodeSeed seedData name () (unsafeFromBuiltinData ctx))

noContextFactory
  :: CompiledCode (TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit)
noContextFactory = $$(compile [|| wrapNoContext ||])

readInputsFactory
  :: CompiledCode (TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit)
readInputsFactory = $$(compile [|| wrapReadInputs ||])

compareSeedFactory
  :: CompiledCode (BuiltinData -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit)
compareSeedFactory = $$(compile [|| wrapCompareSeed ||])

decodeSeedFactory
  :: CompiledCode (BuiltinData -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit)
decodeSeedFactory = $$(compile [|| wrapDecodeSeed ||])
