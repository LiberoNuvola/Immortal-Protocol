module GovernanceAuthorization
  ( authorizationValid
  , evidenceValid
  , rulesetAuthorizationValid
  , canonicalGovernanceEventValid
  ) where

import Governance
import GovernanceEventSchema
import qualified GovernanceEventSchema
import RulesetRegistry
import GovernanceCommitment (commitmentMatches)

authorizationValid :: CanonicalEvent -> Bool
authorizationValid e =
  case (eventType e, actorClass e) of
    (EProposalSubmitted, Proposer)   -> True
    (EProposalClassified, System)    -> True
    (EStatusChanged, System)         -> True
    (EDecisionFinalized, System)      -> True
    (EAdoptionRecorded, System)       -> True
    (EConformanceRecorded, Reviewer) -> True
    (ECanonicalized, System)         -> True
    (EVoteCast, Voter)               -> True
    (EDelegationSet, Delegate)       -> True
    (EGatesSet, Reviewer)            -> True
    _                                -> False

evidenceValid :: CanonicalEvent -> Bool
evidenceValid e =
  not (null (evidenceRefs e)) &&
  all validEvidence (evidenceRefs e)
  where
    validEvidence (EvidenceRef x) = not (null x)

rulesetAuthorizationValid :: RulesetRegistry -> CanonicalEvent -> Bool
rulesetAuthorizationValid rs e =
  rulesetVersionRegistered (GovernanceEventSchema.rulesetVersion e) rs &&
  commitmentMatches e &&
  case activeRuleset (eventTimestamp e) rs of
    Just active ->
      rulesetVersion active == GovernanceEventSchema.rulesetVersion e &&
      rulesetCompatible
        (GovernanceEventSchema.rulesetVersion e)
        (rulesetCommitment active)
        rs
    Nothing -> False

canonicalGovernanceEventValid
  :: RulesetRegistry
  -> Maybe CanonicalEvent
  -> CanonicalEvent
  -> Bool
canonicalGovernanceEventValid rs prev e =
  canonicalEventValid prev e &&
  eventStatus e == AcceptedEvent &&
  authorizationValid e &&
  evidenceValid e &&
  rulesetAuthorizationValid rs e
