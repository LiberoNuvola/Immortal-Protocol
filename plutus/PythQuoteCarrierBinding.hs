{-# LANGUAGE DataKinds #-}
{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE TemplateHaskell #-}
{-# OPTIONS_GHC -fplugin-opt Plinth.Plugin:target-version=1.0.0 #-}

-- | Additive Haskell view of the isolated Aiken Pyth ADA/USD quote carrier.
--
-- This module checks the cross-script transaction topology and extracts the
-- raw quote tuple. It deliberately does not convert USD/ADA into USDM units.
-- It is not yet called by the deployed MintPolicy: production integration
-- must pass the governed-unit decision and bind this exact result into the
-- Treasury valuation predicate.
module PythQuoteCarrierBinding
  ( PythAdaUsdBinding (..)
  , PythAdaUsdQuoteCarrierDatum (..)
  , extractBoundPythAdaUsdQuote
  ) where

import PlutusLedgerApi.V2
import PlutusLedgerApi.V2.Contexts
import PlutusTx
import PlutusTx.Prelude

-- | Field order mirrors Aiken's AdaUsdBinding in
-- poc/aiken-pyth-ada-usd/lib/immortal/ada_usd_probe.ak.
data PythAdaUsdBinding = PythAdaUsdBinding
  { pabPrice                 :: Integer
  , pabExponent              :: Integer
  , pabUpdateTimestampUs     :: Integer
  , pabFeedUpdateTimestampUs :: Integer
  }

PlutusTx.unstableMakeIsData ''PythAdaUsdBinding

-- | Constructor/field shape mirrors Aiken's AdaUsdQuoteCarrierDatum.
data PythAdaUsdQuoteCarrierDatum = PythAdaUsdQuoteCarrierDatum
  { pqcdQuote :: Maybe PythAdaUsdBinding
  }

PlutusTx.unstableMakeIsData ''PythAdaUsdQuoteCarrierDatum

{-# INLINABLE isAtScript #-}
isAtScript :: ScriptHash -> Address -> Bool
isAtScript expected address =
  case addressCredential address of
    ScriptCredential actual -> actual == expected
    _ -> False

{-# INLINABLE findSingleCarrierInput #-}
findSingleCarrierInput :: ScriptHash -> TxInfo -> Maybe TxInInfo
findSingleCarrierInput carrierHash info =
  go (txInfoInputs info) Nothing
  where
    go [] found = found
    go (i:is) found =
      if isAtScript carrierHash (txOutAddress (txInInfoResolved i))
        then
          case found of
            Nothing -> go is (Just i)
            Just _ -> Nothing
        else go is found

{-# INLINABLE findSingleCarrierOutput #-}
findSingleCarrierOutput :: ScriptHash -> TxInfo -> Maybe TxOut
findSingleCarrierOutput carrierHash info =
  go (txInfoOutputs info) Nothing
  where
    go [] found = found
    go (o:os) found =
      if isAtScript carrierHash (txOutAddress o)
        then
          case found of
            Nothing -> go os (Just o)
            Just _ -> Nothing
        else go os found

{-# INLINABLE totalAuthorityQuantityInInputs #-}
totalAuthorityQuantityInInputs
  :: CurrencySymbol -> TokenName -> TxInfo -> Integer
totalAuthorityQuantityInInputs policy name info =
  go (txInfoInputs info)
  where
    go [] = 0
    go (i:is) =
      valueOf (txOutValue (txInInfoResolved i)) policy name + go is

{-# INLINABLE totalAuthorityQuantityInOutputs #-}
totalAuthorityQuantityInOutputs
  :: CurrencySymbol -> TokenName -> TxInfo -> Integer
totalAuthorityQuantityInOutputs policy name info =
  go (txInfoOutputs info)
  where
    go [] = 0
    go (o:os) =
      valueOf (txOutValue o) policy name + go os

{-# INLINABLE decodeCarrierDatum #-}
decodeCarrierDatum
  :: TxInfo -> TxOut -> Maybe PythAdaUsdQuoteCarrierDatum
decodeCarrierDatum info out =
  case txOutDatum out of
    OutputDatum d ->
      fromBuiltinData (getDatum d)
    OutputDatumHash dh ->
      case findDatum dh info of
        Just d -> fromBuiltinData (getDatum d)
        Nothing -> Nothing
    NoOutputDatum ->
      Nothing

-- | Return the exact raw ADA/USD tuple only if the transaction contains a
-- unique carrier script input and continuation, the configured singleton is
-- conserved exactly once, the singleton is neither minted nor burned, both
-- datums decode, and the continuation preserves address and physical Value.
--
-- When used by MintPolicy with the exact deployed carrier script hash, the
-- required script input forces the carrier validator to execute on the same
-- transaction. That validator is responsible for binding the continuation
-- tuple to the Pyth update and its zero-withdrawal signature check. This helper
-- alone is not proof of Pyth authenticity and is not yet wired into Issue.
{-# INLINABLE extractBoundPythAdaUsdQuote #-}
extractBoundPythAdaUsdQuote
  :: ScriptHash
  -> CurrencySymbol
  -> TokenName
  -> TxInfo
  -> Maybe PythAdaUsdBinding
extractBoundPythAdaUsdQuote carrierHash authorityPolicy authorityName info =
  case findSingleCarrierInput carrierHash info of
    Nothing ->
      Nothing
    Just carrierInput ->
      case findSingleCarrierOutput carrierHash info of
        Nothing ->
          Nothing
        Just carrierOutput ->
          let
            before = txInInfoResolved carrierInput
            authorityInputQuantity =
              totalAuthorityQuantityInInputs authorityPolicy authorityName info
            authorityOutputQuantity =
              totalAuthorityQuantityInOutputs authorityPolicy authorityName info
            authorityMintQuantity =
              valueOf (txInfoMint info) authorityPolicy authorityName
            carrierDatumValid =
              case decodeCarrierDatum info before of
                Just _ -> True
                Nothing -> False
            outputQuote =
              case decodeCarrierDatum info carrierOutput of
                Just datum -> pqcdQuote datum
                Nothing -> Nothing
            stateShapeValid =
                 authorityInputQuantity == 1
              && authorityOutputQuantity == 1
              && authorityMintQuantity == 0
              && txOutAddress before == txOutAddress carrierOutput
              && txOutValue before == txOutValue carrierOutput
              && carrierDatumValid
          in
            if stateShapeValid
              then
                case outputQuote of
                  Just quote
                    | pabPrice quote > 0
                    && pabUpdateTimestampUs quote >= 0
                    && pabFeedUpdateTimestampUs quote >= 0 ->
                        Just quote
                  _ ->
                    Nothing
              else
                Nothing
