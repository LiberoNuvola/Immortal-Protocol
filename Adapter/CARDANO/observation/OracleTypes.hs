{-# LANGUAGE DerivingStrategies #-}
{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE TemplateHaskell #-}

module OracleTypes
  ( OracleStateId (..)
  , OracleDatum (..)
  , precision
  , minUtxoLovelace
  , maxOracleAge
  ) where

import PlutusLedgerApi.V2
import PlutusTx
import PlutusTx.Prelude

-- | Canonical identity of the Oracle State UTxO.
--
-- The identified UTxO must carry exactly one unit of the singleton NFT
-- identified by this policy/name pair. The identity authenticates the
-- state container; the OracleDatum below remains the price payload.
data OracleStateId = OracleStateId
  { osiPolicy :: BuiltinByteString
  , osiName   :: BuiltinByteString
  }

PlutusTx.unstableMakeIsData ''OracleStateId


-- | Oracle price datum.
--
-- Published by an authorized publisher. Contains the price of an asset
-- in USDM sub-units, scaled by PRECISION (1_000_000).
--
-- The B1PrizePool validator reads this from a reference input and uses it
-- to compute the USDM-denominated value of assets in the PrizePool UTxO.
data OracleDatum = OracleDatum
  { odAssetPolicy :: BuiltinByteString
  -- ^ CurrencySymbol of the asset (raw bytes).
  , odAssetName   :: BuiltinByteString
  -- ^ TokenName of the asset (raw bytes).
  , odPrice       :: Integer
  -- ^ Price of 1 unit of asset in USDM sub-units, scaled by PRECISION.
  --   For ADA: price of 1 lovelace in USDM sub-units * PRECISION.
  --   For USDM: PRECISION (identity: 1 USDM sub-unit = 1 USDM sub-unit).
  , odTimestamp   :: Integer
  -- ^ POSIX time (ms) when the price was published.
  , odPublisher   :: PubKeyHash
  -- ^ Public key hash of the authorized publisher.
  }

PlutusTx.unstableMakeIsData ''OracleDatum


-- | Precision for integer arithmetic.
-- Oracle prices are scaled by this factor.
-- 1_000_000 ensures sufficient precision for sub-unit calculations.
{-# INLINABLE precision #-}
precision :: Integer
precision = 1000000


-- | Minimum UTxO ADA (1.6 ADA = 1_600_000 lovelace).
-- This ADA is NOT economic liquidity; it is a protocol requirement.
{-# INLINABLE minUtxoLovelace #-}
minUtxoLovelace :: Integer
minUtxoLovelace = 1600000


-- | Maximum oracle age in milliseconds (1 hour).
{-# INLINABLE maxOracleAge #-}
maxOracleAge :: Integer
maxOracleAge = 3600000