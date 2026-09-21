{-# LANGUAGE NoImplicitPrelude #-}

module UniversalEconomicKernel
  ( protectedCapital
  , rawSurplus
  , nonNegativeState
  , solvencyInvariant
  ) where

import PlutusTx.Prelude
import UniversalEconomicState

{-# INLINABLE protectedCapital #-}
protectedCapital :: UniversalEconomicState -> Integer
protectedCapital s =
    uesCrystallizedLiabilities s
  + uesWorstCaseExposure s
  + uesSafetyCapital s
  + uesReserveProtection s
  + uesMandatoryFutureCosts s
  + uesAdditionalProtectedCapital s

{-# INLINABLE rawSurplus #-}
rawSurplus :: Integer -> UniversalEconomicState -> Integer
rawSurplus eev s =
  max 0 (eev - protectedCapital s)

{-# INLINABLE nonNegativeState #-}
nonNegativeState :: UniversalEconomicState -> Bool
nonNegativeState s =
     uesCrystallizedLiabilities s >= 0
  && uesUnresolvedReserve s >= 0
  && uesUnresolvedTicketCount s >= 0
  && uesWorstCaseExposure s >= 0
  && uesSafetyCapital s >= 0
  && uesReserveProtection s >= 0
  && uesMandatoryFutureCosts s >= 0
  && uesAdditionalProtectedCapital s >= 0

{-# INLINABLE solvencyInvariant #-}
solvencyInvariant :: Integer -> UniversalEconomicState -> Bool
solvencyInvariant eev s =
     eev >= 0
  && nonNegativeState s
  && eev >= protectedCapital s
