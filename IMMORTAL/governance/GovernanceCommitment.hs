module GovernanceCommitment
  ( commitmentAlgorithm
  , commitmentDigestHex
  , commitmentMatches
  ) where

import qualified Crypto.Hash.SHA256 as SHA256
import Data.ByteString.Char8 (pack)
import Data.ByteString.Base16 (encode)
import qualified Data.ByteString as BS
import GovernanceCanonicalSerialization (canonicalEventBytes)
import GovernanceEventSchema (CanonicalEvent, payloadCommitment)

commitmentAlgorithm :: String
commitmentAlgorithm = "SHA-256"

commitmentDigestHex :: CanonicalEvent -> String
commitmentDigestHex e =
  let digest = SHA256.hash (pack (canonicalEventBytes e))
  in map toLowerAscii (BS.unpack (encode digest))
  where
    toLowerAscii w
      | w >= 65 && w <= 70 = w + 32
      | otherwise = w

commitmentMatches :: CanonicalEvent -> Bool
commitmentMatches e =
  not (null (payloadCommitment e)) &&
  commitmentDigestHex e == payloadCommitment e
