{-# LANGUAGE NoImplicitPrelude #-}

module Main where

import Prelude
  ( Bool (False, True)
  , IO
  , Maybe (Just, Nothing)
  , String
  , error
  , putStrLn
  )

import EconomicProfile
import EconomicStateV3
import PreRichEconomicProfile
import PreRichEconomicProjection
import qualified UniversalEconomicKernel as UniversalKernel

profile :: EconomicProfile
profile = preRichEconomicProfileV1

assert :: Bool -> String -> IO ()
assert condition label =
  if condition then putStrLn ("PASS: " ++ label) else error ("FAIL: " ++ label)

validState :: V3EconomicState
validState =
  V3EconomicState
    250 5 3 17 19 23
    [ TicketClassState 0 2 1 1 10 True
    , TicketClassState 1 3 2 4 20 True
    ]
    (EconomicControlState 1 1)
    (JackpotState 0 98000 JackpotInactive 0)

main :: IO ()
main = do
  assert
    (projectionBoundaryEquivalent profile 4000 validState)
    "valid multi-class state preserves V3 and Universal protected-capital boundary"

  case projectPreRichState profile validState of
    Nothing -> error "FAIL: valid state projection rejected"
    Just projected -> do
      assert (UniversalKernel.protectedCapital projected == 2_809) "projected ProtectedCapital counts liabilities, exposure and protected components once"
      assert (UniversalKernel.rawSurplus 4000 projected == 1_191) "projected RawSurplus matches exact universal formula"

  assert
    (case projectPreRichState profile (validState { v3UnresolvedReserve = 6 }) of
       Nothing -> True
       Just _ -> False)
    "aggregate unresolved reserve mismatch fails closed"

  assert
    (case projectPreRichState profile (validState { v3UnresolvedTicketCount = 2 }) of
       Nothing -> True
       Just _ -> False)
    "aggregate unresolved count mismatch fails closed"

  assert
    (case projectPreRichState profile
      (validState { v3Classes = [TicketClassState 0 2 1 1 10 True, TicketClassState 0 1 1 1 10 True] })) of
       Nothing -> True
       Just _ -> False)
    "duplicate class state fails closed"

  assert
    (case projectPreRichState profile
      (validState { v3Classes = [TicketClassState 99 0 0 0 0 True] })) of
       Nothing -> True
       Just _ -> False)
    "unknown class state fails closed"

  assert
    (case projectPreRichState profile
      (validState { v3Classes = [TicketClassState 0 2 1 2 10 True, TicketClassState 1 3 2 4 20 True] })) of
       Nothing -> True
       Just _ -> False)
    "stored class exposure that differs from price × unresolved fails closed"

  assert
    (case projectPreRichState profile
      (validState { v3SafetyCapital = -1 })) of
       Nothing -> True
       Just _ -> False)
    "negative SafetyCapital fails closed"

  assert
    (case projectPreRichState profile
      (validState { v3ReserveProtection = -1 })) of
       Nothing -> True
       Just _ -> False)
    "negative ReserveProtection fails closed"

  assert
    (case projectPreRichState profile
      (validState { v3MandatoryFutureCosts = -1 })) of
       Nothing -> True
       Just _ -> False)
    "negative MandatoryFutureCosts fails closed"

  assert
    (case projectPreRichState profile
      (validState { v3CrystallizedLiabilities = -1 })) of
       Nothing -> True
       Just _ -> False)
    "negative crystallised liability fails closed"

  putStrLn "ALL V3/UNIVERSAL PROJECTION CONFORMANCE TESTS PASSED"