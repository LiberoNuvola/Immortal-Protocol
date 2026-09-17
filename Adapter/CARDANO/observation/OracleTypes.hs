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

data OracleStateId = OracleStateId
  { osiPolicy :: BuiltinByteString
  , osiName :: BuiltinByteString
  }

PlutusTx.unstableMakeIsData ''OracleStateId

data OracleDatum = OracleDatum
  { odAssetPolicy :: BuiltinByteString
  , odAssetName :: BuiltinByteString
  , odPrice :: Integer
  , odTimestamp :: Integer
  , odPublisher :: PubKeyHash
  }

PlutusTx.unstableMakeIsData ''OracleDatum

{-# INLINABLE precision #-}
precision :: Integer
precision = 1000000

{-# INLINABLE minUtxoLovelace #-}
minUtxoLovelace :: Integer
minUtxoLovelace = 1600000

{-# INLINABLE maxOracleAge #-}
maxOracleAge :: Integer
maxOracleAge = 3600000
