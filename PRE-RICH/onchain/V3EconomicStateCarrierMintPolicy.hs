{-# LANGUAGE DataKinds #-}
{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TemplateHaskell #-}

module V3EconomicStateCarrierMintPolicy
  ( compiledPolicyFactory
  ) where

import PlutusLedgerApi.V2
import PlutusTx
import PlutusTx.Prelude

-- Diagnostic Probe C:
-- eliminate ScriptContext decoding entirely. The wrapper still has the
-- canonical minting-policy argument shape, but the policy body does not
-- inspect or decode the redeemer/context.
{-# INLINABLE mkPolicy #-}
mkPolicy :: TxOutRef -> TokenName -> () -> Bool
mkPolicy _seed _tokenName _unit = True

{-# INLINABLE wrap #-}
wrap :: TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit
wrap seed tokenName _redeemer _ctx =
  check (mkPolicy seed tokenName ())

compiledPolicyFactory
  :: CompiledCode
       (TxOutRef -> TokenName -> BuiltinData -> BuiltinData -> BuiltinUnit)
compiledPolicyFactory = $$(compile [|| wrap ||])
