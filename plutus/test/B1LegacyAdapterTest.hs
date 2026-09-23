{-# LANGUAGE NoImplicitPrelude #-}

module Main where

import Prelude
  ( Bool (False, True)
  , IO
  , String
  , error
  , putStrLn
  , (&&)
  , (==)
  , Either (Left, Right)
  )

import PlutusLedgerApi.V2 (ScriptHash)
import PlutusTx.Prelude (BuiltinByteString, emptyByteString)

import B1LegacyAdapter
import EconomicStateV3
import qualified EconomicKernel
import PreRichEconomicProfile
import qualified UniversalEconomicKernel
import Types
import qualified UniversalEconomicState

assert :: Bool -> String -> IO ()
assert condition label =
  if condition then putStrLn ("PASS: " ++ label) else error ("FAIL: " ++ label)

dummyHash :: ScriptHash
dummyHash = ScriptHash emptyByteString

zeroState :: V3EconomicState
zeroState = zeroV3EconomicState

representableState :: V3EconomicState
representableState = zeroState

classfulState :: V3EconomicState
classfulState =
  zeroState
    { v3Classes =
        [ TicketClassState 0 1 1 1 10 True ]
    }

protectedState :: V3EconomicState
protectedState =
  zeroState
    { v3SafetyCapital = 1 }

historicalState :: V3EconomicState
historicalState =
  zeroState
    { v3Control = EconomicControlState 1 1 }

jackpotState :: V3EconomicState
jackpotState =
  zeroState
    { v3Jackpot = JackpotState 1 10 JackpotLocked 1 }

main :: IO ()
main = do
  assert
    (legacyProjectionIsLossless representableState)
    "zero/empty V3 state is lossless through legacy representation"

  assert
    (not (legacyProjectionIsLossless classfulState))
    "class composition is explicitly classified as lossy"

  case v3ToLegacyB1 100 dummyHash classfulState of
    Left V3ContainsUnsupportedClassComposition ->
      putStrLn "PASS: V3 class composition fails closed in legacy projection"
    _ ->
      error "FAIL: class composition was silently projected to legacy B1"

  assert
    (not (legacyProjectionIsLossless protectedState))
    "unsupported ProtectedCapital is explicitly classified as lossy"

  case v3ToLegacyB1 100 dummyHash protectedState of
    Left V3ContainsUnsupportedProtectedCapital ->
      putStrLn "PASS: unsupported ProtectedCapital fails closed in legacy projection"
    _ ->
      error "FAIL: unsupported ProtectedCapital was silently projected"

  assert
    (not (legacyProjectionIsLossless historicalState))
    "non-zero historical class state is explicitly classified as lossy"

  assert
    (not (legacyProjectionIsLossless jackpotState))
    "locked Jackpot state is explicitly classified as lossy"

  case v3ToLegacyB1 100 dummyHash jackpotState of
    Left V3ContainsUnsupportedJackpotState ->
      putStrLn "PASS: locked Jackpot fails closed in legacy projection"
    _ ->
      error "FAIL: locked Jackpot was silently projected to legacy B1"

  case v3ToLegacyB1 100 dummyHash historicalState of
    Left LegacyMissingHistoricalControl ->
      putStrLn "PASS: historical control loss fails closed in legacy projection"
    _ ->
      error "FAIL: historical control was silently projected"

  let universalAggregate =
        legacyB1ToUniversalEconomicState
          preRichEconomicProfileV1
          (B1PrizePoolDatum 1000 7 4 2 9 10 0 dummyHash)
  let aggregateComparableState =
        V3EconomicState
          7 5 3 0 0 0
          [ TicketClassState 0 2 2 2 10 True
          , TicketClassState 2 1 1 3 10 True
          ]
          (EconomicControlState 0 0)
          (JackpotState 9 10 JackpotLocked 0)

  let universalComparable =
        legacyB1ToUniversalEconomicState
          preRichEconomicProfileV1
          (B1PrizePoolDatum 1000 7 5 3 9 10 0 dummyHash)

  assert
    (EconomicKernel.protectedCapital
       preRichEconomicProfileV1
       aggregateComparableState
       == UniversalEconomicKernel.protectedCapital universalComparable)
    "legacy aggregate preserves the representable ProtectedCapital boundary"

  assert
    (UniversalEconomicState.uesCrystallizedLiabilities universalAggregate == 7)
    "legacy B1 liabilities map directly to universal aggregate"
  assert
    (UniversalEconomicState.uesUnresolvedReserve universalAggregate == 4)
    "legacy B1 unresolved reserve maps directly to universal aggregate"
  assert
    (UniversalEconomicState.uesUnresolvedTicketCount universalAggregate == 2)
    "legacy B1 unresolved count maps directly to universal aggregate"
  assert
    (UniversalEconomicState.uesWorstCaseExposure universalAggregate == 2000)
    "legacy B1 derives exact PRE-RICH 500x aggregate exposure"
  assert
    (UniversalEconomicState.uesAdditionalProtectedCapital universalAggregate == 9)
    "legacy B1 locked Jackpot maps to additional protected capital"

  case legacyB1ToV3
    (B1PrizePoolDatum 100 0 0 0 0 10 0 dummyHash) of
    Right projected ->
      assert
        (legacyProjectionIsLossless projected)
        "empty legacy pool projects to a lossless V3 state"
    Left _ ->
      error "FAIL: empty legacy pool should project"

  case legacyB1ToV3
    (B1PrizePoolDatum 100 0 1 1 0 10 0 dummyHash) of
    Left LegacyHasUnresolvedTickets ->
      putStrLn "PASS: unresolved legacy tickets fail closed"
    _ ->
      error "FAIL: unresolved legacy tickets were accepted"

  case legacyB1ToV3
    (B1PrizePoolDatum 100 0 0 0 1 10 0 dummyHash) of
    Left LegacyMissingJackpotLifecycle ->
      putStrLn "PASS: legacy locked Jackpot fails closed"
    _ ->
      error "FAIL: legacy locked Jackpot was accepted"

  putStrLn "ALL LEGACY ADAPTER CONFORMANCE TESTS PASSED"