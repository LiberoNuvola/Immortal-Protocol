{-# LANGUAGE NoImplicitPrelude #-}

module Main where

import Prelude
  ( Bool (False, True)
  , IO
  , Either (Left, Right)
  , Maybe (Just, Nothing)
  , String
  , (==)
  , (&&)
  , error
  , putStrLn
  )

import PreRichEconomicProfile (preRichEconomicProfileV1)
import RiskProtectionBridge

profile = preRichEconomicProfileV1

verifiedDeterministic :: RiskAssessment
verifiedDeterministic =
  RiskAssessment
    { raProfileVersion = 1
    , raTrajectoryId = 42
    , raMode = DeterministicWorstCaseOnly
    , raEvidenceStatus = RiskEvidenceVerified
    , raDeterministicExposure = Just 1500
    , raStatisticalReserve = Nothing
    , raCombinationRuleVersion = Nothing
    }

assert :: Bool -> String -> IO ()
assert condition label =
  if condition then putStrLn ("PASS: " ++ label) else error ("FAIL: " ++ label)

main :: IO ()
main = do
  assert
    (case deriveProtectionRequirement profile 42 1500 verifiedDeterministic of
      Right requirement ->
           prProfileVersion requirement == 1
        && prTrajectoryId requirement == 42
        && prDeterministicWorstCase requirement == 1500
      Left _ -> False)
    "verified deterministic assessment maps to the exact projected worst-case requirement"

  assert
    (case deriveProtectionRequirement profile 42 1500
      (verifiedDeterministic { raDeterministicExposure = Just 1499 }) of
      Left DeterministicAssessmentMismatch -> True
      _ -> False)
    "mismatched assessment cannot lower projected deterministic exposure"

  assert
    (case deriveProtectionRequirement profile 43 1500 verifiedDeterministic of
      Left InvalidTrajectoryId -> True
      _ -> False)
    "assessment bound to another trajectory fails closed"

  assert
    (case deriveProtectionRequirement profile 42 1500
      (verifiedDeterministic { raProfileVersion = 2 }) of
      Left ProfileVersionMismatch -> True
      _ -> False)
    "assessment bound to another profile version fails closed"

  assert
    (case deriveProtectionRequirement profile 42 1500
      (verifiedDeterministic { raEvidenceStatus = RiskEvidenceMissing }) of
      Left MissingOrInvalidEvidence -> True
      _ -> False)
    "missing risk evidence fails closed"

  assert
    (case deriveProtectionRequirement profile 42 1500
      (verifiedDeterministic { raMode = StatisticalOnly, raStatisticalReserve = Just 100 }) of
      Left UnsupportedRiskMode -> True
      _ -> False)
    "statistical-only mode cannot replace the deterministic requirement"

  assert
    (case deriveProtectionRequirement profile 42 1500
      (verifiedDeterministic { raMode = DeterministicAndStatistical, raStatisticalReserve = Just 100 }) of
      Left UnsupportedRiskMode -> True
      _ -> False)
    "combined mode cannot invent an additive or substitution rule"

  assert
    (case deriveProtectionRequirement profile 42 1500
      (verifiedDeterministic { raStatisticalReserve = Just 100 }) of
      Left UnexpectedStatisticalAssessment -> True
      _ -> False)
    "statistical output is rejected unless an authorized profile rule is implemented"

  assert
    (case deriveProtectionRequirement profile 42 1500
      (verifiedDeterministic { raCombinationRuleVersion = Just 1 }) of
      Left UnexpectedCombinationRule -> True
      _ -> False)
    "an undeclared combination rule cannot silently enter deterministic-only mode"

  putStrLn "B-R1 typed bridge scaffold tests defined"
