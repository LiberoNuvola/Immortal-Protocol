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
  , OracleQuote (..)
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
  exactAdaSettlementOutcome <- runExactAdaGenesisSettlementCase
  adaRoundingBoundaryOutcome <- runAdaCeilingRoundingBoundaryCase
  mixedBasketOutcome <- runMixedAssetBasketRequiresPerAssetQuoteCase
  quoteSetBasketOutcome <- runMultiAssetQuoteSetBasketCase
  duplicateQuoteOutcome <- runDuplicateOracleQuoteFailsClosedCase
  legacyFallbackGapOutcome <- runLegacyOracleQuoteRemainsAuthoritativeWithUnqualifiedCandidateCase
  if and outcomes && poolOutcome && fixedAdaSettlementOutcome && exactAdaSettlementOutcome
      && adaRoundingBoundaryOutcome && mixedBasketOutcome && quoteSetBasketOutcome
      && duplicateQuoteOutcome && legacyFallbackGapOutcome
    then pure ()
    else exitFailure

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
-- src/mint.ts requests a Treasury output value of 1,000,000 lovelace, while Economic excludes
-- minUtxoLovelace=1,600,000 from ADA's economic quantity. This test exercises
-- the actual Plutus Economic.totalUsdmValue function used by MintPolicy; it
-- does not execute the full mint policy or establish the final completed Lucid transaction body's output value. For the requested value, the result must be zero, so it cannot
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

-- Positive control: an explicit synthetic quote and ADA amount represent
-- the Genesis target under the current integer conversion. The oracle quote
-- is only a unit-test fixture, not a claim about any live ADA market price.
runExactAdaGenesisSettlementCase :: IO Bool
runExactAdaGenesisSettlementCase = do
  result <- try evaluateSettlement :: IO (Either SomeException Integer)
  let passed = case result of Right actual -> actual == 100; Left _ -> False
  putStrLn (prefix passed <> "synthetic authenticated ADA quote yields exactly 100 USDM sub-units")
  pure passed
  where
    adaOracleReferences =
      [ referenceInput 0
          (oracleOutputForAsset 1 statePolicy stateName (bytes "") (bytes "") authorizedPublisher now 100)
      ]
    treasuryValue = singleton adaSymbol adaToken 2_600_000
    evaluateSettlement = evaluate (totalUsdmValue (transactionInfo adaOracleReferences) oracleState authorizedPublisher treasuryValue)

-- Boundary regression: the canonical per-asset conversion currently uses
-- ceilingDiv. One lovelace below the exact synthetic amount still maps to the
-- 100-sub-unit integer target (99.9999 before quantization). This describes
-- the implemented integer semantics; bounded conversion policy must not be
-- claimed more generally without reconciling the relevant specification.
runAdaCeilingRoundingBoundaryCase :: IO Bool
runAdaCeilingRoundingBoundaryCase = do
  result <- try evaluateSettlement :: IO (Either SomeException Integer)
  let passed = case result of Right actual -> actual == 100; Left _ -> False
  putStrLn (prefix passed <> "ceiling conversion rounds 99.9999 sub-units to the 100-sub-unit target")
  pure passed
  where
    adaOracleReferences =
      [ referenceInput 0
          (oracleOutputForAsset 1 statePolicy stateName (bytes "") (bytes "") authorizedPublisher now 100)
      ]
    treasuryValue = singleton adaSymbol adaToken 2_599_999
    evaluateSettlement = evaluate (totalUsdmValue (transactionInfo adaOracleReferences) oracleState authorizedPublisher treasuryValue)
-- Negative compatibility vector for the legacy single-quote OracleDatum
-- constructor. A token settlement output on Cardano also carries ADA for
-- min-UTxO. totalUsdmValue still asks for an oracle match for each nonzero
-- asset before excluding ADA's minimum-UTxO quantity from economic value.
-- A legacy PRE-only datum therefore cannot value an ADA+PRE basket; the
-- additive OracleQuoteSet case below supplies both identities on the same
-- authenticated singleton reference input.
runMixedAssetBasketRequiresPerAssetQuoteCase :: IO Bool
runMixedAssetBasketRequiresPerAssetQuoteCase = do
  result <- try evaluateBasket :: IO (Either SomeException Integer)
  let passed =
        case result of
          Left _ -> True
          Right _ -> False
  putStrLn (prefix passed <> "legacy single-quote datum rejects ADA+PRE basket when only PRE is quoted")
  pure passed
  where
    prePolicy = bytes "pre-settlement-policy"
    preName = bytes "PRE-RICH"
    preOracleReferences =
      [ referenceInput 0
          (oracleOutputForAsset
            1
            statePolicy
            stateName
            prePolicy
            preName
            authorizedPublisher
            now
            price)
      ]
    mixedTreasuryValue =
      singleton adaSymbol adaToken 1_600_000
        <> singleton (CurrencySymbol prePolicy) (TokenName preName) 1
    evaluateBasket =
      evaluate
        (totalUsdmValue
          (transactionInfo preOracleReferences)
          oracleState
          authorizedPublisher
          mixedTreasuryValue)
