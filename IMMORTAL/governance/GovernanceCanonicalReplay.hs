module GovernanceCanonicalReplay
  ( replayCanonical, applyCanonicalEvent, canonicalPayloadToGovernanceEvent
  , canonicalLifecycleAdmission
  ) where

import Governance
import GovernanceEventSchema
import GovernanceAuthorization
import RulesetRegistry
import GovernanceDecisionWitness (DecisionRecord(..), decisionRecordValid, finalizationReady)
import GovernanceConformanceWitness (ConformanceRecord(..), conformanceRecordValid)
import GovernanceCanonicalizationWitness (CanonicalizationRecord(..), canonicalizationRecordValid, canonicalizationRequiresConformance)
import GovernanceConformance (lifecycleEventAdmissible)

canonicalPayloadToGovernanceEvent :: CanonicalPayload -> Maybe GovernanceEvent
canonicalPayloadToGovernanceEvent p = case p of
  PayloadProposalSubmitted x -> Just (ProposalSubmitted x)
  PayloadProposalClassified pid cls _ -> Just (ProposalClassified pid cls)
  PayloadStatusChanged pid st at -> Just (StatusChanged pid st at)
  PayloadVoteCast v -> Just (VoteCast v)
  PayloadDelegationSet pid d at -> Just (DelegationSet pid d at)
  PayloadGatesSet pid g _ -> Just (GatesSet pid g)
  PayloadDecisionFinalized _ -> Nothing
  PayloadAdoptionRecorded _ _ -> Nothing
  PayloadConformanceRecorded _ -> Nothing
  PayloadCanonicalized _ -> Nothing

-- Canonical replay must not silently collapse the GOV-18 lifecycle
-- into the legacy DecisionRecorded -> Accepted -> Adopted -> Canonical
-- state chain. Until distinct canonical lifecycle constructors exist,
-- those collapsed terminal states are inadmissible at this boundary.
canonicalLifecycleAdmission :: GovernanceState -> CanonicalEvent -> Bool
canonicalLifecycleAdmission st ce =
  case eventPayload ce of
    PayloadStatusChanged pid next at ->
      not (next == Accepted || next == Adopted || next == Canonical) &&
      lifecycleEventAdmissible st pid next at
    _ -> True

applyCanonicalEvent :: RulesetRegistry -> GovernanceState -> Maybe CanonicalEvent
                    -> CanonicalEvent -> Either String GovernanceState
applyCanonicalEvent rs st prev ce
  | not (canonicalGovernanceEventValid rs prev ce) =
      Left "canonical governance event invalid"
  | not (canonicalLifecycleAdmission st ce) =
      Left "legacy collapsed lifecycle state is not a canonical event"
  | otherwise =
      case eventPayload ce of
        PayloadDecisionFinalized r -> applyDecisionFinalized st r (eventTimestamp ce)
        PayloadAdoptionRecorded pid at -> applyAdoptionRecorded st pid at
        PayloadConformanceRecorded r -> applyConformanceRecorded st r (eventTimestamp ce)
        PayloadCanonicalized r -> applyCanonicalized st prev r (eventTimestamp ce)
        _ -> case canonicalPayloadToGovernanceEvent (eventPayload ce) of
          Just ge -> applyEvent st ge
          Nothing -> Left "canonical event requires a dedicated replay handler"

