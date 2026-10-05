{-# LANGUAGE NoImplicitPrelude #-}

module Main where

import Prelude (Bool(..), IO, String, error, putStrLn, (++))
import PreRichLifecycleTransition
  ( LifecycleOmegaWitness (..)
  , PreRichLifecycleAction (..)
  , PreRichLifecycleState (..)
  , activeLifecycleState
  , lifecycleActionAvailable
  , lifecycleTransition
  , qneAcrossOmega
  , qneWitnessHolds
  , quiescentLifecycleState
  )
import PreRichRegimeState (PreRichRegime (..))

assert :: Bool -> String -> IO ()
assert condition label =
  if condition
    then putStrLn ("PASS: " ++ label)
    else error ("FAIL: " ++ label)

main :: IO ()
main = do
  let active = activeLifecycleState 7
      entered = lifecycleTransition active EnterQuiescent
      quiescent = quiescentLifecycleState 8
      maintained = lifecycleTransition quiescent MaintainQuiescent
      invalidEnter = lifecycleTransition quiescent EnterQuiescent
      invalidMaintain = lifecycleTransition active MaintainQuiescent

  assert
    (case entered of
       Just state ->
         plsRegime state == Quiescent
         && plsTransitionNonce state == 8
       Nothing -> False)
    "ACTIVE -> QUIESCENT is a real lifecycle transition"

  assert
    (case maintained of
       Just state ->
         plsRegime state == Quiescent
         && plsTransitionNonce state == 9
       Nothing -> False)
    "QUIESCENT maintenance advances lifecycle nonce"

  assert
    (invalidEnter == Nothing)
    "EnterQuiescent is not replayable from QUIESCENT"

  assert
    (invalidMaintain == Nothing)
    "MaintainQuiescent is not available from ACTIVE"

  let nonEroding =
        LifecycleOmegaWitness
          { lowPostEEV = 120
          , lowPostProtectedCapital = 100
          , lowRepresentationPreserved = True
          , lowSafe = True
          }
      adverseEEV =
        LifecycleOmegaWitness
          { lowPostEEV = 90
          , lowPostProtectedCapital = 100
          , lowRepresentationPreserved = True
          , lowSafe = False
          }
      representationLost =
        LifecycleOmegaWitness
          { lowPostEEV = 120
          , lowPostProtectedCapital = 100
          , lowRepresentationPreserved = False
          , lowSafe = True
          }

  assert
    (qneWitnessHolds 110 100 nonEroding)
    "QNE accepts a successor whose buffer is larger without assuming constant EEV"

  assert
    (not (qneWitnessHolds 110 100 adverseEEV))
    "QNE rejects an adverse EEV shock"

  assert
    (not (qneWitnessHolds 110 100 representationLost))
    "QNE rejects loss of represented obligations"

  assert
    (qneAcrossOmega
      quiescent
      MaintainQuiescent
      110
      100
      [nonEroding])
    "QNE accepts a non-empty explicit Omega envelope"

  assert
    (not (qneAcrossOmega
      quiescent
      MaintainQuiescent
      110
      100
      [nonEroding, adverseEEV]))
    "QNE fails closed when any Omega successor erodes the buffer"

  assert
    (not (qneAcrossOmega
      quiescent
      MaintainQuiescent
      110
      100
      []))
    "empty Omega envelope cannot certify QNE"

  assert
    (lifecycleActionAvailable quiescent MaintainQuiescent)
    "quiescent maintenance is an actual available action"

  putStrLn "ALL PRE-RICH LIFECYCLE/QNE TESTS PASSED"
