{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE TemplateHaskell #-}
{-# LANGUAGE ViewPatterns #-}

-- | PRE-RICH lifecycle transition boundary.
--
-- This module deliberately sits outside EconomicTransitionV3: lifecycle
-- transitions are application/regime operations, not new economic formulas.
-- The QNE predicate consumes externally verified EEV/ProtectedCapital and
-- represented-obligation/safety evidence; it never assumes constant EEV and
-- never constructs or narrows Omega.
module PreRichLifecycleTransition
  ( PreRichLifecycleAction (..)
  , PreRichLifecycleState (..)
  , activeLifecycleState
  , quiescentLifecycleState
  , lifecycleTransition
  , lifecycleActionAvailable
  , LifecycleOmegaWitness (..)
  , qneWitnessHolds
  , qneAcrossOmega
  ) where

import PlutusTx
import PlutusTx.Prelude
import PreRichRegimeState (PreRichRegime (..))

data PreRichLifecycleAction
  = EnterQuiescent
  | MaintainQuiescent

PlutusTx.unstableMakeIsData ''PreRichLifecycleAction

-- | Lifecycle state is deliberately separate from V3 economic state.
--
-- transitionNonce makes lifecycle operations real state transitions rather
-- than a disguised NoOp. It has no economic meaning and must never be used
-- as an economic value.
data PreRichLifecycleState = PreRichLifecycleState
  { plsRegime :: PreRichRegime
  , plsTransitionNonce :: Integer
  }

PlutusTx.unstableMakeIsData ''PreRichLifecycleState

{-# INLINABLE activeLifecycleState #-}
activeLifecycleState :: Integer -> PreRichLifecycleState
activeLifecycleState nonce =
  PreRichLifecycleState Active nonce

{-# INLINABLE quiescentLifecycleState #-}
quiescentLifecycleState :: Integer -> PreRichLifecycleState
quiescentLifecycleState nonce =
  PreRichLifecycleState Quiescent nonce

-- | Concrete lifecycle transition.
--
-- ACTIVE -> QUIESCENT is the one-time regime transition.
-- QUIESCENT -> QUIESCENT is an explicit maintenance transition which advances
-- the lifecycle nonce and therefore remains a genuine committed operation.
--
-- No economic V3 field is changed by either operation.
{-# INLINABLE lifecycleTransition #-}
lifecycleTransition
  :: PreRichLifecycleState
  -> PreRichLifecycleAction
  -> Maybe PreRichLifecycleState
lifecycleTransition state action =
  case (plsRegime state, action) of
    (Active, EnterQuiescent) ->
      Just
        (PreRichLifecycleState
          { plsRegime = Quiescent
          , plsTransitionNonce = plsTransitionNonce state + 1
          })
    (Quiescent, MaintainQuiescent) ->
      Just
        (PreRichLifecycleState
          { plsRegime = Quiescent
          , plsTransitionNonce = plsTransitionNonce state + 1
          })
    _ -> Nothing

{-# INLINABLE lifecycleActionAvailable #-}
lifecycleActionAvailable
  :: PreRichLifecycleState
  -> PreRichLifecycleAction
  -> Bool
lifecycleActionAvailable state action =
  case lifecycleTransition state action of
    Nothing -> False
    Just _ -> True

-- | One authoritative Omega successor observation for QNE checking.
--
-- EEV is intentionally carried per-successor instead of being assumed
-- constant. protectedCapital is also explicit because the universal model
-- treats EEV as an external valuation boundary.
data LifecycleOmegaWitness = LifecycleOmegaWitness
  { lowPostEEV :: Integer
  , lowPostProtectedCapital :: Integer
  , lowRepresentationPreserved :: Bool
  , lowSafe :: Bool
  }

PlutusTx.unstableMakeIsData ''LifecycleOmegaWitness

{-# INLINABLE qneWitnessHolds #-}
qneWitnessHolds
  :: Integer
  -> Integer
  -> LifecycleOmegaWitness
  -> Bool
qneWitnessHolds preEEV preProtectedCapital witness =
     lowPostEEV witness >= 0
  && lowPostProtectedCapital witness >= 0
  && lowPostEEV witness - lowPostProtectedCapital witness
       >= preEEV - preProtectedCapital
  && lowRepresentationPreserved witness
  && lowSafe witness

-- | QNE over an explicit non-empty Omega envelope.
--
-- The caller remains responsible for establishing that the witness list is a
-- sound over-approximation of the authoritative deployment Omega. This
-- function intentionally does not narrow or invent Omega.
{-# INLINABLE qneAcrossOmega #-}
qneAcrossOmega
  :: PreRichLifecycleState
  -> PreRichLifecycleAction
  -> Integer
  -> Integer
  -> [LifecycleOmegaWitness]
  -> Bool
qneAcrossOmega state action preEEV preProtectedCapital witnesses =
     lifecycleActionAvailable state action
  && preEEV >= 0
  && preProtectedCapital >= 0
  && witnessesNonEmpty witnesses
  && allQneWitnesses preEEV preProtectedCapital witnesses
  where
    witnessesNonEmpty [] = False
    witnessesNonEmpty (_:_) = True

    allQneWitnesses _ _ [] = True
    allQneWitnesses eev protected (w:ws) =
         qneWitnessHolds eev protected w
      && allQneWitnesses eev protected ws
