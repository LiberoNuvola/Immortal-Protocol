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
  , (++)
  )

import EconomicProfile
import EconomicStateV3
import EconomicTransitionV3
import PreRichEconomicAdmission
import PreRichEconomicProfile
import UniversalEconomicKernel
import UniversalEconomicState (UniversalEconomicState (..))

profile :: EconomicProfile
profile = preRichEconomicProfileV1

baseState :: V3EconomicState
baseState =
  V3EconomicState
    0 0 0 0 0 0
    [TicketClassState 0 0 0 0 1 True]
    (EconomicControlState 0 0)
    (JackpotState 0 0 JackpotInactive 0)

issuedState :: V3EconomicState
issuedState =
  case transition profile baseState (Issue 0 1) of
    Just s -> s
    Nothing -> error "fixture: valid issue did not construct"

revealedState :: V3EconomicState
revealedState =
  case transition profile issuedState (Reveal 0 500) of
    Just s -> s
    Nothing -> error "fixture: valid reveal did not construct"

expiredState :: V3EconomicState
expiredState =
  case transition profile issuedState (Expire 0) of
    Just s -> s
    Nothing -> error "fixture: valid expire did not construct"

assert :: Bool -> String -> IO ()
assert condition label =
  if condition
    then putStrLn ("PASS: " ++ label)
    else error ("FAIL: " ++ label)

main :: IO ()
main = do
  case preRichEconomicAdmission profile baseState (Issue 0 1) 500 500 500 0 True True True True of
    Nothing -> error "FAIL: valid issue was rejected"
    Just admitted -> do
      assert (peaCandidateEEV admitted == 500) "issue preserves explicit EEV"
      assert (uesUnresolvedReserve (peaCandidateUniversal admitted) == 1) "issue candidate carries unresolved reserve"
      assert (uesWorstCaseExposure (peaCandidateUniversal admitted) == 500) "issue candidate carries 500x worst-case exposure"

  assert
    (case preRichEconomicAdmission profile baseState (Issue 0 1) 500 499 499 0 True True True True of
       Nothing -> True
       Just _ -> False)
    "economic gate rejects insufficient EEV"

  assert
    (case preRichEconomicAdmission profile baseState (Issue 0 1) 500 500 500 0 False True True True of
       Nothing -> True
       Just _ -> False)
    "economic gate rejects unverified authority input"

  assert
    (case preRichEconomicAdmission profile baseState (Issue 0 1) 500 500 500 0 True False True True of
       Nothing -> True
       Just _ -> False)
    "economic gate rejects stale EEV"

  assert
    (case preRichEconomicAdmission profile baseState (Issue 0 1) 500 500 500 0 True True False True of
       Nothing -> True
       Just _ -> False)
    "economic gate rejects incomplete obligation coverage"

  assert
    (case preRichEconomicAdmission profile issuedState (Reveal 0 500) 500 501 499 500 True True True True of
       Nothing -> True
       Just _ -> False)
    "economic gate rejects insufficient immediately executable liquidity"

  assert
    (case preRichEconomicAdmission profile baseState (Issue 0 1) 500 500 500 0 True True True False of
       Nothing -> True
       Just _ -> False)
    "viability gate rejects uncertified Omega successors"

  assert
    (case preRichEconomicAdmission profile baseState (Issue 99 1) 500 500 500 0 True True True True of
       Nothing -> True
       Just _ -> False)
    "structural transition rejects unknown class"

  assert
    (case preRichEconomicAdmission profile (baseState { v3Classes = [TicketClassState 0 0 0 1 1 True] }) (Issue 0 1) 500 500 500 0 True True True True of
       Nothing -> True
       Just _ -> False)
    "invalid pre-state fails closed before admission"

  case preRichEconomicAdmission profile issuedState (Reveal 0 500) 500 501 500 500 True True True True of
    Nothing -> error "FAIL: valid reveal was rejected"
    Just admitted -> do
      assert (peaPreEEV admitted == 500) "reveal preserves observed pre-state EEV"
      assert (peaCandidateEEV admitted == 501) "reveal evaluates candidate post-state EEV"
      assert (uesCrystallizedLiabilities (peaCandidateUniversal admitted) == 500) "reveal crystallises exact liability"
      assert (uesUnresolvedReserve (peaCandidateUniversal admitted) == 0) "reveal releases unresolved reserve"
      assert (solvencyInvariant 500 (peaCandidateUniversal admitted)) "revealed candidate remains universally solvent"

  case preRichEconomicAdmission profile revealedState (Claim 500) 500 500 500 500 True True True True of
    Nothing -> error "FAIL: valid claim was rejected"
    Just admitted -> do
      assert (uesCrystallizedLiabilities (peaCandidateUniversal admitted) == 0) "claim closes crystallised liability"
      assert (solvencyInvariant 500 (peaCandidateUniversal admitted)) "claimed candidate remains universally solvent"

  case preRichEconomicAdmission profile issuedState (Expire 0) 1 1 1 0 True True True True of
    Nothing -> error "FAIL: valid expire was rejected"
    Just admitted -> do
      assert (uesUnresolvedReserve (peaCandidateUniversal admitted) == 0) "expire releases unresolved reserve"
      assert (uesUnresolvedTicketCount (peaCandidateUniversal admitted) == 0) "expire removes exactly one unresolved ticket from the candidate"
      assert (solvencyInvariant 1 (peaCandidateUniversal admitted)) "expired candidate remains universally solvent"


  let mixedClassStressState =
        V3EconomicState
          100 102 3 7 11 13
          [ TicketClassState 0 2 2 2 10 True
          , TicketClassState 7 1 1 100 10 True
          ]
          (EconomicControlState 7 7)
          (JackpotState 17 0 JackpotLocked 1)

  case preRichEconomicAdmission profile mixedClassStressState (Issue 0 1) 51648 51648 51648 0 True True True True of
    Nothing -> error "FAIL: exact mixed-class protected-capital boundary was rejected"
    Just admitted -> do
      let candidate = peaCandidateUniversal admitted
      assert (uesUnresolvedReserve candidate == 103) "mixed-class stress preserves aggregate unresolved reserve"
      assert (uesUnresolvedTicketCount candidate == 4) "mixed-class stress increments unresolved count exactly once"
      assert (uesWorstCaseExposure candidate == 51500) "mixed-class worst case is class-aware at 500x"
      assert (uesCrystallizedLiabilities candidate == 100) "mixed-class stress protects crystallized liabilities"
      assert (uesSafetyCapital candidate == 7) "mixed-class stress preserves SafetyCapital"
      assert (uesReserveProtection candidate == 11) "mixed-class stress preserves ReserveProtection"
      assert (uesMandatoryFutureCosts candidate == 13) "mixed-class stress preserves MandatoryFutureCosts"
      assert (uesAdditionalProtectedCapital candidate == 17) "mixed-class stress preserves locked Jackpot capital"
      assert (solvencyInvariant 51648 candidate) "mixed-class exact ProtectedCapital boundary remains solvent"

  assert
    (case preRichEconomicAdmission profile mixedClassStressState (Issue 0 1) 51648 51647 51647 0 True True True True of
       Nothing -> True
       Just _ -> False)
    "mixed-class stress rejects EEV one unit below complete ProtectedCapital"

  putStrLn "ALL ECONOMIC ADMISSION TESTS PASSED"