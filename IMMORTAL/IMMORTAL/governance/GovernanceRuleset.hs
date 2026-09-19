module GovernanceRuleset
  ( Ruleset(..), canonicalRuleset, rulesetImmutable
  , amendmentRequiresNewProposal
  ) where

data Ruleset = Ruleset
  { rulesetId :: Integer
  , quorumNumerator :: Integer
  , quorumDenominator :: Integer
  , ordinaryNumerator :: Integer
  , ordinaryDenominator :: Integer
  , kernelNumerator :: Integer
  , kernelDenominator :: Integer
  , communityDays :: Integer
  , votingDays :: Integer
  , finalityDays :: Integer
  , emergencyHours :: Integer
  } deriving (Eq, Show)

canonicalRuleset :: Ruleset
canonicalRuleset = Ruleset
  { rulesetId = 1
  , quorumNumerator = 1, quorumDenominator = 4
  , ordinaryNumerator = 1, ordinaryDenominator = 2
  , kernelNumerator = 2, kernelDenominator = 3
  , communityDays = 7
  , votingDays = 5
  , finalityDays = 3
  , emergencyHours = 72
  }

rulesetImmutable :: Ruleset -> Ruleset -> Bool
rulesetImmutable active requested = active == requested

amendmentRequiresNewProposal :: Integer -> Integer -> Bool
amendmentRequiresNewProposal active requested =
  active /= requested
