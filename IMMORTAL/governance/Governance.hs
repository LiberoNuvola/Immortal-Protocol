module Governance
  ( EntityId, ProposalId, Weight, Timestamp, Snapshot(..)
  , ProposalClass(..), ProposalStatus(..), Choice(..), Vote(..)
  , Delegation(..), GateResult(..), Proposal(..)
  , GovernanceState(..), GovernanceEvent(..), emptyState
  , communityReviewSeconds, votingSeconds, finalitySeconds, emergencySeconds
  , snapshotValid, snapshotWeight, eligibleWeight, voteWeight
  , effectiveVoteWeight, participatingWeight, quorumReached
  , approvalReached, gatesPassed, delegationValid, delegatedWeight
  , delegationConserves, transition, communityReviewOpen, voteWindowOpen
  , finalityWindowOpen, emergencyActive, emergencyExpired
  , applyEvent, replay
  ) where

type EntityId = Integer
type ProposalId = Integer
type Weight = Integer
type Timestamp = Integer

data Snapshot = Snapshot
  { snapshotId :: Integer
  , snapshotAt :: Timestamp
  , snapshotWeights :: [(EntityId, Weight)]
  } deriving (Eq, Show)

data ProposalClass
  = DocumentationOnly | VerificationTooling | Adapter | Application
  | Specification | ConstitutionalKernel | Emergency
  deriving (Eq, Show)

data ProposalStatus
  = Draft | Proposed | Classified | ImpactReview | EvidenceReview
  | CommunityReview | Voting | DecisionRecorded | Accepted | Rejected
  | Adopted | Canonical | ReturnedForRevision | Expired | Cancelled
  | EmergencyReview
  deriving (Eq, Show)

data Choice = For | Against | Abstain deriving (Eq, Show)

data Vote = Vote
  { voteProposal :: ProposalId
  , voter :: EntityId
  , choice :: Choice
  , castAt :: Timestamp
  } deriving (Eq, Show)

data Delegation = Delegation
  { delegator :: EntityId
  , delegate :: EntityId
  } deriving (Eq, Show)

data GateResult = GateResult
  { evidenceGate :: Bool
  , compatibilityGate :: Bool
  , conformanceGate :: Bool
  , applicationConformanceGate :: Bool
  } deriving (Eq, Show)

data Proposal = Proposal
  { proposalId :: ProposalId
  , proposalClass :: ProposalClass
  , proposalSnapshot :: Snapshot
  , proposalCreatedAt :: Timestamp
  , communityReviewOpenedAt :: Maybe Timestamp
  , votingOpenedAt :: Maybe Timestamp
  , votingClosedAt :: Maybe Timestamp
  , finalizationAt :: Maybe Timestamp
  , emergencyActivatedAt :: Maybe Timestamp
  , proposalVotes :: [Vote]
  , proposalDelegations :: [Delegation]
  , proposalGates :: GateResult
  , proposalStatus :: ProposalStatus
  } deriving (Eq, Show)

data GovernanceState = GovernanceState
  { stateVersion :: Integer
  , proposals :: [Proposal]
  , eventsApplied :: Integer
  } deriving (Eq, Show)

data GovernanceEvent
  = ProposalSubmitted Proposal
  | ProposalClassified ProposalId ProposalClass
  | StatusChanged ProposalId ProposalStatus Timestamp
  | VoteCast Vote
  | DelegationSet ProposalId Delegation Timestamp
  | GatesSet ProposalId GateResult
  deriving (Eq, Show)

emptyState :: GovernanceState
emptyState = GovernanceState 1 [] 0

communityReviewSeconds, votingSeconds, finalitySeconds, emergencySeconds :: Timestamp
communityReviewSeconds = 7 * 24 * 60 * 60
votingSeconds = 5 * 24 * 60 * 60
finalitySeconds = 3 * 24 * 60 * 60
emergencySeconds = 72 * 60 * 60

snapshotValid :: Snapshot -> Bool
snapshotValid (Snapshot _ at ws) =
  at >= 0 && all (\(_,w) -> w > 0) ws && distinct [e | (e,_) <- ws]

