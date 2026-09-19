{-# LANGUAGE NoImplicitPrelude #-}

module GoldenVectors
  ( baseClass
  , baseState
  , issueZeroExpected
  , issueOneExpected
  , revealZeroExpected
  , expireZeroExpected
  , claimExpected
  , invalidIssuePrice
  , invalidRevealPayout
  , invalidRevealWithoutTicket
  , invalidExpireWithoutTicket
  , invalidClaimAmount
  ) where

import PlutusTx.Prelude
import EconomicStateV3
import EconomicTransitionV3

baseClass :: TicketClassState
baseClass = TicketClassState 0 0 0 0 10 True

baseState :: V3EconomicState
baseState =
  V3EconomicState
    0 0 0 0 0 0
    [baseClass]
    (EconomicControlState 0 0)
    (JackpotState 0 0 JackpotInactive 0)

issueZeroExpected :: V3EconomicState
issueZeroExpected =
  baseState
    { v3UnresolvedReserve = 1
    , v3UnresolvedTicketCount = 1
    , v3Classes = [TicketClassState 0 1 1 1 10 True]
    }

issueOneExpected :: V3EconomicState
issueOneExpected =
  baseState
    { v3UnresolvedReserve = 2
    , v3UnresolvedTicketCount = 1
    , v3Classes = [TicketClassState 0 2 1 1 10 True]
    }

revealZeroExpected :: V3EconomicState
revealZeroExpected =
  baseState
    { v3CrystallizedLiabilities = 500
    }

expireZeroExpected :: V3EconomicState
expireZeroExpected = baseState

claimExpected :: V3EconomicState
claimExpected = baseState

invalidIssuePrice :: Bool
invalidIssuePrice =
  case transition baseState (Issue 0 2) of
    Nothing -> True
    Just _ -> False

invalidRevealPayout :: Bool
invalidRevealPayout =
  case transition
         (baseState { v3UnresolvedReserve = 1
                    , v3UnresolvedTicketCount = 1
                    , v3Classes = [TicketClassState 0 1 1 1 10 True] })
         (Reveal 0 501) of
    Nothing -> True
    Just _ -> False

invalidRevealWithoutTicket :: Bool
invalidRevealWithoutTicket =
  case transition baseState (Reveal 0 1) of
    Nothing -> True
    Just _ -> False

invalidExpireWithoutTicket :: Bool
invalidExpireWithoutTicket =
  case transition baseState (Expire 0) of
    Nothing -> True
    Just _ -> False

invalidClaimAmount :: Bool
invalidClaimAmount =
  case transition baseState (Claim 1) of
    Nothing -> True
    Just _ -> False
