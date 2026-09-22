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
  , not
  )

import EconomicProfile (EconomicProfile (..))
import EconomicStateV3
import EconomicKernel
import EconomicTransitionV3
import UniversalEconomicState
import EconomicGate
import qualified UniversalEconomicKernel as UniversalKernel
import PreRichEconomicProjection
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



isNothing :: Maybe a -> Bool
isNothing Nothing = True
isNothing _ = False

sameUniversalState :: UniversalEconomicState -> UniversalEconomicState -> Bool
sameUniversalState a b =
     uesCrystallizedLiabilities a == uesCrystallizedLiabilities b
  && uesUnresolvedReserve a == uesUnresolvedReserve b
  && uesUnresolvedTicketCount a == uesUnresolvedTicketCount b
  && uesWorstCaseExposure a == uesWorstCaseExposure b
  && uesSafetyCapital a == uesSafetyCapital b
  && uesReserveProtection a == uesReserveProtection b
  && uesMandatoryFutureCosts a == uesMandatoryFutureCosts b
  && uesAdditionalProtectedCapital a == uesAdditionalProtectedCapital b

assertUniversalState
  :: Maybe UniversalEconomicState
  -> UniversalEconomicState
  -> String
  -> IO ()
assertUniversalState result expected label =
  case result of
    Just actual -> assert (sameUniversalState actual expected) label
    Nothing -> error ("FAIL: " ++ label)


assert :: Bool -> String -> IO ()
assert condition label =
  if condition
    then putStrLn ("PASS: " ++ label)
    else error ("FAIL: " ++ label)


main :: IO ()
main = do
  assert
    (transitionValid baseProfile baseState (Issue 0 1))
    "valid issue"

  assertState
    (transition baseProfile baseState (Issue 0 1))
    issueZeroExpected
    "issue state"

  assert
    (transitionValid baseProfile issueZeroExpected (Reveal 0 500))
    "valid reveal"

  assertState
    (transition baseProfile issueZeroExpected (Reveal 0 500))
    revealZeroExpected
    "reveal state"

  assert
    (transitionValid baseProfile issueZeroExpected (Expire 0))
    "valid expiry"

  assertState
    (transition baseProfile issueZeroExpected (Expire 0))
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
    (conservationInvariant baseProfile issueZeroExpected)
    "issue conservation"

  assert
    (conservationInvariant baseProfile revealZeroExpected)
    "reveal conservation"

  assert
    (conservationInvariant baseProfile expireZeroExpected)
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


  assertUniversalState
    (projectPreRichState baseProfile baseState)
    (UniversalEconomicState 0 0 0 500 0 0 0 0)
    "base V3 -> universal projection"

  assertUniversalState
    (projectPreRichState baseProfile issueZeroExpected)
    (UniversalEconomicState 0 1 1 500 0 0 0 0)
    "issue V3 -> universal projection"

  assertUniversalState
    (projectPreRichState baseProfile revealZeroExpected)
    (UniversalEconomicState 500 0 0 0 0 0 0 0)
    "reveal V3 -> universal projection"

  assertUniversalState
    (projectPreRichState baseProfile expireZeroExpected)
    (UniversalEconomicState 0 0 0 0 0 0 0 0)
    "expiry V3 -> universal projection"

  assert
    (isNothing
      (projectPreRichState
        baseProfile
        (baseState
          { v3Classes =
              [TicketClassState 99 0 0 0 10 True] })))
    "projection rejects unknown class"

  assert
    (isNothing
      (projectPreRichState
        baseProfile
        (baseState
          { v3Classes =
              [TicketClassState 0 0 0 1 10 True] })))
    "projection rejects inconsistent class exposure"

  assert
    (isNothing
      (projectPreRichState
        (baseProfile { epClassPrices = [] })
        baseState))
    "projection rejects invalid profile"

  assert
    (isNothing
      (projectPreRichState
        baseProfile
        (baseState
          { v3Classes =
              [ TicketClassState 0 0 0 0 10 True
              , TicketClassState 0 0 0 0 10 True
              ] })))
    "projection rejects duplicate class state"

  assert
    (projectionBoundaryEquivalent baseProfile 1000 baseState)
    "aggregate economic boundary equivalence"

  case projectPreRichState baseProfile baseState of
    Nothing -> error "FAIL: base projection unavailable"
    Just universalBase -> do
      assert
        (UniversalKernel.protectedCapital universalBase == 500)
        "universal protected capital"
      assert
        (UniversalKernel.rawSurplus 1000 universalBase == 500)
        "universal raw surplus"
      assert
        (UniversalKernel.solvencyInvariant 1000 universalBase)
        "universal solvency boundary"
      assert
        (not (UniversalKernel.solvencyInvariant 499 universalBase))
        "universal solvency rejects under-protected EEV"
      assert
        (EconomicKernel.protectedCapital baseProfile baseState
          == UniversalKernel.protectedCapital universalBase)
        "V3 and universal protected-capital bridge equivalence"
      assert
        (EconomicKernel.rawSurplus baseProfile 1000 baseState
          == UniversalKernel.rawSurplus 1000 universalBase)
        "V3 and universal raw-surplus bridge equivalence"
      assert
        (EconomicKernel.solvencyInvariant baseProfile 1000 baseState
          == UniversalKernel.solvencyInvariant 1000 universalBase)
        "V3 and universal solvency bridge equivalence"

      let richState =
            baseState
              { v3CrystallizedLiabilities = 7
              , v3SafetyCapital = 11
              , v3ReserveProtection = 13
              , v3MandatoryFutureCosts = 17
              , v3Jackpot = JackpotState 19 0 JackpotLocked 1
              }
      case projectPreRichState baseProfile richState of
        Nothing -> error "FAIL: rich projection unavailable"
        Just richUniversal ->
          assert
            (EconomicKernel.protectedCapital baseProfile richState
              == UniversalKernel.protectedCapital richUniversal)
            "protected-capital preservation for non-zero protected components"

  putStrLn "ALL GOLDEN VECTOR TESTS PASSED"