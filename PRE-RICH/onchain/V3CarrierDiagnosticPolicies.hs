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
  , seedConsumedFactory
  , assocMapMintFactory
  , singletonMintFactory
  ) where

import PlutusLedgerApi.V2
import PlutusLedgerApi.V2.Contexts
import PlutusTx
import PlutusTx.Prelude
import qualified PlutusTx.AssocMap as AssocMap

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


{-# INLINABLE diagnosticSeedConsumed #-}
diagnosticSeedConsumed :: TxOutRef -> TxInfo -> Bool
diagnosticSeedConsumed seed info =
  let
    go [] = False
    go (i:is) = txInInfoOutRef i == seed || go is
  in go (txInfoInputs info)

{-# INLINABLE diagnosticMintEntries #-}
diagnosticMintEntries :: CurrencySymbol -> Value -> [(TokenName, Integer)]
diagnosticMintEntries cs value =
  case AssocMap.lookup cs (getValue value) of
    Nothing -> []
    Just tokens -> AssocMap.toList tokens

{-# INLINABLE diagnosticMintedExactlyOne #-}
diagnosticMintedExactlyOne :: CurrencySymbol -> TokenName -> Value -> Bool
diagnosticMintedExactlyOne cs expectedName value =
  case diagnosticMintEntries cs value of
    [(name, amount)] -> name == expectedName && amount == 1
    _ -> False

{-# INLINABLE mkSeedConsumedOnly #-}
mkSeedConsumedOnly :: TxOutRef -> TokenName -> () -> ScriptContext -> Bool
mkSeedConsumedOnly seed _ _ ctx =
  diagnosticSeedConsumed seed (scriptContextTxInfo ctx)

{-# INLINABLE mkAssocMapMintOnly #-}
mkAssocMapMintOnly :: TxOutRef -> TokenName -> () -> ScriptContext -> Bool
mkAssocMapMintOnly _ tokenName _ ctx =
  diagnosticMintedExactlyOne (ownCurrencySymbol ctx) tokenName (txInfoMint (scriptContextTxInfo ctx))

{-# INLINABLE mkSingletonMintOnly #-}
mkSingletonMintOnly :: TxOutRef -> TokenName -> () -> ScriptContext -> Bool
mkSingletonMintOnly _ tokenName _ ctx =
  txInfoMint (scriptContextTxInfo ctx) == singleton (ownCurrencySymbol ctx) tokenName 1

{-# INLINABLE wrapSeedConsumedOnly #-}
wrapSeedConsumedOnly :: TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit
wrapSeedConsumedOnly seed name _ ctx =
  check (mkSeedConsumedOnly seed name () (unsafeFromBuiltinData ctx))

{-# INLINABLE wrapAssocMapMintOnly #-}
wrapAssocMapMintOnly :: TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit
wrapAssocMapMintOnly seed name _ ctx =
  check (mkAssocMapMintOnly seed name () (unsafeFromBuiltinData ctx))

{-# INLINABLE wrapSingletonMintOnly #-}
wrapSingletonMintOnly :: TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit
wrapSingletonMintOnly seed name _ ctx =
  check (mkSingletonMintOnly seed name () (unsafeFromBuiltinData ctx))

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

seedConsumedFactory
  :: CompiledCode (TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit)
seedConsumedFactory = $$(compile [|| wrapSeedConsumedOnly ||])

assocMapMintFactory
  :: CompiledCode (TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit)
assocMapMintFactory = $$(compile [|| wrapAssocMapMintOnly ||])

singletonMintFactory
  :: CompiledCode (TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit)
singletonMintFactory = $$(compile [|| wrapSingletonMintOnly ||])
