{-# LANGUAGE NoImplicitPrelude #-}

module Main where

import Prelude
  ( Bool (False, True)
  , IO
  , String
  , error
  , putStrLn
  )

import qualified Data.ByteString.Char8 as BSC
import PlutusTx (toBuiltin)
import V3EconomicStateCarrier
  ( V3EconomicStateAction (..)
  , bindingEnvelopeValid
  )

bytes = toBuiltin . BSC.pack
hashA = bytes "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
hashB = bytes "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
hashC = bytes "cccccccccccccccccccccccccccccccc"

valid :: V3EconomicStateAction
valid =
  AdvanceV3State
    (bytes "Issue")
    (bytes "decision:issue:001")
    (bytes "observation:issue:001")
    hashA
    hashB
    hashC
    0
    1

assert :: Bool -> String -> IO ()
assert condition label =
  if condition
    then putStrLn ("PASS: " ++ label)
    else error ("FAIL: " ++ label)

main :: IO ()
main = do
  assert (bindingEnvelopeValid valid)
    "valid Issue decision envelope is accepted"

  assert
    (bindingEnvelopeValid
      (AdvanceV3State
        (bytes "Reveal")
        (bytes "decision:reveal:001")
        (bytes "observation:reveal:001")
        hashA
        hashB
        hashC
        0
        0))
    "Reveal envelope remains supported"

  assert
    (not (bindingEnvelopeValid
      (AdvanceV3State
        (bytes "Unknown")
        (bytes "decision")
        (bytes "observation")
        hashA
        hashB
        hashC
        0
        1)))
    "unknown action class fails closed"

  assert
    (not (bindingEnvelopeValid
      (AdvanceV3State
        (bytes "Issue")
        (bytes "")
        (bytes "observation")
        hashA
        hashB
        hashC
        0
        1)))
    "missing decision reference fails closed"

  assert
    (not (bindingEnvelopeValid
      (AdvanceV3State
        (bytes "Issue")
        (bytes "decision")
        (bytes "observation")
        (bytes "")
        hashB
        hashC
        0
        1)))
    "wrong-length pre-state hash fails closed"

  assert
    (not (bindingEnvelopeValid
      (AdvanceV3State
        (bytes "Issue")
        (bytes "decision")
        (bytes "observation")
        hashA
        (bytes "")
        hashC
        0
        1)))
    "missing action fingerprint fails closed"

  assert
    (not (bindingEnvelopeValid
      (AdvanceV3State
        (bytes "Issue")
        (bytes "decision")
        (bytes "observation")
        hashA
        hashB
        (bytes "")
        0
        1)))
    "missing post-state hash fails closed"

  assert
    (not (bindingEnvelopeValid
      (AdvanceV3State
        (bytes "Issue")
        (bytes "decision")
        (bytes "observation")
        hashA
        hashB
        hashC
        3
        2)))
    "Issue price must match canonical class price"

  putStrLn "ALL V3 CARRIER BINDING TESTS PASSED"
