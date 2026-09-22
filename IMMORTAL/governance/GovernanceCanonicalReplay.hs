module GovernanceCanonicalReplay
  ( replayCanonical, applyCanonicalEvent, canonicalPayloadToGovernanceEvent ) where

import Governance
import GovernanceEventSchema
import GovernanceAuthorization
import RulesetRegistry

canonicalPayloadToGovernanceEvent :: CanonicalPayload -> GovernanceEvent
canonicalPayloadToGovernanceEvent p = case p of
  PayloadProposalSubmitted x -> ProposalSubmitted x
  PayloadProposalClassified pid cls _ -> ProposalClassified pid cls
  PayloadStatusChanged pid st at -> StatusChanged pid st at
  PayloadVoteCast v -> VoteCast v
  PayloadDelegationSet pid d at -> DelegationSet pid d at
  PayloadGatesSet pid g _ -> GatesSet pid g

applyCanonicalEvent :: RulesetRegistry -> GovernanceState -> Maybe CanonicalEvent
                    -> CanonicalEvent -> Either String GovernanceState
applyCanonicalEvent rs st prev ce
  | not (canonicalGovernanceEventValid rs prev ce) =
      Left "canonical governance event invalid"
  | otherwise =
      applyEvent st (canonicalPayloadToGovernanceEvent (eventPayload ce))

replayCanonical :: RulesetRegistry -> GovernanceState -> [CanonicalEvent]
                -> Either String GovernanceState
replayCanonical rs = go Nothing
  where
    go _ st [] = Right st
    go prev st (ce:rest) = do
      st' <- applyCanonicalEvent rs st prev ce
      go (Just ce) st' rest
