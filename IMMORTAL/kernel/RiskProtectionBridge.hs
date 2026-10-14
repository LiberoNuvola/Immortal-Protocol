{-# LANGUAGE NoImplicitPrelude #-}

-- | Typed B-R1 boundary scaffold.
--
-- This module deliberately supports only the already-existing deterministic
-- PRE-RICH path. Statistical-only and combined modes fail closed until a
-- canonical profile supplies an explicit rule. This module is not yet wired
-- into PreRichEconomicAdmission; callers must not treat its presence as proof
-- that B-R1 is integrated end-to-end.
module RiskProtectionBridge
  ( RiskMode (..)
  , EvidenceStatus (..)
  , RiskAssessment (..)
  , ProtectionRequirement (..)
  , BridgeFailure (..)
  , deriveProtectionRequirement
  ) where

import PlutusTx.Prelude
import EconomicProfile (EconomicProfile (..), profileValid)

data RiskMode
  = DeterministicWorstCaseOnly
  | StatisticalOnly
  | DeterministicAndStatistical

data EvidenceStatus
  = RiskEvidenceVerified
  | RiskEvidenceMissing
  | RiskEvidenceInvalid

data RiskAssessment = RiskAssessment
  { raProfileVersion :: Integer
  , raTrajectoryId :: Integer
  , raMode :: RiskMode
  , raEvidenceStatus :: EvidenceStatus
  , raDeterministicExposure :: Maybe Integer
  , raStatisticalReserve :: Maybe Integer
  , raCombinationRuleVersion :: Maybe Integer
  }

data ProtectionRequirement = ProtectionRequirement
  { prProfileVersion :: Integer
  , prTrajectoryId :: Integer
  , prDeterministicWorstCase :: Integer
  }

data BridgeFailure
  = InvalidProfile
  | ProfileVersionMismatch
  | InvalidTrajectoryId
  | MissingOrInvalidEvidence
  | DeterministicAssessmentMissing
  | DeterministicAssessmentMismatch
  | UnexpectedStatisticalAssessment
  | UnsupportedRiskMode
  | UnexpectedCombinationRule

-- | Derive a requirement only when the verified assessment is bound to the
-- supplied profile and trajectory and exactly matches the deterministic
-- exposure already derived by the canonical PRE-RICH projection.
--
-- No statistical substitution, additive combination, or fallback is inferred.
{-# INLINABLE deriveProtectionRequirement #-}
deriveProtectionRequirement
  :: EconomicProfile
  -> Integer
  -> Integer
  -> RiskAssessment
  -> Either BridgeFailure ProtectionRequirement
deriveProtectionRequirement profile expectedTrajectoryId projectedWorstCase assessment
  | not (profileValid profile) = Left InvalidProfile
  | raProfileVersion assessment /= epVersion profile = Left ProfileVersionMismatch
  | expectedTrajectoryId < 0 || raTrajectoryId assessment < 0
      || raTrajectoryId assessment /= expectedTrajectoryId = Left InvalidTrajectoryId
  | raEvidenceStatus assessment /= RiskEvidenceVerified = Left MissingOrInvalidEvidence
  | projectedWorstCase < 0 = Left DeterministicAssessmentMismatch
  | otherwise =
      case raMode assessment of
        DeterministicWorstCaseOnly ->
          case raDeterministicExposure assessment of
            Nothing -> Left DeterministicAssessmentMissing
            Just exposure ->
              if exposure < 0 || exposure /= projectedWorstCase
                then Left DeterministicAssessmentMismatch
                else
                  case raStatisticalReserve assessment of
                    Just _ -> Left UnexpectedStatisticalAssessment
                    Nothing ->
                      case raCombinationRuleVersion assessment of
                        Just _ -> Left UnexpectedCombinationRule
                        Nothing ->
                          Right
                            (ProtectionRequirement
                              (epVersion profile)
                              expectedTrajectoryId
                              exposure)
        StatisticalOnly -> Left UnsupportedRiskMode
        DeterministicAndStatistical -> Left UnsupportedRiskMode
