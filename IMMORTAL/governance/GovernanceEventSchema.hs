module GovernanceEventSchema
  ( ActorClass(..), EventType(..), EventStatus(..), EvidenceRef(..)
  , CanonicalPayload(..), CanonicalEvent(..)
  , canonicalPayloadText, canonicalEventBody
  , eventSchemaValid, canonicalEventValid, predecessorValid
  ) where

import Governance
import GovernanceDecisionWitness (DecisionRecord(..))
import GovernanceConformanceWitness (ConformanceRecord(..))
import GovernanceCanonicalizationWitness (CanonicalizationRecord(..))

data ActorClass = System | Proposer | Voter | Delegate | Reviewer | Auditor | EmergencyAuthority
  deriving (Eq, Show)

data EventType = EProposalSubmitted | EProposalClassified | EStatusChanged
  | EDecisionFinalized
  | EAdoptionRecorded | EConformanceRecorded | ECanonicalized
  | EVoteCast | EDelegationSet | EGatesSet
  deriving (Eq, Show)

data EventStatus = Pending | AcceptedEvent | RejectedEvent
  deriving (Eq, Show)

newtype EvidenceRef = EvidenceRef String deriving (Eq, Show)

data CanonicalPayload
  = PayloadProposalSubmitted Proposal
  | PayloadProposalClassified ProposalId ProposalClass Timestamp
  | PayloadStatusChanged ProposalId ProposalStatus Timestamp
  | PayloadDecisionFinalized DecisionRecord
  | PayloadAdoptionRecorded ProposalId Timestamp
  | PayloadConformanceRecorded ConformanceRecord
  | PayloadCanonicalized CanonicalizationRecord
  | PayloadVoteCast Vote
  | PayloadDelegationSet ProposalId Delegation Timestamp
  | PayloadGatesSet ProposalId GateResult Timestamp
  deriving (Eq, Show)

data CanonicalEvent = CanonicalEvent
  { eventId :: String
  , eventProposalId :: ProposalId
  , rulesetVersion :: Integer
  , eventType :: EventType
  , actorClass :: ActorClass
  , eventTimestamp :: Timestamp
  , eventPayload :: CanonicalPayload
  , payloadCommitment :: String
  , predecessor :: Maybe String
  , evidenceRefs :: [EvidenceRef]
  , eventStatus :: EventStatus
  } deriving (Eq, Show)

