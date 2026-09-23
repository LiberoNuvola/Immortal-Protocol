{-# LANGUAGE DataKinds #-}
{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TemplateHaskell #-}

module GenesisCarrierMintPolicy
  ( mkPolicy
  , compiledPolicyFactory
  ) where

import PlutusLedgerApi.V2
import PlutusLedgerApi.V2.Contexts
import PlutusTx
import PlutusTx.Prelude
import qualified PlutusTx.AssocMap as AssocMap

-- | One-shot minting authority for the PRE-RICH Genesis regime carrier.
--
-- The policy is parameterized by one concrete TxOutRef.  The reference UTxO
-- must be consumed by the mint transaction, so the policy can succeed only
-- once in ledger history.  The only asset permitted under this policy is the
-- configured carrier token, in quantity exactly one.  Burning is forbidden.
--
-- This is an application-state authority token; it carries no economic
-- meaning and does not alter the Genesis predicate.
{-# INLINABLE ownMintEntries #-}
ownMintEntries :: CurrencySymbol -> Value -> [(TokenName, Integer)]
ownMintEntries cs value =
  case AssocMap.lookup cs (getValue value) of
    Nothing -> []
    Just tokens -> AssocMap.toList tokens

{-# INLINABLE mintedExactlyOne #-}
mintedExactlyOne
  :: CurrencySymbol
  -> TokenName
  -> Value
  -> Bool
mintedExactlyOne ownCs expectedName minted =
  case ownMintEntries ownCs minted of
    [(name, amount)] -> name == expectedName && amount == 1
    _ -> False

{-# INLINABLE oneShotInputConsumed #-}
oneShotInputConsumed :: TxOutRef -> TxInfo -> Bool
oneShotInputConsumed ref info =
  go (txInfoInputs info)
  where
    go [] = False
    go (i:is) =
      txInInfoOutRef i == ref || go is

{-# INLINABLE mkPolicy #-}
mkPolicy
  :: TxOutRef
  -> TokenName
  -> ()
  -> ScriptContext
  -> Bool
mkPolicy seedRef carrierName _ ctx =
  let
    info = scriptContextTxInfo ctx
    ownCs = ownCurrencySymbol ctx
  in
       oneShotInputConsumed seedRef info
    && mintedExactlyOne ownCs carrierName (txInfoMint info)

{-# INLINABLE wrap #-}
wrap
  :: TxOutRef
  -> TokenName
  -> BuiltinData
  -> BuiltinData
  -> BuiltinUnit
wrap seedRef carrierName _ ctx =
  check
    (mkPolicy
      seedRef
      carrierName
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
compiledPolicyFactory =
  $$(compile [|| wrap ||])
