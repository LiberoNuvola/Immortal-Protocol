module Main where

import Governance
import GovernanceFinality
import GovernanceDecisionWitness

assert :: String -> Bool -> IO ()
assert label ok =
  if ok then putStrLn ("PASS " ++ label) else error ("FAIL " ++ label)

proposal :: Proposal
proposal =
  Proposal
    { proposalId = 7
    , proposalClass = DocumentationOnly
    , proposalSnapshot = Snapshot 11 100 [(1,60),(2,40)]
    , proposalCreatedAt = 90
    , communityReviewOpenedAt = Nothing
    , votingOpenedAt = Just 100
    , votingClosedAt = Just 200
    , finalizationAt = Nothing
    , emergencyActivatedAt = Nothing
    , proposalVotes =
        [ Vote 7 1 For 100
        , Vote 7 2 Abstain 100
        ]
    , proposalDelegations = []
    , proposalGates = GateResult True True True True
    , proposalStatus = DecisionRecorded
    }

rejectedChallenge :: Challenge
rejectedChallenge =
  Challenge
    { challengeId = "challenge-1"
    , challengeProposalId = 7
    , challengeOpenedAt = 250
    , challengeStatus = ChallengeRejected
    }

record :: DecisionRecord
record =
  DecisionRecord
    { decisionProposalId = 7
    , decisionProposalClass = DocumentationOnly
    , decisionSnapshotId = 11
    , decisionSnapshotAt = 100
    , decisionEligibleWeight = 100
    , decisionYesWeight = 60
    , decisionNoWeight = 0
    , decisionAbstentionWeight = 40
    , decisionQuorumReached = True
    , decisionApprovalReached = True
    , decisionRequiredGates = GateResult True True True True
    , decisionFinalOutcome = DecisionRecorded
    , decisionRulesetVersion = 1
    , decisionChallenges = [rejectedChallenge]
    , decisionCanonicalizationReference = "canonical-ref-1"
    }

main :: IO ()
main = do
  assert "GOV-18 decision record preserves minimum fields"
    (decisionRecordValid proposal record)
  assert "finalization witness waits for challenge expiry"
    (not (finalizationReady proposal [rejectedChallenge] 200))
  assert "finalization witness becomes ready at expiry"
    (finalizationReady proposal [rejectedChallenge] (200 + finalitySeconds))
  putStrLn "GOV-28 DECISION WITNESS CHECKS PREPARED"
