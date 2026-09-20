module GovernanceCanonicalSerialization
  ( canonicalPayloadBytes, canonicalEventBytes ) where

import GovernanceEventSchema
import Data.List (intercalate)

canonicalPayloadBytes :: CanonicalPayload -> String
canonicalPayloadBytes = canonicalPayloadText

canonicalEventBytes :: CanonicalEvent -> String
canonicalEventBytes e = intercalate ";" [
  "event_id=" ++ eventId e,
  "proposal_id=" ++ show (eventProposalId e),
  "ruleset_version=" ++ show (rulesetVersion e),
  "event_type=" ++ show (eventType e),
  "actor_class=" ++ show (actorClass e),
  "timestamp=" ++ show (eventTimestamp e),
  "payload=" ++ canonicalPayloadBytes (eventPayload e),
  "payload_commitment=" ++ payloadCommitment e,
  "predecessor=" ++ maybe "" id (predecessor e),
  "evidence_refs=" ++ show (evidenceRefs e),
  "status=" ++ show (eventStatus e)]
