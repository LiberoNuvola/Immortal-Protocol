{-# LANGUAGE NoImplicitPrelude #-}

module EconomicTransitionV3
  ( V3Action (..)
  , transition
  , transitionValid
  , updateClass
  ) where

import PlutusTx.Prelude
import EconomicStateV3
import EconomicProfile (EconomicProfile, profileValid)
import qualified EconomicKernel

data V3Action
  = Issue TicketClass Integer
  | Reveal TicketClass Integer
  | Claim Integer
  | Expire TicketClass

{-# INLINABLE updateClass #-}
updateClass :: TicketClass -> (TicketClassState -> TicketClassState) -> [TicketClassState] -> Maybe [TicketClassState]
updateClass _ _ [] = Nothing
updateClass cid f (c:cs)
  | tcsClassId c == cid = Just (f c : cs)
  | otherwise =
      case updateClass cid f cs of
        Nothing -> Nothing
        Just xs -> Just (c : xs)

{-# INLINABLE transition #-}
transition :: EconomicProfile -> V3EconomicState -> V3Action -> Maybe V3EconomicState
transition profile s (Issue cid price) =
  case classPrice profile cid of
    Nothing -> Nothing
    Just canonicalPrice
      | price /= canonicalPrice -> Nothing
      | not (EconomicKernel.classSaleable s cid) -> Nothing
      | otherwise ->
          case updateClass cid (issueClass price) (v3Classes s) of
            Nothing -> Nothing
            Just cs ->
              Just s
                { v3UnresolvedReserve = v3UnresolvedReserve s + price
                , v3UnresolvedTicketCount = v3UnresolvedTicketCount s + 1
                , v3Classes = cs
                }

transition profile s (Reveal cid payout) =
  case classPrice profile cid of
    Nothing -> Nothing
    Just price
      | not (EconomicKernel.payoutSufficient profile price payout) -> Nothing
      | otherwise ->
          case updateClass cid (revealClass price) (v3Classes s) of
            Nothing -> Nothing
            Just cs
              | totalUnresolved cid (v3Classes s) <= 0 -> Nothing
              | v3UnresolvedReserve s < price -> Nothing
              | otherwise ->
                  Just s
                    { v3CrystallizedLiabilities =
                        v3CrystallizedLiabilities s + payout
                    , v3UnresolvedReserve =
                        v3UnresolvedReserve s - price
                    , v3UnresolvedTicketCount =
                        v3UnresolvedTicketCount s - 1
                    , v3Classes = cs
                    }

transition _ s (Claim amount)
  | amount <= 0 = Nothing
  | amount > v3CrystallizedLiabilities s = Nothing
  | otherwise =
      Just s
        { v3CrystallizedLiabilities =
            v3CrystallizedLiabilities s - amount
        }

transition profile s (Expire cid) =
  case classPrice profile cid of
    Nothing -> Nothing
    Just price ->
      case updateClass cid (expireClass price) (v3Classes s) of
        Nothing -> Nothing
        Just cs
          | totalUnresolved cid (v3Classes s) <= 0 -> Nothing
          | v3UnresolvedReserve s < price -> Nothing
          | otherwise ->
              Just s
                { v3UnresolvedReserve =
                    v3UnresolvedReserve s - price
                , v3UnresolvedTicketCount =
                    v3UnresolvedTicketCount s - 1
                , v3Classes = cs
                }

{-# INLINABLE issueClass #-}
issueClass :: Integer -> TicketClassState -> TicketClassState
issueClass price c =
  c
    { tcsIssued = tcsIssued c + 1
    , tcsUnresolved = tcsUnresolved c + 1
    , tcsExposure = tcsExposure c + price
    }

{-# INLINABLE revealClass #-}
revealClass :: Integer -> TicketClassState -> TicketClassState
revealClass price c =
  c
    { tcsUnresolved = tcsUnresolved c - 1
    , tcsExposure = tcsExposure c - price
    }

{-# INLINABLE expireClass #-}
expireClass :: Integer -> TicketClassState -> TicketClassState
expireClass price c =
  c
    { tcsUnresolved = tcsUnresolved c - 1
    , tcsExposure = tcsExposure c - price
    }

{-# INLINABLE totalUnresolved #-}
totalUnresolved :: TicketClass -> [TicketClassState] -> Integer
totalUnresolved _ [] = 0
totalUnresolved cid (c:cs)
  | tcsClassId c == cid = tcsUnresolved c
  | otherwise = totalUnresolved cid cs

{-# INLINABLE transitionValid #-}
transitionValid :: EconomicProfile -> V3EconomicState -> V3Action -> Bool
transitionValid profile s a =
     profileValid profile
  && preStateValid s
  && case transition profile s a of
       Nothing -> False
       Just s' -> postStateValid s' && controlHistoryPreserved s s'
  where
    preStateValid st =
         EconomicKernel.conservationInvariant profile st
      && EconomicKernel.controlStateValid profile (v3Control st)
      && nonNegativeState st

    postStateValid st =
         EconomicKernel.conservationInvariant profile st
      && EconomicKernel.controlStateValid profile (v3Control st)
      && nonNegativeState st

    controlHistoryPreserved before after =
         ecsHighestClassEverActivated (v3Control after)
           >= ecsHighestClassEverActivated (v3Control before)
      && ecsCurrentActiveClass (v3Control after)
           <= ecsHighestClassEverActivated (v3Control after)

    nonNegativeState st =
         v3CrystallizedLiabilities st >= 0
      && v3UnresolvedReserve st >= 0
      && v3UnresolvedTicketCount st >= 0
      && v3SafetyCapital st >= 0
      && v3ReserveProtection st >= 0
      && v3MandatoryFutureCosts st >= 0
      && jsLockedAmount (v3Jackpot st) >= 0
      && allClassesNonNegative (v3Classes st)

    allClassesNonNegative [] = True
    allClassesNonNegative (c:cs) =
         tcsIssued c >= 0
      && tcsUnresolved c >= 0
      && tcsExposure c >= 0
      && tcsCap c >= 0
      && allClassesNonNegative cs
