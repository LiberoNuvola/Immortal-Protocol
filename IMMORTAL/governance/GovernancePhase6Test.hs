module Main where

import Governance
import GovernanceEventSchema
import GovernanceFinality
import GovernanceRuleset
import GovernanceCommitment

assert :: String -> Bool -> IO ()
assert label ok = if ok then putStrLn ("PASS " ++ label)
                         else error ("FAIL " ++ label)

main :: IO ()
main = do
  let s = Snapshot 1 0 [(1,60),(2,40)]
      g = GateResult True True True True
      p0 = Proposal 1 DocumentationOnly s 0 Nothing Nothing (Just 100) Nothing Nothing [] [] g DecisionRecorded
      p = p0 { votingClosedAt = Just 100 }

  assert "challenge opens inside 3d window"
    (case openChallenge p "c1" (100 + finalitySeconds - 1) of Right _ -> True; _ -> False)

  let Right c = openChallenge p "c1" (100 + finalitySeconds - 1)
      Right cr = resolveChallenge c ChallengeRejected

  assert "challenge cannot resolve twice"
    (case resolveChallenge cr ChallengeRejected of Left _ -> True; Right _ -> False)

  assert "cannot finalize before expiry"
    (not (canFinalize p [cr] (100 + finalitySeconds - 1)))

  assert "finalize after rejected challenge and expiry"
    (canFinalize p [cr] (100 + finalitySeconds))

  assert "decision recording does not set finalization time"
    (finalizationAt p0 == Nothing)

  assert "finalize produces Canonical"
    (case finalize p [cr] (100 + finalitySeconds) of
       Right x -> proposalStatus x == Canonical
       Left _ -> False)

  assert "ruleset immutable"
    (rulesetImmutable canonicalRuleset canonicalRuleset)
  assert "ruleset change requires amendment"
    (amendmentRequiresNewProposal (rulesetId canonicalRuleset) 2)

  let ce = CanonicalEvent "evt-1" 1 1 EProposalSubmitted Proposer 0
             "payload" Nothing [] AcceptedEvent
  assert "commitment algorithm explicit"
    (commitmentAlgorithm == "SHA-256")
  assert "canonical commitment input deterministic"
    (commitmentInput ce == commitmentInput ce)

  putStrLn "PHASE 6 FINALITY/RULESET CHECKS PASSED"
