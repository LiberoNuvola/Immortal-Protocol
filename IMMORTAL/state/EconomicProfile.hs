{-# LANGUAGE NoImplicitPrelude #-}

module EconomicProfile
  ( TicketClass
  , EconomicProfile (..)
  , profilePrice
  , profileClasses
  , profileValid
  ) where

import PlutusTx.Prelude

type TicketClass = Integer

-- | Declarative economic parameters supplied by an application deployment.
-- IMMORTAL owns the interpretation of these parameters; the application owns
-- their concrete values.
data EconomicProfile = EconomicProfile
  { epVersion :: Integer
  , epClassPrices :: [(TicketClass, Integer)]
  , epMaxNormalPayoutMultiplier :: Integer
  }

{-# INLINABLE profilePrice #-}
profilePrice :: EconomicProfile -> TicketClass -> Maybe Integer
profilePrice p cid = findPrice (epClassPrices p) cid
  where
    findPrice [] _ = Nothing
    findPrice ((k,v):xs) x
      | k == x = Just v
      | otherwise = findPrice xs x

{-# INLINABLE profileClasses #-}
profileClasses :: EconomicProfile -> [TicketClass]
profileClasses p = classIds (epClassPrices p)
  where
    classIds [] = []
    classIds ((k,_):xs) = k : classIds xs

{-# INLINABLE profileValid #-}
profileValid :: EconomicProfile -> Bool
profileValid p =
     epVersion p > 0
  && epMaxNormalPayoutMultiplier p >= 0
  && allValid (epClassPrices p)
  && uniqueClasses (epClassPrices p)
  where
    allValid [] = False
    allValid ((k,v):xs) =
         k >= 0
      && v > 0
      && allValidTail xs

    allValidTail [] = True
    allValidTail ((k,v):xs) =
         k >= 0
      && v > 0
      && allValidTail xs

    uniqueClasses [] = True
    uniqueClasses ((k,_):xs) =
         not (contains k xs)
      && uniqueClasses xs

    contains _ [] = False
    contains k ((x,_):xs) =
      k == x || contains k xs
