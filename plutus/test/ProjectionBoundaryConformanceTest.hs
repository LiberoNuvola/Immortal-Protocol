{-# LANGUAGE NoImplicitPrelude #-}

module Main where

import Prelude
  ( Bool (False, True)
  , IO
  , Maybe (Just, Nothing)
  , String
  , (++)
  , (==)
  , error
  , putStrLn
  )

import EconomicProfile
import EconomicStateV3
import EconomicTransitionV3 (V3Action (..), transition)
import PreRichEconomicProfile
import PreRichEconomicProjection
import UniversalEconomicState (UniversalEconomicState (..))
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

project :: V3EconomicState -> UniversalEconomicState
project s =
  case projectPreRichState profile s of
    Nothing -> error "FAIL: valid transition result failed PRE-RICH -> Universal projection"
    Just projected -> projected

main :: IO ()
main = do
  assert
    (projectionBoundaryEquivalent profile 4000 validState)
    "valid multi-class state preserves V3 and Universal protected-capital boundary"

  case projectPreRichState profile validState of
    Nothing -> error "FAIL: valid state projection rejected"
    Just projected -> do
      assert (UniversalKernel.protectedCapital projected == 2809) "projected ProtectedCapital counts liabilities, exposure and protected components once"
      assert (UniversalKernel.rawSurplus 4000 projected == 1191) "projected RawSurplus matches exact universal formula"

  -- Transition-level differential evidence:
  -- PRE-RICH V3 may contain classes/control/Jackpot, but the universal boundary
  -- must observe exactly the canonical economic delta and must not invent a
  -- second economic rule.
  case transition profile validState (Issue 1 2) of
    Nothing -> error "FAIL: canonical Issue transition rejected"
    Just post -> do
      let before = project validState
          after = project post
      assert
        (uesCrystallizedLiabilities after == uesCrystallizedLiabilities before)
        "Issue preserves crystallized liabilities at the universal boundary"
      assert
        (uesUnresolvedReserve after == uesUnresolvedReserve before + 2)
        "Issue adds exactly the canonical ticket reserve"
      assert
        (uesUnresolvedTicketCount after == uesUnresolvedTicketCount before + 1)
        "Issue adds exactly one unresolved obligation"
      assert
        (uesWorstCaseExposure after == uesWorstCaseExposure before + 1000)
        "Issue adds exactly 500x price to worst-case exposure"
      assert
        (UniversalKernel.protectedCapital after == UniversalKernel.protectedCapital before + 1000)
        "Issue changes universal ProtectedCapital by exactly the PRE-RICH profile payout bound"
      assert
        (uesSafetyCapital after == uesSafetyCapital before
          && uesReserveProtection after == uesReserveProtection before
          && uesMandatoryFutureCosts after == uesMandatoryFutureCosts before
          && uesAdditionalProtectedCapital after == uesAdditionalProtectedCapital before)
        "Issue does not mutate unrelated universal protected-capital components"

  case transition profile validState (Reveal 1 1000) of
    Nothing -> error "FAIL: canonical Reveal transition rejected"
    Just post -> do
      let before = project validState
          after = project post
      assert
        (uesCrystallizedLiabilities after == uesCrystallizedLiabilities before + 1000)
        "Reveal crystallizes exactly the committed payout"
      assert
        (uesUnresolvedReserve after == uesUnresolvedReserve before - 2)
        "Reveal releases exactly the ticket reserve"
      assert
        (uesUnresolvedTicketCount after == uesUnresolvedTicketCount before - 1)
        "Reveal consumes exactly one unresolved obligation"
      assert
        (uesWorstCaseExposure after == uesWorstCaseExposure before - 1000)
        "Reveal removes exactly the profile worst-case exposure"
      assert
        (UniversalKernel.protectedCapital after == UniversalKernel.protectedCapital before - 1000)
        "Reveal changes universal ProtectedCapital by payout minus 500x exposure"
      assert
        (UniversalKernel.rawSurplus 4000 after == UniversalKernel.rawSurplus 4000 before + 1000)
        "Reveal produces the same RawSurplus delta at the universal boundary"

  case transition profile (validState { v3CrystallizedLiabilities = 1250 }) (Claim 1000) of
    Nothing -> error "FAIL: canonical Claim transition rejected"
    Just post -> do
      let before = project (validState { v3CrystallizedLiabilities = 1250 })
          after = project post
      assert
        (uesCrystallizedLiabilities after == uesCrystallizedLiabilities before - 1000)
        "Claim removes exactly the frozen liability"
      assert
        (UniversalKernel.protectedCapital after == UniversalKernel.protectedCapital before - 1000)
        "Claim changes universal ProtectedCapital by exactly the settled liability"
      assert
        (uesUnresolvedReserve after == uesUnresolvedReserve before
          && uesUnresolvedTicketCount after == uesUnresolvedTicketCount before
          && uesWorstCaseExposure after == uesWorstCaseExposure before)
        "Claim does not rewrite unresolved obligations or exposure"

  case transition profile validState (Expire 1) of
    Nothing -> error "FAIL: canonical Expire transition rejected"
    Just post -> do
      let before = project validState
          after = project post
      assert
        (uesCrystallizedLiabilities after == uesCrystallizedLiabilities before)
        "Expire preserves crystallized liabilities"
      assert
        (uesUnresolvedReserve after == uesUnresolvedReserve before - 2)
        "Expire releases exactly the ticket reserve"
      assert
        (uesUnresolvedTicketCount after == uesUnresolvedTicketCount before - 1)
        "Expire consumes exactly one unresolved obligation"
      assert
        (uesWorstCaseExposure after == uesWorstCaseExposure before - 1000)
        "Expire removes exactly the profile worst-case exposure"
      assert
        (UniversalKernel.protectedCapital after == UniversalKernel.protectedCapital before - 1000)
        "Expire changes universal ProtectedCapital by exactly the released exposure"

  let lockedJackpotState =
        validState
          { v3Jackpot = JackpotState 700 10000 JackpotLocked 1
          }

  case projectPreRichState profile lockedJackpotState of
    Nothing -> error "FAIL: locked-jackpot state projection rejected"
    Just projected -> do
      assert
        (uesAdditionalProtectedCapital projected == 700)
        "locked Jackpot liquidity projects into universal additional ProtectedCapital"
      assert
        (projectionBoundaryEquivalent profile 5000 lockedJackpotState)
        "locked Jackpot remains inside the same V3/Universal ProtectedCapital boundary"

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
      (validState { v3Classes = [TicketClassState 0 2 1 1 10 True, TicketClassState 0 1 1 1 10 True] }) of
       Nothing -> True
       Just _ -> False)
    "duplicate class state fails closed"

  assert
    (case projectPreRichState profile
      (validState { v3Classes = [TicketClassState 99 0 0 0 0 True] }) of
       Nothing -> True
       Just _ -> False)
    "unknown class state fails closed"

  assert
    (case projectPreRichState profile
      (validState { v3Classes = [TicketClassState 0 2 1 2 10 True, TicketClassState 1 3 2 4 20 True] }) of
       Nothing -> True
       Just _ -> False)
    "stored class exposure that differs from price × unresolved fails closed"

  assert
    (case projectPreRichState profile
      (validState { v3SafetyCapital = -1 }) of
       Nothing -> True
       Just _ -> False)
    "negative SafetyCapital fails closed"

  assert
    (case projectPreRichState profile
      (validState { v3ReserveProtection = -1 }) of
       Nothing -> True
       Just _ -> False)
    "negative ReserveProtection fails closed"

  assert
    (case projectPreRichState profile
      (validState { v3MandatoryFutureCosts = -1 }) of
       Nothing -> True
       Just _ -> False)
    "negative MandatoryFutureCosts fails closed"

  assert
    (case projectPreRichState profile
      (validState { v3CrystallizedLiabilities = -1 }) of
       Nothing -> True
       Just _ -> False)
    "negative crystallised liability fails closed"

  putStrLn "ALL V3/UNIVERSAL PROJECTION CONFORMANCE TESTS PASSED"
