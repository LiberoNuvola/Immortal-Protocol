{-# LANGUAGE NumericUnderscores #-}
module Main where

import Control.Exception (SomeException, evaluate, try)
import qualified Data.ByteString.Char8 as ByteString
import Data.Monoid (mempty)
import System.Exit (exitFailure)

import PlutusLedgerApi.V1.Address (Address (..))
import PlutusLedgerApi.V1.Credential (Credential (..))
import PlutusLedgerApi.V1.Crypto (PubKeyHash (..))
import PlutusLedgerApi.V1.Scripts (Datum (..))
import PlutusLedgerApi.V1.Tx (TxId (..), TxOutRef (..))
import PlutusLedgerApi.V1.Time (POSIXTime (..))
import PlutusLedgerApi.V1.Interval (interval)
import PlutusLedgerApi.V1.Value (CurrencySymbol (..), TokenName (..), adaSymbol, adaToken, singleton)
import PlutusLedgerApi.V2.Contexts (TxInInfo (..), TxInfo (..))
import PlutusLedgerApi.V2.Tx (OutputDatum (..), TxOut (..))
import PlutusTx (toBuiltinData)
import qualified PlutusTx.AssocMap as AssocMap
import PlutusTx.Builtins (toBuiltin)
import PlutusTx.Prelude (BuiltinByteString)

import Economic
  ( oraclePriceFor
  , poolUsdmValue
  , totalUsdmValue
  )

import OracleTypes
  ( OracleDatum (..)
  , OracleStateId (..)
  )

data Case = Case
  { caseName :: String
  , caseReferences :: [TxInInfo]
  , caseExpectedPrice :: Maybe Integer
  }

main :: IO ()
main = do
  outcomes <- traverse runCase cases
  poolOutcome <- runPoolSingletonZeroCase
  fixedAdaSettlementOutcome <- runFixedAdaGenesisSettlementCase
  if and outcomes && poolOutcome && fixedAdaSettlementOutcome then pure () else exitFailure

runCase :: Case -> IO Bool
runCase testCase = do
  result <- try evaluatePrice :: IO (Either SomeException Integer)
  let passed =
        case caseExpectedPrice testCase of
          Just expected ->
            case result of
              Right actual -> actual == expected
              Left _ -> False
          Nothing ->
            case result of
              Left _ -> True
              Right _ -> False
  putStrLn (prefix passed <> caseName testCase)
  pure passed
  where
    evaluatePrice =
      evaluate
        (oraclePriceFor
          (caseReferences testCase)
          oracleState
          authorizedPublisher
          (transactionInfo (caseReferences testCase))
          assetPolicy
          assetName)

-- Regression for poolUsdmValue's singleton subtraction. The raw Plutus
-- Value map may retain POOL=0 after subtracting the singleton. That zero entry
-- must not require an oracle price; only the non-zero ADA balance is valued.
runPoolSingletonZeroCase :: IO Bool
runPoolSingletonZeroCase = do
  result <- try evaluatePoolValue :: IO (Either SomeException Integer)
  let passed =
        case result of
          Right actual -> actual == 3_400_000
          Left _ -> False
  putStrLn (prefix passed <> "pool singleton subtraction skips zero-quantity oracle lookup")
  pure passed
  where
    poolPolicy = bytes "pool-policy"
    poolName = bytes "pool-token"
    oracleReferences =
      [ referenceInput 0
          (oracleOutputForAsset
            1
            statePolicy
            stateName
            (bytes "")
            (bytes "")
            authorizedPublisher
            now
            price)
      ]
    poolValue =
      singleton adaSymbol adaToken 5_000_000
        <> singleton
             (CurrencySymbol poolPolicy)
             (TokenName poolName)
             1
    evaluatePoolValue =
      evaluate
        (poolUsdmValue
          (transactionInfo oracleReferences)
          oracleState
          authorizedPublisher
          poolPolicy
          poolName
          poolValue)


-- Regression for the currently configured first-Issue payment construction.
-- src/mint.ts sends 1,000,000 lovelace to Treasury, while Economic excludes
-- minUtxoLovelace=1,600,000 from ADA's economic quantity. This test exercises
-- the actual Plutus Economic.totalUsdmValue function used by MintPolicy; it
-- does not execute the full mint policy. The result must be zero, so it cannot
-- satisfy Genesis pdPriceUsdm=100 via this ADA-only output.
runFixedAdaGenesisSettlementCase :: IO Bool
runFixedAdaGenesisSettlementCase = do
  result <- try evaluateSettlement :: IO (Either SomeException Integer)
  let passed =
        case result of
          Right actual -> actual == 0 && actual /= 100
          Left _ -> False
  putStrLn (prefix passed <> "fixed 1 ADA Treasury output values to zero, not Genesis 100 sub-units")
  pure passed
  where
    adaOracleReferences =
      [ referenceInput 0
          (oracleOutputForAsset
            1
            statePolicy
            stateName
            (bytes "")
            (bytes "")
            authorizedPublisher
            now
            price)
      ]
    fixedTreasuryValue = singleton adaSymbol adaToken 1_000_000
    evaluateSettlement =
      evaluate
        (totalUsdmValue
          (transactionInfo adaOracleReferences)
          oracleState
          authorizedPublisher
          fixedTreasuryValue)

prefix :: Bool -> String
prefix passed = if passed then "PASS " else "FAIL "

oracleState :: OracleStateId
oracleState = OracleStateId statePolicy stateName

statePolicy :: BuiltinByteString
statePolicy = bytes "oracle-state-policy"

stateName :: BuiltinByteString
stateName = bytes "oracle-state-token"

assetPolicy :: BuiltinByteString
assetPolicy = bytes "priced-asset-policy"

assetName :: BuiltinByteString
assetName = bytes "priced-asset-name"

authorizedPublisher :: PubKeyHash
authorizedPublisher = PubKeyHash (bytes "authorized-publisher")

otherPublisher :: PubKeyHash
otherPublisher = PubKeyHash (bytes "other-publisher")

now :: Integer
now = 10_000_000

price :: Integer
price = 1_000_000

bytes :: String -> BuiltinByteString
bytes = toBuiltin . ByteString.pack

transactionInfo :: [TxInInfo] -> TxInfo
transactionInfo references =
  TxInfo
    [] references [] mempty mempty [] AssocMap.empty
    (interval (POSIXTime now) (POSIXTime now))
    []
    AssocMap.empty
    AssocMap.empty
    (TxId (bytes "test-transaction"))

referenceInput :: Integer -> TxOut -> TxInInfo
referenceInput index out =
  TxInInfo
    (TxOutRef (TxId (bytes "reference-transaction")) index)
    out

oracleOutputForAsset :: Integer -> BuiltinByteString -> BuiltinByteString -> BuiltinByteString -> BuiltinByteString -> PubKeyHash -> Integer -> Integer -> TxOut
oracleOutputForAsset nftAmount nftPolicy nftName datumPolicy datumName publisher timestamp oraclePrice =
  TxOut
    (Address (PubKeyCredential authorizedPublisher) Nothing)
    (singleton (CurrencySymbol nftPolicy) (TokenName nftName) nftAmount)
    (OutputDatum (Datum (toBuiltinData datum)))
    Nothing
  where
    datum =
      OracleDatum
        datumPolicy
        datumName
        oraclePrice
        timestamp
        publisher

oracleOutput :: Integer -> BuiltinByteString -> BuiltinByteString -> PubKeyHash -> Integer -> Integer -> TxOut
oracleOutput nftAmount nftPolicy nftName publisher timestamp oraclePrice =
  oracleOutputForAsset
    nftAmount
    nftPolicy
    nftName
    assetPolicy
    assetName
    publisher
    timestamp
    oraclePrice

correctOracleOutput :: TxOut
correctOracleOutput =
  oracleOutput 1 statePolicy stateName authorizedPublisher now price

cases :: [Case]
cases =
  [ Case "valid oracle state singleton and datum" [referenceInput 0 correctOracleOutput] (Just price)
  , Case "publisher-correct datum without singleton" [referenceInput 0 (oracleOutput 0 statePolicy stateName authorizedPublisher now price)] Nothing
  , Case "singleton with wrong policy" [referenceInput 0 (oracleOutput 1 (bytes "wrong-policy") stateName authorizedPublisher now price)] Nothing
  , Case "singleton with wrong token name" [referenceInput 0 (oracleOutput 1 statePolicy (bytes "wrong-name") authorizedPublisher now price)] Nothing
  , Case "datum on UTxO different from singleton" [referenceInput 0 (oracleOutputForAsset 1 statePolicy stateName (bytes "other-asset-policy") (bytes "other-asset-name") authorizedPublisher now price), referenceInput 1 (oracleOutput 0 statePolicy stateName authorizedPublisher now price)] Nothing
  , Case "wrong publisher" [referenceInput 0 (oracleOutput 1 statePolicy stateName otherPublisher now price)] Nothing
  , Case "future timestamp" [referenceInput 0 (oracleOutput 1 statePolicy stateName authorizedPublisher (now + 1) price)] Nothing
  , Case "timestamp beyond maximum age" [referenceInput 0 (oracleOutput 1 statePolicy stateName authorizedPublisher (now - 3_600_001) price)] Nothing
  , Case "negative price" [referenceInput 0 (oracleOutput 1 statePolicy stateName authorizedPublisher now (-1))] Nothing
  ]