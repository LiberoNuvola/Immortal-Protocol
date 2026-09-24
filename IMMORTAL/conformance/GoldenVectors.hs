{-# LANGUAGE NoImplicitPrelude #-}

module GoldenVectors
  ( baseProfile
  , baseClass
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
import EconomicProfile
import EconomicStateV3
import EconomicTransitionV3
import PreRichEconomicProfile

baseProfile :: EconomicProfile
baseProfile = preRichEconomicProfileV1

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
    , v3UnresolvedReserve = 0
    , v3UnresolvedTicketCount = 0
    , v3Classes = [TicketClassState 0 1 0 0 10 True]
    }

expireZeroExpected :: V3EconomicState
expireZeroExpected =
  baseState
    { v3UnresolvedReserve = 0
    , v3UnresolvedTicketCount = 0
    , v3Classes = [TicketClassState 0 1 0 0 10 True]
    }

claimExpected :: V3EconomicState
claimExpected = baseState

invalidIssuePrice :: Bool
invalidIssuePrice =
  case transition baseProfile baseState (Issue 0 2) of
    Nothing -> True
    Just _ -> False

invalidRevealPayout :: Bool
invalidRevealPayout =
  case transition
         baseProfile
         (baseState { v3UnresolvedReserve = 1
                    , v3UnresolvedTicketCount = 1
                    , v3Classes = [TicketClassState 0 1 1 1 10 True] })
         (Reveal 0 501) of
    Nothing -> True
    Just _ -> False

invalidRevealWithoutTicket :: Bool
invalidRevealWithoutTicket =
  case transition baseProfile baseState (Reveal 0 1) of
    Nothing -> True
    Just _ -> False

invalidExpireWithoutTicket :: Bool
invalidExpireWithoutTicket =
  case transition baseProfile baseState (Expire 0) of
    Nothing -> True
    Just _ -> False

invalidClaimAmount :: Bool
invalidClaimAmount =
  case transition baseProfile baseState (Claim 1) of
    Nothing -> True
    Just _ -> False
