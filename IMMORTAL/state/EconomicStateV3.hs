{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE DerivingStrategies #-}

module EconomicStateV3
  ( TicketClass
  , canonicalClasses
  , classPrice
  , TicketClassState (..)
  , EconomicControlState (..)
  , JackpotStatus (..)
  , JackpotState (..)
  , V3EconomicState (..)
  , zeroV3EconomicState
  ) where

import PlutusTx.Prelude

type TicketClass = Integer

{-# INLINABLE canonicalClasses #-}
canonicalClasses :: [TicketClass]
canonicalClasses = [0,1,2,3,4,5,6,7]

{-# INLINABLE classPrice #-}
classPrice :: TicketClass -> Maybe Integer
classPrice c
  | c == 0 = Just 1
  | c == 1 = Just 2
  | c == 2 = Just 3
  | c == 3 = Just 5
  | c == 4 = Just 10
  | c == 5 = Just 25
  | c == 6 = Just 50
  | c == 7 = Just 100
  | otherwise = Nothing

data TicketClassState = TicketClassState
  { tcsClassId :: TicketClass
  , tcsIssued :: Integer
  , tcsUnresolved :: Integer
  , tcsExposure :: Integer
  , tcsCap :: Integer
  , tcsSaleable :: Bool
  }

data EconomicControlState = EconomicControlState
  { ecsCurrentActiveClass :: TicketClass
  , ecsHighestClassEverActivated :: TicketClass
  }

data JackpotStatus
  = JackpotInactive
  | JackpotLocked
  | JackpotPayable
  | JackpotClosed

instance Eq JackpotStatus where
  {-# INLINABLE (==) #-}
  JackpotInactive == JackpotInactive = True
  JackpotLocked == JackpotLocked = True
  JackpotPayable == JackpotPayable = True
  JackpotClosed == JackpotClosed = True
  _ == _ = False

data JackpotState = JackpotState
  { jsLockedAmount :: Integer
  , jsThreshold :: Integer
  , jsStatus :: JackpotStatus
  , jsCycle :: Integer
  }

data V3EconomicState = V3EconomicState
  { v3CrystallizedLiabilities :: Integer
  , v3UnresolvedReserve :: Integer
  , v3UnresolvedTicketCount :: Integer
  , v3SafetyCapital :: Integer
  , v3ReserveProtection :: Integer
  , v3MandatoryFutureCosts :: Integer
  , v3Classes :: [TicketClassState]
  , v3Control :: EconomicControlState
  , v3Jackpot :: JackpotState
  }

{-# INLINABLE zeroV3EconomicState #-}
zeroV3EconomicState :: V3EconomicState
zeroV3EconomicState =
  V3EconomicState
    0 0 0 0 0 0 []
    (EconomicControlState 0 0)
    (JackpotState 0 0 JackpotInactive 0)
