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
  putStrLn "ALL ECONOMIC GATE BOUNDARY TESTS PASSED"
