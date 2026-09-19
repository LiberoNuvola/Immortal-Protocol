module CanonicalEvent
  ( EventId, ProposalId, RulesetVersion, Timestamp
  , ActorClass(..), EventType(..), EventStatus(..), CanonicalEvent(..)
  , schemaValid, predecessorValid, rulesetValid, evidenceValid
  , authorizedTransition, validEvent, canonicalize, replayCanonical
  ) where

type EventId = Integer
type ProposalId = Integer
type RulesetVersion = Integer
type Timestamp = Integer

data ActorClass = GovernanceActor | Reviewer | Voter | EmergencyActor | System deriving (Eq, Show)
data EventType = ProposalCreated | ProposalClassified | ImpactReviewCompleted | EvidenceRecorded | CommunityReviewOpened | VotingOpened | VoteCast | VotingClosed | ChallengeOpened | ChallengeResolved | DecisionFinalized | AdoptionRecorded | ConformanceRecorded | Canonicalized | Rejected | ReturnedForRevision | Cancelled | EmergencyActivated | EmergencyRenewed | EmergencyExpired deriving (Eq, Show)
data EventStatus = EventProposed | EventValid | EventChallenged | EventFinal | EventRejected deriving (Eq, Show)

data CanonicalEvent = CanonicalEvent
  { eventId :: EventId, eventProposalId :: ProposalId, rulesetVersion :: RulesetVersion
  , eventType :: EventType, actorClass :: ActorClass, eventTimestamp :: Timestamp
  , payloadCommitment :: String, predecessor :: Maybe EventId, evidenceRefs :: [String]
  , eventStatus :: EventStatus
  } deriving (Eq, Show)

schemaValid :: CanonicalEvent -> Bool
schemaValid e = eventId e > 0 && eventProposalId e > 0 && rulesetVersion e > 0 && eventTimestamp e >= 0 && not (null (payloadCommitment e)) && eventStatus e /= EventRejected

predecessorValid :: CanonicalEvent -> [CanonicalEvent] -> Bool
predecessorValid e history = case predecessor e of
  Nothing -> null history
  Just pid -> not (null history) && eventId (last history) == pid && eventTimestamp e >= eventTimestamp (last history)

rulesetValid :: RulesetVersion -> CanonicalEvent -> Bool
rulesetValid active e = rulesetVersion e == active

evidenceValid :: CanonicalEvent -> Bool
evidenceValid e = case eventType e of
  CommunityReviewOpened -> not (null (evidenceRefs e))
  VotingOpened -> not (null (evidenceRefs e))
  ChallengeOpened -> not (null (evidenceRefs e))
  DecisionFinalized -> not (null (evidenceRefs e))
  Canonicalized -> not (null (evidenceRefs e))
  ConformanceRecorded -> not (null (evidenceRefs e))
  _ -> True

authorizedTransition :: CanonicalEvent -> Maybe CanonicalEvent -> Bool
authorizedTransition e Nothing = eventType e == ProposalCreated
authorizedTransition e (Just p) = case (eventType p, eventType e) of
  (ProposalCreated, ProposalClassified) -> True
  (ProposalClassified, ImpactReviewCompleted) -> True
  (ImpactReviewCompleted, EvidenceRecorded) -> True
  (EvidenceRecorded, CommunityReviewOpened) -> True
  (CommunityReviewOpened, VotingOpened) -> True
  (VotingOpened, VoteCast) -> True
  (VoteCast, VoteCast) -> True
  (VoteCast, VotingClosed) -> True
  (VotingClosed, ChallengeOpened) -> True
  (ChallengeOpened, ChallengeResolved) -> True
  (ChallengeResolved, DecisionFinalized) -> True
  (VotingClosed, DecisionFinalized) -> True
  (DecisionFinalized, AdoptionRecorded) -> True
  (AdoptionRecorded, ConformanceRecorded) -> True
  (ConformanceRecorded, Canonicalized) -> True
  (ProposalCreated, ReturnedForRevision) -> True
  (ProposalClassified, ReturnedForRevision) -> True
  (ImpactReviewCompleted, ReturnedForRevision) -> True
  (EvidenceRecorded, ReturnedForRevision) -> True
  (CommunityReviewOpened, ReturnedForRevision) -> True
  (VotingClosed, Rejected) -> True
  (VotingClosed, Cancelled) -> True
  (VotingClosed, EmergencyActivated) -> True
  (EmergencyActivated, EmergencyRenewed) -> True
  (EmergencyActivated, EmergencyExpired) -> True
  (EmergencyRenewed, EmergencyRenewed) -> True
  (EmergencyRenewed, EmergencyExpired) -> True
  _ -> False

validEvent :: RulesetVersion -> [CanonicalEvent] -> CanonicalEvent -> Bool
validEvent active history e = schemaValid e && rulesetValid active e && predecessorValid e history && evidenceValid e && authorizedTransition e (if null history then Nothing else Just (last history))

canonicalize :: RulesetVersion -> [CanonicalEvent] -> CanonicalEvent -> Either String [CanonicalEvent]
canonicalize active history e = if validEvent active history e then Right (history ++ [e { eventStatus = EventValid }]) else Left "invalid canonical event"

replayCanonical :: RulesetVersion -> [CanonicalEvent] -> Either String [CanonicalEvent]
replayCanonical active = foldl step (Right []) where
  step acc e = do h <- acc; canonicalize active h e
