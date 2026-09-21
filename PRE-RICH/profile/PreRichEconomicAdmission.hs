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
-- `availableLiquidity` is an explicit verified execution-boundary input.
-- It must already exclude funds that cannot be spent immediately (for
-- example ring-fenced unresolved reserve, liabilities or locked Jackpot).
-- `eev` remains a distinct economic-value input.
data PreRichEconomicAdmission = PreRichEconomicAdmission
  { peaAction :: V3Action
  , peaCandidateV3 :: V3EconomicState
  , peaCandidateUniversal :: UniversalEconomicState
  , peaPreEEV :: Integer
  , peaCandidateEEV :: Integer
  , peaAvailableExecutableLiquidity :: Integer
  , peaRequiredImmediateLiquidity :: Integer
  }

-- | Compose the already-separated layers:
-- structural transition validity -> candidate V3 state
-- -> fail-closed PRE-RICH projection -> verified EEV/execution evidence
-- -> IMMORTAL Economic Gate -> explicit Viability certificate.
--
-- `transitionValid` remains structural. Economic admissibility is evaluated
-- here, never hidden inside the transition predicate.
{-# INLINABLE preRichEconomicAdmission #-}
preRichEconomicAdmission
  :: EconomicProfile
  -> V3EconomicState
  -> V3Action
  -> Integer
  -> Integer
  -> Integer
  -> Integer
  -> Bool
  -> Bool
  -> Bool
  -> Bool
  -> Maybe PreRichEconomicAdmission
preRichEconomicAdmission profile preState action preEEV candidateEEV availableLiquidity requiredLiquidity truthVerified eevFresh obligationsComplete allOmegaSuccessorsInCertifiedKernel =
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
                    , egiEEV = candidateEEV
                    , egiAvailableExecutableLiquidity = availableLiquidity
                    , egiRequiredImmediateLiquidity = requiredLiquidity
                    }
                safePostState =
                  UniversalKernel.solvencyInvariant candidateEEV candidateUniversal
              in
                if executionAdmissible gateInput candidateUniversal safePostState allOmegaSuccessorsInCertifiedKernel
                  then
                    Just
                      (PreRichEconomicAdmission
                        { peaAction = action
                        , peaCandidateV3 = candidateV3
                        , peaCandidateUniversal = candidateUniversal
                        , peaPreEEV = preEEV
                        , peaCandidateEEV = candidateEEV
                        , peaAvailableExecutableLiquidity = availableLiquidity
                        , peaRequiredImmediateLiquidity = requiredLiquidity
                        })
                  else Nothing