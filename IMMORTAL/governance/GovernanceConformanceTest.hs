module Main where
import Governance

assert :: String -> Bool -> IO ()
assert l ok = if ok then putStrLn ("PASS " ++ l) else error ("FAIL " ++ l)

main :: IO ()
main = do
  let snap = Snapshot 1 0 [(1,60),(2,40)]
  let mk = GateResult True True True True
  let initialGates = GateResult False False False False
  let p = Proposal 1 DocumentationOnly snap 0 Nothing Nothing Nothing Nothing Nothing [] [] initialGates Draft
  let Right s1 = applyEvent emptyState (ProposalSubmitted p)
  let Right s2 = replay s1
        [ StatusChanged 1 Proposed 1
        , ProposalClassified 1 DocumentationOnly
        , StatusChanged 1 ImpactReview 2
        , StatusChanged 1 EvidenceReview 3
        , GatesSet 1 mk
        , StatusChanged 1 CommunityReview 4
        , StatusChanged 1 Voting (4 + communityReviewSeconds)
        ]
  let votingAt = 4 + communityReviewSeconds
  let Right votedBeforeDelegation =
        applyEvent s2 (VoteCast (Vote 1 1 Against votingAt))
  assert "delegation after prior vote is rejected without changing state"
    (case applyEvent votedBeforeDelegation
            (DelegationSet 1 (Delegation 1 2) votingAt) of
       Left _ ->
         let pAfter = head (proposals votedBeforeDelegation)
         in null (proposalDelegations pAfter) &&
            length (proposalVotes pAfter) == 1
       Right _ -> False)
  let Right delegatedBeforeVote =
        applyEvent s2 (DelegationSet 1 (Delegation 1 2) votingAt)
  let Right delegatedVoteState =
        applyEvent delegatedBeforeVote (VoteCast (Vote 1 2 For votingAt))
  let delegatedProposal = head (proposals delegatedVoteState)
  assert "delegation before vote remains valid and transfers weight once"
    (case proposalVotes delegatedProposal of
       [v] -> effectiveVoteWeight snap (proposalDelegations delegatedProposal) v == 100
       _ -> False)
  assert "delegator still cannot vote after delegating"
    (case applyEvent delegatedBeforeVote (VoteCast (Vote 1 1 For votingAt)) of
       Left _ -> True
       Right _ -> False)
  assert "valid delegated vote participation is bounded by eligible weight"
    (participatingWeight snap (proposalDelegations delegatedProposal)
       (proposalVotes delegatedProposal) <= eligibleWeight snap)

  let mixedSnapshot = Snapshot 2 0 [(1,60),(2,40),(3,20)]
      mixedVotingState =
        s2 { proposals = [(head (proposals s2)) { proposalSnapshot = mixedSnapshot }] }
  let Right mixedDelegated =
        applyEvent mixedVotingState (DelegationSet 1 (Delegation 1 2) votingAt)
  let Right mixedFor =
        applyEvent mixedDelegated (VoteCast (Vote 1 2 For votingAt))
  let Right mixedAgainst =
        applyEvent mixedFor (VoteCast (Vote 1 3 Against votingAt))
  let mixedFinal = head (proposals mixedAgainst)
      mixedVotes = proposalVotes mixedFinal
      mixedForWeight =
        case [v | v <- mixedVotes, voter v == 2] of
          [v] -> effectiveVoteWeight mixedSnapshot (proposalDelegations mixedFinal) v == 100
          _ -> False
      mixedAgainstWeight =
        case [v | v <- mixedVotes, voter v == 3] of
          [v] -> choice v == Against &&
                 effectiveVoteWeight mixedSnapshot (proposalDelegations mixedFinal) v == 20
          _ -> False
  assert "opposing votes after delegation count each snapshot weight once"
    (participatingWeight mixedSnapshot (proposalDelegations mixedFinal) mixedVotes == 120 &&
     eligibleWeight mixedSnapshot == 120 &&
     participatingWeight mixedSnapshot (proposalDelegations mixedFinal) mixedVotes
       <= eligibleWeight mixedSnapshot &&
     mixedForWeight && mixedAgainstWeight)
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
  let ungated = pp { proposalGates = GateResult False False False False }
  assert "acceptance requires gates" 
    (case applyEvent (s3 { proposals = [ungated] }) (StatusChanged 1 Accepted 10) of
       Left _ -> True
       Right _ -> False)
  let Right s4 = applyEvent s3 (StatusChanged 1 DecisionRecorded (4 + communityReviewSeconds + votingSeconds))
  let Right s5 = applyEvent s4 (StatusChanged 1 Accepted (4 + communityReviewSeconds + votingSeconds + 1))
  let Right s6 = applyEvent s5 (StatusChanged 1 Adopted (4 + communityReviewSeconds + votingSeconds + 2))
  assert "adoption follows accepted state"
    (proposalStatus (head (proposals s6)) == Adopted)
  let emergency = pp { emergencyActivatedAt = Just 100 }
  assert "72h emergency expires"
    (emergencyExpired emergency (100 + emergencySeconds))
