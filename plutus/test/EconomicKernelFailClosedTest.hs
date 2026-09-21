module Main where

import Control.Exception (SomeException, evaluate, try)
import EconomicKernel (classExposure, conservationInvariant)
import EconomicStateV3
  ( EconomicControlState (..)
  , JackpotState (..)
  , JackpotStatus (..)
  , TicketClassState (..)
  , V3EconomicState (..)
  )

validClass :: TicketClassState
validClass = TicketClassState
  { tcsClassId = 0
  , tcsIssued = 1
  , tcsUnresolved = 3
  , tcsExposure = 3
  , tcsCap = 10
  , tcsSaleable = True
  }

invalidClass :: TicketClassState
invalidClass = TicketClassState
  { tcsClassId = 999
  , tcsIssued = 1
  , tcsUnresolved = 1
  , tcsExposure = 0
  , tcsCap = 10
  , tcsSaleable = True
  }

invalidState :: V3EconomicState
invalidState =
  V3EconomicState
    { v3CrystallizedLiabilities = 0
    , v3UnresolvedReserve = 0
    , v3UnresolvedTicketCount = 1
    , v3SafetyCapital = 0
    , v3ReserveProtection = 0
    , v3MandatoryFutureCosts = 0
    , v3Classes = [invalidClass]
    , v3Control = EconomicControlState 0 0
    , v3Jackpot = JackpotState 0 0 JackpotInactive 0
    }

expectIntegerThrows :: String -> IO Integer -> IO ()
expectIntegerThrows label action = do
  result <- try action :: IO (Either SomeException Integer)
  case result of
    Left _ -> pure ()
    Right _ -> error (label ++ ": expected evaluation failure")

expectBoolThrows :: String -> IO Bool -> IO ()
expectBoolThrows label action = do
  result <- try action :: IO (Either SomeException Bool)
  case result of
    Left _ -> pure ()
    Right _ -> error (label ++ ": expected evaluation failure")

main :: IO ()
main = do
  validExposure <- evaluate (classExposure validClass)
  if validExposure /= 3
    then error ("valid class exposure changed: " ++ show validExposure)
    else pure ()

  expectIntegerThrows
    "invalid class exposure must fail closed"
    (evaluate (classExposure invalidClass))

  expectBoolThrows
    "invalid class state must not satisfy conservation invariant"
    (evaluate (conservationInvariant invalidState))

  putStrLn "EconomicKernel invalid-class fail-closed tests: PASS"
