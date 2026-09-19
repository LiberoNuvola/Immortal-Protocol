module GovernanceCommitment
  ( canonicalText, commitmentInput, commitmentAlgorithm
  ) where

import GovernanceEventSchema

-- The protocol chooses the commitment algorithm explicitly instead of
-- relying on implementation-defined serialization.
commitmentAlgorithm :: String
commitmentAlgorithm = "SHA-256"

canonicalText :: CanonicalEvent -> String
canonicalText = canonicalEventBody

commitmentInput :: CanonicalEvent -> String
commitmentInput e =
  canonicalText e ++ "|payload=" ++ payloadCommitment e
