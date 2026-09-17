{-# LANGUAGE NoImplicitPrelude #-}

-- Canonical V3 transition layer.
-- This module is deliberately chain-neutral: Cardano/TxInfo/Value types
-- must not enter here. The Adapter proves that a concrete transaction
-- refines one of these transitions.

module EconomicTransitionV3
  ( V3Action (..)
  , transition
  , transitionValid
  , updateClass
  ) where

import PlutusTx.Prelude
import EconomicStateV3
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
transition :: V3EconomicState -> V3Action -> Maybe V3EconomicState
transition s (Issue cid price) =
  case classPrice cid of
    Nothing -> Nothing
    Just canonicalPrice
      | price /= canonicalPrice -> Nothing
      | not (EconomicKernel.classSaleable s cid) -> Nothing
      | otherwise ->
          case updateClass cid issueClass (v3Classes s) of
            Nothing -> Nothing
            Just cs ->
              Just s
                { v3UnresolvedReserve = v3UnresolvedReserve s + price
                , v3UnresolvedTicketCount = v3UnresolvedTicketCount s + 1
                , v3Classes = cs
                }
  where
    issueClass c =
      c
        { tcsIssued = tcsIssued c + 1
        , tcsUnresolved = tcsUnresolved c + 1
        , tcsExposure = tcsExposure c + price
        }

transition s (Reveal cid payout) =
  case classPrice cid of
    Nothing -> Nothing
    Just price
      | not (EconomicKernel.payoutSufficient price payout) -> Nothing
      | otherwise ->
          case updateClass cid revealClass (v3Classes s) of
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
  where
    revealClass c =
      c
        { tcsUnresolved = tcsUnresolved c - 1
        , tcsExposure = tcsExposure c - price
        }

transition s (Claim amount)
  | amount <= 0 = Nothing
  | amount > v3CrystallizedLiabilities s = Nothing
  | otherwise =
      Just s
        { v3CrystallizedLiabilities =
            v3CrystallizedLiabilities s - amount
        }

transition s (Expire cid) =
  case classPrice cid of
    Nothing -> Nothing
    Just price ->
      case updateClass cid expireClass (v3Classes s) of
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
  where
    expireClass c =
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
transitionValid :: V3EconomicState -> V3Action -> Bool
transitionValid s a =
  case transition s a of
    Nothing -> False
    Just s' ->
         EconomicKernel.conservationInvariant s'
      && v3CrystallizedLiabilities s' >= 0
      && v3UnresolvedReserve s' >= 0
      && v3UnresolvedTicketCount s' >= 0
