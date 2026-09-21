{-# LANGUAGE NoImplicitPrelude #-}

module PreRichEconomicProjection
  ( projectPreRichState
  , projectionBoundaryEquivalent
  ) where

import PlutusTx.Prelude
import EconomicProfile
import EconomicStateV3
import UniversalEconomicState
import qualified EconomicKernel as V3Kernel
import qualified UniversalEconomicKernel as UniversalKernel

-- | Project the richer PRE-RICH V3 state into the application-neutral
-- economic state consumed by the universal economic kernel.
--
-- This is intentionally a PRE-RICH boundary function. It owns knowledge of
-- PRE-RICH's class decomposition and profile-supplied payout bound, while the
-- universal target contains only application-neutral economic quantities.
--
-- Failure is represented by Nothing: an incomplete or inconsistent projection
-- must never be promoted into canonical economic state.
{-# INLINABLE projectPreRichState #-}
projectPreRichState
  :: EconomicProfile
  -> V3EconomicState
  -> Maybe UniversalEconomicState
projectPreRichState profile s
  | not (profileValid profile) = Nothing
  | not (v3NonNegative s) = Nothing
  | otherwise =
      case foldClasses profile (v3Classes s) of
        Nothing -> Nothing
        Just (reserve, count, exposure) ->
          if reserve /= v3UnresolvedReserve s
             || count /= v3UnresolvedTicketCount s
             || exposure < 0
          then Nothing
          else
            Just
              (UniversalEconomicState
                (v3CrystallizedLiabilities s)
                (v3UnresolvedReserve s)
                (v3UnresolvedTicketCount s)
                exposure
                (v3SafetyCapital s)
                (v3ReserveProtection s)
                (v3MandatoryFutureCosts s)
                (jsLockedAmount (v3Jackpot s)))

{-# INLINABLE foldClasses #-}
foldClasses
  :: EconomicProfile
  -> [TicketClassState]
  -> Maybe (Integer, Integer, Integer)
foldClasses profile classes =
  foldClassesSeen profile [] classes

{-# INLINABLE foldClassesSeen #-}
foldClassesSeen
  :: EconomicProfile
  -> [TicketClass]
  -> [TicketClassState]
  -> Maybe (Integer, Integer, Integer)
foldClassesSeen _ _ [] = Just (0, 0, 0)
foldClassesSeen profile seen (c:cs)
  | containsClass (tcsClassId c) seen = Nothing
  | otherwise =
    case classPrice profile (tcsClassId c) of
    Nothing -> Nothing
    Just price ->
      if tcsClassId c < 0
         || tcsIssued c < 0
         || tcsUnresolved c < 0
         || tcsExposure c < 0
         || tcsCap c < 0
         || tcsExposure c /= price * tcsUnresolved c
      then Nothing
      else
        case foldClassesSeen profile (tcsClassId c : seen) cs of
          Nothing -> Nothing
          Just (reserve, count, exposure) ->
            Just
              ( reserve + price * tcsUnresolved c
              , count + tcsUnresolved c
              , exposure
                  + epMaxNormalPayoutMultiplier profile
                    * price
                    * tcsUnresolved c
              )

{-# INLINABLE v3NonNegative #-}
v3NonNegative :: V3EconomicState -> Bool
v3NonNegative s =
     v3CrystallizedLiabilities s >= 0
  && v3UnresolvedReserve s >= 0
  && v3UnresolvedTicketCount s >= 0
  && v3SafetyCapital s >= 0
  && v3ReserveProtection s >= 0
  && v3MandatoryFutureCosts s >= 0
  && jsLockedAmount (v3Jackpot s) >= 0
  && classesNonNegative (v3Classes s)

{-# INLINABLE classesNonNegative #-}
classesNonNegative :: [TicketClassState] -> Bool
classesNonNegative [] = True
classesNonNegative (c:cs) =
     tcsIssued c >= 0
  && tcsUnresolved c >= 0
  && tcsExposure c >= 0
  && tcsCap c >= 0
  && classesNonNegative cs

{-# INLINABLE containsClass #-}
containsClass :: TicketClass -> [TicketClass] -> Bool
containsClass _ [] = False
containsClass x (y:ys) = x == y || containsClass x ys


-- | Conformance witness for the aggregate economic boundary.
-- This proves only equality of the represented ProtectedCapital-derived
-- boundary functions for the projected state. It does not prove Economic Gate
-- soundness, viability, atomicity, or full Cardano/V3 equivalence.
{-# INLINABLE projectionBoundaryEquivalent #-}
projectionBoundaryEquivalent
  :: EconomicProfile
  -> Integer
  -> V3EconomicState
  -> Bool
projectionBoundaryEquivalent profile eev s =
  case projectPreRichState profile s of
    Nothing -> False
    Just u ->
         V3Kernel.protectedCapital profile s
           == UniversalKernel.protectedCapital u
      && V3Kernel.rawSurplus profile eev s
           == UniversalKernel.rawSurplus eev u
      && V3Kernel.solvencyInvariant profile eev s
           == UniversalKernel.solvencyInvariant eev u
