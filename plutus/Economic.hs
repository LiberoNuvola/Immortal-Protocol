{-# LANGUAGE DataKinds           #-}
{-# LANGUAGE NoImplicitPrelude   #-}
{-# LANGUAGE OverloadedStrings   #-}
{-# LANGUAGE ScopedTypeVariables #-}

module Economic
  ( usdmPrecision
  , adaMinUtxo
  , oracleMaxAge
  , ceilingDiv
  , validOracleTimestamp
  , oraclePriceFor
  , totalUsdmValue
  , poolUsdmValue
  ) where

import PlutusLedgerApi.V2
import PlutusLedgerApi.V2.Contexts
import PlutusTx.Prelude
import qualified PlutusTx.AssocMap as AssocMap

import OracleTypes
  ( OracleStateId (..)
  , OracleDatum (..)
  , OracleQuote (..)
  , lookupOracleQuote
  , precision
  , minUtxoLovelace
  , maxOracleAge
  )

import EconomicKernel
  ( ceilingDiv
  )

{-# INLINABLE usdmPrecision #-}
usdmPrecision :: Integer
usdmPrecision = precision

{-# INLINABLE adaMinUtxo #-}
adaMinUtxo :: Integer
adaMinUtxo = minUtxoLovelace

{-# INLINABLE oracleMaxAge #-}
oracleMaxAge :: Integer
oracleMaxAge = maxOracleAge


-- | Oracle timestamp validation against the transaction validity
-- upper bound.
{-# INLINABLE validOracleTimestamp #-}
validOracleTimestamp
  :: Integer
  -> TxInfo
  -> Bool
validOracleTimestamp timestamp info =
  case ivTo (txInfoValidRange info) of
    UpperBound (Finite t) _ ->
      let
        now =
          getPOSIXTime t
      in
        timestamp <= now
          && now - timestamp <= maxOracleAge

    _ ->
      False


{-# INLINABLE decodeOracleDatum #-}
decodeOracleDatum
  :: TxInfo
  -> TxOut
  -> Maybe OracleDatum
decodeOracleDatum info out =
  case txOutDatum out of
    OutputDatum d ->
      fromBuiltinData (getDatum d)

    OutputDatumHash dh ->
      case findDatum dh info of
        Just d ->
          fromBuiltinData (getDatum d)

        Nothing ->
          Nothing

    NoOutputDatum ->
      Nothing


-- | Resolve an asset-specific price from the authenticated Oracle State
-- reference input. Legacy five-field OracleDatum remains supported. The
-- additive OracleQuoteSet constructor allows a single singleton UTxO to carry
-- several independently timestamped, publisher-bound quotes. Missing or
-- duplicate target quotes fail closed.
{-# INLINABLE oraclePriceFor #-}
oraclePriceFor
  :: [TxInInfo]
  -> OracleStateId
  -> PubKeyHash
  -> TxInfo
  -> BuiltinByteString
  -> BuiltinByteString
  -> Integer
oraclePriceFor [] _ _ _ _ _ =
  traceError "Economic: oracle missing"

oraclePriceFor
  (i:is)
  oracleState
  publisher
  info
  csBytes
  tnBytes =
  let
    out = txInInfoResolved i
    oracleStatePresent =
      valueOf
        (txOutValue out)
        (CurrencySymbol (osiPolicy oracleState))
        (TokenName (osiName oracleState))
        == 1
  in
  case decodeOracleDatum info out of
    Just datum
      | oracleStatePresent ->
          case lookupOracleQuote csBytes tnBytes datum of
            Just quote
              | oqPublisher quote == publisher
              && validOracleTimestamp (oqTimestamp quote) info
              && oqPrice quote >= 0 ->
                  oqPrice quote
            _ ->
              oraclePriceFor is oracleState publisher info csBytes tnBytes
    _ ->
      oraclePriceFor is oracleState publisher info csBytes tnBytes


-- | Canonical conversion from Value to USDM sub-units.
--
-- ADA:
--   the protocol minimum-UTxO amount is excluded from economic value.
--
-- Other assets:
--   the complete quantity is valued.
--
-- Every non-zero asset encountered by this function requires a matching
-- oracle. Value arithmetic can retain zero-quantity map entries (for example,
-- after poolUsdmValue removes the Pool singleton); they have no economic value
-- and must not trigger an oracle lookup.
{-# INLINABLE totalUsdmValue #-}
totalUsdmValue
  :: TxInfo
  -> OracleStateId
  -> PubKeyHash
  -> Value
  -> Integer
totalUsdmValue info oracleState publisher val =
  go
    (txInfoReferenceInputs info)
    (AssocMap.toList (getValue val))
  where

    go _ [] =
      0

    go refs ((cs, innerMap):rest) =
      goInner
        refs
        (unCurrencySymbol cs)
        (AssocMap.toList innerMap)
        + go refs rest

    goInner _ _ [] =
      0

    goInner
      refs
      csBytes
      ((tn, amt):rest)
      | amt == 0 =
          goInner
            refs
            csBytes
            rest

      | otherwise =
          let
            price =
              oraclePriceFor
                refs
                oracleState
                publisher
                info
                csBytes
                (unTokenName tn)

            economicAmt
              | csBytes == unCurrencySymbol adaSymbol
              && unTokenName tn == unTokenName adaToken =
                  max
                    0
                    (amt - minUtxoLovelace)

              | otherwise =
                  amt

          in
            ceilingDiv
              (economicAmt * price)
              precision
              + goInner
                  refs
                  csBytes
                  rest


-- | Canonical Pool valuation excluding the protocol singleton NFT.
{-# INLINABLE poolUsdmValue #-}
poolUsdmValue
  :: TxInfo
  -> OracleStateId
  -> PubKeyHash
  -> BuiltinByteString
  -> BuiltinByteString
  -> Value
  -> Integer
poolUsdmValue
  info
  oracleState
  publisher
  poolPolicy
  poolName
  val =
  totalUsdmValue
    info
    oracleState
    publisher
    ( val
      - singleton
          (CurrencySymbol poolPolicy)
          (TokenName poolName)
          1
    )