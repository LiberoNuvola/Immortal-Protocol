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

canonicalPayloadToGovernanceEvent :: CanonicalPayload -> GovernanceEvent
canonicalPayloadToGovernanceEvent p = case p of
  PayloadProposalSubmitted x -> ProposalSubmitted x
  PayloadProposalClassified pid cls _ -> ProposalClassified pid cls
  PayloadStatusChanged pid st at -> StatusChanged pid st at
  PayloadVoteCast v -> VoteCast v
  PayloadDelegationSet pid d at -> DelegationSet pid d at
  PayloadGatesSet pid g _ -> GatesSet pid g

-- Canonical replay must not silently collapse the GOV-18 lifecycle
-- into the legacy DecisionRecorded -> Accepted -> Adopted -> Canonical
-- state chain. Until distinct canonical lifecycle constructors exist,
-- those collapsed terminal states are inadmissible at this boundary.
canonicalLifecycleAdmission :: GovernanceState -> CanonicalEvent -> Bool
canonicalLifecycleAdmission _ ce =
  case eventPayload ce of
    PayloadStatusChanged _ st _ ->
      not (st == Accepted || st == Adopted || st == Canonical)
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
        _ -> applyEvent st (canonicalPayloadToGovernanceEvent (eventPayload ce))

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
                                      then p' { finalizationAt = Just at, proposalStatus = Accepted }
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
replayCanonical rs = go Nothing
  where
    go _ st [] = Right st
    go prev st (ce:rest) = do
      st' <- applyCanonicalEvent rs st prev ce
      go (Just ce) st' rest


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
