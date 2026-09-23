{-# LANGUAGE NoImplicitPrelude #-}

module ProtectedCapitalConformance
  ( revealProtectedCapitalDelta
  , claimProtectedCapitalDelta
  , expireProtectedCapitalDelta
  , protectedCapitalLifecycleSafe
  , protectedCapitalComponentsPreserved
  , protectedCapitalPartitionExact
  , V3ActionWitness (..)
  ) where

import PlutusTx.Prelude
import EconomicProfile
import EconomicStateV3
import qualified EconomicKernel

{-# INLINABLE revealProtectedCapitalDelta #-}
revealProtectedCapitalDelta :: EconomicProfile -> Integer -> Integer -> Integer
revealProtectedCapitalDelta profile price payout =
  payout - epMaxNormalPayoutMultiplier profile * price

{-# INLINABLE claimProtectedCapitalDelta #-}
claimProtectedCapitalDelta :: Integer -> Integer
claimProtectedCapitalDelta amount = negate amount

{-# INLINABLE expireProtectedCapitalDelta #-}
expireProtectedCapitalDelta :: EconomicProfile -> Integer -> Integer
expireProtectedCapitalDelta profile price =
  negate (epMaxNormalPayoutMultiplier profile * price)

-- | For valid lifecycle inputs, Reveal/Claim/Expire cannot increase the
-- protected-capital requirement. This is a local preservation property, not
-- an infinite-horizon viability proof.
{-# INLINABLE protectedCapitalLifecycleSafe #-}
protectedCapitalLifecycleSafe :: EconomicProfile -> V3ActionWitness -> Bool
protectedCapitalLifecycleSafe profile (RevealWitness price payout) =
     price >= 0
  && payout >= 0
  && payout <= epMaxNormalPayoutMultiplier profile * price
  && revealProtectedCapitalDelta profile price payout <= 0
protectedCapitalLifecycleSafe _ (ClaimWitness amount) =
  amount >= 0
  && claimProtectedCapitalDelta amount <= 0
protectedCapitalLifecycleSafe profile (ExpireWitness price) =
  price >= 0
  && expireProtectedCapitalDelta profile price <= 0

data V3ActionWitness
  = RevealWitness Integer Integer
  | ClaimWitness Integer
  | ExpireWitness Integer

-- | Protected-capital components that are not modified by the canonical
-- Issue/Reveal/Claim/Expire transition set must remain byte-for-byte
-- semantically identical across the transition boundary.
-- This is a local state-preservation property, not a viability proof.
{-# INLINABLE protectedCapitalComponentsPreserved #-}
protectedCapitalComponentsPreserved :: V3EconomicState -> V3EconomicState -> Bool
protectedCapitalComponentsPreserved before after =
     v3SafetyCapital before == v3SafetyCapital after
  && v3ReserveProtection before == v3ReserveProtection after
  && v3MandatoryFutureCosts before == v3MandatoryFutureCosts after
  && jsLockedAmount (v3Jackpot before) == jsLockedAmount (v3Jackpot after)
  && jsThreshold (v3Jackpot before) == jsThreshold (v3Jackpot after)
  && jsStatus (v3Jackpot before) == jsStatus (v3Jackpot after)
  && jsCycle (v3Jackpot before) == jsCycle (v3Jackpot after)

{-# INLINABLE protectedCapitalPartitionExact #-}
protectedCapitalPartitionExact :: Integer -> Integer -> Integer -> Integer -> Integer -> Integer -> Integer -> Bool
protectedCapitalPartitionExact liabilities exposure safety reserveProtection futureCosts additionalProtected actual =
     actual ==
       liabilities + exposure + safety + reserveProtection + futureCosts + additionalProtected
