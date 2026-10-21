{-# LANGUAGE NumericUnderscores #-}

module Main where

import Prelude

import PythAdaUsdConversion (pythAdaUsdToUsdmSubunitsCandidate)

assert :: Bool -> String -> IO ()
assert condition label =
  if condition then putStrLn ("PASS: " ++ label)
  else error ("FAIL: " ++ label)

convert :: Integer -> Integer -> Integer -> Integer -> Integer -> Integer -> Maybe Integer
convert = pythAdaUsdToUsdmSubunitsCandidate

main :: IO ()
main = do
  assert
    (convert 100_000_000 (-8) 1_000_000 1 1 18 == Just 100)
    "synthetic D=1/1 vector matches Aiken candidate"

  assert
    (convert 69_508_700 (-8) 1_438_000 1 1 18 == Just 100)
    "retains raw price/exponent until final ceiling division"

  assert
    (convert 100_000_000 (-8) 1_000_000 2 1 18 == Just 50)
    "does not hardcode USD/USDM parity (synthetic D=2/1)"

  assert
    (convert 100_000_000 (-8) 1_000_000 3 2 18 == Just 67)
    "supports an explicit fractional USD/USDM ratio"

  assert
    (convert 7 0 1_000_000 1 1 18 == Just 700)
    "supports a non-negative exponent without floating point"

  assert
    (convert 100_000_000 (-8) 0 1 1 18 == Just 0)
    "zero economic quantity returns zero"

  assert
    (convert 100_000_000 (-19) 1_000_000 1 1 18 == Nothing)
    "rejects exponent outside the explicitly supplied bound"

  assert
    (convert 100_000_000 (-8) (-1) 1 1 18 == Nothing)
    "rejects negative economic quantity"

  assert
    (convert 100_000_000 (-8) 1_000_000 0 1 18 == Nothing)
    "rejects missing/zero USD-per-USDM numerator"

  assert
    (convert 100_000_000 (-8) 1_000_000 1 0 18 == Nothing)
    "rejects missing/zero USD-per-USDM denominator"

  assert
    (convert 0 (-8) 1_000_000 1 1 18 == Nothing)
    "rejects non-positive raw price"

  assert
    (convert 100_000_000 (-8) 1_000_000 1 1 (-1) == Nothing)
    "rejects invalid exponent bound"

  putStrLn "ALL PYTH ADA/USD CONVERSION CANDIDATE TESTS PASSED"
