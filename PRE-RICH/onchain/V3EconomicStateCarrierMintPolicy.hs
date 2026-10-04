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
import PlutusTx.List qualified as List

-- Validate the complete mint slice belonging to this policy:
-- exactly one currency symbol, one token name, and one unit.
--
-- IMPORTANT: do not use Eq Value here. Plutus' Eq Value compares the
-- underlying associative maps and is therefore exactly the representation
-- that the native Scalus/Yaci evaluator has rejected in this path.
--
-- flattenValue exposes the normalized non-zero entries as a plain list.
-- Matching that list explicitly preserves the exact-singleton invariant
-- without scrutinizing the Value/AssocMap representation in our policy.
{-# INLINABLE mintedExactlyOne #-}
mintedExactlyOne :: CurrencySymbol -> TokenName -> Value -> Bool
mintedExactlyOne expectedCs expectedName value =
  case flattenValue value of
    [(actualCs, actualName, amount)] ->
      actualCs == expectedCs
        && actualName == expectedName
        && amount == 1
    _ -> False

{-# INLINABLE seedConsumed #-}
seedConsumed :: TxOutRef -> TxInfo -> Bool
seedConsumed seed info =
  List.any (i -> txInInfoOutRef i == seed) (txInfoInputs info)

{-# INLINABLE mkPolicy #-}
mkPolicy :: TxOutRef -> TokenName -> () -> ScriptContext -> Bool
mkPolicy seed tokenName _ ctx =
  seedConsumed seed (scriptContextTxInfo ctx)
  && mintedExactlyOne
       (ownCurrencySymbol ctx)
       tokenName
       (txInfoMint (scriptContextTxInfo ctx))

{-# INLINABLE wrap #-}
wrap :: TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit
wrap seed tokenName _ ctx =
  check
    (mkPolicy seed tokenName () (unsafeFromBuiltinData ctx))

compiledPolicyFactory
  :: CompiledCode
       (TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit)
compiledPolicyFactory = $$(compile [|| wrap ||])