-- A single authenticated singleton UTxO may carry one quote per asset.
-- This basket has the exact ADA min-UTxO floor plus one quoted PRE quantity.
-- ADA's economic quantity is zero, but its quote is still required by the
-- existing totalUsdmValue traversal before the minimum-UTxO exclusion.
runMultiAssetQuoteSetBasketCase :: IO Bool
runMultiAssetQuoteSetBasketCase = do
  result <- try evaluateSettlement :: IO (Either SomeException Integer)
  let passed = case result of
        Right actual -> actual == 100
        Left _ -> False
  putStrLn (prefix passed <> "multi-asset OracleQuoteSet values ADA+PRE basket from one singleton reference")
  pure passed
  where
    prePolicy = bytes "pre-settlement-policy"
    preName = bytes "PRE-RICH"
    quoteSet =
      OracleQuoteSet
        [ OracleQuote (bytes "") (bytes "") 100 now authorizedPublisher
        , OracleQuote prePolicy preName 100 now authorizedPublisher
        ]
    oracleReferences =
      [ referenceInput 0
          (oracleOutputWithDatum 1 statePolicy stateName quoteSet)
      ]
    basket =
      singleton adaSymbol adaToken 1_600_000
        <> singleton (CurrencySymbol prePolicy) (TokenName preName) 1_000_000
    evaluateSettlement =
      evaluate
        (totalUsdmValue
          (transactionInfo oracleReferences)
          oracleState
          authorizedPublisher
          basket)

-- More than one quote for the requested identity is ambiguous and must not
-- select the first/last entry. lookupOracleQuote returns Nothing and the
-- valuation primitive fails closed.
runDuplicateOracleQuoteFailsClosedCase :: IO Bool
runDuplicateOracleQuoteFailsClosedCase = do
  result <- try evaluateSettlement :: IO (Either SomeException Integer)
  let passed = case result of
        Left _ -> True
        Right _ -> False
  putStrLn (prefix passed <> "duplicate OracleQuoteSet identity fails closed")
  pure passed
  where
    prePolicy = bytes "pre-settlement-policy"
    preName = bytes "PRE-RICH"
    quoteSet =
      OracleQuoteSet
        [ OracleQuote prePolicy preName 100 now authorizedPublisher
        , OracleQuote prePolicy preName 200 now authorizedPublisher
        ]
    oracleReferences =
      [ referenceInput 0
          (oracleOutputWithDatum 1 statePolicy stateName quoteSet)
      ]
    basket = singleton (CurrencySymbol prePolicy) (TokenName preName) 1_000_000
    evaluateSettlement =
      evaluate
        (totalUsdmValue
          (transactionInfo oracleReferences)
          oracleState
          authorizedPublisher
          basket)

-- Negative control / blocker reproduction for the Pyth source-to-economics seam.
--
-- A quote-like reference input carrying a conflicting price is deliberately
-- NOT the configured OracleState singleton. The current Economic.totalUsdmValue
-- ignores it and still values the Treasury basket from the legacy singleton.
-- This test documents the current gap; it does NOT certify the path as safe.
-- When MintPolicy is actually bound to the Pyth carrier, replace this
-- characterization test with native-ledger acceptance/rejection vectors.
runLegacyOracleQuoteRemainsAuthoritativeWithUnqualifiedCandidateCase :: IO Bool
runLegacyOracleQuoteRemainsAuthoritativeWithUnqualifiedCandidateCase = do
  result <- try evaluateSettlement :: IO (Either SomeException Integer)
  let observedLegacyAuthority =
        case result of
          Right actual -> actual == legacyPrice && actual /= candidatePrice
          Left _ -> False
  putStrLn
    ( (if observedLegacyAuthority then "OBSERVED " else "FAIL ")
        <> "OPEN SOURCE-TO-ECONOMICS GAP: legacy OracleState quote controls valuation despite a conflicting unqualified candidate quote"
    )
  pure observedLegacyAuthority
  where
    candidatePrice = 200
    legacyPrice = 100
    assetBasket =
      singleton
        (CurrencySymbol assetPolicy)
        (TokenName assetName)
        1_000_000
    unqualifiedCandidateReference =
      referenceInput
        0
        (oracleOutputWithDatum
          0
          statePolicy
          stateName
          (OracleQuoteSet
            [ OracleQuote assetPolicy assetName candidatePrice now authorizedPublisher
            ])
        )
    configuredLegacyReference =
      referenceInput
        1
        (oracleOutputWithDatum
          1
          statePolicy
          stateName
          (OracleQuoteSet
            [ OracleQuote assetPolicy assetName legacyPrice now authorizedPublisher
            ])
        )
    evaluateSettlement =
      evaluate
        (totalUsdmValue
          (transactionInfo [unqualifiedCandidateReference, configuredLegacyReference])
          oracleState
          authorizedPublisher
          assetBasket)

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
  oracleOutputWithDatum nftAmount nftPolicy nftName
    (OracleDatum datumPolicy datumName oraclePrice timestamp publisher)

oracleOutputWithDatum :: Integer -> BuiltinByteString -> BuiltinByteString -> OracleDatum -> TxOut
oracleOutputWithDatum nftAmount nftPolicy nftName datum =
  TxOut
    (Address (PubKeyCredential authorizedPublisher) Nothing)
    (singleton (CurrencySymbol nftPolicy) (TokenName nftName) nftAmount)
    (OutputDatum (Datum (toBuiltinData datum)))
    Nothing

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