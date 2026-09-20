module GovernanceFinality
  ( ChallengeStatus(..), Challenge(..), FinalityState(..)
  , openChallenge, resolveChallenge, challengeExpired
  , validChallenges, canFinalize, finalize
  ) where

import Governance

data ChallengeStatus = ChallengeOpen | ChallengeUpheld | ChallengeRejected
  deriving (Eq, Show)

data Challenge = Challenge
  { challengeId :: String
  , challengeProposalId :: ProposalId
  , challengeOpenedAt :: Timestamp
  , challengeStatus :: ChallengeStatus
  } deriving (Eq, Show)

data FinalityState = NotFinal | ChallengePeriod | Finalized | Blocked
  deriving (Eq, Show)

openChallenge :: Proposal -> String -> Timestamp -> Either String Challenge
openChallenge p cid at
  | null cid = Left "challenge id required"
  | proposalStatus p /= DecisionRecorded = Left "proposal is not challengeable"
  | not (finalityWindowOpen p at) = Left "challenge window is closed"
  | otherwise = Right (Challenge cid (proposalId p) at ChallengeOpen)

resolveChallenge :: Challenge -> ChallengeStatus -> Either String Challenge
resolveChallenge c st =
  case (challengeStatus c, st) of
    (ChallengeOpen, ChallengeUpheld)   -> Right c { challengeStatus = ChallengeUpheld }
    (ChallengeOpen, ChallengeRejected) -> Right c { challengeStatus = ChallengeRejected }
    _ -> Left "challenge must be open"

validChallenges :: Proposal -> [Challenge] -> Bool
validChallenges p cs =
  uniqueIds cs &&
  all (\c -> challengeProposalId c == proposalId p &&
             challengeOpenedAt c >= maybe 0 id (votingClosedAt p)) cs
  where
    uniqueIds xs =
      let ids = map challengeId xs
      in length ids == length (dedup ids)
    dedup [] = []
    dedup (x:xs) = x : dedup (filter (/= x) xs)

challengeExpired :: Proposal -> Timestamp -> Bool
challengeExpired p now =
  case votingClosedAt p of
    Just t -> now >= t + finalitySeconds
    Nothing -> False

canFinalize :: Proposal -> [Challenge] -> Timestamp -> Bool
canFinalize p cs now =
  proposalStatus p == DecisionRecorded &&
  validChallenges p cs &&
  challengeExpired p now &&
  all (\c -> challengeStatus c == ChallengeRejected) cs

finalize :: Proposal -> [Challenge] -> Timestamp -> Either String Proposal
finalize p cs now
  | canFinalize p cs now =
      Right p { proposalStatus = Canonical, finalizationAt = Just now }
  | otherwise = Left "proposal cannot be finalized"
