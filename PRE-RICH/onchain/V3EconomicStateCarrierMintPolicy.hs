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
import qualified PlutusTx.List as List

-- Diagnostic Probe A:
-- isolate seedConsumed from all Value/mint-shape inspection.
-- mintedExactlyOne is deliberately bypassed for this probe only.
{-# INLINABLE mintedExactlyOne #-}
mintedExactlyOne :: CurrencySymbol -> TokenName -> Value -> Bool
mintedExactlyOne _ _ _ = True

{-# INLINABLE seedConsumed #-}
seedConsumed :: TxOutRef -> TxInfo -> Bool
seedConsumed seed info =
  List.any (\i -> txInInfoOutRef i == seed) (txInfoInputs info)

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
