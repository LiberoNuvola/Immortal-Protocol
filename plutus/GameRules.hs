{-# LANGUAGE DataKinds             #-}
{-# LANGUAGE FlexibleInstances     #-}
{-# LANGUAGE MultiParamTypeClasses #-}
{-# LANGUAGE NoImplicitPrelude     #-}
{-# LANGUAGE OverloadedStrings     #-}
{-# LANGUAGE ScopedTypeVariables   #-}
{-# LANGUAGE TemplateHaskell       #-}
{-# LANGUAGE UndecidableInstances  #-}
{-# LANGUAGE ViewPatterns          #-}

module GameRules
  ( PrizeTable (..)
  , classifyRowTier
  , classifyTier
  , rowOutcomeIndex
  , rowTierFromIndex
  , rowPayoutTotal
  , prizeAmountForTier
  , defaultPrizeTable
  , generateSymbols
  ) where

import PlutusTx
import PlutusTx.Prelude

-- ============================================================
-- Prize table
-- ============================================================

data PrizeTable = PrizeTable
  { ptTier1 :: Integer
  , ptTier2 :: Integer
  , ptTier3 :: Integer
  , ptTier4 :: Integer
  , ptTier5 :: Integer
  }

PlutusTx.unstableMakeIsData ''PrizeTable
PlutusTx.makeLift ''PrizeTable

{-# INLINABLE defaultPrizeTable #-}
defaultPrizeTable :: PrizeTable
defaultPrizeTable =
  PrizeTable
    { ptTier1 = 2
    , ptTier2 = 5
    , ptTier3 = 10
    , ptTier4 = 200
    , ptTier5 = 1000
    }

{-# INLINABLE baseForTier #-}
baseForTier :: PrizeTable -> Integer -> Integer
baseForTier t tier =
  if tier == 1 then ptTier1 t
  else if tier == 2 then ptTier2 t
  else if tier == 3 then ptTier3 t
  else if tier == 4 then ptTier4 t
  else if tier == 5 then ptTier5 t
  else 0

{-# INLINABLE prizeAmountForTier #-}
prizeAmountForTier :: PrizeTable -> Integer -> Integer -> Integer
prizeAmountForTier table tier priceUsdm =
  if tier <= 0 || priceUsdm <= 0
    then 0
    else (baseForTier table tier * priceUsdm) `divide` 2

-- ============================================================
-- Canonical Classic-6 row distribution
-- ============================================================

-- A row is sampled uniformly from 20,000 canonical outcome slots:
--
--   0..17499  -> loss
--   17500..19199 -> tier 1
--   19200..19799 -> tier 2
--   19800..19979 -> tier 3
--   19980..19998 -> tier 4
--   19999 -> tier 5
--
-- A 16-bit draw is accepted only when < 60,000 and then reduced modulo
-- 20,000. Because 60,000 = 3 * 20,000, the reduction is unbiased.
{-# INLINABLE rowTierFromIndex #-}
rowTierFromIndex :: Integer -> Integer
rowTierFromIndex r =
  if r < 0 || r >= 20000 then
    traceError "GameRules: row outcome index out of range"
  else if r < 17500 then 0
  else if r < 19200 then 1
  else if r < 19800 then 2
  else if r < 19980 then 3
  else if r < 19999 then 4
  else 5

{-# INLINABLE rowOutcomeIndex #-}
rowOutcomeIndex :: BuiltinByteString -> Integer -> Integer
rowOutcomeIndex seed row =
  draw 0
  where
    draw attempt =
      if attempt >= 256 then
        traceError "GameRules: row randomness exhausted"
      else
        let h =
              sha2_256
                (appendByteString
                  (consByteString row (consByteString attempt emptyByteString))
                  seed)
            u =
              indexByteString h 0 * 256
              + indexByteString h 1
        in
          if u < 60000
            then remainder u 20000
            else draw (attempt + 1)

{-# INLINABLE tripleBytes #-}
tripleBytes :: Integer -> BuiltinByteString
tripleBytes sym =
  consByteString sym
    (consByteString sym
      (consByteString sym emptyByteString))

-- For a loss row, deterministically select one of the 120 ordered
-- three-symbol combinations over symbols 1..5 that is not a triple.
{-# INLINABLE lossTriple #-}
lossTriple :: Integer -> BuiltinByteString
lossTriple outcome =
  let
    rank = remainder outcome 120
    first = divide rank 24 + 1
    pairRank = remainder rank 24
    excluded = (first - 1) * 6
    pairIndex =
      if pairRank < excluded
        then pairRank
        else pairRank + 1
    second = divide pairIndex 5 + 1
    third = remainder pairIndex 5 + 1
  in
    consByteString first
      (consByteString second
        (consByteString third emptyByteString))

{-# INLINABLE rowSymbolsFromIndex #-}
rowSymbolsFromIndex :: Integer -> BuiltinByteString
rowSymbolsFromIndex outcome =
  let tier = rowTierFromIndex outcome
  in
    if tier == 0
      then lossTriple outcome
      else tripleBytes tier

{-# INLINABLE classifyRowTier #-}
classifyRowTier :: BuiltinByteString -> Integer
classifyRowTier row =
  if lengthOfByteString row < 3
    then 0
    else
      let
        a = indexByteString row 0
        b = indexByteString row 1
        c = indexByteString row 2
      in
        if a == b && b == c && a >= 1 && a <= 5
          then a
          else 0

-- | Classic-6 summary tier for a full six-symbol board.
-- Both rows are independently evaluated; this returns the maximum row
-- tier only as a legacy summary. The canonical two-row information is
-- carried separately by pdRow1Tier and pdRow2Tier.
{-# INLINABLE classifyTier #-}
classifyTier :: BuiltinByteString -> Integer
classifyTier bs =
  if lengthOfByteString bs < 6
    then 0
    else
      let
        row1 =
          consByteString (indexByteString bs 0)
            (consByteString (indexByteString bs 1)
              (consByteString (indexByteString bs 2) emptyByteString))
        row2 =
          consByteString (indexByteString bs 3)
            (consByteString (indexByteString bs 4)
              (consByteString (indexByteString bs 5) emptyByteString))
        t1 = classifyRowTier row1
        t2 = classifyRowTier row2
      in
        if t1 >= t2 then t1 else t2

{-# INLINABLE rowPayoutTotal #-}
rowPayoutTotal :: PrizeTable -> Integer -> Integer -> Integer -> Integer -> Integer
rowPayoutTotal table row1Tier row2Tier priceUsdm =
  min
    (prizeAmountForTier table row1Tier priceUsdm
      + prizeAmountForTier table row2Tier priceUsdm)
    (500 * priceUsdm)

-- | Deterministically constructs two independent Classic-6 rows from the
-- verified reveal seed. The row outcome distribution, not the old global
-- six-cell classifier, is the economic source of truth.
{-# INLINABLE generateSymbols #-}
generateSymbols :: BuiltinByteString -> BuiltinByteString
generateSymbols symbolsSeed =
  appendByteString
    (rowSymbolsFromIndex (rowOutcomeIndex symbolsSeed 1))
    (rowSymbolsFromIndex (rowOutcomeIndex symbolsSeed 2))
