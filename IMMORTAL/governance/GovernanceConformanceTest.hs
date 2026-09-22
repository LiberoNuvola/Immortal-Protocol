module Main where
import Governance

assert :: String -> Bool -> IO ()
assert l ok = if ok then putStrLn ("PASS " ++ l) else error ("FAIL " ++ l)

main :: IO ()
main = do
  let snap = Snapshot 1 0 [(1,60),(2,40)]
  let mk = GateResult True True True True
  let p = Proposal 1 DocumentationOnly snap 0 Nothing Nothing Nothing Nothing Nothing [] [] mk Draft
  let Right s1 = applyEvent emptyState (ProposalSubmitted p)
  let Right s2 = replay s1
        [ StatusChanged 1 Proposed 1
        , ProposalClassified 1 DocumentationOnly
        , StatusChanged 1 ImpactReview 2
        , StatusChanged 1 EvidenceReview 3
        , StatusChanged 1 CommunityReview 4
        , StatusChanged 1 Voting (4 + communityReviewSeconds)
        ]
  let Right s3 = applyEvent s2 (VoteCast (Vote 1 1 For (4 + communityReviewSeconds)))
  let pp = head (proposals s3)
  assert "25% quorum" (quorumReached snap (proposalDelegations pp) (proposalVotes pp))
  assert "ordinary >50%" (approvalReached DocumentationOnly snap (proposalDelegations pp) (proposalVotes pp))
  assert "abstention is participation"
    (quorumReached snap [] [Vote 1 2 Abstain 4])
  assert "abstention excluded from approval"
    (not (approvalReached DocumentationOnly snap [] [Vote 1 2 Abstain 4]))
  assert "direct delegation conserves weight"
    (delegationConserves snap [Delegation 1 2])
  assert "delegation cycle rejected"
    (not (delegationValid snap [Delegation 1 2, Delegation 2 1]))
  assert "late vote rejected"
    (not (voteWindowOpen pp (4 + communityReviewSeconds + votingSeconds)))
  let emergency = pp { emergencyActivatedAt = Just 100 }
  assert "72h emergency expires"
    (emergencyExpired emergency (100 + emergencySeconds))
