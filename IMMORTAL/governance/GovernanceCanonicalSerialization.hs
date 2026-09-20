module GovernanceCanonicalSerialization
  ( canonicalPayloadBytes, canonicalEventBytes ) where

import Governance
import GovernanceEventSchema
import Data.List (intercalate)

canonicalPayloadBytes :: CanonicalPayload -> String
canonicalPayloadBytes p = case p of
  PayloadProposalSubmitted x ->
    "type=ProposalSubmitted;proposal_id=" ++ show (proposalId x) ++
    ";class=" ++ show (proposalClass x) ++
    ";snapshot=" ++ show (proposalSnapshot x) ++
    ";created=" ++ show (proposalCreatedAt x)
  PayloadProposalClassified pid cls ->
    "type=ProposalClassified;proposal_id=" ++ show pid ++ ";class=" ++ show cls
  PayloadStatusChanged pid st at ->
    "type=StatusChanged;proposal_id=" ++ show pid ++
    ";status=" ++ show st ++ ";timestamp=" ++ show at
  PayloadVoteCast v ->
    "type=VoteCast;proposal_id=" ++ show (voteProposal v) ++
    ";voter=" ++ show (voter v) ++ ";choice=" ++ show (choice v) ++
    ";cast_at=" ++ show (castAt v)
  PayloadDelegationSet pid d at ->
    "type=DelegationSet;proposal_id=" ++ show pid ++
    ";delegator=" ++ show (delegator d) ++ ";delegate=" ++ show (delegate d) ++
    ";timestamp=" ++ show at
  PayloadGatesSet pid g ->
    "type=GatesSet;proposal_id=" ++ show pid ++ ";gates=" ++ show g

canonicalEventBytes :: CanonicalEvent -> String
canonicalEventBytes e =
  intercalate ";" [
    "event_id=" ++ eventId e,
    "proposal_id=" ++ show (eventProposalId e),
    "ruleset_version=" ++ show (rulesetVersion e),
    "event_type=" ++ show (eventType e),
    "actor_class=" ++ show (actorClass e),
    "timestamp=" ++ show (eventTimestamp e),
    "payload=" ++ canonicalPayloadBytes (eventPayload e),
    "payload_commitment=" ++ payloadCommitment e,
    "predecessor=" ++ maybe "" id (predecessor e),
    "evidence_refs=" ++ concatMap (\(EvidenceRef x) -> "[" ++ x ++ "]") (evidenceRefs e),
    "status=" ++ show (eventStatus e)]
