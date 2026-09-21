{-# LANGUAGE NoImplicitPrelude #-}

module EconomicKernel
  ( ceilingDiv
  , classExposure
  , totalClassExposure
  , totalUnresolvedCount
  , worstCaseExposure
  , effectivePool
  , protectedCapital
  , rawSurplus
  , classSaleable
  , reserveIssueDelta
  , reserveRevealDelta
  , reserveExpiryDelta
  , liabilityRevealDelta
  , liabilityClaimDelta
  , payoutSufficient
  , solvencyInvariant
  , conservationInvariant
  ) where

import PlutusTx.Builtins.HasOpaque (stringToBuiltinString)
import PlutusTx.Prelude
import EconomicStateV3
import EconomicProfile (EconomicProfile, profilePrice, epMaxNormalPayoutMultiplier)

{-# INLINABLE ceilingDiv #-}
ceilingDiv :: Integer -> Integer -> Integer
ceilingDiv a b
  | b == 0 = traceError (stringToBuiltinString "EconomicKernel: division by zero")
  | a <= 0 = 0
  | b < 0 = traceError (stringToBuiltinString "EconomicKernel: invalid divisor")
  | otherwise = (a + b - 1) `divide` b

{-# INLINABLE classExposure #-}
classExposure :: EconomicProfile -> TicketClassState -> Integer
classExposure profile c =
  case profilePrice profile (tcsClassId c) of
    Just p -> p * tcsUnresolved c
    Nothing ->
      traceError (stringToBuiltinString "EconomicKernel: unknown ticket class")

{-# INLINABLE totalClassExposure #-}
totalClassExposure :: EconomicProfile -> [TicketClassState] -> Integer
totalClassExposure _ [] = 0
totalClassExposure profile (c:cs) =
  classExposure profile c + totalClassExposure profile cs

{-# INLINABLE totalUnresolvedCount #-}
totalUnresolvedCount :: [TicketClassState] -> Integer
totalUnresolvedCount [] = 0
totalUnresolvedCount (c:cs) =
  tcsUnresolved c + totalUnresolvedCount cs

{-# INLINABLE worstCaseExposure #-}
worstCaseExposure :: EconomicProfile -> V3EconomicState -> Integer
worstCaseExposure profile s =
  epMaxNormalPayoutMultiplier profile
    * totalClassExposure profile (v3Classes s)

{-# INLINABLE effectivePool #-}
effectivePool :: Integer -> V3EconomicState -> Integer
effectivePool eev s =
  eev
    - v3CrystallizedLiabilities s
    - v3UnresolvedReserve s
    - jsLockedAmount (v3Jackpot s)

{-# INLINABLE protectedCapital #-}
protectedCapital :: EconomicProfile -> V3EconomicState -> Integer
protectedCapital profile s =
    v3CrystallizedLiabilities s
  + worstCaseExposure profile s
  + v3SafetyCapital s
  + v3ReserveProtection s
  + jsLockedAmount (v3Jackpot s)
  + v3MandatoryFutureCosts s

{-# INLINABLE rawSurplus #-}
rawSurplus :: EconomicProfile -> Integer -> V3EconomicState -> Integer
rawSurplus profile eev s =
  max 0 (eev - protectedCapital profile s)

{-# INLINABLE classSaleable #-}
classSaleable :: V3EconomicState -> TicketClass -> Bool
classSaleable s cid =
  case findClass (v3Classes s) cid of
    Nothing -> False
    Just c ->
         cid <= ecsCurrentActiveClass (v3Control s)
      && tcsIssued c < tcsCap c
  where
    findClass [] _ = Nothing
    findClass (c:cs) x
      | tcsClassId c == x = Just c
      | otherwise = findClass cs x

{-# INLINABLE reserveIssueDelta #-}
reserveIssueDelta :: Integer -> Integer
reserveIssueDelta priceUsdm = priceUsdm

{-# INLINABLE reserveRevealDelta #-}
reserveRevealDelta :: Integer -> Integer
reserveRevealDelta priceUsdm = negate priceUsdm

{-# INLINABLE reserveExpiryDelta #-}
reserveExpiryDelta :: Integer -> Integer
reserveExpiryDelta priceUsdm = negate priceUsdm

{-# INLINABLE liabilityRevealDelta #-}
liabilityRevealDelta :: Integer -> Integer
liabilityRevealDelta prizeAmount = max 0 prizeAmount

{-# INLINABLE liabilityClaimDelta #-}
liabilityClaimDelta :: Integer -> Integer
liabilityClaimDelta claimedAmount = negate (max 0 claimedAmount)

{-# INLINABLE payoutSufficient #-}
payoutSufficient :: EconomicProfile -> Integer -> Integer -> Bool
payoutSufficient profile priceUsdm payoutAmount =
     priceUsdm >= 0
  && payoutAmount >= 0
  && payoutAmount <= epMaxNormalPayoutMultiplier profile * priceUsdm

{-# INLINABLE solvencyInvariant #-}
solvencyInvariant :: EconomicProfile -> Integer -> V3EconomicState -> Bool
solvencyInvariant profile eev s =
     eev >= 0
  && v3CrystallizedLiabilities s >= 0
  && v3UnresolvedReserve s >= 0
  && v3UnresolvedTicketCount s >= 0
  && v3SafetyCapital s >= 0
  && v3ReserveProtection s >= 0
  && v3MandatoryFutureCosts s >= 0
  && jsLockedAmount (v3Jackpot s) >= 0
  && eev >= protectedCapital profile s

{-# INLINABLE conservationInvariant #-}
conservationInvariant :: EconomicProfile -> V3EconomicState -> Bool
conservationInvariant profile s =
     v3UnresolvedReserve s == totalClassExposure profile (v3Classes s)
  && v3UnresolvedTicketCount s == totalUnresolvedCount (v3Classes s)
