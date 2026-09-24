{-# LANGUAGE NoImplicitPrelude #-}

module UniversalEconomicState
  ( UniversalEconomicState (..)
  , zeroUniversalEconomicState
  ) where

import PlutusTx.Prelude

-- | Application-neutral economic state required by IMMORTAL's universal
-- economic decision boundary.
--
-- Application-specific structures (ticket classes, activation policy,
-- Jackpot lifecycle, payout tables) are deliberately absent. A profile or
-- application may project its richer state into this aggregate before the
-- universal kernel evaluates it.
data UniversalEconomicState = UniversalEconomicState
  { uesCrystallizedLiabilities :: Integer
  , uesUnresolvedReserve :: Integer
  , uesUnresolvedTicketCount :: Integer
  , uesWorstCaseExposure :: Integer
  , uesSafetyCapital :: Integer
  , uesReserveProtection :: Integer
  , uesMandatoryFutureCosts :: Integer
  , uesAdditionalProtectedCapital :: Integer
  }

{-# INLINABLE zeroUniversalEconomicState #-}
zeroUniversalEconomicState :: UniversalEconomicState
zeroUniversalEconomicState =
  UniversalEconomicState
    0 0 0 0 0 0 0 0
