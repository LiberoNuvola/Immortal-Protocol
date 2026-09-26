{-# LANGUAGE NoImplicitPrelude #-}

module PreRichIssueDecision
  ( IssueDecisionInput (..)
  , IssueDecision (..)
  , produceIssueDecision
  , canonicalV3State
  , canonicalIssueAction
  ) where

import PlutusTx.Prelude
import qualified Prelude as P
import qualified Crypto.Hash.SHA256 as SHA256
import qualified Data.ByteString.Char8 as BSC
import qualified Data.ByteString.Base16 as B16

import EconomicStateV3
import EconomicTransitionV3
import PreRichEconomicAdmission
import PreRichEconomicProfile (preRichEconomicProfileV1)

-- | All economic inputs required to turn an observed PRE-RICH state into an
-- authoritative Issue decision. None are invented here.
data IssueDecisionInput = IssueDecisionInput
  { idiPreState :: V3EconomicState
  , idiClass :: Integer
  , idiPrice :: Integer
  , idiPreEEV :: Integer
  , idiCandidateEEV :: Integer
  , idiAvailableExecutableLiquidity :: Integer
  , idiRequiredImmediateLiquidity :: Integer
  , idiTruthVerified :: Bool
  , idiEEVFresh :: Bool
  , idiObligationsComplete :: Bool
  , idiAllOmegaSuccessorsCertified :: Bool
  , idiDecisionReference :: String
  , idiObservationReference :: String
  }

data IssueDecision = IssueDecision
  { idAction :: V3Action
  , idPreStateHash :: String
  , idPostStateHash :: String
  , idActionFingerprint :: String
  , idDecisionReference :: String
  , idObservationReference :: String
  , idPreEEV :: Integer
  , idCandidateEEV :: Integer
  , idAvailableExecutableLiquidity :: Integer
  , idRequiredImmediateLiquidity :: Integer
  , idCandidateState :: V3EconomicState
  }

-- | Canonical, application-owned serialization. It is deliberately explicit
-- and independent of Haskell 'Show', so the fingerprint cannot silently
-- change because of a compiler/library representation.
canonicalV3State :: V3EconomicState -> String
canonicalV3State s =
  joinFields
    [ i (v3CrystallizedLiabilities s)
    , i (v3UnresolvedReserve s)
    , i (v3UnresolvedTicketCount s)
    , i (v3SafetyCapital s)
    , i (v3ReserveProtection s)
    , i (v3MandatoryFutureCosts s)
    , classes (v3Classes s)
    , control (v3Control s)
    , jackpot (v3Jackpot s)
    ]
  where
    classes [] = ""
    classes (c:cs) =
      joinFields
        [ i (tcsClassId c)
        , i (tcsIssued c)
        , i (tcsUnresolved c)
        , i (tcsExposure c)
        , i (tcsCap c)
        , b (tcsSaleable c)
        ] ++ "|" ++ classes cs

    control c =
      joinFields
        [ i (ecsCurrentActiveClass c)
        , i (ecsHighestClassEverActivated c)
        ]

    jackpot j =
      joinFields
        [ i (jsLockedAmount j)
        , i (jsThreshold j)
        , status (jsStatus j)
        , i (jsCycle j)
        ]

    status JackpotInactive = "inactive"
    status JackpotLocked = "locked"
    status JackpotPayable = "payable"
    status JackpotClosed = "closed"

    i = P.show
    b True = "1"
    b False = "0"

canonicalIssueAction :: V3Action -> String
canonicalIssueAction (Issue cid price) =
  joinFields ["Issue", P.show cid, P.show price]
canonicalIssueAction _ = "INVALID-ISSUE-ACTION"

produceIssueDecision :: IssueDecisionInput -> Maybe IssueDecision
produceIssueDecision input =
  let
    action = Issue (idiClass input) (idiPrice input)
    admission =
      preRichEconomicAdmission
        preRichEconomicProfileV1
        (idiPreState input)
        action
        (idiPreEEV input)
        (idiCandidateEEV input)
        (idiAvailableExecutableLiquidity input)
        (idiRequiredImmediateLiquidity input)
        (idiTruthVerified input)
        (idiEEVFresh input)
        (idiObligationsComplete input)
        (idiAllOmegaSuccessorsCertified input)
  in
    case admission of
      Nothing -> Nothing
      Just admitted ->
        let
          preHash = digest (canonicalV3State (idiPreState input))
          postHash = digest (canonicalV3State (peaCandidateV3 admitted))
          actionHash =
            digest
              (joinFields
                [ canonicalIssueAction action
                , preHash
                , postHash
                ])
        in
          Just
            (IssueDecision
              { idAction = action
              , idPreStateHash = preHash
              , idPostStateHash = postHash
              , idActionFingerprint = actionHash
              , idDecisionReference = idiDecisionReference input
              , idObservationReference = idiObservationReference input
              , idPreEEV = peaPreEEV admitted
              , idCandidateEEV = peaCandidateEEV admitted
              , idAvailableExecutableLiquidity =
                  peaAvailableExecutableLiquidity admitted
              , idRequiredImmediateLiquidity =
                  peaRequiredImmediateLiquidity admitted
              , idCandidateState = peaCandidateV3 admitted
              })

digest :: String -> String
digest value =
  BSC.unpack
    (B16.encode
      (SHA256.hash
        (BSC.pack value)))

joinFields :: [String] -> String
joinFields [] = ""
joinFields [x] = x
joinFields (x:xs) = x ++ "|" ++ joinFields xs
