{-# LANGUAGE NoImplicitPrelude #-}

module Main where

import Prelude (Bool(..), IO, Maybe (Just), String, error, putStrLn, (==), (++))
import PreRichGenesisAdmission

assert :: Bool -> String -> IO ()
assert condition label =
  if condition then putStrLn ("PASS: " ++ label) else error ("FAIL: " ++ label)

base :: GenesisTreasuryObservation
base = GenesisTreasuryObservation
  True True True True True True
  4000 100 1

main :: IO ()
main = do
  assert (genesisTreasuryValueUsdm base == Just 400000) "4000 PRE at 100 subunits/PRE = 400000 USDM subunits"
  assert (genesisPredicate base == True) "exact 4000 USDM Genesis threshold admits"
  assert (genesisPredicate (base { gtoPreQuantity = 3999 }) == False) "below threshold rejects"
  let fractionalObservation =
        base
          { gtoPreQuantity = 3999999
          , gtoVerifiedPreUsdmPrice = 100000
          , gtoOraclePrecision = 1000000
          }
  assert (genesisTreasuryValueUsdm fractionalObservation == Just 399999) "fractional subunit value floors below threshold"
  assert (genesisPredicate fractionalObservation == False) "fractional sub-threshold value cannot round upward into Genesis"
  assert (genesisPredicate (base { gtoOracleFresh = False }) == False) "stale oracle rejects"
  assert (genesisPredicate (base { gtoTreasuryIdentityVerified = False }) == False) "wrong Treasury rejects"
  assert (genesisPredicate (base { gtoSourceRegimePreGenesis = False }) == False) "wrong source regime rejects"
  putStrLn "ALL GENESIS ADMISSION TESTS PASSED"
