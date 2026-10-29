{-# LANGUAGE NoImplicitPrelude #-}

module Main where

import Prelude
  ( Bool (False, True)
  , Maybe (Nothing, Just)
  , IO
  , String
  , error
  , putStrLn
  , length
  , (++)
  , (==)
  , (>=)
  )

import EconomicStateV3
import PreRichIssueDecision
  ( IssueDecision (..)
  , IssueDecisionInput (..)
  , produceIssueDecision
  , canonicalV3State
  , canonicalIssueAction
  )

baseState :: V3EconomicState
baseState =
  V3EconomicState
    0 0 0 0 0 0
    [TicketClassState 0 0 0 0 1 True]
    (EconomicControlState 0 0)
    (JackpotState 0 0 JackpotInactive 0)

unsaleableState :: V3EconomicState
unsaleableState =
  V3EconomicState
    0 0 0 0 0 0
    [TicketClassState 0 0 0 0 1 False]
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
  assert
    (canonicalV3State (baseState { v3Jackpot = JackpotState 2 3 JackpotInactive 4 })
      == "0|0|0|0|0|0|0|0|0|0|1|1|0|0|2|3|inactive|4")
    "canonical Jackpot inactive serialization"
  assert
    (canonicalV3State (baseState { v3Jackpot = JackpotState 2 3 JackpotLocked 4 })
      == "0|0|0|0|0|0|0|0|0|0|1|1|0|0|2|3|locked|4")
    "canonical Jackpot locked serialization"
  assert
    (canonicalV3State (baseState { v3Jackpot = JackpotState 2 3 JackpotPayable 4 })
      == "0|0|0|0|0|0|0|0|0|0|1|1|0|0|2|3|payable|4")
    "canonical Jackpot payable serialization"
  assert
    (canonicalV3State (baseState { v3Jackpot = JackpotState 2 3 JackpotClosed 4 })
      == "0|0|0|0|0|0|0|0|0|0|1|1|0|0|2|3|closed|4")
    "canonical Jackpot closed serialization"
  assert
    (canonicalV3State
      (baseState
        { v3Classes =
            [ TicketClassState 0 0 0 0 1 True
            , TicketClassState 1 2 3 4 5 False
            ]
        })
      == "0|0|0|0|0|0|0|0|0|0|1|1|1|2|3|4|5|0|0|0|0|inactive|0")
    "canonical serialization preserves multiple class order and saleability"

  case produceIssueDecision input of
    Nothing -> error "FAIL: valid authoritative Issue decision was rejected"
    Just decision -> do
      assert (idPreEEV decision == 500) "producer preserves authoritative pre-EEV"
      assert (canonicalV3State (idPreState decision) == canonicalV3State baseState) "producer retains exact pre-state for provenance"
      assert
        (canonicalV3State baseState == "0|0|0|0|0|0|0|0|0|0|1|1|0|0|0|0|inactive|0")
        "canonical V3 pre-state serialization golden string"
      assert
        (canonicalIssueAction (idAction decision) == "Issue|0|1")
        "canonical Issue action serialization golden string"
      assert (idCandidateEEV decision == 500) "producer preserves authoritative candidate EEV"
      assert (idAvailableExecutableLiquidity decision == 500) "producer preserves executable liquidity"
      assert (idDecisionReference decision == "decision:issue:test") "decision reference is carried"
      assert (idObservationReference decision == "observation:issue:test") "observation reference is carried"
      assert (length (idPreStateHash decision) == 64) "pre-state hash is SHA-256"
      assert
        (idPreStateHash decision == "f4023fbcd4876200c00daa2c947b0836aa7b25b81b4113c61d034214b6c4e42d")
        "pre-state SHA-256 golden vector"
      assert (length (idPostStateHash decision) == 64) "post-state hash is SHA-256"
      assert (length (idActionFingerprint decision) == 64) "action fingerprint is SHA-256"
      putStrLn ("ISSUE_VECTOR_PRE_STATE_CANONICAL=" ++ canonicalV3State (idPreState decision))
      putStrLn ("ISSUE_VECTOR_PRE_STATE_SHA256=" ++ idPreStateHash decision)
      putStrLn ("ISSUE_VECTOR_CANDIDATE_STATE_CANONICAL=" ++ canonicalV3State (idCandidateState decision))
      putStrLn ("ISSUE_VECTOR_POST_STATE_SHA256=" ++ idPostStateHash decision)
      putStrLn ("ISSUE_VECTOR_ACTION_CANONICAL=" ++ canonicalIssueAction (idAction decision))
      putStrLn ("ISSUE_VECTOR_ACTION_HASH_PREIMAGE=" ++ canonicalIssueAction (idAction decision) ++ "|" ++ idPreStateHash decision ++ "|" ++ idPostStateHash decision)
      putStrLn ("ISSUE_VECTOR_ACTION_FINGERPRINT=" ++ idActionFingerprint decision)

  case produceIssueDecision (input { idiTruthVerified = False }) of
    Nothing -> putStrLn "PASS: unverified authority is rejected"
    Just _ -> error "FAIL: unverified authority was admitted"

  case produceIssueDecision (input { idiAvailableExecutableLiquidity = 0, idiRequiredImmediateLiquidity = 1 }) of
    Nothing -> putStrLn "PASS: insufficient executable liquidity is rejected"
    Just _ -> error "FAIL: insufficient executable liquidity was admitted"

  case produceIssueDecision (input { idiPreState = unsaleableState }) of
    Nothing -> putStrLn "PASS: explicitly non-saleable class is rejected"
    Just _ -> error "FAIL: explicitly non-saleable class was admitted"

  putStrLn "ALL AUTHORITATIVE ISSUE DECISION TESTS PASSED"
