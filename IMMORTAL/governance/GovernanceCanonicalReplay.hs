module GovernanceCanonicalReplay
  ( replayCanonical, applyCanonicalEvent ) where

import Governance
import GovernanceEventSchema
import GovernanceAuthorization
import RulesetRegistry

payloadToEvent :: CanonicalEvent -> Either String GovernanceEvent
payloadToEvent _ =
  Left "semantic payload decoding must be supplied by the concrete canonical event implementation"

applyCanonicalEvent
  :: RulesetRegistry
  -> GovernanceState
  -> Maybe CanonicalEvent
  -> CanonicalEvent
  -> Either String GovernanceState
applyCanonicalEvent rs st prev ce = do
  if not (canonicalGovernanceEventValid rs prev ce)
    then Left "canonical governance event invalid"
    else payloadToEvent ce >>= applyEvent st

replayCanonical
  :: RulesetRegistry
  -> GovernanceState
  -> [CanonicalEvent]
  -> Either String GovernanceState
replayCanonical rs = go Nothing
  where
    go _ st [] = Right st
    go prev st (ce:rest) = do
      st' <- applyCanonicalEvent rs st prev ce
      go (Just ce) st' rest
