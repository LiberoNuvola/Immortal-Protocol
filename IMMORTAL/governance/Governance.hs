module Governance where

type EntityId = Integer
type ProposalId = Integer
type Snapshot = [(EntityId, Integer)]

data ProposalClass = DocumentationOnly | VerificationTooling | Adapter | Application | Specification | ConstitutionalKernel | Emergency deriving (Eq, Show)
data ProposalStatus = Draft | Proposed | Classified | ImpactReview | EvidenceReview | CommunityReview | Voting | DecisionRecorded | Accepted | Rejected | Adopted | Canonical | ReturnedForRevision | Expired | Cancelled | EmergencyReview deriving (Eq, Show)
data Choice = For | Against | Abstain deriving (Eq, Show)
data Vote = Vote { voter :: EntityId, choice :: Choice } deriving (Eq, Show)
data Delegation = Delegation { delegator :: EntityId, delegate :: EntityId } deriving (Eq, Show)
data GateResult = GateResult { evidenceGate :: Bool, compatibilityGate :: Bool, conformanceGate :: Bool, applicationConformanceGate :: Bool } deriving (Eq, Show)
data Proposal = Proposal { proposalId :: ProposalId, proposalClass :: ProposalClass, proposalSnapshot :: Snapshot, proposalVotes :: [Vote], proposalDelegations :: [Delegation], proposalGates :: GateResult, proposalStatus :: ProposalStatus } deriving (Eq, Show)
data GovernanceState = GovernanceState { stateVersion :: Integer, proposals :: [Proposal], eventsApplied :: Integer } deriving (Eq, Show)
data GovernanceEvent = ProposalSubmitted Proposal | ProposalClassified ProposalId ProposalClass | StatusChanged ProposalId ProposalStatus | VoteCast ProposalId Vote | DelegationSet ProposalId Delegation | GatesSet ProposalId GateResult deriving (Eq, Show)

emptyState = GovernanceState 1 [] 0

snapshotWeight s e = case lookup e s of Just x -> x; Nothing -> 0
voteWeight s v = snapshotWeight s (voter v)

quorumReached s vs =
  let eligible = sum [x | (_,x) <- s]
      participating = sum [voteWeight s v | v <- vs]
  in eligible > 0 && participating * 4 >= eligible

approvalReached c s vs =
  let yes = sum [voteWeight s v | v <- vs, choice v == For]
      no = sum [voteWeight s v | v <- vs, choice v == Against]
      d = yes + no
  in d > 0 && case c of
       ConstitutionalKernel -> yes * 3 >= d * 2
       _ -> yes * 2 > d

gatesPassed c g = case c of
  ConstitutionalKernel -> evidenceGate g && compatibilityGate g && conformanceGate g
  Application -> applicationConformanceGate g
  _ -> True

ordinaryAccepted p = quorumReached (proposalSnapshot p) (proposalVotes p) &&
  approvalReached (proposalClass p) (proposalSnapshot p) (proposalVotes p) &&
  gatesPassed (proposalClass p) (proposalGates p)

kernelAccepted p = proposalClass p == ConstitutionalKernel &&
  quorumReached (proposalSnapshot p) (proposalVotes p) &&
  approvalReached ConstitutionalKernel (proposalSnapshot p) (proposalVotes p) &&
  gatesPassed ConstitutionalKernel (proposalGates p)

transition a b = case (a,b) of
  (Draft,Proposed) -> True; (Proposed,Classified) -> True
  (Classified,ImpactReview) -> True; (ImpactReview,EvidenceReview) -> True
  (EvidenceReview,CommunityReview) -> True; (CommunityReview,Voting) -> True
  (Voting,DecisionRecorded) -> True; (DecisionRecorded,Accepted) -> True
  (DecisionRecorded,Rejected) -> True; (Accepted,Adopted) -> True
  (Adopted,Canonical) -> True; (Proposed,ReturnedForRevision) -> True
  (Classified,ReturnedForRevision) -> True; (ImpactReview,ReturnedForRevision) -> True
  (EvidenceReview,ReturnedForRevision) -> True; (CommunityReview,ReturnedForRevision) -> True
  (Voting,Expired) -> True; (Draft,Cancelled) -> True; (Proposed,Cancelled) -> True
  (EmergencyReview,Voting) -> True; (EmergencyReview,DecisionRecorded) -> True
  _ -> False

updateProposal pid f ps =
  if any ((== pid) . proposalId) ps
  then Right [if proposalId p == pid then f p else p | p <- ps]
  else Left "proposal not found"

applyEvent st ev = case ev of
  ProposalSubmitted p ->
    if any ((== proposalId p) . proposalId) (proposals st) then Left "proposal already exists"
    else Right st { proposals = proposals st ++ [p], eventsApplied = eventsApplied st + 1 }
  ProposalClassified pid cls -> do
    ps <- updateProposal pid (\p -> if proposalStatus p == Proposed then p {proposalClass=cls, proposalStatus=Classified} else p) (proposals st)
    case [p | p <- ps, proposalId p == pid, proposalStatus p == Classified] of
      [_] -> Right st {proposals=ps, eventsApplied=eventsApplied st+1}
      _ -> Left "classification is accepted only from Proposed"
  StatusChanged pid next -> do
    ps <- updateProposal pid (\p -> if transition (proposalStatus p) next then p {proposalStatus=next} else p) (proposals st)
    case [p | p <- ps, proposalId p == pid, proposalStatus p == next] of
      [_] -> Right st {proposals=ps, eventsApplied=eventsApplied st+1}
      _ -> Left "invalid lifecycle transition"
  VoteCast pid v -> do
    ps <- updateProposal pid (\p -> if proposalStatus p == Voting && not (any ((== voter v) . voter) (proposalVotes p))
      then p {proposalVotes=proposalVotes p ++ [v]} else p) (proposals st)
    case [p | p <- ps, proposalId p == pid, any (==v) (proposalVotes p)] of
      [_] -> Right st {proposals=ps, eventsApplied=eventsApplied st+1}
      _ -> Left "vote is accepted only once per voter during Voting"
  DelegationSet pid d -> do
    ps <- updateProposal pid (\p -> if proposalStatus p == Voting then p {proposalDelegations=proposalDelegations p ++ [d]} else p) (proposals st)
    case [p | p <- ps, proposalId p == pid, any (==d) (proposalDelegations p)] of
      [_] -> Right st {proposals=ps, eventsApplied=eventsApplied st+1}
      _ -> Left "delegation is accepted only during Voting"
  GatesSet pid g -> do
    ps <- updateProposal pid (\p -> p {proposalGates=g}) (proposals st)
    Right st {proposals=ps, eventsApplied=eventsApplied st+1}

replay st = foldl step (Right st) where
  step acc ev = do s <- acc; applyEvent s ev
