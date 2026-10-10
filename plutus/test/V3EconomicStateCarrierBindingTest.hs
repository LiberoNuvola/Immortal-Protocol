{-# LANGUAGE NoImplicitPrelude #-}

module Main where

import Prelude
  ( Bool (False, True)
  , IO
  , String
  , error
  , putStrLn
  , (==)
  )

import qualified Data.ByteString.Char8 as BSC
import PlutusTx (toBuiltin)
import V3EconomicStateCarrier
  ( V3EconomicStateAction (..)
  , bindingEnvelopeValid
  )

bytes = toBuiltin . BSC.pack

valid :: V3EconomicStateAction
valid =
  AdvanceV3State
    (bytes "Issue")
    (bytes "decision:issue:001")
    (bytes "observation:issue:001")
    (bytes "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    (bytes "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")
    (bytes "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc")

assert :: Bool -> String -> IO ()
assert condition label =
  if condition
    then putStrLn ("PASS: " ++ label)
    else error ("FAIL: " ++ label)

main :: IO ()
main = do
  assert
    (bindingEnvelopeValid valid)
    "valid Issue decision envelope is accepted"

  assert
    (bindingAuthorityValid
      (bytes "79b5562e8fe654f94078b112e8a98ba7901f853ae695bed7e0e3910bad049664")
      valid)
    "valid Issue authority signature is accepted"

  assert
    (not (bindingAuthorityValid
      (bytes "00")
      valid))
    "invalid authority public-key size fails closed"

  assert
    (not (bindingAuthorityValid
      (bytes "79b5562e8fe654f94078b112e8a98ba7901f853ae695bed7e0e3910bad049664")
      (AdvanceV3State
        (bytes "Issue")
        (bytes "decision:issue:002")
        (bytes "observation:issue:001")
        (bytes "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
        (bytes "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")
        (bytes "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc")
        (bytes "3c1a0d94bc0024da6e8d1e0eaab96011b2fc07e2cbb074205a117bc90c0009b7e7339cd42d6cbd49a979918a71c98bf38ea550f241fede2615a4f504aa168a06")))
    "changed decision reference invalidates authority signature"

  assert
    (bindingEnvelopeValid
      (AdvanceV3State
        (bytes "Reveal")
        (bytes "decision:reveal:001")
        (bytes "observation:reveal:001")
        (bytes "pre")
        (bytes "action")
        (bytes "post")))
    "Reveal envelope remains supported"

  assert
    (not (bindingEnvelopeValid
      (AdvanceV3State
        (bytes "Unknown")
        (bytes "decision")
        (bytes "observation")
        (bytes "pre")
        (bytes "action")
        (bytes "post"))))
    "unknown action class fails closed"

  assert
    (not (bindingEnvelopeValid
      (AdvanceV3State
        (bytes "Issue")
        (bytes "")
        (bytes "observation")
        (bytes "pre")
        (bytes "action")
        (bytes "post"))))
    "missing decision reference fails closed"

  assert
    (not (bindingEnvelopeValid
      (AdvanceV3State
        (bytes "Issue")
        (bytes "decision")
        (bytes "observation")
        (bytes "")
        (bytes "action")
        (bytes "post"))))
    "missing pre-state hash fails closed"

  assert
    (not (bindingEnvelopeValid
      (AdvanceV3State
        (bytes "Issue")
        (bytes "decision")
        (bytes "observation")
        (bytes "pre")
        (bytes "")
        (bytes "post"))))
    "missing action fingerprint fails closed"

  assert
    (not (bindingEnvelopeValid
      (AdvanceV3State
        (bytes "Issue")
        (bytes "decision")
        (bytes "observation")
        (bytes "pre")
        (bytes "action")
        (bytes ""))))
    "missing post-state hash fails closed"

  putStrLn "ALL V3 CARRIER BINDING TESTS PASSED"
