{-# LANGUAGE NoImplicitPrelude #-}

module Main where

import Prelude (IO, putStrLn)
import EconomicStateV3
import EconomicKernel
import EconomicTransitionV3
import GoldenVectors

assert :: Bool -> String -> IO ()
assert condition label =
  if condition
    then putStrLn ("PASS: " ++ label)
    else error ("FAIL: " ++ label)

main :: IO ()
main = do
  assert (transitionValid baseState (Issue 0 1)) "valid issue"
  assert (transition baseState (Issue 0 1) == Just issueZeroExpected) "issue state"
  assert (transitionValid
            (issueZeroExpected)
            (Reveal 0 500)) "valid reveal"
  assert (transition issueZeroExpected (Reveal 0 500) == Just revealZeroExpected) "reveal state"
  assert (transitionValid issueZeroExpected (Expire 0)) "valid expiry"
  assert (transition issueZeroExpected (Expire 0) == Just expireZeroExpected) "expiry state"
  assert (invalidIssuePrice) "reject non-canonical issue price"
  assert (invalidRevealPayout) "reject payout above 500x"
  assert (invalidRevealWithoutTicket) "reject reveal without unresolved ticket"
  assert (invalidExpireWithoutTicket) "reject expiry without unresolved ticket"
  assert (invalidClaimAmount) "reject claim above liability"
  assert (conservationInvariant issueZeroExpected) "issue conservation"
  assert (conservationInvariant revealZeroExpected) "reveal conservation"
  assert (conservationInvariant expireZeroExpected) "expiry conservation"
  putStrLn "A3/A5 hardening vectors complete."
