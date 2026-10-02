{-# LANGUAGE NoImplicitPrelude #-}

module Main where

import Prelude (IO, Bool (..), String, putStrLn, error, length, head, (==), not, (++))
import EconomicProfile (EconomicProfile)
import EconomicStateV3
import EconomicTransitionV3
import GoldenVectors
import ReferenceAdapter

assert :: Bool -> String -> IO ()
assert ok label = if ok then putStrLn ("PASS: " ++ label) else error ("FAIL: " ++ label)

main :: IO ()
main = do
  let steps =
        [ ReferenceStep (Issue 0 1) issueZeroExpected
        , ReferenceStep (Reveal 0 500) revealZeroExpected
        , ReferenceStep (Expire 0) expireZeroExpected
        ]

  assert
    (replayValid baseProfile baseState steps)
    "reference adapter replays canonical Issue -> Reveal -> Expire trace"

  case replay baseProfile baseState steps of
    Nothing -> error "FAIL: reference replay returned Nothing"
    Just states -> do
      assert (length states == 3) "reference replay emits every transition state"
      assert (v3UnresolvedReserve (head states) == 1) "reference replay preserves Issue state"

  let mutated =
        [ ReferenceStep (Issue 0 1) issueZeroExpected
        , ReferenceStep (Reveal 0 500) revealZeroExpected
        , ReferenceStep (Expire 0)
            (expireZeroExpected
              { v3UnresolvedReserve = 1
              })
        ]

  assert
    (not (replayValid baseProfile baseState mutated))
    "reference adapter rejects a mutated expected post-state"

  putStrLn "ALL REFERENCE ADAPTER TESTS PASSED"
