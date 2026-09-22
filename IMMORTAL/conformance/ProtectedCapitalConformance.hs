{-# LANGUAGE NoImplicitPrelude #-}

module ProtectedCapitalConformance
  ( revealProtectedCapitalDelta
  , claimProtectedCapitalDelta
  , expireProtectedCapitalDelta
  , protectedCapitalLifecycleSafe
  , protectedCapitalPartitionExact
  , V3ActionWitness (..)
  ) where

import PlutusTx.Prelude
import EconomicProfile
import EconomicStateV3
import qualified EconomicKernel

-- | Exact delta in ProtectedCapital for a canonical PRE-RICH Reveal.
-- Given a valid unresolved ticket of price P and payout W:
--   ΔPC = W - M*P
-- where M is the profile payout multiplier.
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

-- | Exact arithmetic partition used by the current universal bridge.
-- Each listed component is a distinct field/obligation category and appears
-- exactly once in the sum. This guards against accidental omission or double
-- counting when the aggregate state is refactored.
{-# INLINABLE protectedCapitalPartitionExact #-}
protectedCapitalPartitionExact :: Integer -> Integer -> Integer -> Integer -> Integer -> Integer -> Integer -> Bool
protectedCapitalPartitionExact liabilities exposure safety reserveProtection futureCosts additionalProtected actual =
     actual ==
       liabilities + exposure + safety + reserveProtection + futureCosts + additionalProtected