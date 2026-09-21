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
import EconomicProfile
  ( TicketClass
  , EconomicProfile
  , profileClasses
  , profilePrice
  )

{-# INLINABLE canonicalClasses #-}
canonicalClasses :: EconomicProfile -> [TicketClass]
canonicalClasses = profileClasses

{-# INLINABLE classPrice #-}
classPrice :: EconomicProfile -> TicketClass -> Maybe Integer
classPrice = profilePrice

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
