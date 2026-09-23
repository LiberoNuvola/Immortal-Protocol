{-# LANGUAGE NoImplicitPrelude #-}

-- Refinement boundary used by conformance tests.
-- Concrete/Cardano code must establish these fields from actual datum state;
-- this module never invents missing economic information.

module RefinementV3
  ( ConcreteV3State (..)
  , refine
  , refinementExact
  ) where

import PlutusTx.Prelude
import EconomicStateV3
import EconomicProfile (EconomicProfile)
import qualified EconomicKernel

data ConcreteV3State = ConcreteV3State
  { cvsCrystallizedLiabilities :: Integer
  , cvsUnresolvedReserve :: Integer
  , cvsUnresolvedTicketCount :: Integer
  , cvsSafetyCapital :: Integer
  , cvsReserveProtection :: Integer
  , cvsMandatoryFutureCosts :: Integer
  , cvsClasses :: [TicketClassState]
  , cvsControl :: EconomicControlState
  , cvsJackpot :: JackpotState
  }

{-# INLINABLE refine #-}
refine :: ConcreteV3State -> V3EconomicState
refine c =
  V3EconomicState
    (cvsCrystallizedLiabilities c)
    (cvsUnresolvedReserve c)
    (cvsUnresolvedTicketCount c)
    (cvsSafetyCapital c)
    (cvsReserveProtection c)
    (cvsMandatoryFutureCosts c)
    (cvsClasses c)
    (cvsControl c)
    (cvsJackpot c)

{-# INLINABLE refinementExact #-}
refinementExact :: EconomicProfile -> ConcreteV3State -> Bool
refinementExact profile c =
     EconomicKernel.conservationInvariant profile (refine c)
  && EconomicKernel.controlStateValid profile (cvsControl c)
  && allNonNegative (refine c)
  where
    allNonNegative s =
         v3CrystallizedLiabilities s >= 0
      && v3UnresolvedReserve s >= 0
      && v3UnresolvedTicketCount s >= 0
      && v3SafetyCapital s >= 0
      && v3ReserveProtection s >= 0
      && v3MandatoryFutureCosts s >= 0
      && jsLockedAmount (v3Jackpot s) >= 0
