module Main where

import Governance

assert :: String -> Bool -> IO ()
assert label ok =
  if ok then putStrLn ("PASS " ++ label)
        else error ("FAIL " ++ label)

baseProposal :: Proposal
baseProposal =
  Proposal
    { proposalId = 1
    , proposalClass = DocumentationOnly
    , proposalSnapshot = Snapshot 1 0 [(1,60),(2,40)]
    , proposalCreatedAt = 0
    , communityReviewOpenedAt = Nothing
    , votingOpenedAt = Nothing
    , votingClosedAt = Nothing
    , finalizationAt = Nothing
    , emergencyActivatedAt = Nothing
    , proposalVotes = []
    , proposalDelegations = []
    , proposalGates = GateResult True True True True
    , proposalStatus = Draft
    }

main :: IO ()
main = do
  let s = proposalSnapshot baseProposal

  -- GOV-C-01 / C-05
  assert "snapshot valid" (snapshotValid s)
  assert "snapshot duplicate entity rejected"
    (not (snapshotValid (Snapshot 2 0 [(1,50),(1,50)])))

  -- GOV-C-06 / C-07 / C-08 / C-09
  assert "25% quorum"
    (quorumReached s [] [Vote 1 1 For 0])
  assert "ordinary 50/50 rejected"
    (not (approvalReached DocumentationOnly s []
      [Vote 1 1 For 0, Vote 1 2 Against 0]))
  assert "ordinary 60/40 accepted"
    (approvalReached DocumentationOnly s []
      [Vote 1 1 For 0, Vote 1 2 Against 0])
  assert "kernel 60/40 rejected"
    (not (approvalReached ConstitutionalKernel s []
      [Vote 1 1 For 0, Vote 1 2 Against 0]))
  assert "kernel 70/30 accepted"
    (approvalReached ConstitutionalKernel
      (Snapshot 2 0 [(1,70),(2,30)]) []
      [Vote 1 1 For 0, Vote 1 2 Against 0])
  assert "abstention counts for quorum"
    (quorumReached s [] [Vote 1 2 Abstain 0])
  assert "abstention excluded from approval"
    (not (approvalReached DocumentationOnly s [] [Vote 1 2 Abstain 0]))

  -- GOV-C-03 / C-04
  assert "direct delegation conserves"
    (delegationConserves s [Delegation 1 2])
  assert "self delegation rejected"
    (not (delegationValid s [Delegation 1 1]))
  assert "delegation cycle rejected"
    (not (delegationValid s [Delegation 1 2, Delegation 2 1]))
  assert "recursive chain rejected"
    (not (delegationValid (Snapshot 2 0 [(1,30),(2,30),(3,40)])
      [Delegation 1 2, Delegation 2 3]))

  -- Lifecycle / replay
  let Right s1 = applyEvent emptyState (ProposalSubmitted baseProposal)
      Right s2 = replay s1
        [ StatusChanged 1 Proposed 1
        , ProposalClassified 1 DocumentationOnly
        , StatusChanged 1 ImpactReview 2
        , StatusChanged 1 EvidenceReview 3
        , GatesSet 1 (GateResult True True True True)
        , StatusChanged 1 CommunityReview 4
        , StatusChanged 1 Voting (4 + communityReviewSeconds)
        ]
      p = head (proposals s2)

  assert "first eligible vote accepted"
    (case applyEvent s2 (VoteCast (Vote 1 1 For (4 + communityReviewSeconds)))
       of Right _ -> True; Left _ -> False)

  let Right s3 = applyEvent s2
        (VoteCast (Vote 1 1 For (4 + communityReviewSeconds)))
  assert "duplicate vote rejected"
    (case applyEvent s3 (VoteCast (Vote 1 1 Against (4 + communityReviewSeconds + 1)))
       of Left _ -> True; Right _ -> False)

  assert "late vote rejected"
    (not (voteWindowOpen p
      (4 + communityReviewSeconds + votingSeconds)))

  assert "ineligible voter rejected"
    (case applyEvent s2 (VoteCast (Vote 1 99 For (4 + communityReviewSeconds)))
       of Left _ -> True; Right _ -> False)

  assert "delegated voter cannot direct vote"
    (case applyEvent s2
      (DelegationSet 1 (Delegation 1 2) (4 + communityReviewSeconds)) of
        Left _ -> False
        Right sd ->
          case applyEvent sd (VoteCast (Vote 1 1 For (4 + communityReviewSeconds + 1))) of
            Left _ -> True
            Right _ -> False)

  -- GOV-C-17 / gates
  assert "invalid classification rejected"
    (case applyEvent (emptyState {proposals=[baseProposal]})
      (ProposalClassified 1 Specification) of
        Left _ -> True; Right _ -> False)

  assert "gate update outside review rejected"
    (case applyEvent (emptyState {proposals=[baseProposal]})
      (GatesSet 1 (GateResult False False False False)) of
        Left _ -> True; Right _ -> False)

  putStrLn "GOV-C CORE CONVERGENCE CHECKS PASSED"
