module Main where
import Governance

assert label ok = if ok then putStrLn ("PASS " ++ label) else error ("FAIL " ++ label)

main = do
  assert "quorum below threshold" $ not (quorumReached [(1,100)] [Vote 1 For])
  assert "ordinary 50/50 rejected" $ not (approvalReached DocumentationOnly [(1,50),(2,50)] [Vote 1 For, Vote 2 Against])
  assert "kernel 70/30 accepted" $ approvalReached ConstitutionalKernel [(1,70),(2,30)] [Vote 1 For, Vote 2 Against]
  assert "kernel gates required" $ not (gatesPassed ConstitutionalKernel (GateResult True False True True))
  let p = Proposal 1 DocumentationOnly [(1,60),(2,40)] [] [] (GateResult True True True True) Draft
  let Right s1 = replay (emptyState {proposals=[p]}) [StatusChanged 1 Proposed, ProposalClassified 1 DocumentationOnly, StatusChanged 1 ImpactReview, StatusChanged 1 EvidenceReview, StatusChanged 1 CommunityReview, StatusChanged 1 Voting]
  let Right s2 = applyEvent s1 (VoteCast 1 (Vote 1 For))
  assert "first vote accepted" $ length (proposalVotes (head (proposals s2))) == 1
  assert "duplicate vote rejected" $ case applyEvent s2 (VoteCast 1 (Vote 1 Against)) of Left _ -> True; Right _ -> False
  assert "classification cannot bypass Proposed" $ case applyEvent (emptyState {proposals=[p]}) (ProposalClassified 1 Specification) of Left _ -> True; Right _ -> False
