{-# LANGUAGE NumericUnderscores #-}
{-# LANGUAGE DataKinds #-}
{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TemplateHaskell #-}
{-# OPTIONS_GHC -fplugin-opt Plinth.Plugin:target-version=1.0.0 #-}

-- | Exact-rational candidate conversion for Pyth USD/ADA into IMMORTAL
-- USDM sub-units. This is a differential-test surface only.
--
-- The USD-per-USDM ratio and maximum absolute exponent are mandatory inputs.
-- No parity default is selected, and this module is not wired into MintPolicy,
-- Economic.totalUsdmValue, or the production settlement builder. Do not
-- authorize Issue with this helper until the normative conversion decision
-- freezes the ratio source, exponent bound, and rounding contract.
module PythAdaUsdConversion
  ( pythAdaUsdToUsdmSubunitsCandidate
  ) where

import PlutusTx.Prelude

{-# INLINABLE powerOfTenLoop #-}
powerOfTenLoop :: Integer -> Integer -> Integer
powerOfTenLoop remaining accumulator =
  if remaining == 0
    then accumulator
    else powerOfTenLoop (remaining - 1) (accumulator * 10)

{-# INLINABLE absoluteInteger #-}
absoluteInteger :: Integer -> Integer
absoluteInteger value =
  if value < 0 then 0 - value else value

{-# INLINABLE positiveCeilingDiv #-}
positiveCeilingDiv :: Integer -> Integer -> Integer
positiveCeilingDiv numerator denominator =
  divide (numerator + denominator - 1) denominator

-- | Candidate formula:
--
--   ceil(economicLovelace * price * 10^exponent * 100 / (1e6 * D))
--
-- where D = usdPerUsdmNumerator / usdPerUsdmDenominator.
-- economicLovelace is already net of the ADA minimum-UTxO exclusion.
-- Keeping the raw price and exponent avoids premature integer-price rounding.
-- The bound and D ratio are inputs on purpose: neither is frozen by this
-- candidate, so callers must not treat the result as authoritative valuation.
{-# INLINABLE pythAdaUsdToUsdmSubunitsCandidate #-}
pythAdaUsdToUsdmSubunitsCandidate
  :: Integer -- raw Pyth price
  -> Integer -- raw Pyth exponent
  -> Integer -- economic lovelace, after min-UTxO exclusion
  -> Integer -- USD per USDM numerator
  -> Integer -- USD per USDM denominator
  -> Integer -- caller-supplied maximum absolute exponent
  -> Maybe Integer
pythAdaUsdToUsdmSubunitsCandidate
  price
  exponent
  economicLovelace
  usdPerUsdmNumerator
  usdPerUsdmDenominator
  maximumAbsoluteExponent =
  let
    exponentMagnitude = absoluteInteger exponent
  in
    if price <= 0
      || economicLovelace < 0
      || usdPerUsdmNumerator <= 0
      || usdPerUsdmDenominator <= 0
      || maximumAbsoluteExponent < 0
      || exponentMagnitude > maximumAbsoluteExponent
      then Nothing
      else
        let
          scale = powerOfTenLoop exponentMagnitude 1
          numerator =
            if exponent < 0
              then economicLovelace * price * 100 * usdPerUsdmDenominator
              else economicLovelace * price * scale * 100 * usdPerUsdmDenominator
          denominator =
            if exponent < 0
              then 1_000_000 * scale * usdPerUsdmNumerator
              else 1_000_000 * usdPerUsdmNumerator
        in
          Just (positiveCeilingDiv numerator denominator)
