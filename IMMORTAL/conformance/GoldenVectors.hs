{-# LANGUAGE NoImplicitPrelude #-}

module GoldenVectors
  ( vectorIssue
  , vectorReveal
  , vectorExpire
  , vectorClaim
  ) where

import PlutusTx.Prelude
import EconomicStateV3
import EconomicTransitionV3
import qualified EconomicKernel

class0 :: TicketClassState
class0 = TicketClassState 0 0 0 0 10 True

baseState :: V3EconomicState
baseState =
  V3EconomicState
    0 0 0 0 0 0
    [class0]
    (EconomicControlState 0 0)
    (JackpotState 0 0 JackpotInactive 0)

{-# INLINABLE vectorIssue #-}
vectorIssue :: Bool
vectorIssue =
  case transition baseState (Issue 0 1) of
    Nothing -> False
    Just s ->
         v3UnresolvedReserve s == 1
      && v3UnresolvedTicketCount s == 1
      && EconomicKernel.conservationInvariant s

{-# INLINABLE vectorReveal #-}
vectorReveal :: Bool
vectorReveal =
  case transition (issueState baseState) (Reveal 0 500) of
    Nothing -> False
    Just s ->
         v3UnresolvedReserve s == 0
      && v3UnresolvedTicketCount s == 0
      && v3CrystallizedLiabilities s == 500
      && EconomicKernel.conservationInvariant s

{-# INLINABLE vectorExpire #-}
vectorExpire :: Bool
vectorExpire =
  case transition (issueState baseState) (Expire 0) of
    Nothing -> False
    Just s ->
         v3UnresolvedReserve s == 0
      && v3UnresolvedTicketCount s == 0
      && v3CrystallizedLiabilities s == 0
      && EconomicKernel.conservationInvariant s

{-# INLINABLE vectorClaim #-}
vectorClaim :: Bool
vectorClaim =
  case transition (issueState baseState) (Reveal 0 500) of
    Nothing -> False
    Just revealed ->
      case transition revealed (Claim 500) of
        Nothing -> False
        Just claimed ->
             v3CrystallizedLiabilities claimed == 0
          && EconomicKernel.conservationInvariant claimed

issueState :: V3EconomicState -> V3EconomicState
issueState s =
  case transition s (Issue 0 1) of
    Just s' -> s'
    Nothing -> s
