module GovernanceCanonicalizationWitness
  ( CanonicalizationRecord(..)
  , canonicalizationRecordValid
  , canonicalizationRequiresConformance
  , canonicalizationRequiresCompatibility
  ) where

import Governance

-- Projection of the GOV-10 canonicalization gate.
-- It does not create new governance semantics.
data CanonicalizationRecord = CanonicalizationRecord
  { canonicalizationProposalId :: ProposalId
  , canonicalizationTargetArtifact :: String
  , canonicalizationVersionTransition :: String
  , canonicalizationDecisionRecordReference :: String
  , canonicalizationEvidenceReferences :: [String]
  , canonicalizationConformanceEvidence :: Maybe String
  , canonicalizationCompatibilityUpgradeResult :: Maybe String
  , canonicalizationMandatoryGatesResolved :: Bool
  , canonicalizationVersionIdentifier :: String
  } deriving (Eq, Show)

canonicalizationRequiresConformance :: ProposalClass -> Bool
canonicalizationRequiresConformance cls =
  cls /= DocumentationOnly

canonicalizationRequiresCompatibility :: ProposalClass -> Bool
canonicalizationRequiresCompatibility cls =
  cls == Adapter || cls == Specification || cls == ConstitutionalKernel

canonicalizationRecordValid :: Proposal -> CanonicalizationRecord -> Bool
canonicalizationRecordValid p r =
  canonicalizationProposalId r == proposalId p &&
  not (null (canonicalizationTargetArtifact r)) &&
  not (null (canonicalizationVersionTransition r)) &&
  not (null (canonicalizationDecisionRecordReference r)) &&
  not (null (canonicalizationEvidenceReferences r)) &&
  canonicalizationMandatoryGatesResolved r &&
  not (null (canonicalizationVersionIdentifier r)) &&
  conformanceValid &&
  compatibilityValid
  where
    conformanceValid =
      if canonicalizationRequiresConformance (proposalClass p)
        then case canonicalizationConformanceEvidence r of
          Just x -> not (null x)
          Nothing -> False
        else True

    compatibilityValid =
      if canonicalizationRequiresCompatibility (proposalClass p)
        then case canonicalizationCompatibilityUpgradeResult r of
          Just x -> not (null x)
          Nothing -> False
        else True
