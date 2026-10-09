module Main where

import Prelude
import qualified Data.Aeson as A
import qualified Data.ByteString.Lazy as BL
import qualified Data.Text as T
import System.Exit (exitFailure)

import EconomicStateV3
import EconomicKernel
  ( protectedCapital
  , worstCaseExposure
  )
import PreRichEconomicProfile
  ( preRichEconomicProfileV1
  )
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


toDecimalString :: Integer -> String
toDecimalString = show

v3StateToJSON :: V3EconomicState -> A.Value
v3StateToJSON s =
  A.object
    [ "crystallizedLiabilities" A..= toDecimalString (v3CrystallizedLiabilities s)
    , "unresolvedReserve" A..= toDecimalString (v3UnresolvedReserve s)
    , "unresolvedTicketCount" A..= toDecimalString (v3UnresolvedTicketCount s)
    , "safetyCapital" A..= toDecimalString (v3SafetyCapital s)
    , "reserveProtection" A..= toDecimalString (v3ReserveProtection s)
    , "mandatoryFutureCosts" A..= toDecimalString (v3MandatoryFutureCosts s)
    , "classes" A..= map classToJSON (v3Classes s)
    , "control" A..= controlToJSON (v3Control s)
    , "jackpot" A..= jackpotToJSON (v3Jackpot s)
    ]
  where
    classToJSON c' = A.object
      [ "classId" A..= toDecimalString (tcsClassId c')
      , "issued" A..= toDecimalString (tcsIssued c')
      , "unresolved" A..= toDecimalString (tcsUnresolved c')
      , "exposure" A..= toDecimalString (tcsExposure c')
      , "cap" A..= toDecimalString (tcsCap c')
      , "saleable" A..= tcsSaleable c'
      ]
    controlToJSON c' = A.object
      [ "currentActiveClass" A..= toDecimalString (ecsCurrentActiveClass c')
      , "highestClassEverActivated" A..= toDecimalString (ecsHighestClassEverActivated c')
      ]
    jackpotToJSON j' = A.object
      [ "lockedAmount" A..= toDecimalString (jsLockedAmount j')
      , "threshold" A..= toDecimalString (jsThreshold j')
      , "status" A..= jackpotStatusText (jsStatus j')
      , "cycle" A..= toDecimalString (jsCycle j')
      ]
    jackpotStatusText JackpotInactive = ("inactive" :: String)
    jackpotStatusText JackpotLocked = "locked"
    jackpotStatusText JackpotPayable = "payable"
    jackpotStatusText JackpotClosed = "closed"

protectedCapitalToJSON :: V3EconomicState -> A.Value
protectedCapitalToJSON s =
  A.object
    [ "sourceType" A..= ("V3_PRESTATE_CANONICAL_HASKELL" :: String)
    , "components" A..= A.object
        [ "crystallizedLiabilities" A..= toDecimalString (v3CrystallizedLiabilities s)
        , "worstCaseExposure" A..= toDecimalString (worstCaseExposure preRichEconomicProfileV1 s)
        , "safetyCapital" A..= toDecimalString (v3SafetyCapital s)
        , "reserveProtection" A..= toDecimalString (v3ReserveProtection s)
        , "lockedJackpot" A..= toDecimalString (jsLockedAmount (v3Jackpot s))
        , "mandatoryFutureCosts" A..= toDecimalString (v3MandatoryFutureCosts s)
        ]
    , "accountingInputs" A..= A.object
        [ "unresolvedReserve" A..= toDecimalString (v3UnresolvedReserve s)
        , "unresolvedTicketCount" A..= toDecimalString (v3UnresolvedTicketCount s)
        ]
    , "total" A..= toDecimalString (protectedCapital preRichEconomicProfileV1 s)
    ]

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
      , "truthVerified" A..= idTruthVerified d
      , "eevFresh" A..= idEEVFresh d
      , "obligationsComplete" A..= idObligationsComplete d
      , "allOmegaSuccessorsCertified" A..= idAllOmegaSuccessorsCertified d
      , "candidateState" A..= v3StateToJSON (idCandidateState d)
      , "protectedCapitalProvenance" A..= protectedCapitalToJSON (idPreState d)
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
