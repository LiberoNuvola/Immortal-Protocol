{-# LANGUAGE NoImplicitPrelude #-}

module Main where

import Prelude (Bool(..), IO, String, error, putStrLn, (==), (++))
import PreRichGenesisAdmission
  ( GenesisTreasuryObservation (..)
  )
import PreRichRegimeState
  ( PreRichRegime (..)
  , PreRichRegimeState (..)
  , genesisState
  , preGenesisState
  , preGenesisToGenesis
  )

assert :: Bool -> String -> IO ()
assert condition label =
  if condition
    then putStrLn ("PASS: " ++ label)
    else error ("FAIL: " ++ label)

validObservation :: GenesisTreasuryObservation
validObservation =
  GenesisTreasuryObservation
    True True True True True True
    400000 1 1

belowThresholdObservation :: GenesisTreasuryObservation
belowThresholdObservation =
  GenesisTreasuryObservation
    True True True True True True
    399999 1 1

wrongSourceObservation :: GenesisTreasuryObservation
wrongSourceObservation =
  GenesisTreasuryObservation
    True False True True True True
    400000 1 1

main :: IO ()
main = do
  let accepted = preGenesisToGenesis preGenesisState validObservation
      rejectedBelow = preGenesisToGenesis preGenesisState belowThresholdObservation
      rejectedSource = preGenesisToGenesis preGenesisState wrongSourceObservation
      rejectedReplay = preGenesisToGenesis genesisState validObservation
      malformed = PreRichRegimeState Active

  assert
    (case accepted of
       Just state ->
         case prrsRegime state of
           Genesis -> True
           _ -> False
       Nothing -> False)
    "verified PRE-GENESIS predicate produces Genesis state"

  assert
    (rejectedBelow == Nothing)
    "below-threshold observation fails closed"

  assert
    (rejectedSource == Nothing)
    "non-PRE-GENESIS observation fails closed"

  assert
    (rejectedReplay == Nothing)
    "Genesis cannot be transitioned through the same edge twice"

  assert
    (preGenesisToGenesis malformed validObservation == Nothing)
    "non-PRE-GENESIS carrier rejects the transition"

  putStrLn "ALL GENESIS REGIME CARRIER TESTS PASSED"
