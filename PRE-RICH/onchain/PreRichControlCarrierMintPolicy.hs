{-# LANGUAGE DataKinds #-}
{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TemplateHaskell #-}

module PreRichControlCarrierMintPolicy
  ( mkPolicy
  , compiledPolicyFactory
  ) where

import PlutusLedgerApi.V2
import PlutusLedgerApi.V2.Contexts
import PlutusTx
import PlutusTx.Prelude
import qualified PlutusTx.AssocMap as AssocMap

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
  in
       seedConsumed seed info
    && mintedExactlyOne ownCs tokenName (txInfoMint info)

{-# INLINABLE wrap #-}
wrap
  :: TxOutRef
  -> TokenName
  -> BuiltinData
  -> BuiltinData
  -> BuiltinUnit
wrap seed tokenName _ ctx =
  check
    (mkPolicy
      seed
      tokenName
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
compiledPolicyFactory = $$(compile [|| wrap ||])
