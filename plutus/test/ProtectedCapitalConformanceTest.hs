{-# LANGUAGE NoImplicitPrelude #-}

module Main where

import Prelude
  ( Bool (False, True)
  , IO
  , Maybe (Just, Nothing)
  , String
  , error
  , putStrLn
  , (==)
  , (&&)
  , not
  , (++)
  , (-)
  )

import EconomicProfile
import EconomicStateV3
import EconomicTransitionV3
import qualified EconomicKernel
import PreRichEconomicProfile
import PreRichEconomicProjection
import ProtectedCapitalConformance
import qualified UniversalEconomicState

assert :: Bool -> String -> IO ()
assert condition label =
  if condition
    then putStrLn ("PASS: " ++ label)
    else error ("FAIL: " ++ label)

profile :: EconomicProfile
profile = preRichEconomicProfileV1

baseState :: V3EconomicState
baseState =
  V3EconomicState
    0 0 0 0 0 0
    [TicketClassState 0 0 0 0 10 True]
    (EconomicControlState 0 0)
    (JackpotState 0 0 JackpotInactive 0)

issuedState :: V3EconomicState
issuedState =
  case transition profile baseState (Issue 0 1) of
    Just s -> s
    Nothing -> error "fixture: issue failed"

reveal500State :: V3EconomicState
reveal500State =
  case transition profile issuedState (Reveal 0 500) of
    Just s -> s
    Nothing -> error "fixture: reveal failed"

reveal1State :: V3EconomicState
reveal1State =
  case transition profile issuedState (Reveal 0 1) of
    Just s -> s
    Nothing -> error "fixture: low-payout reveal failed"

claimOneState :: V3EconomicState
claimOneState =
  case transition profile reveal1State (Claim 1) of
    Just s -> s
    Nothing -> error "fixture: claim failed"

expireState :: V3EconomicState
expireState =
  case transition profile issuedState (Expire 0) of
    Just s -> s
    Nothing -> error "fixture: expire failed"

main :: IO ()
main = do
  let pc0 = EconomicKernel.protectedCapital profile baseState
  let pcIssue = EconomicKernel.protectedCapital profile issuedState
  let pcReveal500 = EconomicKernel.protectedCapital profile reveal500State
  let pcReveal1 = EconomicKernel.protectedCapital profile reveal1State
  let pcClaimOne = EconomicKernel.protectedCapital profile claimOneState
  let pcExpire = EconomicKernel.protectedCapital profile expireState

  assert (pc0 == 0) "base ProtectedCapital"
  assert (pcIssue == 500) "Issue adds exactly 500xP exposure"
  assert (pcReveal500 - pcIssue == 0) "max Reveal does not increase ProtectedCapital"
  assert (pcReveal1 - pcIssue == -499) "partial Reveal reduces ProtectedCapital by 499"
  assert (pcClaimOne - pcReveal1 == -1) "Claim reduces ProtectedCapital by claimed liability"
  assert (pcExpire - pcIssue == -500) "Expire releases exactly the unresolved 500xP exposure"

  assert
    (protectedCapitalLifecycleSafe profile (RevealWitness 1 0))
    "zero-payout Reveal is protected-capital safe"
  assert
    (protectedCapitalLifecycleSafe profile (RevealWitness 1 500))
    "500x Reveal is protected-capital safe"
  assert
    (not (protectedCapitalLifecycleSafe profile (RevealWitness 1 501)))
    "Reveal above 500x is rejected by the preservation predicate"
  assert
    (protectedCapitalLifecycleSafe profile (ClaimWitness 7))
    "Claim decreases protected requirement"
  assert
    (protectedCapitalLifecycleSafe profile (ExpireWitness 1))
    "Expire decreases protected requirement"

  assert
    (protectedCapitalPartitionExact 7 500 11 13 17 19 567)
    "ProtectedCapital partition counts each component once"
  assert
    (not (protectedCapitalPartitionExact 7 500 11 13 17 19 566))
    "ProtectedCapital partition rejects arithmetic omission"

  let protectedProjectionState =
        V3EconomicState
          100 1 1 11 13 17
          [TicketClassState 0 1 1 1 10 True]
          (EconomicControlState 0 0)
          (JackpotState 19 98 JackpotLocked 1)

  case projectPreRichState profile protectedProjectionState of
    Nothing ->
      error "FAIL: non-zero protected V3 projection rejected"
    Just u -> do
      assert
        (UniversalEconomicState.uesCrystallizedLiabilities u == 100)
        "projection preserves crystallised liabilities"
      assert
        (UniversalEconomicState.uesUnresolvedReserve u == 1)
        "projection preserves unresolved reserve"
      assert
        (UniversalEconomicState.uesUnresolvedTicketCount u == 1)
        "projection preserves unresolved count"
      assert
        (UniversalEconomicState.uesWorstCaseExposure u == 500)
        "projection preserves derived worst-case exposure"
      assert
        (UniversalEconomicState.uesSafetyCapital u == 11)
        "projection preserves SafetyCapital"
      assert
        (UniversalEconomicState.uesReserveProtection u == 13)
        "projection preserves ReserveProtection"
      assert
        (UniversalEconomicState.uesMandatoryFutureCosts u == 17)
        "projection preserves MandatoryFutureCosts"
      assert
        (UniversalEconomicState.uesAdditionalProtectedCapital u == 19)
        "projection preserves locked Jackpot protection"
      assert
        (projectionBoundaryEquivalent profile 1000 protectedProjectionState)
        "non-zero protected components preserve V3/universal boundary equivalence"

  putStrLn "ALL PROTECTED CAPITAL CONFORMANCE TESTS PASSED"