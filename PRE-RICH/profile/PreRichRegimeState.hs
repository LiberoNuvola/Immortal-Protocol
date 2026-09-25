{-# LANGUAGE TemplateHaskell #-}
{-# LANGUAGE NoImplicitPrelude #-}

module PreRichRegimeState
  ( PreRichRegime (..)
  , PreRichRegimeState (..)
  , preGenesisState
  , genesisState
  , preGenesisToGenesis
  ) where

import PlutusTx
import PlutusTx.Prelude
import PreRichGenesisAdmission
  ( GenesisTreasuryObservation
  , genesisPredicate
  )

-- | PRE-RICH application lifecycle regime. This is application state, not
-- an IMMORTAL universal economic state primitive.
data PreRichRegime
  = PreGenesis
  | Genesis
  | Active
  | Quiescent

PlutusTx.unstableMakeIsData ''PreRichRegime

-- | Minimal regime carrier for the PRE-GENESIS -> GENESIS transition.
-- Economic state remains outside this carrier and is projected separately.
data PreRichRegimeState = PreRichRegimeState
  { prrsRegime :: PreRichRegime
  }

PlutusTx.unstableMakeIsData ''PreRichRegimeState

{-# INLINABLE preGenesisState #-}
preGenesisState :: PreRichRegimeState
preGenesisState = PreRichRegimeState PreGenesis

{-# INLINABLE genesisState #-}
genesisState :: PreRichRegimeState
genesisState = PreRichRegimeState Genesis

-- | Permissionless transition predicate/witness seam. This pure function
-- does not transfer funds, mint assets, or replace on-chain revalidation.
-- It is deliberately restricted to the single canonical PRE-GENESIS ->
-- GENESIS edge and fails closed for every other source regime.
{-# INLINABLE preGenesisToGenesis #-}
preGenesisToGenesis
  :: PreRichRegimeState
  -> GenesisTreasuryObservation
  -> Maybe PreRichRegimeState
preGenesisToGenesis state observation =
  case prrsRegime state of
    PreGenesis
      | genesisPredicate observation -> Just genesisState
    _ -> Nothing
