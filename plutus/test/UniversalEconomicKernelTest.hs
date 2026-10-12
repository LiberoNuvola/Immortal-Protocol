module Main where

import Prelude
  ( IO, Bool (..), Integer, String, putStrLn, error, (==), (>=), (&&), not, (++), show )
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
  assert (not (solvencyInvariant (-1) s)) "negative EEV is rejected"
  assert (not (nonNegativeState (state 10 (-1) 2 20 3 4 5 6))) "negative unresolved reserve is rejected"
  assert (not (nonNegativeState (state 10 7 (-1) 20 3 4 5 6))) "negative unresolved count is rejected"
  assert (not (nonNegativeState (state 10 7 2 (-1) 3 4 5 6))) "negative worst-case exposure is rejected"
  assert (not (nonNegativeState (state 10 7 2 20 3 4 5 (-1)))) "negative additional protected capital is rejected"
  putStrLn "ALL UNIVERSAL ECONOMIC KERNEL TESTS PASSED"
