{-# LANGUAGE ViewPatterns #-}
{-# LANGUAGE DerivingStrategies #-}
{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE TemplateHaskell #-}

module OracleTypes
  ( OracleStateId (..)
  , OracleQuote (..)
  , OracleDatum (..)
  , lookupOracleQuote
  , precision
  , minUtxoLovelace
  , maxOracleAge
  ) where

import PlutusLedgerApi.V2
import PlutusTx
import PlutusTx.Prelude

data OracleStateId = OracleStateId
  { osiPolicy :: BuiltinByteString
  , osiName :: BuiltinByteString
  }

PlutusTx.unstableMakeIsData ''OracleStateId

-- | One asset-specific quote. OracleQuoteSet keeps these records inside the
-- same authenticated singleton UTxO so a basket can be valued without placing
-- the singleton NFT on multiple UTxOs (which is impossible for a true singleton).
data OracleQuote = OracleQuote
  { oqAssetPolicy :: BuiltinByteString
  , oqAssetName :: BuiltinByteString
  , oqPrice :: Integer
  , oqTimestamp :: Integer
  , oqPublisher :: PubKeyHash
  }

PlutusTx.unstableMakeIsData ''OracleQuote

-- | Constructor 0 deliberately preserves the deployed five-field datum.
-- Constructor 1 is the additive multi-quote schema. Because the legacy
-- constructor remains first and unchanged, old single-quote UTxOs remain
-- decodable. Consumers must still validate the selected quote's publisher,
-- freshness and price exactly as before.
data OracleDatum
  = OracleDatum
      { odAssetPolicy :: BuiltinByteString
      , odAssetName :: BuiltinByteString
      , odPrice :: Integer
      , odTimestamp :: Integer
      , odPublisher :: PubKeyHash
      }
  | OracleQuoteSet [OracleQuote]

PlutusTx.unstableMakeIsData ''OracleDatum

-- | Select exactly one quote for an asset. Legacy OracleDatum is treated as
-- a one-element quote set. In the new constructor, missing or duplicate asset
-- identities return Nothing instead of selecting an arbitrary entry.
{-# INLINABLE lookupOracleQuote #-}
lookupOracleQuote
  :: BuiltinByteString
  -> BuiltinByteString
  -> OracleDatum
  -> Maybe OracleQuote
lookupOracleQuote policy name datum =
  case datum of
    OracleDatum assetPolicy assetName price timestamp publisher ->
      if assetPolicy == policy && assetName == name
        then Just (OracleQuote assetPolicy assetName price timestamp publisher)
        else Nothing
    OracleQuoteSet quotes ->
      findUnique quotes Nothing
  where
    findUnique [] found = found
    findUnique (quote:rest) found
      | oqAssetPolicy quote == policy && oqAssetName quote == name =
          case found of
            Just _ -> Nothing
            Nothing -> findUnique rest (Just quote)
      | otherwise = findUnique rest found

{-# INLINABLE precision #-}
precision :: Integer
precision = 1000000

{-# INLINABLE minUtxoLovelace #-}
minUtxoLovelace :: Integer
minUtxoLovelace = 1600000

{-# INLINABLE maxOracleAge #-}
maxOracleAge :: Integer
maxOracleAge = 3600000