applyDecisionFinalized :: GovernanceState -> DecisionRecord -> Timestamp -> Either String GovernanceState
applyDecisionFinalized st r at = do
  p <- case [p | p <- proposals st, proposalId p == decisionProposalId r] of
         [p] -> Right p
         _ -> Left "decision finalization proposal not found"
  if proposalStatus p /= DecisionRecorded
     then Left "decision finalization requires DecisionRecorded state"
     else if not (decisionRecordValid p r)
       then Left "decision finalization witness invalid"
       else if not (finalizationReady p (decisionChallenges r) at)
         then Left "decision finalization prerequisites not satisfied"
         else Right st { proposals = [ if proposalId p' == proposalId p
                                      then p' { finalizationAt = Just at, proposalStatus = decisionFinalOutcome r }
                                      else p'
                                    | p' <- proposals st ]
                       , eventsApplied = eventsApplied st + 1
                       }

applyAdoptionRecorded :: GovernanceState -> ProposalId -> Timestamp -> Either String GovernanceState
applyAdoptionRecorded st pid at = do
  p <- case [p | p <- proposals st, proposalId p == pid] of
         [p] -> Right p
         _ -> Left "adoption proposal not found"
  if proposalStatus p /= Accepted
     then Left "adoption requires Accepted projection state"
     else case finalizationAt p of
       Nothing -> Left "adoption requires prior decision finalization"
       Just finalizedAt ->
         if at < finalizedAt
           then Left "adoption timestamp precedes decision finalization"
           else Right st { proposals = [ if proposalId p' == pid
                                      then p' { proposalStatus = Adopted }
                                      else p'
                                    | p' <- proposals st ]
                       , eventsApplied = eventsApplied st + 1
                       }

replayCanonical :: RulesetRegistry -> GovernanceState -> [CanonicalEvent]
                -> Either String GovernanceState
replayCanonical rs = go [] Nothing
  where
    go _ _ st [] = Right st
    go history prev st (ce:rest) = do
      st' <- applyCanonicalEvent rs st prev ce
      case eventPayload ce of
        PayloadCanonicalized r ->
          if canonicalizationDecisionReferenceMatches history r
            then go (ce : history) (Just ce) st' rest
            else Left "canonicalization decision-record reference does not match finalized DecisionRecord"
        _ -> go (ce : history) (Just ce) st' rest

canonicalizationDecisionReferenceMatches :: [CanonicalEvent] -> CanonicalizationRecord -> Bool
canonicalizationDecisionReferenceMatches history r =
  case [ d
       | ce <- history
       , PayloadDecisionFinalized d <- [eventPayload ce]
       , decisionProposalId d == canonicalizationProposalId r
       ] of
    [d] -> decisionCanonicalizationReference d == canonicalizationDecisionRecordReference r
    _ -> False


applyConformanceRecorded :: GovernanceState -> ConformanceRecord -> Timestamp -> Either String GovernanceState
applyConformanceRecorded st r _at = do
  p <- case [p | p <- proposals st, proposalId p == conformanceProposalId r] of
         [p] -> Right p
         _ -> Left "conformance proposal not found"
  if proposalStatus p /= Adopted
     then Left "conformance requires Adopted projection state"
     else if not (conformanceRecordValid p r)
       then Left "conformance witness invalid"
       else Right st { eventsApplied = eventsApplied st + 1 }


applyCanonicalized :: GovernanceState -> Maybe CanonicalEvent -> CanonicalizationRecord -> Timestamp -> Either String GovernanceState
applyCanonicalized st prev r at = do
  p <- case [p | p <- proposals st, proposalId p == canonicalizationProposalId r] of
         [p] -> Right p
         _ -> Left "canonicalization proposal not found"
  if proposalStatus p /= Adopted
     then Left "canonicalization requires Adopted projection state"
     else if not (canonicalizationRecordValid p r)
       then Left "canonicalization witness invalid"
       else if not (canonicalizationPredecessorValid p prev)
         then Left "canonicalization predecessor/gate sequence invalid"
         else if not (canonicalizationTimestampValid prev at)
           then Left "canonicalization timestamp precedes predecessor event"
           else Right st { proposals = [ if proposalId p' == proposalId p
                                      then p' { proposalStatus = Canonical }
                                      else p'
                                    | p' <- proposals st ]
                       , eventsApplied = eventsApplied st + 1
                       }
  where
    canonicalizationPredecessorValid p Nothing =
      not (canonicalizationRequiresConformance (proposalClass p))
    canonicalizationPredecessorValid p (Just ce) =
      case eventPayload ce of
        PayloadConformanceRecorded cr ->
          not (canonicalizationRequiresConformance (proposalClass p)) ||
          conformanceProposalId cr == proposalId p
        _ -> not (canonicalizationRequiresConformance (proposalClass p))

    canonicalizationTimestampValid Nothing _ = True
    canonicalizationTimestampValid (Just ce) t = t >= eventTimestamp ce

