module GovernanceDecisionWitness
  ( DecisionRecord(..)
  , decisionRecordValid
  , finalizationReady
  ) where

import Governance
import GovernanceFinality

-- Exact GOV-18 minimum finalized-decision record.
-- This is a witness/projection type; it does not replace the canonical event.
data DecisionRecord = DecisionRecord
  { decisionProposalId :: ProposalId
  , decisionProposalClass :: ProposalClass
  , decisionSnapshotId :: Integer
  , decisionSnapshotAt :: Timestamp
  , decisionEligibleWeight :: Weight
  , decisionYesWeight :: Weight
  , decisionNoWeight :: Weight
  , decisionAbstentionWeight :: Weight
  , decisionQuorumReached :: Bool
  , decisionApprovalReached :: Bool
  , decisionRequiredGates :: GateResult
  , decisionFinalOutcome :: ProposalStatus
  , decisionRulesetVersion :: Integer
  , decisionChallenges :: [Challenge]
  , decisionCanonicalizationReference :: String
  } deriving (Eq, Show)

decisionRecordValid :: Proposal -> DecisionRecord -> Bool
decisionRecordValid p r =
  decisionProposalId r == proposalId p &&
  decisionProposalClass r == proposalClass p &&
  decisionSnapshotId r == snapshotId (proposalSnapshot p) &&
  decisionSnapshotAt r == snapshotAt (proposalSnapshot p) &&
  decisionEligibleWeight r == eligibleWeight (proposalSnapshot p) &&
  decisionFinalOutcome r == Accepted &&
  decisionRequiredGates r == proposalGates p &&
  decisionYesWeight r == sum [effectiveVoteWeight (proposalSnapshot p) (proposalDelegations p) v | v <- proposalVotes p, choice v == For] &&
  decisionNoWeight r == sum [effectiveVoteWeight (proposalSnapshot p) (proposalDelegations p) v | v <- proposalVotes p, choice v == Against] &&
  decisionAbstentionWeight r == sum [effectiveVoteWeight (proposalSnapshot p) (proposalDelegations p) v | v <- proposalVotes p, choice v == Abstain] &&
  decisionQuorumReached r == quorumReached (proposalSnapshot p) (proposalDelegations p) (proposalVotes p) &&
  decisionApprovalReached r == approvalReached (proposalClass p) (proposalSnapshot p) (proposalDelegations p) (proposalVotes p) &&
  decisionRulesetVersion r > 0 &&
  not (null (decisionCanonicalizationReference r))

finalizationReady :: Proposal -> [Challenge] -> Timestamp -> Bool
finalizationReady p cs now =
  canFinalize p cs now &&
  validChallenges p cs
