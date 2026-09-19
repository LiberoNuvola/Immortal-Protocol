module GovernanceEventSchema
  ( ActorClass(..), EventType(..), EventStatus(..), EvidenceRef(..)
  , CanonicalEvent(..), canonicalPayload, canonicalEventBody
  , eventSchemaValid, canonicalEventValid, predecessorValid
  ) where

import Governance
  ( GovernanceState, GovernanceEvent(..), ProposalId, Timestamp
  , ProposalStatus(..), Proposal(..), proposals )

data ActorClass
  = System | Proposer | Voter | Delegate | Reviewer | Auditor | EmergencyAuthority
  deriving (Eq, Show, Ord)

data EventType
  = EProposalSubmitted | EProposalClassified | EStatusChanged
  | EVoteCast | EDelegationSet | EGatesSet
  deriving (Eq, Show, Ord)

data EventStatus = Pending | AcceptedEvent | RejectedEvent
  deriving (Eq, Show, Ord)

newtype EvidenceRef = EvidenceRef String
  deriving (Eq, Show, Ord)

data CanonicalEvent = CanonicalEvent
  { eventId :: String
  , eventProposalId :: ProposalId
  , rulesetVersion :: Integer
  , eventType :: EventType
  , actorClass :: ActorClass
  , eventTimestamp :: Timestamp
  , payloadCommitment :: String
  , predecessor :: Maybe String
  , evidenceRefs :: [EvidenceRef]
  , eventStatus :: EventStatus
  } deriving (Eq, Show, Ord)

canonicalPayload :: GovernanceEvent -> String
canonicalPayload e = case e of
  ProposalSubmitted p ->
    "proposal:" ++ show (proposalId p) ++
    "|class:" ++ show (proposalClass p) ++
    "|snapshot:" ++ show (proposalSnapshot p) ++
    "|created:" ++ show (proposalCreatedAt p)
  ProposalClassified pid cls ->
    "proposal:" ++ show pid ++ "|class:" ++ show cls
  StatusChanged pid st at ->
    "proposal:" ++ show pid ++ "|status:" ++ show st ++ "|at:" ++ show at
  VoteCast v ->
    "proposal:" ++ show (voteProposal v) ++
    "|voter:" ++ show (voter v) ++
    "|choice:" ++ show (choice v) ++
    "|cast:" ++ show (castAt v)
  DelegationSet pid d ->
    "proposal:" ++ show pid ++
    "|delegator:" ++ show (delegator d) ++
    "|delegate:" ++ show (delegate d)
  GatesSet pid g ->
    "proposal:" ++ show pid ++ "|gates:" ++ show g

canonicalEventBody :: CanonicalEvent -> String
canonicalEventBody e =
  "event_id=" ++ eventId e ++
  ";proposal_id=" ++ show (eventProposalId e) ++
  ";ruleset_version=" ++ show (rulesetVersion e) ++
  ";event_type=" ++ show (eventType e) ++
  ";actor_class=" ++ show (actorClass e) ++
  ";timestamp=" ++ show (eventTimestamp e) ++
  ";payload_commitment=" ++ payloadCommitment e ++
  ";predecessor=" ++ maybe "" id (predecessor e) ++
  ";evidence_refs=" ++ show (evidenceRefs e) ++
  ";status=" ++ show (eventStatus e)

eventSchemaValid :: CanonicalEvent -> Bool
eventSchemaValid e =
  not (null (eventId e)) &&
  eventProposalId e >= 0 &&
  rulesetVersion e > 0 &&
  eventTimestamp e >= 0 &&
  not (null (payloadCommitment e)) &&
  unique (evidenceRefs e)
  where
    unique xs = length xs == length (dedup xs)
    dedup [] = []
    dedup (x:rest) = x : dedup (filter (/=x) rest)

predecessorValid :: Maybe CanonicalEvent -> CanonicalEvent -> Bool
predecessorValid Nothing e = predecessor e == Nothing
predecessorValid (Just p) e = predecessor e == Just (eventId p)

canonicalEventValid :: Maybe CanonicalEvent -> CanonicalEvent -> Bool
canonicalEventValid prev e =
  eventSchemaValid e &&
  predecessorValid prev e &&
  case eventStatus e of
    RejectedEvent -> True
    _ -> True
