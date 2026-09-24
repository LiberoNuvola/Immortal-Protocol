module GovernanceConformanceWitness
  ( ConformanceRecord(..)
  , conformanceRecordValid
  ) where

import Governance

data ConformanceRecord = ConformanceRecord
  { conformanceProposalId :: ProposalId
  , conformanceImplementationCommit :: String
  , conformanceRulesetVersion :: Integer
  , conformanceTestVectorVersion :: String
  , conformanceEnvironmentToolchain :: String
  , conformanceTestResults :: String
  , conformanceFailedTestRecord :: Maybe String
  , conformanceCanonicalInputFixtures :: String
  , conformanceReplayOutput :: String
  } deriving (Eq, Show)

conformanceRecordValid :: Proposal -> ConformanceRecord -> Bool
conformanceRecordValid p r =
  conformanceProposalId r == proposalId p &&
  not (null (conformanceImplementationCommit r)) &&
  conformanceRulesetVersion r > 0 &&
  not (null (conformanceTestVectorVersion r)) &&
  not (null (conformanceEnvironmentToolchain r)) &&
  not (null (conformanceTestResults r)) &&
  conformanceFailedTestRecord r == Nothing &&
  not (null (conformanceCanonicalInputFixtures r)) &&
  not (null (conformanceReplayOutput r))
