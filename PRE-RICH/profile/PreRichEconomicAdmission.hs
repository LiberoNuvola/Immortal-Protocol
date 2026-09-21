{-# LANGUAGE NoImplicitPrelude #-}

module PreRichEconomicAdmission
  ( PreRichEconomicAdmission (..)
  , preRichEconomicAdmission
  ) where

import PlutusTx.Prelude

import EconomicGate
  ( EconomicGateInput (..)
  , executionAdmissible
  )
import EconomicProfile
import EconomicStateV3
import EconomicTransitionV3
import UniversalEconomicState
import qualified UniversalEconomicKernel as UniversalKernel
import PreRichEconomicProjection
  ( projectPreRichState
  )

-- | Successful economic-admission witness for one PRE-RICH action.
--
-- Both V3 and application-neutral universal representations are carried
-- so downstream conformance code can inspect the same candidate state.
-- This module does not perform chain realization.
data PreRichEconomicAdmission = PreRichEconomicAdmission
  { peaAction :: V3Action
  , peaCandidateV3 :: V3EconomicState
  , peaCandidateUniversal :: UniversalEconomicState
  , peaEEV :: Integer
  }

-- | Compose the already-separated layers:
-- structural transition validity -> candidate V3 state
-- -> fail-closed PRE-RICH projection -> verified EEV inputs
-- -> IMMORTAL Economic Gate -> explicit Viability certificate.
--
-- transitionValid remains structural. Economic admissibility is evaluated
-- here, not hidden inside the transition predicate.
{-# INLINABLE preRichEconomicAdmission #-}
preRichEconomicAdmission
  :: EconomicProfile
  -> V3EconomicState
  -> V3Action
  -> Integer
  -> Bool
  -> Bool
  -> Bool
  -> Bool
  -> Maybe PreRichEconomicAdmission
preRichEconomicAdmission profile preState action eev truthVerified eevFresh obligationsComplete allOmegaSuccessorsInCertifiedKernel =
  preRichEconomicAdmissionWithLiquidity
    profile
    preState
    action
    eev
    eev
    (immediateLiquidity action)
    truthVerified
    eevFresh
    obligationsComplete
    allOmegaSuccessorsInCertifiedKernel

  if not (transitionValid profile preState action)
    then Nothing
    else
      case transition profile preState action of
        Nothing -> Nothing
        Just candidateV3 ->
          case projectPreRichState profile candidateV3 of
            Nothing -> Nothing
            Just candidateUniversal ->
              let
                gateInput =
                  EconomicGateInput
                    { egiAuthoritativeTruthVerified = truthVerified
                    , egiEEVFresh = eevFresh
                    , egiObligationsComplete = obligationsComplete
                    , egiEEV = eev
                    , egiAvailableExecutableLiquidity = eev
                    , egiRequiredImmediateLiquidity = immediateLiquidity action
                    }
                safePostState =
                  UniversalKernel.solvencyInvariant
                    eev
                    candidateUniversal
              in
                if executionAdmissible
                    gateInput
                    candidateUniversal
                    safePostState
                    allOmegaSuccessorsInCertifiedKernel
                  then
                    Just
                      (PreRichEconomicAdmission
                        { peaAction = action
                        , peaCandidateV3 = candidateV3
                        , peaCandidateUniversal = candidateUniversal
                        , peaEEV = eev
                        })
                  else
                    Nothing

{-# INLINABLE immediateLiquidity #-}
immediateLiquidity :: V3Action -> Integer
immediateLiquidity (Claim amount) = amount
immediateLiquidity _ = 0

{-# INLINABLE preRichEconomicAdmissionWithLiquidity #-}
preRichEconomicAdmissionWithLiquidity
  :: EconomicProfile
  -> V3EconomicState
  -> V3Action
  -> Integer
  -> Integer
  -> Integer
  -> Bool
  -> Bool
  -> Bool
  -> Bool
  -> Maybe PreRichEconomicAdmission
preRichEconomicAdmissionWithLiquidity profile preState action eev availableLiquidity requiredLiquidity truthVerified eevFresh obligationsComplete allOmegaSuccessorsInCertifiedKernel =
  if not (transitionValid profile preState action)
    then Nothing
    else
      case transition profile preState action of
        Nothing -> Nothing
        Just candidateV3 ->
          case projectPreRichState profile candidateV3 of
            Nothing -> Nothing
            Just candidateUniversal ->
              let
                gateInput =
                  EconomicGateInput
                    { egiAuthoritativeTruthVerified = truthVerified
                    , egiEEVFresh = eevFresh
                    , egiObligationsComplete = obligationsComplete
                    , egiEEV = eev
                    , egiAvailableExecutableLiquidity = availableLiquidity
                    , egiRequiredImmediateLiquidity = requiredLiquidity
                    }
                safePostState =
                  UniversalKernel.solvencyInvariant eev candidateUniversal
              in
                if executionAdmissible gateInput candidateUniversal safePostState allOmegaSuccessorsInCertifiedKernel
                  then Just (PreRichEconomicAdmission action candidateV3 candidateUniversal eev)
                  else Nothing
