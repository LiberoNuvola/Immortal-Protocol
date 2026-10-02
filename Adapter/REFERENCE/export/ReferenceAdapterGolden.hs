{-# LANGUAGE NoImplicitPrelude #-}

module Main where

import Prelude (IO, String, putStrLn, (++), show)
import EconomicStateV3
import EconomicTransitionV3
import GoldenVectors
import ReferenceAdapter

renderState :: V3EconomicState -> String
renderState s =
  show (v3CrystallizedLiabilities s)
  ++ "," ++ show (v3UnresolvedReserve s)
  ++ "," ++ show (v3UnresolvedTicketCount s)
  ++ "," ++ show (v3SafetyCapital s)
  ++ "," ++ show (v3ReserveProtection s)
  ++ "," ++ show (v3MandatoryFutureCosts s)
  ++ "," ++ show (ecsCurrentActiveClass (v3Control s))
  ++ "," ++ show (ecsHighestClassEverActivated (v3Control s))
  ++ "," ++ classes (v3Classes s)

classes :: [TicketClassState] -> String
classes [] = ""
classes (c:cs) =
  show (tcsClassId c) ++ ":"
  ++ show (tcsIssued c) ++ ":"
  ++ show (tcsUnresolved c) ++ ":"
  ++ show (tcsExposure c) ++ ":"
  ++ show (tcsCap c) ++ ":"
  ++ show (tcsSaleable c)
  ++ ifNull cs
  where
    ifNull [] = ""
    ifNull xs = "|" ++ classes xs

canonicalState8 :: V3EconomicState
canonicalState8 =
  V3EconomicState
    0 0 0 0 0 0
    [ TicketClassState 0 0 0 0 10 True
    , TicketClassState 1 0 0 0 10 True
    , TicketClassState 2 0 0 0 10 True
    , TicketClassState 3 0 0 0 10 True
    , TicketClassState 4 0 0 0 10 True
    , TicketClassState 5 0 0 0 10 True
    , TicketClassState 6 0 0 0 10 True
    , TicketClassState 7 0 0 0 10 True
    ]
    (EconomicControlState 0 0)
    (JackpotState 0 100 JackpotInactive 0)

main :: IO ()
main = do
  let issueExpected =
        canonicalState8
          { v3UnresolvedReserve = 1
          , v3UnresolvedTicketCount = 1
          , v3Classes = updateFirst (v3Classes canonicalState8)
          }
      revealExpected =
        issueExpected
          { v3CrystallizedLiabilities = 500
          , v3UnresolvedReserve = 0
          , v3UnresolvedTicketCount = 0
          , v3Classes = revealFirst (v3Classes issueExpected)
          }
      steps =
        [ ReferenceStep (Issue 0 1) issueExpected
        , ReferenceStep (Reveal 0 500) revealExpected
        ]
  case replay baseProfile canonicalState8 steps of
    Nothing -> putStrLn "REFERENCE_ERROR"
    Just states -> do
      putStrLn "REFERENCE_V1"
      putStrLn (renderState canonicalState8)
      putStrLn (renderState (headState states))
      putStrLn (renderState (lastState states))
  where
    updateFirst (c:cs) = TicketClassState 0 1 1 1 10 True : cs
    updateFirst [] = []
    revealFirst (c:cs) = TicketClassState 0 1 0 0 10 True : cs
    revealFirst [] = []
    headState (x:_) = x
    headState [] = canonicalState8
    lastState [x] = x
    lastState (_:xs) = lastState xs
    lastState [] = canonicalState8
