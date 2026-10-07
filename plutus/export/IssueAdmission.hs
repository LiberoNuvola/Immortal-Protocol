module Main where

import Prelude
import qualified Data.Aeson as A
import qualified Data.ByteString.Lazy as BL
import qualified Data.Text as T
import System.Exit (exitFailure)

import EconomicStateV3
import PreRichIssueDecision

instance A.FromJSON JackpotStatus where
  parseJSON = A.withText "JackpotStatus" $ \t ->
    case t of
      "inactive" -> pure JackpotInactive
      "locked" -> pure JackpotLocked
      "payable" -> pure JackpotPayable
      "closed" -> pure JackpotClosed
      _ -> fail "invalid jackpot status"

instance A.FromJSON TicketClassState where
  parseJSON = A.withObject "TicketClassState" $ \o ->
    TicketClassState
      <$> o A..: "classId"
      <*> o A..: "issued"
      <*> o A..: "unresolved"
      <*> o A..: "exposure"
      <*> o A..: "cap"
      <*> o A..: "saleable"

instance A.FromJSON EconomicControlState where
  parseJSON = A.withObject "EconomicControlState" $ \o ->
    EconomicControlState
      <$> o A..: "currentActiveClass"
      <*> o A..: "highestClassEverActivated"

instance A.FromJSON JackpotState where
  parseJSON = A.withObject "JackpotState" $ \o ->
    JackpotState
      <$> o A..: "lockedAmount"
      <*> o A..: "threshold"
      <*> o A..: "status"
      <*> o A..: "cycle"

instance A.FromJSON V3EconomicState where
  parseJSON = A.withObject "V3EconomicState" $ \o ->
    V3EconomicState
      <$> o A..: "crystallizedLiabilities"
      <*> o A..: "unresolvedReserve"
      <*> o A..: "unresolvedTicketCount"
      <*> o A..: "safetyCapital"
      <*> o A..: "reserveProtection"
      <*> o A..: "mandatoryFutureCosts"
      <*> o A..: "classes"
      <*> o A..: "control"
      <*> o A..: "jackpot"

instance A.ToJSON TicketClassState where
  toJSON c =
    A.object
      [ "classId" A..= show (tcsClassId c)
      , "issued" A..= show (tcsIssued c)
      , "unresolved" A..= show (tcsUnresolved c)
      , "exposure" A..= show (tcsExposure c)
      , "cap" A..= show (tcsCap c)
      , "saleable" A..= tcsSaleable c
      ]

instance A.ToJSON EconomicControlState where
  toJSON c =
    A.object
      [ "currentActiveClass" A..= show (ecsCurrentActiveClass c)
      , "highestClassEverActivated" A..= show (ecsHighestClassEverActivated c)
      ]

instance A.ToJSON JackpotStatus where
  toJSON status =
    A.String $ case status of
      JackpotInactive -> "inactive"
      JackpotLocked -> "locked"
      JackpotPayable -> "payable"
      JackpotClosed -> "closed"

instance A.ToJSON JackpotState where
  toJSON j =
    A.object
      [ "lockedAmount" A..= show (jsLockedAmount j)
      , "threshold" A..= show (jsThreshold j)
      , "status" A..= jsStatus j
      , "cycle" A..= show (jsCycle j)
      ]

instance A.ToJSON V3EconomicState where
  toJSON s =
    A.object
      [ "crystallizedLiabilities" A..= show (v3CrystallizedLiabilities s)
      , "unresolvedReserve" A..= show (v3UnresolvedReserve s)
      , "unresolvedTicketCount" A..= show (v3UnresolvedTicketCount s)
      , "safetyCapital" A..= show (v3SafetyCapital s)
      , "reserveProtection" A..= show (v3ReserveProtection s)
      , "mandatoryFutureCosts" A..= show (v3MandatoryFutureCosts s)
      , "classes" A..= v3Classes s
      , "control" A..= v3Control s
      , "jackpot" A..= v3Jackpot s
      ]

instance A.FromJSON IssueDecisionInput where
  parseJSON = A.withObject "IssueDecisionInput" $ \o ->
    IssueDecisionInput
      <$> o A..: "preState"
      <*> o A..: "classId"
      <*> o A..: "price"
      <*> o A..: "preEEV"
      <*> o A..: "candidateEEV"
      <*> o A..: "availableExecutableLiquidity"
      <*> o A..: "requiredImmediateLiquidity"
      <*> o A..: "truthVerified"
      <*> o A..: "eevFresh"
      <*> o A..: "obligationsComplete"
      <*> o A..: "allOmegaSuccessorsCertified"
      <*> o A..: "decisionReference"
      <*> o A..: "observationReference"

instance A.ToJSON IssueDecision where
  toJSON d =
    A.object
      [ "actionClass" A..= ("Issue" :: String)
      , "action" A..= actionText (idAction d)
      , "stateHash" A..= idPreStateHash d
      , "postStateHash" A..= idPostStateHash d
      , "actionFingerprint" A..= idActionFingerprint d
      , "decisionReference" A..= idDecisionReference d
      , "authoritativeObservationReference" A..= idObservationReference d
      , "preEEV" A..= show (idPreEEV d)
      , "candidateEEV" A..= show (idCandidateEEV d)
      , "availableExecutableLiquidity" A..= show (idAvailableExecutableLiquidity d)
      , "requiredImmediateLiquidity" A..= show (idRequiredImmediateLiquidity d)
      , "candidateState" A..= idCandidateState d
      ]

actionText :: V3Action -> String
actionText (Issue cid price) =
  "Issue:" ++ show cid ++ ":" ++ show price
actionText _ = "INVALID"

main :: IO ()
main = do
  input <- A.eitherDecode =<< BL.getContents
  case input of
    Left err -> do
      BL.putStrLn (A.encode (A.object ["admitted" A..= False, "error" A..= err]))
      exitFailure
    Right decisionInput ->
      case produceIssueDecision decisionInput of
        Nothing -> do
          BL.putStrLn (A.encode (A.object ["admitted" A..= False, "error" A..= ("EconomicAdmission rejected Issue" :: String)]))
          exitFailure
        Just decision -> do
          BL.putStrLn (A.encode (A.object ["admitted" A..= True, "decision" A..= decision]))