snapshotWeight :: Snapshot -> EntityId -> Weight
snapshotWeight (Snapshot _ _ ws) e =
  case [w | (e',w) <- ws, e' == e] of
    [w] -> w
    _ -> 0

eligibleWeight :: Snapshot -> Weight
eligibleWeight (Snapshot _ _ ws) = sum (map snd ws)

voteWeight :: Snapshot -> Vote -> Weight
voteWeight s v = snapshotWeight s (voter v)

delegatedWeight :: Snapshot -> [Delegation] -> EntityId -> Weight
delegatedWeight s ds target =
  sum [snapshotWeight s (delegator d) | d <- ds, delegate d == target]

effectiveVoteWeight :: Snapshot -> [Delegation] -> Vote -> Weight
effectiveVoteWeight s ds v =
  snapshotWeight s (voter v) + delegatedWeight s ds (voter v)

participatingWeight :: Snapshot -> [Delegation] -> [Vote] -> Weight
participatingWeight s ds vs =
  sum [effectiveVoteWeight s ds v | v <- vs]

quorumReached :: Snapshot -> [Delegation] -> [Vote] -> Bool
quorumReached s ds vs =
  snapshotValid s &&
  delegationConserves s ds &&
  eligibleWeight s > 0 &&
  4 * participatingWeight s ds vs >= eligibleWeight s

approvalReached :: ProposalClass -> Snapshot -> [Delegation] -> [Vote] -> Bool
approvalReached cls s ds vs =
  snapshotValid s &&
  delegationConserves s ds &&
  let y = sum [effectiveVoteWeight s ds v | v <- vs, choice v == For]
      n = sum [effectiveVoteWeight s ds v | v <- vs, choice v == Against]
      d = y + n
  in d > 0 && case cls of
       ConstitutionalKernel -> 3 * y >= 2 * d
       _ -> 2 * y > d

gatesPassed :: ProposalClass -> GateResult -> Bool
gatesPassed cls g = case cls of
  ConstitutionalKernel ->
    evidenceGate g && compatibilityGate g && conformanceGate g
  Application -> applicationConformanceGate g
  _ -> True

delegationValid :: Snapshot -> [Delegation] -> Bool
delegationValid s ds =
  snapshotValid s &&
  distinct [delegator d | d <- ds] &&
  all validOne ds &&
  not (cycleExists ds)
  where
    validOne d =
      delegator d /= delegate d &&
      snapshotWeight s (delegator d) > 0 &&
      snapshotWeight s (delegate d) > 0 &&
      not (any (\x -> delegator x == delegate d) ds)

delegationConserves :: Snapshot -> [Delegation] -> Bool
delegationConserves s ds =
  delegationValid s ds &&
  sum [snapshotWeight s (delegator d) | d <- ds] ==
  sum [delegatedWeight s ds (delegate d) | d <- ds]

distinct :: Eq a => [a] -> Bool
distinct xs = length xs == length (unique xs)

unique :: Eq a => [a] -> [a]
unique [] = []
unique (x:xs) = x : unique (filter (/= x) xs)

cycleExists :: [Delegation] -> Bool
cycleExists ds = any (\d -> reaches (delegate d) (delegator d) ds) ds

reaches :: EntityId -> EntityId -> [Delegation] -> Bool
reaches from target ds =
  from == target ||
  any (\d -> delegator d == from && reaches (delegate d) target ds) ds

communityReviewOpen :: Proposal -> Timestamp -> Bool
communityReviewOpen p now =
  case communityReviewOpenedAt p of
    Just t -> now >= t && now < t + communityReviewSeconds
    Nothing -> False

voteWindowOpen :: Proposal -> Timestamp -> Bool
voteWindowOpen p now =
  case votingOpenedAt p of
    Just t -> now >= t && now < t + votingSeconds
    Nothing -> False

finalityWindowOpen :: Proposal -> Timestamp -> Bool
finalityWindowOpen p now =
  case votingClosedAt p of
    Just t -> now >= t && now < t + finalitySeconds
    Nothing -> False

emergencyActive :: Proposal -> Timestamp -> Bool
emergencyActive p now =
  case emergencyActivatedAt p of
    Just t -> now >= t && now < t + emergencySeconds
    Nothing -> False

emergencyExpired :: Proposal -> Timestamp -> Bool
emergencyExpired p now =
  case emergencyActivatedAt p of
    Just t -> now >= t + emergencySeconds
    Nothing -> False

transition :: ProposalStatus -> ProposalStatus -> Bool
transition a b = case (a,b) of
  (Draft,Proposed) -> True
  (Proposed,Classified) -> True
  (Classified,ImpactReview) -> True
  (ImpactReview,EvidenceReview) -> True
  (EvidenceReview,CommunityReview) -> True
  (CommunityReview,Voting) -> True
  (Voting,DecisionRecorded) -> True
  (DecisionRecorded,Accepted) -> True
  (DecisionRecorded,Rejected) -> True
  (Accepted,Adopted) -> True
  (Adopted,Canonical) -> True
  (Proposed,ReturnedForRevision) -> True
  (Classified,ReturnedForRevision) -> True
  (ImpactReview,ReturnedForRevision) -> True
  (EvidenceReview,ReturnedForRevision) -> True
  (CommunityReview,ReturnedForRevision) -> True
  (Voting,Expired) -> True
  (Draft,Cancelled) -> True
  (Proposed,Cancelled) -> True
  (EmergencyReview,Voting) -> True
  (EmergencyReview,DecisionRecorded) -> True
  _ -> False

updateProposal :: ProposalId -> (Proposal -> Proposal) -> [Proposal]
              -> Either String [Proposal]
updateProposal pid f ps =
  if any ((== pid) . proposalId) ps
  then Right [if proposalId p == pid then f p else p | p <- ps]
  else Left "proposal not found"

applyEvent :: GovernanceState -> GovernanceEvent
           -> Either String GovernanceState
applyEvent st ev = case ev of
  ProposalSubmitted p ->
    if snapshotValid (proposalSnapshot p) &&
       not (any ((== proposalId p) . proposalId) (proposals st))
    then Right st { proposals = proposals st ++ [p]
                  , eventsApplied = eventsApplied st + 1 }
    else Left "invalid or duplicate proposal"

  ProposalClassified pid cls -> do
    ps <- updateProposal pid
      (\p -> if proposalStatus p == Proposed
             then p { proposalClass = cls, proposalStatus = Classified }
             else p)
      (proposals st)
    case [p | p <- ps, proposalId p == pid, proposalStatus p == Classified] of
      [_] -> Right st { proposals = ps, eventsApplied = eventsApplied st + 1 }
      _ -> Left "classification is accepted only from Proposed"

  StatusChanged pid next at -> do
    ps <- updateProposal pid
      (\p -> if statusChangeAllowed p next
             then recordTime p next at
             else p)
      (proposals st)
    case [p | p <- ps, proposalId p == pid, proposalStatus p == next] of
      [_] -> Right st { proposals = ps, eventsApplied = eventsApplied st + 1 }
      _ -> Left "invalid lifecycle transition or unmet governance gates"

statusChangeAllowed :: Proposal -> ProposalStatus -> Bool
statusChangeAllowed p next =
  transition (proposalStatus p) next &&
  case next of
    Accepted ->
      quorumReached
        (proposalSnapshot p)
        (proposalDelegations p)
        (proposalVotes p) &&
      approvalReached
        (proposalClass p)
        (proposalSnapshot p)
        (proposalDelegations p)
        (proposalVotes p) &&
      gatesPassed (proposalClass p) (proposalGates p)
    Adopted -> proposalStatus p == Accepted
    Canonical -> proposalStatus p == Adopted
    _ -> True

  VoteCast v -> do
    ps <- updateProposal (voteProposal v)
      (\p -> if proposalStatus p == Voting &&
                 voteWindowOpen p (castAt v) &&
                 snapshotWeight (proposalSnapshot p) (voter v) > 0 &&
                 not (any ((== voter v) . voter) (proposalVotes p)) &&
                 not (any ((== voter v) . delegator) (proposalDelegations p))
             then p { proposalVotes = proposalVotes p ++ [v] }
             else p)
      (proposals st)
    case [p | p <- ps, proposalId p == voteProposal v,
                    any (==v) (proposalVotes p)] of
      [_] -> Right st { proposals = ps, eventsApplied = eventsApplied st + 1 }
      _ -> Left "vote rejected: ineligible, delegated, late, or duplicate"

  DelegationSet pid d at -> do
    ps <- updateProposal pid
      (\p -> if proposalStatus p == Voting &&
                voteWindowOpen p at &&
                delegationValid (proposalSnapshot p) (proposalDelegations p ++ [d]) &&
                not (any ((== delegate d) . voter) (proposalVotes p))
             then p { proposalDelegations = proposalDelegations p ++ [d] }
             else p)
      (proposals st)
    case [p | p <- ps, proposalId p == pid,
                    any (==d) (proposalDelegations p)] of
      [_] -> Right st { proposals = ps, eventsApplied = eventsApplied st + 1 }
      _ -> Left "delegation rejected"

  GatesSet pid g -> do
    ps <- updateProposal pid
      (\p -> if proposalStatus p `elem` [EvidenceReview, CommunityReview]
             then p { proposalGates = g }
             else p)
      (proposals st)
    case [p | p <- ps, proposalId p == pid, proposalGates p == g] of
      [_] -> Right st { proposals = ps, eventsApplied = eventsApplied st + 1 }
      _ -> Left "gate update rejected outside evidence/community review"

recordTime :: Proposal -> ProposalStatus -> Timestamp -> Proposal
recordTime p s at = case s of
  CommunityReview -> p { proposalStatus = s, communityReviewOpenedAt = Just at }
  Voting -> p { proposalStatus = s, votingOpenedAt = Just at }
  DecisionRecorded ->
    p { proposalStatus = s
      , votingClosedAt = Just at
      , finalizationAt = Just (at + finalitySeconds) }
  EmergencyReview -> p { proposalStatus = s, emergencyActivatedAt = Just at }
  _ -> p { proposalStatus = s }

replay :: GovernanceState -> [GovernanceEvent]
       -> Either String GovernanceState
replay = foldl step . Right
  where
    step acc e = do
      s <- acc
      applyEvent s e
