{-# LANGUAGE NoImplicitPrelude #-}

module EconomicGate
  ( EconomicGateInput (..)
  , economicGate
  , viabilityGate
  , executionAdmissible
  ) where

import PlutusTx.Prelude
import UniversalEconomicState
import qualified UniversalEconomicKernel as Kernel

-- | Inputs that must already have been verified by the authoritative
-- observation/refinement layer before economic admissibility is evaluated.
--
-- The record is an interface, not an authority declaration: callers must bind
-- these booleans to their actual verification/refinement mechanisms. The
-- universal gate does not manufacture truth, freshness or obligation coverage.
data EconomicGateInput = EconomicGateInput
  { egiAuthoritativeTruthVerified :: Bool
  , egiEEVFresh :: Bool
  , egiObligationsComplete :: Bool
  , egiEEV :: Integer
  }

-- | Immediate economic admissibility for a candidate post-state.
--
-- This is deliberately separate from Viability. A positive RawSurplus is not
-- required: some safe actions (for example expiry) may consume no surplus.
{-# INLINABLE economicGate #-}
economicGate :: EconomicGateInput -> UniversalEconomicState -> Bool
economicGate input candidate =
     egiAuthoritativeTruthVerified input
  && egiEEVFresh input
  && egiObligationsComplete input
  && Kernel.solvencyInvariant (egiEEV input) candidate

-- | Viability is evaluated after immediate post-state safety has been checked.
--
-- The second argument denotes the authoritative-Ω condition that every
-- relevant successor remains inside the deployment's declared certified
-- concrete kernel K_c. Certifying K_c itself is an external conformance
-- obligation (CK1–CK8); this predicate does not manufacture that certificate.
{-# INLINABLE viabilityGate #-}
viabilityGate :: Bool -> Bool -> Bool
viabilityGate safePostState allOmegaSuccessorsInCertifiedKernel =
     safePostState
  && allOmegaSuccessorsInCertifiedKernel

-- | Full execution admissibility boundary.
--
-- Atomic commit and history recording remain downstream obligations of the
-- execution layer; this predicate only identifies an admissible candidate.
{-# INLINABLE executionAdmissible #-}
executionAdmissible
  :: EconomicGateInput
  -> UniversalEconomicState
  -> Bool
  -> Bool
  -> Bool
executionAdmissible input candidate safePostState allOmegaSuccessorsInCertifiedKernel =
     economicGate input candidate
  && viabilityGate safePostState allOmegaSuccessorsInCertifiedKernel
