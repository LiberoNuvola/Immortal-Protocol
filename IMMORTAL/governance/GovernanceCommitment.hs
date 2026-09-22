module GovernanceCommitment
  ( commitmentAlgorithm, commitmentDigestHex, commitmentMatches ) where

import qualified Crypto.Hash.SHA256 as SHA256
import qualified Data.ByteString.Char8 as BSC
import qualified Data.ByteString.Base16 as B16
import qualified Data.Text
import qualified Data.Text.Encoding as TE
import GovernanceCanonicalSerialization (canonicalEventBytes)
import GovernanceEventSchema (CanonicalEvent, payloadCommitment)

commitmentAlgorithm :: String
commitmentAlgorithm = "SHA-256 over UTF-8 canonical event representation"

commitmentDigestHex :: CanonicalEvent -> String
commitmentDigestHex e =
  map lower (BSC.unpack (B16.encode (SHA256.hash (TE.encodeUtf8 (Data.Text.pack (canonicalEventBytes e))))))
  where
    lower w | w >= 65 && w <= 70 = w + 32
            | otherwise = w

commitmentMatches :: CanonicalEvent -> Bool
commitmentMatches e = commitmentDigestHex e == payloadCommitment e
