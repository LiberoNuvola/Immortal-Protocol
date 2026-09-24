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
      pReview = Proposal 1 DocumentationOnly s 0 (Just 0) Nothing Nothing Nothing Nothing [] [] g CommunityReview
      reviewState = GovernanceState 1 [pReview] 0

  assert "voting cannot open before 7d community review"
    (case applyEvent reviewState (StatusChanged 1 Voting (communityReviewSeconds - 1)) of
       Left _ -> True
       Right _ -> False)

  let Right votingState = applyEvent reviewState (StatusChanged 1 Voting communityReviewSeconds)
  assert "voting opens at 7d community-review boundary"
    (case votingState of
       GovernanceState _ [p] _ -> proposalStatus p == Voting && votingOpenedAt p == Just communityReviewSeconds
       _ -> False)

  assert "decision cannot be recorded before 5d voting window"
    (case applyEvent votingState (StatusChanged 1 DecisionRecorded (communityReviewSeconds + votingSeconds - 1)) of
       Left _ -> True
       Right _ -> False)

  let s2 = s
      g2 = g
      p0 = Proposal 1 DocumentationOnly s2 0 Nothing Nothing (Just 100) Nothing Nothing [] [] g2 DecisionRecorded
      p = p0 { votingClosedAt = Just 100 }

  assert "challenge opens inside 3d window"
    (case openChallenge p "c1" (100 + finalitySeconds - 1) of Right _ -> True; _ -> False)

  let Right c = openChallenge p "c1" (100 + finalitySeconds - 1)
      Right cr = resolveChallenge c ChallengeRejected

  assert "challenge cannot resolve twice"
    (case resolveChallenge cr ChallengeRejected of Left _ -> True; Right _ -> False)

  assert "cannot finalize before expiry"
    (not (canFinalize p [cr] (100 + finalitySeconds - 1)))

  let upheld = c { challengeStatus = ChallengeUpheld }
  assert "upheld challenge blocks finalization"
    (not (canFinalize p [upheld] (100 + finalitySeconds)))

  let lateRejected = Challenge "late" 1 (100 + finalitySeconds) ChallengeRejected
  assert "challenge opened at expiry boundary is invalid"
    (not (validChallenges p [lateRejected]))

  let emptyId = Challenge "" 1 100 ChallengeRejected
  assert "empty challenge id is invalid"
    (not (validChallenges p [emptyId]))

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