canonicalPayloadText :: CanonicalPayload -> String
canonicalPayloadText p = case p of
  PayloadProposalSubmitted x ->
    "type=ProposalSubmitted;proposal_id=" ++ show (proposalId x) ++
    ";class=" ++ show (proposalClass x) ++
    ";snapshot_id=" ++ show (snapshotId (proposalSnapshot x)) ++
    ";snapshot_at=" ++ show (snapshotAt (proposalSnapshot x)) ++
    ";snapshot_weights=" ++ show (snapshotWeights (proposalSnapshot x)) ++
    ";created_at=" ++ show (proposalCreatedAt x)
  PayloadProposalClassified pid cls at ->
    "type=ProposalClassified;proposal_id=" ++ show pid ++ ";class=" ++ show cls ++ ";timestamp=" ++ show at
  PayloadStatusChanged pid st at ->
    "type=StatusChanged;proposal_id=" ++ show pid ++ ";status=" ++ show st ++ ";timestamp=" ++ show at
  PayloadDecisionFinalized r ->
    "type=DecisionFinalized;proposal_id=" ++ show (decisionProposalId r) ++
    ";snapshot_id=" ++ show (decisionSnapshotId r) ++
    ";snapshot_at=" ++ show (decisionSnapshotAt r) ++
    ";eligible_weight=" ++ show (decisionEligibleWeight r) ++
    ";yes=" ++ show (decisionYesWeight r) ++
    ";no=" ++ show (decisionNoWeight r) ++
    ";abstention=" ++ show (decisionAbstentionWeight r) ++
    ";quorum=" ++ show (decisionQuorumReached r) ++
    ";approval=" ++ show (decisionApprovalReached r) ++
    ";required_gates=" ++ show (decisionRequiredGates r) ++
    ";final_outcome=" ++ show (decisionFinalOutcome r) ++
    ";ruleset_version=" ++ show (decisionRulesetVersion r) ++
    ";challenges=" ++ show (decisionChallenges r) ++
    ";canonicalization_reference=" ++ decisionCanonicalizationReference r
  PayloadAdoptionRecorded pid at ->
    "type=AdoptionRecorded;proposal_id=" ++ show pid ++ ";timestamp=" ++ show at
  PayloadConformanceRecorded r ->
    "type=ConformanceRecorded;proposal_id=" ++ show (conformanceProposalId r) ++
    ";implementation_commit=" ++ conformanceImplementationCommit r ++
    ";ruleset_version=" ++ show (conformanceRulesetVersion r) ++
    ";test_vector_version=" ++ conformanceTestVectorVersion r ++
    ";environment_toolchain=" ++ conformanceEnvironmentToolchain r ++
    ";test_results=" ++ conformanceTestResults r ++
    ";failed_test_record=" ++ maybe "" id (conformanceFailedTestRecord r) ++
    ";canonical_input_fixtures=" ++ conformanceCanonicalInputFixtures r ++
    ";replay_output=" ++ conformanceReplayOutput r
  PayloadCanonicalized r ->
    "type=Canonicalized;proposal_id=" ++ show (canonicalizationProposalId r) ++
    ";target_artifact=" ++ canonicalizationTargetArtifact r ++
    ";version_transition=" ++ canonicalizationVersionTransition r ++
    ";decision_record_reference=" ++ canonicalizationDecisionRecordReference r ++
    ";evidence_references=" ++ show (canonicalizationEvidenceReferences r) ++
    ";conformance_evidence=" ++ maybe "" id (canonicalizationConformanceEvidence r) ++
    ";compatibility_upgrade_result=" ++ maybe "" id (canonicalizationCompatibilityUpgradeResult r) ++
    ";mandatory_gates_resolved=" ++ show (canonicalizationMandatoryGatesResolved r) ++
    ";version_identifier=" ++ canonicalizationVersionIdentifier r
  PayloadVoteCast v ->
    "type=VoteCast;proposal_id=" ++ show (voteProposal v) ++
    ";voter=" ++ show (voter v) ++ ";choice=" ++ show (choice v) ++ ";cast_at=" ++ show (castAt v)
  PayloadDelegationSet pid d at ->
    "type=DelegationSet;proposal_id=" ++ show pid ++
    ";delegator=" ++ show (delegator d) ++ ";delegate=" ++ show (delegate d) ++ ";timestamp=" ++ show at
  PayloadGatesSet pid g at ->
    "type=GatesSet;proposal_id=" ++ show pid ++ ";gates=" ++ show g ++ ";timestamp=" ++ show at

canonicalEventBody :: CanonicalEvent -> String
canonicalEventBody e =
  "event_id=" ++ eventId e ++
  ";proposal_id=" ++ show (eventProposalId e) ++
  ";ruleset_version=" ++ show (rulesetVersion e) ++
  ";event_type=" ++ show (eventType e) ++
  ";actor_class=" ++ show (actorClass e) ++
  ";timestamp=" ++ show (eventTimestamp e) ++
  ";payload=" ++ canonicalPayloadText (eventPayload e) ++
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
  payloadProposalId (eventPayload e) == eventProposalId e &&
  eventTypeMatchesPayload (eventType e) (eventPayload e) &&
  payloadTimestampCompatible e &&
  payloadRulesetVersionCompatible e &&
  not (null (payloadCommitment e)) &&
  not (null (evidenceRefs e)) &&
  unique (evidenceRefs e)

