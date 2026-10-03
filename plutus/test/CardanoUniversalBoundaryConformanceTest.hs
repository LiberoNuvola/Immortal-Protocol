module Main where

import Prelude
  ( Bool (False, True)
  , IO
  , Integer
  , String
  , (++)
  , (==)
  , (+)
  , error
  , putStrLn
  , not
  )

import EconomicStateV3
import PreRichEconomicProfile
import PreRichEconomicProjection
import UniversalEconomicState
import qualified UniversalEconomicKernel as UniversalKernel

profile = preRichEconomicProfileV1

assert :: Bool -> String -> IO ()
assert condition label =
  if condition
    then putStrLn ("PASS: " ++ label)
    else error ("FAIL: " ++ label)

classesWith :: Integer -> [TicketClassState]
classesWith unresolved0 =
  [ TicketClassState 0 unresolved0 unresolved0 (unresolved0) 20000 True
  , TicketClassState 1 0 0 0 20000 True
  , TicketClassState 2 0 0 0 20000 True
  , TicketClassState 3 0 0 0 20000 True
  , TicketClassState 4 0 0 0 20000 True
  , TicketClassState 5 0 0 0 20000 True
  , TicketClassState 6 0 0 0 20000 True
  , TicketClassState 7 0 0 0 20000 True
  ]

-- Cardano's observation layer emits the canonical V3 representation. This
-- fixture mirrors that representation; no Cardano-specific economics are
-- introduced here.
stateFor
  :: Integer
  -> Integer
  -> Integer
  -> Integer
  -> Integer
  -> V3EconomicState
stateFor liabilities unresolved safety reserveProtection futureCosts =
  V3EconomicState
    liabilities
    unresolved
    unresolved
    safety
    reserveProtection
    futureCosts
    (classesWith unresolved)
    (EconomicControlState 0 0)
    (JackpotState 0 10000 JackpotInactive 0)

project :: V3EconomicState -> UniversalEconomicState
project s =
  case projectPreRichState profile s of
    Nothing -> error "projection rejected canonical V3 fixture"
    Just u -> u

main :: IO ()
main = do
  let v01 = project (stateFor 0 1 200 0 0)
      v05 = project (stateFor 1000 12 500 500 500)
      v06 = project (stateFor 0 19 0 0 0)
      v07a = project (stateFor 0 4 0 0 0)
      v07b = project (stateFor 0 9 0 0 0)

  assert
    (UniversalKernel.protectedCapital v01 == 700)
    "Cardano V3 -> Universal preserves V01 decomposition"

  assert
    ( UniversalKernel.protectedCapital v05 == 8500
      && uesCrystallizedLiabilities v05 == 1000
      && uesWorstCaseExposure v05 == 6000
      && uesSafetyCapital v05 == 500
      && uesReserveProtection v05 == 500
      && uesMandatoryFutureCosts v05 == 500
      && uesAdditionalProtectedCapital v05 == 0
    )
    "Cardano V3 -> Universal preserves complete V05 decomposition"

  assert
    (UniversalKernel.protectedCapital v06 == 9500)
    "Cardano V3 -> Universal preserves V06 protected boundary"

  assert
    ( UniversalKernel.protectedCapital v07a == 2000
      && UniversalKernel.protectedCapital v07b == 4500
    )
    "Cardano V3 -> Universal preserves V07 locality"

  assert
    ( projectionBoundaryEquivalent profile 1000 (stateFor 0 1 500 0 0)
      && projectionBoundaryEquivalent profile 900 (stateFor 0 1 500 0 0)
      && not (UniversalKernel.solvencyInvariant 900 v01)
    )
    "Universal bridge preserves the V3 solvency predicate without Cardano-side economic interpretation"

  putStrLn "ALL CARDANO V3 -> UNIVERSAL BOUNDARY TESTS PASSED"
