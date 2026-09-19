module GovernanceCanonicalReplay
  ( replayCanonical, applyCanonicalEvent ) where

import Governance
import GovernanceEventSchema

applyCanonicalEvent :: GovernanceState -> CanonicalEvent
                    -> GovernanceEvent
                    -> Either String GovernanceState
applyCanonicalEvent st ce ev =
  if not (canonicalEventValid Nothing ce)
  then Left "canonical event schema invalid"
  else applyEvent st ev

replayCanonical :: GovernanceState
                -> [(CanonicalEvent, GovernanceEvent)]
                -> Either String GovernanceState
replayCanonical st xs = go st Nothing xs
  where
    go s _ [] = Right s
    go s prev ((ce,ev):rest) =
      if not (canonicalEventValid prev ce)
      then Left "invalid canonical event sequence"
      else case applyEvent s ev of
        Left err -> Left err
        Right s' -> go s' (Just ce) rest
