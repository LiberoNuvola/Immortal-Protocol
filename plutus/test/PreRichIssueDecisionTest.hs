{-# LANGUAGE NoImplicitPrelude #-}

module Main where

import Prelude
  ( Bool (False, True)
  , IO
  , String
  , error
  , putStrLn
  , length
  , (==)
  , (>=)
  )

import EconomicStateV3
import PreRichIssueDecision

baseState :: V3EconomicState
baseState =
  V3EconomicState
    0 0 0 0 0 0
    [TicketClassState 0 0 0 0 1 True]
    (EconomicControlState 0 0)
    (JackpotState 0 0 JackpotInactive 0)

input :: IssueDecisionInput
input =
  IssueDecisionInput
    { idiPreState = baseState
    , idiClass = 0
    , idiPrice = 1
    , idiPreEEV = 500
    , idiCandidateEEV = 500
    , idiAvailableExecutableLiquidity = 500
    , idiRequiredImmediateLiquidity = 0
    , idiTruthVerified = True
    , idiEEVFresh = True
    , idiObligationsComplete = True
    , idiAllOmegaSuccessorsCertified = True
    , idiDecisionReference = "decision:issue:test"
    , idiObservationReference = "observation:issue:test"
    }

assert :: Bool -> String -> IO ()
assert condition label =
  if condition
    then putStrLn ("PASS: " ++ label)
    else error ("FAIL: " ++ label)

main :: IO ()
main = do
  case produceIssueDecision input of
    Nothing -> error "FAIL: valid authoritative Issue decision was rejected"
    Just decision -> do
      assert (idPreEEV decision == 500) "producer preserves authoritative pre-EEV"
      assert (idCandidateEEV decision == 500) "producer preserves authoritative candidate EEV"
      assert (idAvailableExecutableLiquidity decision == 500) "producer preserves executable liquidity"
      assert (idDecisionReference decision == "decision:issue:test") "decision reference is carried"
      assert (idObservationReference decision == "observation:issue:test") "observation reference is carried"
      assert (length (idPreStateHash decision) == 64) "pre-state hash is SHA-256"
      assert (length (idPostStateHash decision) == 64) "post-state hash is SHA-256"
      assert (length (idActionFingerprint decision) == 64) "action fingerprint is SHA-256"

  case produceIssueDecision (input { idiTruthVerified = False }) of
    Nothing -> putStrLn "PASS: unverified authority is rejected"
    Just _ -> error "FAIL: unverified authority was admitted"

  case produceIssueDecision (input { idiAvailableExecutableLiquidity = 0, idiRequiredImmediateLiquidity = 1 }) of
    Nothing -> putStrLn "PASS: insufficient executable liquidity is rejected"
    Just _ -> error "FAIL: insufficient executable liquidity was admitted"

  putStrLn "ALL AUTHORITATIVE ISSUE DECISION TESTS PASSED"
