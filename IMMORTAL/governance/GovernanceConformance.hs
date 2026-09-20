module GovernanceConformance
  ( conformanceChecklist
  , lifecycleTransitionValid
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

challengeSetValid :: Proposal -> [Challenge] -> Bool
challengeSetValid = validChallenges
