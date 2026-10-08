{-# LANGUAGE OverloadedStrings #-}

module Main where

import Prelude
  ( Bool (False, True)
  , IO
  , String
  , error
  , putStrLn
  , (&&)
  , (==)
  )

import PreRichControlCarrier
  ( PreRichControlAction (..)
  , PreRichControlDatum (..)
  , actionValid
  , datumValid
  )

assert :: Bool -> String -> IO ()
assert condition label =
  if condition
    then putStrLn ("PASS: " ++ label)
    else error ("FAIL: " ++ label)

baseDatum :: PreRichControlDatum
baseDatum =
  PreRichControlDatum
    { prcdCurrentActiveClass = 0
    , prcdHighestClassEverActivated = 0
    , prcdStateVersion = 0
    , prcdTransitionNonce = 0
    , prcdControlPolicy = "policy"
    , prcdControlTokenName = "control"
    }

main :: IO ()
main = do
  assert
    (datumValid "policy" "control" baseDatum)
    "canonical initial control datum is valid"

  assert
    (not (datumValid "wrong-policy" "control" baseDatum))
    "wrong control policy is rejected"

  assert
    (not (datumValid "policy" "wrong-token" baseDatum))
    "wrong control token-name is rejected"

  assert
    (datumValid
      "policy"
      "control"
      (baseDatum
        { prcdCurrentActiveClass = 2
        , prcdHighestClassEverActivated = 4
        }))
    "current class may not exceed historical highest"

  assert
    (not (datumValid
      "policy"
      "control"
      (baseDatum
        { prcdCurrentActiveClass = 5
        , prcdHighestClassEverActivated = 4
        })))
    "current class above highest is rejected"

  let activated =
        baseDatum
          { prcdCurrentActiveClass = 1
          , prcdHighestClassEverActivated = 1
          }
  assert
    (actionValid
      baseDatum
      activated
      (ActivateControl 1 1 "decision:activate" "observation:activate"))
    "activation is monotonic and fully bound to output state"

  let highestDropped =
        activated
          { prcdHighestClassEverActivated = 0
          }
  assert
    (not (actionValid
      activated
      highestDropped
      (ActivateControl 1 0 "decision:bad" "observation:bad")))
    "activation cannot decrease HighestClassEverActivated"

  let contracted =
        PreRichControlDatum
          { prcdCurrentActiveClass = 2
          , prcdHighestClassEverActivated = 5
          , prcdStateVersion = 8
          , prcdTransitionNonce = 11
          , prcdControlPolicy = "policy"
          , prcdControlTokenName = "control"
          }
  let contractedNext = contracted
        { prcdCurrentActiveClass = 1
        , prcdHighestClassEverActivated = 5
        }
  assert
    (actionValid
      contracted
      contractedNext
      (ContractControl 1 "decision:contract" "observation:contract"))
    "contraction preserves historical highest class"

  let contractedIncrease =
        contracted
          { prcdCurrentActiveClass = 3
          }
  assert
    (not (actionValid
      contracted
      contractedIncrease
      (ContractControl 3 "decision:bad" "observation:bad")))
    "contraction cannot increase current class"

  let contractedHighestChanged =
        contractedNext
          { prcdHighestClassEverActivated = 4
          }
  assert
    (not (actionValid
      contracted
      contractedHighestChanged
      (ContractControl 1 "decision:bad" "observation:bad")))
    "contraction cannot erase historical highest class"

  assert
    (not (actionValid
      contracted
      contractedNext
      (ContractControl 1 "" "observation:contract")))
    "control transitions require a decision reference"

  assert
    (not (actionValid
      contracted
      contractedNext
      (ContractControl 1 "decision:contract" "")))
    "control transitions require an observation reference"

  putStrLn "ALL B2 CONTROL PURE CONFORMANCE TESTS PASSED"
