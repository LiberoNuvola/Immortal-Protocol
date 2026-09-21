{-# LANGUAGE NoImplicitPrelude #-}

module PreRichEconomicProfile
  ( preRichEconomicProfileV1
  ) where

import EconomicProfile

-- | PRE-RICH application profile.
-- These values are application parameters, not universal IMMORTAL constants.
preRichEconomicProfileV1 :: EconomicProfile
preRichEconomicProfileV1 =
  EconomicProfile
    { epVersion = 1
    , epClassPrices =
        [ (0, 1)
        , (1, 2)
        , (2, 3)
        , (3, 5)
        , (4, 10)
        , (5, 25)
        , (6, 50)
        , (7, 100)
        ]
    , epMaxNormalPayoutMultiplier = 500
    }
