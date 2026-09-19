module Governance
  ( EntityId
  , ProposalId
  , Snapshot
  , ProposalClass (..)
  , ProposalStatus (..)
  , Choice (..)
  , Vote (..)
  , Delegation (..)
  , GateResult (..)
  , Proposal (..)
  , GovernanceState (..)
  , GovernanceEvent (..)
  , emptyState
  , snapshotWeight
  , voteWeight
  , quorumReached
  , approvalReached
  , gatesPassed
  , ordinaryAccepted
  , kernelAccepted
  , transition
  , applyEvent
  , replay
  ) where

type EntityId = Integer
type ProposalId = Integer
type Snapshot = [(EntityId, Integer)]

data ProposalClass
  = DocumentationOnly
  | VerificationTooling
  | Adapter
  | Application
  | Specification
  | ConstitutionalKernel
  | Emergency
  deriving (Eq, Show)

data ProposalStatus
  = Draft
  | Proposed
  | Classified
  | ImpactReview
  | EvidenceReview
  | CommunityReview
  | Voting
  | DecisionRecorded
  | Accepted
  | Rejected
  | Adopted
  | Canonical
  | ReturnedForRevision
  | Expired
  | Cancelled
  | EmergencyReview
  deriving (Eq, Show)

data Choice = For | Against | Abstain
  deriving (Eq, Show)

data Vote = Vote
  { voter :: EntityId
  , choice :: Choice
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
  | StatusChanged ProposalId ProposalStatus
  | VoteCast ProposalId Vote
  | DelegationSet ProposalId Delegation
  | GatesSet ProposalId GateResult
  deriving (Eq, Show)

emptyState :: GovernanceState
emptyState = GovernanceState 1 [] 0

snapshotWeight :: Snapshot -> EntityId -> Integer
snapshotWeight snapshot entity =
  case lookup entity snapshot of
    Just amount -> amount
    Nothing -> 0

voteWeight :: Snapshot -> Vote -> Integer
voteWeight snapshot v = snapshotWeight snapshot (voter v)

quorumReached :: Snapshot -> [Vote] -> Bool
quorumReached snapshot votes =
  let eligible = sum [amount | (_, amount) <- snapshot]
      participating =
        sum [voteWeight snapshot v | v <- votes]
  in eligible > 0 && participating * 4 >= eligible

approvalReached :: ProposalClass -> Snapshot -> [Vote] -> Bool
approvalReached cls snapshot votes =
  let yes = sum [voteWeight snapshot v | v <- votes, choice v == For]
      no  = sum [voteWeight snapshot v | v <- votes, choice v == Against]
      denominator = yes + no
  in denominator > 0 &&
     case cls of
       ConstitutionalKernel -> yes * 3 >= denominator * 2
       _                    -> yes * 2 > denominator

gatesPassed :: ProposalClass -> GateResult -> Bool
gatesPassed cls gates =
  case cls of
    ConstitutionalKernel ->
      evidenceGate gates &&
      compatibilityGate gates &&
      conformanceGate gates
    Application ->
      applicationConformanceGate gates
    _ -> True

ordinaryAccepted :: Proposal -> Bool
ordinaryAccepted p =
  quorumReached (proposalSnapshot p) (proposalVotes p) &&
  approvalReached
    (proposalClass p)
    (proposalSnapshot p)
    (proposalVotes p) &&
  gatesPassed (proposalClass p) (proposalGates p)

kernelAccepted :: Proposal -> Bool
kernelAccepted p =
  proposalClass p == ConstitutionalKernel &&
  quorumReached (proposalSnapshot p) (proposalVotes p) &&
  approvalReached
    ConstitutionalKernel
    (proposalSnapshot p)
    (proposalVotes p) &&
  gatesPassed ConstitutionalKernel (proposalGates p)

transition :: ProposalStatus -> ProposalStatus -> Bool
transition from to =
  case (from, to) of
    (Draft, Proposed) -> True
    (Proposed, Classified) -> True
    (Classified, ImpactReview) -> True
    (ImpactReview, EvidenceReview) -> True
    (EvidenceReview, CommunityReview) -> True
    (CommunityReview, Voting) -> True
    (Voting, DecisionRecorded) -> True
    (DecisionRecorded, Accepted) -> True
    (DecisionRecorded, Rejected) -> True
    (Accepted, Adopted) -> True
    (Adopted, Canonical) -> True
    (Proposed, ReturnedForRevision) -> True
    (Classified, ReturnedForRevision) -> True
    (ImpactReview, ReturnedForRevision) -> True
    (EvidenceReview, ReturnedForRevision) -> True
    (CommunityReview, ReturnedForRevision) -> True
    (Voting, Expired) -> True
    (Draft, Cancelled) -> True
    (Proposed, Cancelled) -> True
    (EmergencyReview, Voting) -> True
    (EmergencyReview, DecisionRecorded) -> True
    _ -> False

updateProposal :: ProposalId
              -> (Proposal -> Proposal)
              -> [Proposal]
              -> Either String [Proposal]
updateProposal pid f ps =
  if any ((== pid) . proposalId) ps
    then Right [if proposalId p == pid then f p else p | p <- ps]
    else Left "proposal not found"

applyEvent :: GovernanceState
           -> GovernanceEvent
           -> Either String GovernanceState
applyEvent st event =
  case event of
    ProposalSubmitted p ->
      if any ((== proposalId p) . proposalId) (proposals st)
        then Left "proposal already exists"
        else Right st
          { proposals = proposals st ++ [p]
          , eventsApplied = eventsApplied st + 1
          }

    ProposalClassified pid cls -> do
      ps <- updateProposal pid
        (\p -> p
          { proposalClass = cls
          , proposalStatus = Classified
          })
        (proposals st)
      Right st
        { proposals = ps
        , eventsApplied = eventsApplied st + 1
        }

    StatusChanged pid next -> do
      ps <- updateProposal pid
        (\p ->
          if transition (proposalStatus p) next
            then p { proposalStatus = next }
            else p)
        (proposals st)
      case [p | p <- ps, proposalId p == pid] of
        [p] | proposalStatus p == next ->
          Right st
            { proposals = ps
            , eventsApplied = eventsApplied st + 1
            }
        _ -> Left "invalid lifecycle transition"

    VoteCast pid v -> do
      ps <- updateProposal pid
        (\p ->
          if proposalStatus p == Voting
            then p { proposalVotes = proposalVotes p ++ [v] }
            else p)
        (proposals st)
      case [p | p <- ps, proposalId p == pid] of
        [p] | any (== v) (proposalVotes p) ->
          Right st
            { proposals = ps
            , eventsApplied = eventsApplied st + 1
            }
        _ -> Left "votes are accepted only during Voting"

    DelegationSet pid d -> do
      ps <- updateProposal pid
        (\p ->
          if proposalStatus p == Voting
            then p
              { proposalDelegations =
                  proposalDelegations p ++ [d]
              }
            else p)
        (proposals st)
      case [p | p <- ps, proposalId p == pid] of
        [p] | any (== d) (proposalDelegations p) ->
          Right st
            { proposals = ps
            , eventsApplied = eventsApplied st + 1
            }
        _ -> Left "delegation is accepted only during Voting"

    GatesSet pid g -> do
      ps <- updateProposal pid
        (\p -> p { proposalGates = g })
        (proposals st)
      Right st
        { proposals = ps
        , eventsApplied = eventsApplied st + 1
        }

replay :: GovernanceState
       -> [GovernanceEvent]
       -> Either String GovernanceState
replay = foldl step . Right
  where
    step acc event = do
      st <- acc
      applyEvent st event
