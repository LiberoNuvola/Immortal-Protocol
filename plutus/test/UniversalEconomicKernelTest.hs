module Main where

import Prelude
  ( IO, Bool (..), Integer, String, putStrLn, error, (==), not, (++), negate, (>>=) )
import UniversalEconomicKernel
import UniversalEconomicState

assert :: Bool -> String -> IO ()
assert ok label =
  if ok then putStrLn ("PASS: " ++ label)
  else error ("FAIL: " ++ label)

state :: Integer -> Integer -> Integer -> Integer -> Integer -> Integer -> Integer -> Integer -> UniversalEconomicState
state liabilities unresolvedReserve unresolvedCount exposure safety reserveProtection futureCosts additional =
  UniversalEconomicState liabilities unresolvedReserve unresolvedCount exposure safety reserveProtection futureCosts additional

main :: IO ()
main = do
  let s = state 10 7 2 20 3 4 5 6
  assert (protectedCapital s == 48) "protected capital sums only protected obligation components"
  assert (rawSurplus 60 s == 12) "raw surplus subtracts protected capital from EEV"
  assert (rawSurplus 40 s == 0) "raw surplus is floored at zero"
  assert (nonNegativeState s) "non-negative canonical state is accepted"
  assert (solvencyInvariant 48 s) "exactly covered protected capital is solvent"
  assert (solvencyInvariant 60 s) "EEV above protected capital is solvent"
  assert (not (solvencyInvariant 47 s)) "EEV below protected capital is insolvent"
  assert (not (solvencyInvariant (negate 1) s)) "negative EEV is rejected"
  assert (not (nonNegativeState (state (negate 1) 7 2 20 3 4 5 6))) "negative crystallized liabilities are rejected"
  assert (not (nonNegativeState (state 10 (negate 1) 2 20 3 4 5 6))) "negative unresolved reserve is rejected"
  assert (not (nonNegativeState (state 10 7 (negate 1) 20 3 4 5 6))) "negative unresolved count is rejected"
  assert (not (nonNegativeState (state 10 7 2 (negate 1) 3 4 5 6))) "negative worst-case exposure is rejected"
  assert (not (nonNegativeState (state 10 7 2 20 (negate 1) 4 5 6))) "negative safety capital is rejected"
  assert (not (nonNegativeState (state 10 7 2 20 3 (negate 1) 5 6))) "negative reserve protection is rejected"
  assert (not (nonNegativeState (state 10 7 2 20 3 4 (negate 1) 6))) "negative mandatory future costs are rejected"
  assert (not (nonNegativeState (state 10 7 2 20 3 4 5 (negate 1)))) "negative additional protected capital is rejected"
  -- Cross-family kernel vectors: labels describe economic test families only;
  -- these assertions do not claim to execute Issue/Claim/Expire transitions.
  let crossFamily = state 10 2 1 20 5 5 3 2
  assert (protectedCapital crossFamily == 45) "cross-family protected capital excludes unresolved reserve/count"
  assert (rawSurplus 60 crossFamily == 15) "cross-family EEV 60 yields raw surplus 15"
  assert (solvencyInvariant 45 crossFamily) "cross-family exact solvency boundary is accepted"
  assert (not (solvencyInvariant 44 crossFamily)) "cross-family EEV one below boundary is rejected"
  assert (rawSurplus 44 crossFamily == 0) "zero raw surplus alone does not determine solvency"
  assert (rawSurplus 75 crossFamily == 30) "positive-surplus vector is computed from the same protected capital"
  assert (not (solvencyInvariant 60 (state 10 2 1 (negate 1) 5 5 3 2))) "negative exposure fails solvency despite positive clamped raw surplus"
  assert (rawSurplus 60 (state 10 7 2 (negate 1) 5 5 3 2) == 36) "raw surplus clamp is distinct from non-negative-state validation"
  assert (not (solvencyInvariant 49 (state 10 2 1 20 5 5 8 2))) "increased mandatory future costs raise the solvency boundary"
  assert (protectedCapital (state 10 7 2 20 5 5 8 2) == 50) "future-cost sensitivity changes protected capital from 45 to 50"
  putStrLn "ALL UNIVERSAL ECONOMIC KERNEL TESTS PASSED"
