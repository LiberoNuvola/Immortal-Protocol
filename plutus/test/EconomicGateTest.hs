{-# LANGUAGE NoImplicitPrelude #-}

module Main where

import Prelude
  ( Bool (False, True)
  , IO
  , String
  , error
  , putStrLn
  , not
  , (++)
  )

import EconomicGate
import UniversalEconomicState

assert :: Bool -> String -> IO ()
assert condition label =
  if condition then putStrLn ("PASS: " ++ label)
  else error ("FAIL: " ++ label)

candidate :: UniversalEconomicState
candidate = UniversalEconomicState 10 0 0 0 0 0 0 0

baseInput :: EconomicGateInput
baseInput = EconomicGateInput
  True
  True
  True
  10
  100
  10



-- RGB-IMMORTAL conformance vectors RGB-001..RGB-013.
-- These vectors exercise only the canonical IMMORTAL economic boundary;
-- Bitcoin/RGB observation is intentionally outside this test.

solvencyBoundaryCandidate :: UniversalEconomicState
solvencyBoundaryCandidate = UniversalEconomicState 10 0 0 0 0 0 0 0

negativeStateCandidate :: UniversalEconomicState
negativeStateCandidate = UniversalEconomicState (-1) 0 0 0 0 0 0 0

main :: IO ()
main = do
  assert (economicGate baseInput candidate)
    "economic gate accepts verified solvent candidate"
  assert (not (economicGate (EconomicGateInput False True True 10 100 10) candidate))
    "reject unverified authoritative truth"
  assert (not (economicGate (EconomicGateInput True False True 10 100 10) candidate))
    "reject stale EEV"
  assert (not (economicGate (EconomicGateInput True True False 10 100 10) candidate))
    "reject incomplete obligations"
  assert (not (economicGate (EconomicGateInput True True True 10 (-1) 0) candidate))
    "reject negative executable liquidity"
  assert (not (economicGate (EconomicGateInput True True True 10 100 101) candidate))
    "reject immediate liquidity above executable liquidity"
  assert (not (economicGate (EconomicGateInput True True True 9 100 10) candidate))
    "reject EEV below protected capital"
  assert (executionAdmissible baseInput candidate True True)
    "accept complete execution admissibility witness"
  assert (not (executionAdmissible baseInput candidate False True))
    "reject unsafe post-state"
  assert (not (executionAdmissible baseInput candidate True False))
    "reject incomplete certified-kernel successor coverage"

  assert (economicGate baseInput solvencyBoundaryCandidate)
    "RGB-001/002 accept solvent and exact solvency boundary"
  assert (not (economicGate baseInput (UniversalEconomicState 11 0 0 0 0 0 0 0)))
    "RGB-003 reject insolvent candidate"
  assert (not (economicGate baseInput negativeStateCandidate))
    "RGB-004 reject negative state component"
  assert (not (economicGate (EconomicGateInput True True True (-1) 100 10) candidate))
    "RGB-005 reject negative EEV"
  assert (not (economicGate (EconomicGateInput False True True 10 100 10) candidate))
    "RGB-006 reject unverified truth"
  assert (not (economicGate (EconomicGateInput True False True 10 100 10) candidate))
    "RGB-007 reject stale EEV"
  assert (not (economicGate (EconomicGateInput True True False 10 100 10) candidate))
    "RGB-008 reject incomplete obligations"
  assert (not (economicGate (EconomicGateInput True True True 10 (-1) 0) candidate))
    "RGB-009 reject negative available liquidity"
  assert (not (economicGate (EconomicGateInput True True True 10 100 (-1)) candidate))
    "RGB-010 reject negative required liquidity"
  assert (not (economicGate (EconomicGateInput True True True 10 100 101) candidate))
    "RGB-011 reject required liquidity above available"
  assert (economicGate baseInput candidate)
    "RGB-012 economic gate accepts candidate before viability rejection"
  assert (executionAdmissible baseInput candidate False True == False)
    "RGB-012 reject unsafe post-state at execution boundary"
  assert (executionAdmissible baseInput candidate True False == False)
    "RGB-013 reject uncertified Omega successors"

  putStrLn "ALL ECONOMIC GATE BOUNDARY TESTS PASSED"
