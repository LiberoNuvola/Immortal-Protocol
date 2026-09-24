module GovernanceConformance
  ( conformanceChecklist
  , lifecycleTransitionValid
  , lifecycleEventAdmissible
  , eventTypeMatchesActor
  , challengeSetValid
  ) where

import Governance
import GovernanceEventSchema
import GovernanceAuthorization
import GovernanceFinality
import RulesetRegistry

conformanceChecklist :: RulesetRegistry -> Maybe CanonicalEvent -> CanonicalEvent -> Bool
conformanceChecklist rs prev e =
  canonicalGovernanceEventValid rs prev e &&
  eventTypeMatchesActor e

eventTypeMatchesActor :: CanonicalEvent -> Bool
eventTypeMatchesActor = authorizationValid

lifecycleTransitionValid :: ProposalStatus -> ProposalStatus -> Bool
lifecycleTransitionValid = transition

-- State-aware lifecycle admission for legacy StatusChanged events.
-- Dedicated GOV-18 lifecycle acts are admitted by their explicit replay handlers.
lifecycleEventAdmissible :: GovernanceState -> ProposalId -> ProposalStatus -> Timestamp -> Bool
lifecycleEventAdmissible st pid next at =
  case [p | p <- proposals st, proposalId p == pid] of
    [p] -> statusChangeAllowed p next at
    _ -> False

challengeSetValid :: Proposal -> [Challenge] -> Bool
challengeSetValid = validChallenges
