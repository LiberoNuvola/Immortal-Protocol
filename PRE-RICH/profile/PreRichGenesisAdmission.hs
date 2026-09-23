{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE TemplateHaskell #-}
{-# LANGUAGE ViewPatterns #-}

module PreRichGenesisAdmission
  ( GenesisTreasuryObservation (..)
  , genesisTreasuryValueUsdm
  , genesisPredicate
  ) where

import PlutusTx.Prelude
import qualified PlutusTx
import EconomicKernel (ceilingDiv)

-- | PRE-RICH application bootstrap predicate. This is deliberately kept
-- | outside IMMORTAL's universal economic kernel.
usdmSubunitsPerUsdm :: Integer
usdmSubunitsPerUsdm = 100

genesisThresholdUsdmSubunits :: Integer
genesisThresholdUsdmSubunits = 4000 * usdmSubunitsPerUsdm

-- | Oracle prices use the shared economic precision. The observation stores
-- | the already-verified PRE quantity and PRE->USDM price; freshness and
-- | source/Treasury binding are explicit evidence fields.
data GenesisTreasuryObservation = GenesisTreasuryObservation
  { gtoTreasuryIdentityVerified :: Bool
  , gtoSourceRegimePreGenesis   :: Bool
  , gtoPreAssetVerified         :: Bool
  , gtoTreasuryStateVerified    :: Bool
  , gtoOracleVerified           :: Bool
  , gtoOracleFresh              :: Bool
  , gtoPreQuantity              :: Integer
  , gtoVerifiedPreUsdmPrice     :: Integer
  , gtoOraclePrecision          :: Integer
  }

PlutusTx.unstableMakeIsData ''GenesisTreasuryObservation

-- | Value in USDM sub-units after integer conversion. This helper assumes
-- | the observation has already passed the identity/freshness checks.
{-# INLINABLE genesisTreasuryValueUsdm #-}
genesisTreasuryValueUsdm :: GenesisTreasuryObservation -> Maybe Integer
genesisTreasuryValueUsdm o
  | gtoPreQuantity o < 0 = Nothing
  | gtoVerifiedPreUsdmPrice o < 0 = Nothing
  | gtoOraclePrecision o <= 0 = Nothing
  | otherwise =
      Just
        ceilingDiv
          (gtoPreQuantity o * gtoVerifiedPreUsdmPrice o)
          (gtoOraclePrecision o)

{-# INLINABLE genesisPredicate #-}
genesisPredicate :: GenesisTreasuryObservation -> Bool
genesisPredicate o =
  gtoTreasuryIdentityVerified o
  && gtoSourceRegimePreGenesis o
  && gtoPreAssetVerified o
  && gtoTreasuryStateVerified o
  && gtoOracleVerified o
  && gtoOracleFresh o
  && case genesisTreasuryValueUsdm o of
       Nothing -> False
       Just value -> value >= genesisThresholdUsdmSubunits