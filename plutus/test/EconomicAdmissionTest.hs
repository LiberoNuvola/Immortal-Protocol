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
  )

import EconomicProfile
import EconomicStateV3
import EconomicTransitionV3
import PreRichEconomicAdmission
import PreRichEconomicProfile
import UniversalEconomicKernel

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

assert :: Bool -> String -> IO ()
assert condition label =
  if condition
    then putStrLn ("PASS: " ++ label)
    else error ("FAIL: " ++ label)

main :: IO ()
main = do
  case preRichEconomicAdmission profile baseState (Issue 0 1) 500 500 0 True True True True of
    Nothing -> error "FAIL: valid issue was rejected"
    Just admitted -> do
      assert (peaEEV admitted == 500) "issue preserves explicit EEV"
      assert (uesUnresolvedReserve (peaCandidateUniversal admitted) == 1) "issue candidate carries unresolved reserve"
      assert (uesWorstCaseExposure (peaCandidateUniversal admitted) == 500) "issue candidate carries 500x worst-case exposure"

  assert
    (case preRichEconomicAdmission profile baseState (Issue 0 1) 499 499 0 True True True True of
       Nothing -> True
       Just _ -> False)
    "economic gate rejects insufficient EEV"

  assert
    (case preRichEconomicAdmission profile baseState (Issue 0 1) 500 500 0 False True True True of
       Nothing -> True
       Just _ -> False)
    "economic gate rejects unverified authority input"

  assert
    (case preRichEconomicAdmission profile baseState (Issue 0 1) 500 500 0 True False True True of
       Nothing -> True
       Just _ -> False)
    "economic gate rejects stale EEV"

  assert
    (case preRichEconomicAdmission profile baseState (Issue 0 1) 500 500 0 True True False True of
       Nothing -> True
       Just _ -> False)
    "economic gate rejects incomplete obligation coverage"

  assert
    (case preRichEconomicAdmission profile issuedState (Reveal 0 500) 500 499 500 True True True True of
       Nothing -> True
       Just _ -> False)
    "economic gate rejects insufficient immediately executable liquidity"

  assert
    (case preRichEconomicAdmission profile baseState (Issue 0 1) 500 500 0 True True True False of
       Nothing -> True
       Just _ -> False)
    "viability gate rejects uncertified Omega successors"

  assert
    (case preRichEconomicAdmission profile baseState (Issue 99 1) 500 500 0 True True True True of
       Nothing -> True
       Just _ -> False)
    "structural transition rejects unknown class"

  assert
    (case preRichEconomicAdmission profile (baseState { v3Classes = [TicketClassState 0 0 0 1 1 True] }) (Issue 0 1) 500 500 0 True True True True of
       Nothing -> True
       Just _ -> False)
    "invalid pre-state fails closed before admission"

  case preRichEconomicAdmission profile issuedState (Reveal 0 500) 501 500 500 True True True True of
    Nothing -> error "FAIL: valid reveal was rejected"
    Just admitted -> do
      assert (uesCrystallizedLiabilities (peaCandidateUniversal admitted) == 500) "reveal crystallises exact liability"
      assert (uesUnresolvedReserve (peaCandidateUniversal admitted) == 0) "reveal releases unresolved reserve"
      assert (solvencyInvariant 500 (peaCandidateUniversal admitted)) "revealed candidate remains universally solvent"

  case preRichEconomicAdmission profile revealedState (Claim 500) 500 500 500 True True True True of
    Nothing -> error "FAIL: valid claim was rejected"
    Just admitted -> do
      assert (uesCrystallizedLiabilities (peaCandidateUniversal admitted) == 0) "claim closes crystallised liability"
      assert (solvencyInvariant 500 (peaCandidateUniversal admitted)) "claimed candidate remains universally solvent"

  putStrLn "ALL ECONOMIC ADMISSION TESTS PASSED"