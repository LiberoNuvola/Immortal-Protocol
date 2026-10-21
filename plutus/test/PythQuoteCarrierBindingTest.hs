{-# LANGUAGE NumericUnderscores #-}

module Main where

import Prelude

import qualified Data.ByteString.Char8 as ByteString
import PlutusLedgerApi.V1.Address (Address (..))
import PlutusLedgerApi.V1.Credential (Credential (..))
import PlutusLedgerApi.V1.Crypto (PubKeyHash (..))
import PlutusLedgerApi.V1.Scripts (Datum (..), ScriptHash (..))
import PlutusLedgerApi.V1.Tx (TxId (..), TxOutRef (..))
import PlutusLedgerApi.V1.Time (POSIXTime (..))
import PlutusLedgerApi.V1.Interval (interval)
import PlutusLedgerApi.V1.Value
  ( CurrencySymbol (..)
  , TokenName (..)
  , Value
  , adaSymbol
  , adaToken
  , singleton
  )
import PlutusLedgerApi.V2.Contexts (TxInInfo (..), TxInfo (..))
import PlutusLedgerApi.V2.Tx (OutputDatum (..), TxOut (..))
import PlutusTx (toBuiltinData)
import qualified PlutusTx.AssocMap as AssocMap
import PlutusTx.Builtins (toBuiltin)
import PlutusTx.Prelude (BuiltinByteString)

import PythQuoteCarrierBinding
  ( PythAdaUsdBinding (..)
  , PythAdaUsdQuoteCarrierDatum (..)
  , extractBoundPythAdaUsdQuote
  )

import PythAdaUsdConversion (pythAdaUsdToUsdmSubunitsCandidate)

bytes :: String -> BuiltinByteString
bytes = toBuiltin . ByteString.pack

carrierHash :: ScriptHash
carrierHash = ScriptHash (bytes "pyth-carrier-script-hash")

authorityPolicy :: CurrencySymbol
authorityPolicy = CurrencySymbol (bytes "carrier-authority-policy")

authorityName :: TokenName
authorityName = TokenName (bytes "PYTH_QUOTE_CARRIER")

carrierAddress :: Address
carrierAddress = Address (ScriptCredential carrierHash) Nothing

buyerAddress :: Address
buyerAddress = Address (PubKeyCredential (PubKeyHash (bytes "buyer"))) Nothing

carrierValue :: Value
carrierValue =
  singleton adaSymbol adaToken 2_000_000
    <> singleton authorityPolicy authorityName 1

changedValue :: Value
changedValue =
  singleton adaSymbol adaToken 2_000_001
    <> singleton authorityPolicy authorityName 1

rawQuote :: PythAdaUsdBinding
rawQuote = PythAdaUsdBinding 69_500_000 (-8) 1_700_000_000_000_000 1_699_999_990_000_000

priorDatum :: PythAdaUsdQuoteCarrierDatum
priorDatum = PythAdaUsdQuoteCarrierDatum Nothing

quoteDatum :: PythAdaUsdQuoteCarrierDatum
quoteDatum = PythAdaUsdQuoteCarrierDatum (Just rawQuote)

carrierOut :: PythAdaUsdQuoteCarrierDatum -> Value -> TxOut
carrierOut datum value =
  TxOut
    carrierAddress
    value
    (OutputDatum (Datum (toBuiltinData datum)))
    Nothing

carrierOutAt :: Address -> PythAdaUsdQuoteCarrierDatum -> Value -> TxOut
carrierOutAt address datum value =
  TxOut
    address
    value
    (OutputDatum (Datum (toBuiltinData datum)))
    Nothing

carrierInput :: Integer -> PythAdaUsdQuoteCarrierDatum -> Value -> TxInInfo
carrierInput index datum value =
  TxInInfo
    (TxOutRef (TxId (bytes "carrier-input")) index)
    (carrierOut datum value)

malformedCarrierInput :: Integer -> Value -> TxInInfo
malformedCarrierInput index value =
  TxInInfo
    (TxOutRef (TxId (bytes "carrier-input")) index)
    (TxOut
      carrierAddress
      value
      (OutputDatum (Datum (toBuiltinData (42 :: Integer))))
      Nothing)

txInfo :: [TxInInfo] -> [TxOut] -> Value -> TxInfo
txInfo inputs outputs minted =
  TxInfo
    inputs
    []
    outputs
    mempty
    minted
    []
    AssocMap.empty
    (interval (POSIXTime 1_700_000_000_000) (POSIXTime 1_700_000_000_000))
    []
    AssocMap.empty
    AssocMap.empty
    (TxId (bytes "test-transaction"))

validInfo :: TxInfo
validInfo =
  txInfo
    [carrierInput 0 priorDatum carrierValue]
    [carrierOut quoteDatum carrierValue]
    mempty

sameRawQuote :: PythAdaUsdBinding -> PythAdaUsdBinding -> Bool
sameRawQuote a b =
     pabPrice a == pabPrice b
  && pabExponent a == pabExponent b
  && pabUpdateTimestampUs a == pabUpdateTimestampUs b
  && pabFeedUpdateTimestampUs a == pabFeedUpdateTimestampUs b

extract :: TxInfo -> Maybe PythAdaUsdBinding
extract = extractBoundPythAdaUsdQuote carrierHash authorityPolicy authorityName

rejected :: TxInfo -> Bool
rejected info =
  case extract info of
    Nothing -> True
    Just _ -> False

assert :: Bool -> String -> IO ()
assert condition label =
  if condition then putStrLn ("PASS: " ++ label)
  else error ("FAIL: " ++ label)

main :: IO ()
main = do
  assert
    (case extract validInfo of
      Just actual -> sameRawQuote actual rawQuote
      Nothing -> False)
    "unique carrier continuation returns exact raw price/exponent/timestamps"

  assert
    (case extract validInfo of
      Just quote ->
        pythAdaUsdToUsdmSubunitsCandidate
          (pabPrice quote)
          (pabExponent quote)
          1_000_000
          1
          1
          18
          == Just 70
      Nothing -> False)
    "candidate conversion consumes the extracted raw carrier tuple (synthetic D=1/1; not authoritative)"

  assert
    (rejected (txInfo [] [carrierOut quoteDatum carrierValue] mempty))
    "missing carrier input fails closed"

  assert
    (rejected (txInfo [carrierInput 0 priorDatum carrierValue] [] mempty))
    "missing carrier continuation fails closed"

  assert
    (rejected (txInfo
      [carrierInput 0 priorDatum carrierValue, carrierInput 1 priorDatum carrierValue]
      [carrierOut quoteDatum carrierValue]
      mempty))
    "duplicate carrier inputs fail closed"

  assert
    (rejected (txInfo
      [carrierInput 0 priorDatum carrierValue]
      [carrierOut quoteDatum carrierValue, carrierOut quoteDatum carrierValue]
      mempty))
    "duplicate carrier outputs fail closed"

  assert
    (rejected (txInfo
      [carrierInput 0 priorDatum carrierValue]
      [carrierOut quoteDatum changedValue]
      mempty))
    "changed continuation Value fails closed"

  assert
    (rejected (txInfo
      [carrierInput 0 priorDatum carrierValue]
      [carrierOutAt buyerAddress quoteDatum carrierValue]
      mempty))
    "substituted continuation address fails closed"

  assert
    (rejected (txInfo
      [carrierInput 0 priorDatum (singleton adaSymbol adaToken 2_000_000)]
      [carrierOut quoteDatum carrierValue]
      mempty))
    "missing authority singleton in inputs fails closed"

  assert
    (rejected (txInfo
      [carrierInput 0 priorDatum carrierValue]
      [carrierOut quoteDatum (singleton adaSymbol adaToken 2_000_000)]
      mempty))
    "missing authority singleton in outputs fails closed"

  assert
    (rejected (txInfo
      [carrierInput 0 priorDatum carrierValue]
      [carrierOut quoteDatum carrierValue, carrierOutAt buyerAddress quoteDatum
        (singleton authorityPolicy authorityName 1)]
      mempty))
    "authority singleton duplicated outside carrier continuation fails closed"

  assert
    (rejected (txInfo
      [carrierInput 0 priorDatum carrierValue]
      [carrierOut quoteDatum carrierValue]
      (singleton authorityPolicy authorityName 1)))
    "minted or burned authority singleton fails closed"

  assert
    (rejected (txInfo
      [malformedCarrierInput 0 carrierValue]
      [carrierOut quoteDatum carrierValue]
      mempty))
    "malformed consumed carrier datum fails closed"

  assert
    (rejected (txInfo
      [carrierInput 0 priorDatum carrierValue]
      [carrierOut priorDatum carrierValue]
      mempty))
    "missing quote fails closed"

  assert
    (rejected (txInfo
      [carrierInput 0 priorDatum carrierValue]
      [carrierOut (PythAdaUsdQuoteCarrierDatum
        (Just (PythAdaUsdBinding 0 (-8) 1_700_000_000_000_000 1_699_999_990_000_000)))
        carrierValue]
      mempty))
    "non-positive raw price fails closed"

  putStrLn "ALL PYTH QUOTE-CARRIER BINDING CANDIDATE TESTS PASSED"
