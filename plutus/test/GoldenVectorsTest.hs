{-# LANGUAGE NoImplicitPrelude #-}

module Main where

import Prelude
  ( Bool (False, True)
  , IO
  , String
  , Maybe (Just, Nothing)
  , error
  , putStrLn
  , (++)
  , (==)
  , (&&)
  )

import EconomicStateV3
import EconomicKernel
import EconomicTransitionV3
import GoldenVectors
import GameRules


sameState :: V3EconomicState -> V3EconomicState -> Bool
sameState a b =
     v3CrystallizedLiabilities a == v3CrystallizedLiabilities b
  && v3UnresolvedReserve a == v3UnresolvedReserve b
  && v3UnresolvedTicketCount a == v3UnresolvedTicketCount b
  && v3SafetyCapital a == v3SafetyCapital b
  && v3ReserveProtection a == v3ReserveProtection b
  && v3MandatoryFutureCosts a == v3MandatoryFutureCosts b
  && sameClasses (v3Classes a) (v3Classes b)
  && sameControl (v3Control a) (v3Control b)
  && sameJackpot (v3Jackpot a) (v3Jackpot b)


sameClasses :: [TicketClassState] -> [TicketClassState] -> Bool
sameClasses [] [] = True
sameClasses (a:as) (b:bs) =
     tcsClassId a == tcsClassId b
  && tcsIssued a == tcsIssued b
  && tcsUnresolved a == tcsUnresolved b
  && tcsExposure a == tcsExposure b
  && tcsCap a == tcsCap b
  && tcsSaleable a == tcsSaleable b
  && sameClasses as bs
sameClasses _ _ = False


sameControl :: EconomicControlState -> EconomicControlState -> Bool
sameControl a b =
     ecsCurrentActiveClass a == ecsCurrentActiveClass b
  && ecsHighestClassEverActivated a == ecsHighestClassEverActivated b


sameJackpot :: JackpotState -> JackpotState -> Bool
sameJackpot a b =
     jsLockedAmount a == jsLockedAmount b
  && jsThreshold a == jsThreshold b
  && sameJackpotStatus (jsStatus a) (jsStatus b)
  && jsCycle a == jsCycle b

sameJackpotStatus :: JackpotStatus -> JackpotStatus -> Bool
sameJackpotStatus JackpotInactive JackpotInactive = True
sameJackpotStatus JackpotLocked JackpotLocked = True
sameJackpotStatus JackpotPayable JackpotPayable = True
sameJackpotStatus JackpotClosed JackpotClosed = True
sameJackpotStatus _ _ = False


assertState :: Maybe V3EconomicState -> V3EconomicState -> String -> IO ()
assertState result expected label =
  case result of
    Just actual -> assert (sameState actual expected) label
    Nothing -> error ("FAIL: " ++ label)


assert :: Bool -> String -> IO ()
assert condition label =
  if condition
    then putStrLn ("PASS: " ++ label)
    else error ("FAIL: " ++ label)


main :: IO ()
main = do
  assert
    (transitionValid baseState (Issue 0 1))
    "valid issue"

  assertState
    (transition baseState (Issue 0 1))
    issueZeroExpected
    "issue state"

  assert
    (transitionValid issueZeroExpected (Reveal 0 500))
    "valid reveal"

  assertState
    (transition issueZeroExpected (Reveal 0 500))
    revealZeroExpected
    "reveal state"

  assert
    (transitionValid issueZeroExpected (Expire 0))
    "valid expiry"

  assertState
    (transition issueZeroExpected (Expire 0))
    expireZeroExpected
    "expiry state"

  assert
    invalidIssuePrice
    "reject non-canonical issue price"

  assert
    invalidRevealPayout
    "reject payout above 500x"

  assert
    invalidRevealWithoutTicket
    "reject reveal without unresolved ticket"

  assert
    invalidExpireWithoutTicket
    "reject expiry without unresolved ticket"

  assert
    invalidClaimAmount
    "reject claim above liability"

  assert
    (conservationInvariant issueZeroExpected)
    "issue conservation"

  assert
    (conservationInvariant revealZeroExpected)
    "reveal conservation"

  assert
    (conservationInvariant expireZeroExpected)
    "expiry conservation"

  assert (rowTierFromIndex 0 == 0) "Classic-6 lower boundary"
  assert (rowTierFromIndex 17499 == 0) "Classic-6 loss interval"
  assert (rowTierFromIndex 17500 == 1) "Classic-6 tier1 boundary"
  assert (rowTierFromIndex 19199 == 1) "Classic-6 tier1 interval"
  assert (rowTierFromIndex 19200 == 2) "Classic-6 tier2 boundary"
  assert (rowTierFromIndex 19800 == 3) "Classic-6 tier3 boundary"
  assert (rowTierFromIndex 19980 == 4) "Classic-6 tier4 boundary"
  assert (rowTierFromIndex 19999 == 5) "Classic-6 tier5 boundary"
  assert
    (rowPayoutTotal defaultPrizeTable 5 5 100 == 50000)
    "Classic-6 dual tier payout capped at 500x"

  putStrLn "ALL GOLDEN VECTOR TESTS PASSED"