payloadRulesetVersionCompatible :: CanonicalEvent -> Bool
payloadRulesetVersionCompatible e = case eventPayload e of
  PayloadDecisionFinalized r ->
    decisionRulesetVersion r == rulesetVersion e
  PayloadConformanceRecorded r ->
    conformanceRulesetVersion r == rulesetVersion e
  _ -> True

payloadProposalId :: CanonicalPayload -> ProposalId
payloadProposalId p = case p of
  PayloadProposalSubmitted x -> proposalId x
  PayloadProposalClassified x _ _ -> x
  PayloadStatusChanged x _ _ -> x
  PayloadDecisionFinalized r -> decisionProposalId r
  PayloadAdoptionRecorded pid _ -> pid
  PayloadConformanceRecorded r -> conformanceProposalId r
  PayloadCanonicalized r -> canonicalizationProposalId r
  PayloadVoteCast x -> voteProposal x
  PayloadDelegationSet x _ _ -> x
  PayloadGatesSet x _ _ -> x

payloadTimestampCompatible :: CanonicalEvent -> Bool
payloadTimestampCompatible e = case eventPayload e of
  PayloadDecisionFinalized _ -> eventTimestamp e >= 0
  PayloadConformanceRecorded _ -> eventTimestamp e >= 0
  PayloadCanonicalized _ -> eventTimestamp e >= 0
  _ -> eventTimestamp e == payloadTimestamp (eventPayload e)

payloadTimestamp :: CanonicalPayload -> Timestamp
payloadTimestamp p = case p of
  PayloadProposalSubmitted x -> proposalCreatedAt x
  PayloadProposalClassified _ _ t -> t
  PayloadStatusChanged _ _ t -> t
  PayloadDecisionFinalized r -> decisionSnapshotAt r
  PayloadAdoptionRecorded _ t -> t
  PayloadConformanceRecorded _ -> 0
  PayloadCanonicalized _ -> 0
  PayloadVoteCast v -> castAt v
  PayloadDelegationSet _ _ t -> t
  PayloadGatesSet _ _ t -> t

eventTypeMatchesPayload :: EventType -> CanonicalPayload -> Bool
eventTypeMatchesPayload t p = case (t,p) of
  (EProposalSubmitted, PayloadProposalSubmitted _) -> True
  (EProposalClassified, PayloadProposalClassified _ _ _) -> True
  (EStatusChanged, PayloadStatusChanged _ _ _) -> True
  (EDecisionFinalized, PayloadDecisionFinalized _) -> True
  (EAdoptionRecorded, PayloadAdoptionRecorded _ _) -> True
  (EConformanceRecorded, PayloadConformanceRecorded _) -> True
  (ECanonicalized, PayloadCanonicalized _) -> True
  (EVoteCast, PayloadVoteCast _) -> True
  (EDelegationSet, PayloadDelegationSet _ _ _) -> True
  (EGatesSet, PayloadGatesSet _ _ _) -> True
  _ -> False

unique :: Eq a => [a] -> Bool
unique xs = length xs == length (dedup xs)
  where
    dedup [] = []
    dedup (x:rest) = x : dedup (filter (/= x) rest)

predecessorValid :: Maybe CanonicalEvent -> CanonicalEvent -> Bool
predecessorValid Nothing e = predecessor e == Nothing
predecessorValid (Just p) e = predecessor e == Just (eventId p)

eventTimestampValid :: Maybe CanonicalEvent -> CanonicalEvent -> Bool
eventTimestampValid Nothing _ = True
eventTimestampValid (Just p) e = eventTimestamp e >= eventTimestamp p

eventIdentityValid :: Maybe CanonicalEvent -> CanonicalEvent -> Bool
eventIdentityValid Nothing _ = True
eventIdentityValid (Just p) e = eventId e /= eventId p

canonicalEventValid :: Maybe CanonicalEvent -> CanonicalEvent -> Bool
canonicalEventValid prev e =
  eventSchemaValid e &&
  predecessorValid prev e &&
  eventTimestampValid prev e &&
  eventIdentityValid prev e &&
  eventStatus e == AcceptedEvent
