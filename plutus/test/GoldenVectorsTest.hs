module Main where

import Control.Exception (SomeException, evaluate, try)
import System.Exit (exitFailure)

import GoldenVectors
  ( vectorClaim
  , vectorExpire
  , vectorIssue
  , vectorReveal
  )

data Case = Case
  { caseName :: String
  , caseResult :: Bool
  }

main :: IO ()
main = do
  outcomes <- traverse runCase cases
  if and outcomes then pure () else exitFailure

runCase :: Case -> IO Bool
runCase testCase = do
  result <- try (evaluate (caseResult testCase)) :: IO (Either SomeException Bool)
  let passed = result == Right True
  putStrLn ((if passed then "PASS " else "FAIL ") <> caseName testCase)
  pure passed

cases :: [Case]
cases =
  [ Case "V3 issue golden vector" vectorIssue
  , Case "V3 reveal golden vector" vectorReveal
  , Case "V3 expiry golden vector" vectorExpire
  , Case "V3 claim golden vector" vectorClaim
  ]
