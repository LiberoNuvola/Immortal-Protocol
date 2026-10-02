{-# LANGUAGE NoImplicitPrelude #-}

module ReferenceAdapter
  ( ReferenceStep (..)
  , replay
  , replayValid
  ) where

import PlutusTx.Prelude
import EconomicProfile (EconomicProfile)
import EconomicStateV3 (V3EconomicState (..), TicketClassState (..), EconomicControlState (..), JackpotState (..))
import EconomicTransitionV3 (V3Action, transition, transitionValid)

data ReferenceStep = ReferenceStep
  { rsAction :: V3Action
  , rsExpected :: V3EconomicState
  }

{-# INLINABLE replay #-}
replay :: EconomicProfile -> V3EconomicState -> [ReferenceStep] -> Maybe [V3EconomicState]
replay _ _ [] = Just []
replay profile state (step:steps) =
  case transition profile state (rsAction step) of
    Nothing -> Nothing
    Just next ->
      case replay profile next steps of
        Nothing -> Nothing
        Just rest -> Just (next : rest)

{-# INLINABLE replayValid #-}
replayValid :: EconomicProfile -> V3EconomicState -> [ReferenceStep] -> Bool
replayValid profile initial steps = go initial steps
  where
    go _ [] = True
    go state (step:rest) =
      transitionValid profile state (rsAction step)
      && case transition profile state (rsAction step) of
           Nothing -> False
           Just next ->
             sameState next (rsExpected step)
             && go next rest

    sameState a b =
         v3CrystallizedLiabilities a == v3CrystallizedLiabilities b
      && v3UnresolvedReserve a == v3UnresolvedReserve b
      && v3UnresolvedTicketCount a == v3UnresolvedTicketCount b
      && v3SafetyCapital a == v3SafetyCapital b
      && v3ReserveProtection a == v3ReserveProtection b
      && v3MandatoryFutureCosts a == v3MandatoryFutureCosts b
      && sameClasses (v3Classes a) (v3Classes b)
      && sameControl (v3Control a) (v3Control b)
      && sameJackpot (v3Jackpot a) (v3Jackpot b)

    sameClasses [] [] = True
    sameClasses (a:as) (b:bs) =
         tcsClassId a == tcsClassId b
      && tcsIssued a == tcsIssued b
      && tcsUnresolved a == tcsUnresolved b
      && tcsExposure a == tcsExposure b
      && tcsCap a == tcsCap b
      && tcsSaleable a == tcsSaleable b
      && sameClasses as bs
    sameClasses _ _ = False

    sameControl a b =
         ecsCurrentActiveClass a == ecsCurrentActiveClass b
      && ecsHighestClassEverActivated a == ecsHighestClassEverActivated b

    sameJackpot a b =
         jsLockedAmount a == jsLockedAmount b
      && jsThreshold a == jsThreshold b
      && jsStatus a == jsStatus b
      && jsCycle a == jsCycle b
