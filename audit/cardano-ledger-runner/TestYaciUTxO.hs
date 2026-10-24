{-# LANGUAGE OverloadedStrings #-}

module Main (main) where

import Cardano.Ledger.Address (decodeAddrEither)
import Cardano.Ledger.Babbage.TxOut (BabbageTxOut (..))
import Cardano.Ledger.BaseTypes (TxIx (..))
import Cardano.Ledger.Coin (Coin (..))
import Cardano.Ledger.Conway (ConwayEra)
import Cardano.Ledger.Mary.Value
  ( AssetName (..)
  , MaryValue (..)
  , MultiAsset (..)
  , PolicyID
  )
import Cardano.Ledger.Plutus.Data
  ( BinaryData
  , Datum (..)
  , hashBinaryData
  , makeBinaryData
  )
import Cardano.Ledger.State (UTxO (..))
import Cardano.Ledger.TxIn (TxId, TxIn (..))
import Data.Aeson (Result (..), Value (..), fromJSON, toJSON)
import qualified Data.ByteString.Base16 as B16
import qualified Data.ByteString.Char8 as B8
import Data.ByteString.Short (toShort)
import qualified Data.Map.Strict as Map
import qualified Data.Text as Text
import System.Exit (exitFailure)
import YaciUTxO (decodeYaciUTxO)

txHash :: String
txHash = replicate 64 '0'

-- Representative values copied from the real Yaci UTxO response captured
-- by the Integration Lab #1883 evidence artifact; assertions below treat them
-- as fixtures only and never substitute them for the P2.8 ledger gate.
address :: String
address = "addr_test1wzh4pxgnxgd6zf4xkzufdevnd0562sswpv5khd954eahlks0v4609"

addressHex :: String
addressHex = "70af509913321ba126a6b0b896e5936be9a5420e0b296bb4b4ae7b7fda"

assetPolicyHex :: String
assetPolicyHex = "89234e0f20373cde0c7b0644edeb3cfc1dbca4005fd98b731518d235"

poolUnit :: String
poolUnit = assetPolicyHex <> "504f4f4c"

usdmUnit :: String
usdmUnit = assetPolicyHex <> "5553444d"

amountJson :: String
amountJson =
  "[{\"unit\": \"lovelace\", \"quantity\": \"5000000\"}, " <>
  "{\"unit\": \"" <> poolUnit <> "\", \"quantity\": \"1\"}, " <>
  "{\"unit\": \"" <> usdmUnit <> "\", \"quantity\": \"100000\"}]"

packet :: String
packet =
  unlines
    [ "{"
    , "  \"observed\": {"
    , "    \"inputs\": ["
    , "      {"
    , "        \"tx_hash\": \"" <> txHash <> "\","
    , "        \"output_index\": 0,"
    , "        \"address\": \"" <> address <> "\","
    , "        \"ledger_address_hex\": \"" <> addressHex <> "\","
    , "        \"amount\": " <> amountJson <> ","
    , "        \"data_hash\": null,"
    , "        \"inline_datum\": null,"
    , "        \"script_ref\": null,"
    , "        \"reference_script_hash\": null"
    , "      }"
    , "    ]"
    , "  }"
    , "}"
    ]

assertRight :: String -> Either String a -> IO a
assertRight label value = case value of
  Left err -> putStrLn ("FAIL " <> label <> ": " <> err) >> exitFailure
  Right decoded -> putStrLn ("PASS " <> label) >> pure decoded

assertLeft :: String -> String -> Either String a -> IO ()
assertLeft label expected value = case value of
  Left err
    | contains expected err -> putStrLn ("PASS " <> label)
    | otherwise ->
        putStrLn ("FAIL " <> label <> ": expected " <> expected <> ", got " <> err) >> exitFailure
  Right _ ->
    putStrLn ("FAIL " <> label <> ": decoder accepted invalid input (expected " <> expected <> ")") >> exitFailure

contains :: String -> String -> Bool
contains needle haystack = any (startsWith needle) (tails haystack)
  where
    tails [] = [[]]
    tails xs@(_:rest) = xs : tails rest

replaceOnce :: String -> String -> String -> Either String String
replaceOnce needle replacement input
  | null needle = Left "replaceOnce: empty search string"
  | otherwise = case splitOnce needle input of
      Nothing -> Left "replaceOnce: target not found"
      Just (before, after)
        | contains needle (drop (length needle) after) ->
            Left "replaceOnce: target occurs more than once"
        | otherwise -> Right (before <> replacement <> drop (length needle) after)

splitOnce :: String -> String -> Maybe (String, String)
splitOnce needle = go []
  where
    go _ [] = Nothing
    go reversed input
      | startsWith needle input = Just (reverse reversed, input)
      | otherwise = case input of
          c:rest -> go (c:reversed) rest
          [] -> Nothing

startsWith :: String -> String -> Bool
startsWith [] _ = True
startsWith _ [] = False
startsWith (x:xs) (y:ys) = x == y && startsWith xs ys

mutatedFrom :: String -> String -> String -> String -> IO String
mutatedFrom label base needle replacement = case replaceOnce needle replacement base of
  Left err -> putStrLn ("FAIL fixture mutation " <> label <> ": " <> err) >> exitFailure
  Right result
    | result == base -> putStrLn ("FAIL fixture mutation " <> label <> ": no change") >> exitFailure
    | otherwise -> putStrLn ("PASS fixture mutation " <> label <> " (one exact target)") >> pure result

mutated :: String -> String -> String -> IO String
mutated label = mutatedFrom label packet

failTest :: String -> IO a
failTest msg = putStrLn ("FAIL " <> msg) >> exitFailure

main :: IO ()
main = do
  decoded <- assertRight "native Yaci UTxO decode" (decodeYaciUTxO (B8.pack packet))
  if decodeYaciUTxO (B8.pack packet) /= Right decoded
    then failTest "same input produced a different decoded result"
    else putStrLn "PASS deterministic decode result"

  case decoded of
    UTxO entries -> do
      if Map.size entries == 1
        then putStrLn "PASS decoded UTxO entry count"
        else failTest ("expected one UTxO, got " <> show (Map.size entries))
      case Map.toList entries of
        [(TxIn actualTxId (TxIx actualIndex), BabbageTxOut actualAddress (MaryValue (Coin lovelace) (MultiAsset assets)) datum _)] -> do
          if actualIndex == 0
            then putStrLn "PASS output index identity preserved"
            else failTest ("output index changed during decode: " <> show actualIndex)

          case (fromJSON (String (Text.pack txHash)) :: Result TxId) of
            Error err -> failTest ("could not parse expected transaction id fixture: " <> err)
            Success expectedTxId ->
              if actualTxId == expectedTxId
                then putStrLn "PASS transaction id identity preserved"
                else failTest "transaction id changed during decode"

          case B16.decode (B8.pack addressHex) of
            Left err -> failTest ("invalid expected address hex fixture: " <> err)
            Right addressBytes ->
              case decodeAddrEither addressBytes of
                Left err -> failTest ("invalid expected Ledger address fixture: " <> show err)
                Right expectedAddress ->
                  if actualAddress == expectedAddress
                    then putStrLn "PASS Ledger address identity preserved"
                    else failTest "Ledger address changed during decode"

          if lovelace == 5000000
            then putStrLn "PASS exact lovelace quantity preserved"
            else failTest ("lovelace changed during decode: " <> show lovelace)

          expectedPolicy <- case (fromJSON (String (Text.pack assetPolicyHex)) :: Result PolicyID) of
            Error err -> failTest ("could not parse expected policy ID fixture: " <> err)
            Success policy -> pure policy
          if Map.size assets /= 1
            then failTest ("expected exactly one policy ID, got " <> show (Map.size assets))
            else case Map.toList assets of
              [(actualPolicy, names)] -> do
                if actualPolicy == expectedPolicy
                  then putStrLn "PASS policy ID identity preserved"
                  else failTest "policy ID changed during decode"
                let poolName = AssetName (toShort (B8.pack "POOL"))
                    usdmName = AssetName (toShort (B8.pack "USDM"))
                if Map.size names /= 2
                  then failTest ("expected two asset names, got " <> show (Map.size names))
                  else do
                    if Map.lookup poolName names == Just 1
                      then putStrLn "PASS POOL asset name and quantity preserved"
                      else failTest "POOL asset identity or quantity changed"
                    if Map.lookup usdmName names == Just 100000
                      then putStrLn "PASS USDM asset name and quantity preserved"
                      else failTest "USDM asset identity or quantity changed"

          case datum of
            NoDatum -> putStrLn "PASS absent datum preserved"
            _ -> failTest "unexpected datum appeared in a null-datum fixture"
        _ -> failTest "expected exactly one decoded Babbage output"

  duplicateInput <- mutated "duplicate transaction input"
    "      }\n    ]"
    ( "      },\n      {\n" <>
      "        \"tx_hash\": \"" <> txHash <> "\",\n" <>
      "        \"output_index\": 0,\n" <>
      "        \"address\": \"" <> address <> "\",\n" <>
      "        \"ledger_address_hex\": \"" <> addressHex <> "\",\n" <>
      "        \"amount\": " <> amountJson <> ",\n" <>
      "        \"data_hash\": null,\n" <>
      "        \"inline_datum\": null,\n" <>
      "        \"script_ref\": null,\n" <>
      "        \"reference_script_hash\": null\n" <>
      "      }\n    ]"
    )
  assertLeft "duplicate transaction input is rejected" "DUPLICATE_YACI_UTXO_INPUT"
    (decodeYaciUTxO (B8.pack duplicateInput))

  negative <- mutated "negative quantity" "\"quantity\": \"5000000\"" "\"quantity\": \"-1\""
  assertLeft "negative UTxO quantity is rejected" "NEGATIVE_UTXO_QUANTITY"
    (decodeYaciUTxO (B8.pack negative))

  missingAddress <- mutated "missing Ledger address"
    ("\"ledger_address_hex\": \"" <> addressHex <> "\",") ""
  assertLeft "missing Ledger address bytes are rejected" "MISSING_FIELD:ledger_address_hex"
    (decodeYaciUTxO (B8.pack missingAddress))

  invalidAddress <- mutated "invalid Ledger address"
    ("\"ledger_address_hex\": \"" <> addressHex <> "\"")
    "\"ledger_address_hex\": \"zz\""
  assertLeft "invalid Ledger address hex is rejected" "INVALID_HEX:ledger_address_hex"
    (decodeYaciUTxO (B8.pack invalidAddress))

  missingTxHash <- mutated "missing transaction hash"
    ("\"tx_hash\": \"" <> txHash <> "\",") ""
  assertLeft "missing transaction id is rejected" "MISSING_FIELD:tx_hash"
    (decodeYaciUTxO (B8.pack missingTxHash))

  badTxHash <- mutated "invalid tx hash"
    ("\"tx_hash\": \"" <> txHash <> "\"")
    "\"tx_hash\": \"not-a-ledger-txid\""
  assertLeft "malformed transaction id is rejected" "TxId:"
    (decodeYaciUTxO (B8.pack badTxHash))

  badIndex <- mutated "output index out of range" "\"output_index\": 0" "\"output_index\": 65536"
  assertLeft "output index above supported bound is rejected" "INVALID_YACI_OUTPUT_INDEX"
    (decodeYaciUTxO (B8.pack badIndex))

  negativeIndex <- mutated "negative output index" "\"output_index\": 0" "\"output_index\": -1"
  assertLeft "negative output index is rejected" "INVALID_YACI_OUTPUT_INDEX"
    (decodeYaciUTxO (B8.pack negativeIndex))

  malformedIndex <- mutated "malformed output index" "\"output_index\": 0" "\"output_index\": \"zero\""
  assertLeft "malformed output index is rejected" "INVALID_INTEGER:output_index"
    (decodeYaciUTxO (B8.pack malformedIndex))

  badQuantity <- mutated "malformed quantity" "\"quantity\": \"5000000\"" "\"quantity\": \"five-million\""
  assertLeft "malformed string quantity is rejected" "INVALID_INTEGER:quantity"
    (decodeYaciUTxO (B8.pack badQuantity))

  fractionalQuantity <- mutated "fractional numeric quantity"
    "\"quantity\": \"5000000\"" "\"quantity\": 5000000.5"
  assertLeft "fractional JSON numeric quantity is rejected" "INVALID_INTEGER:"
    (decodeYaciUTxO (B8.pack fractionalQuantity))

  assetQuantityOutOfRange <- mutated "asset quantity above current decoder bound"
    "\"quantity\": \"1\"" "\"quantity\": \"9223372036854775808\""
  assertLeft "asset quantity overflow is rejected" "ASSET_QUANTITY_OUT_OF_RANGE"
    (decodeYaciUTxO (B8.pack assetQuantityOutOfRange))

  duplicateLovelace <- mutated "duplicate lovelace unit"
    ("\"unit\": \"" <> poolUnit <> "\"") "\"unit\": \"lovelace\""
  assertLeft "duplicate lovelace entries are rejected" "DUPLICATE_LOVELACE"
    (decodeYaciUTxO (B8.pack duplicateLovelace))

  malformedAssetUnit <- mutated "malformed asset unit"
    ("\"unit\": \"" <> poolUnit <> "\"") "\"unit\": \"abc\""
  assertLeft "malformed asset identity is rejected" "INVALID_ASSET_UNIT"
    (decodeYaciUTxO (B8.pack malformedAssetUnit))

  missingAmount <- mutated "missing amount" ("\"amount\": " <> amountJson <> ",") ""
  assertLeft "missing required amount is rejected" "MISSING_FIELD:amount"
    (decodeYaciUTxO (B8.pack missingAmount))

  badAmountType <- mutated "amount field of wrong type"
    ("\"amount\": " <> amountJson) "\"amount\": \"not-an-array\""
  assertLeft "non-array amount is rejected" "FIELD_NOT_ARRAY:amount"
    (decodeYaciUTxO (B8.pack badAmountType))

  badDatum <- mutated "invalid inline datum hex"
    "\"inline_datum\": null" "\"inline_datum\": \"zz\""
  assertLeft "invalid inline datum hex is rejected" "INVALID_HEX:inline_datum"
    (decodeYaciUTxO (B8.pack badDatum))

  badInlineType <- mutated "inline datum of wrong type"
    "\"inline_datum\": null" "\"inline_datum\": true"
  assertLeft "wrong inline datum type is rejected" "FIELD_NOT_TEXT:inline_datum"
    (decodeYaciUTxO (B8.pack badInlineType))

  malformedHash <- mutated "malformed datum hash"
    "\"data_hash\": null" ("\"data_hash\": \"" <> replicate 64 'z' <> "\"")
  assertLeft "malformed datum hash is rejected" "DataHash:"
    (decodeYaciUTxO (B8.pack malformedHash))

  badHashType <- mutated "datum hash of wrong type"
    "\"data_hash\": null" "\"data_hash\": true"
  assertLeft "wrong datum hash type is rejected" "FIELD_NOT_TEXT:data_hash"
    (decodeYaciUTxO (B8.pack badHashType))

  hashOnly <- mutated "valid datum hash without inline datum"
    "\"data_hash\": null" ("\"data_hash\": \"" <> replicate 64 '1' <> "\"")
  hashOnlyDecoded <- assertRight "valid hash-only datum is decoded" (decodeYaciUTxO (B8.pack hashOnly))
  case hashOnlyDecoded of
    UTxO entries -> case Map.elems entries of
      [BabbageTxOut _ _ (DatumHash _) _] -> putStrLn "PASS hash-only datum representation preserved"
      _ -> failTest "valid hash-only datum was not represented as DatumHash"

  inlineOnly <- mutated "valid inline datum"
    "\"inline_datum\": null" "\"inline_datum\": \"01\""
  inlineDecoded <- assertRight "valid inline datum is decoded" (decodeYaciUTxO (B8.pack inlineOnly))
  case inlineDecoded of
    UTxO entries -> case Map.elems entries of
      [BabbageTxOut _ _ (Datum _) _] -> putStrLn "PASS inline datum representation preserved"
      _ -> failTest "valid inline datum was not represented as inline Datum"

  datumRaw <- case B16.decode (B8.pack "01") of
    Left err -> failTest ("could not construct inline datum fixture bytes: " <> err)
    Right bytes -> pure bytes
  binaryDatum <- case (makeBinaryData (toShort datumRaw) :: Either String (BinaryData ConwayEra)) of
    Left err -> failTest ("could not construct inline datum fixture: " <> err)
    Right bd -> pure bd
  let encodedHash = toJSON (hashBinaryData binaryDatum)
  hashHex <- case encodedHash of
    String value -> pure (Text.unpack value)
    _ -> failTest "Ledger DataHash JSON encoding is not a hex string"

  coherentDatum <- mutatedFrom "coherent inline datum/hash fixture" inlineOnly
    "\"data_hash\": null" ("\"data_hash\": \"" <> hashHex <> "\"")
  _ <- assertRight "matching inline datum and data_hash are accepted"
    (decodeYaciUTxO (B8.pack coherentDatum))

  let deliberatelyWrongHash = replicate 64 '1'
  if Text.pack hashHex == Text.pack deliberatelyWrongHash
    then failTest "could not construct a distinct mismatching datum hash"
    else pure ()
  inconsistentDatum <- mutatedFrom "mismatching inline datum/hash fixture" inlineOnly
    "\"data_hash\": null" ("\"data_hash\": \"" <> deliberatelyWrongHash <> "\"")
  assertLeft "inline datum/data_hash mismatch is rejected" "INLINE_DATUM_HASH_MISMATCH"
    (decodeYaciUTxO (B8.pack inconsistentDatum))

  badRefScript <- mutated "reference script hash without body"
    "\"reference_script_hash\": null"
    ("\"reference_script_hash\": \"" <> replicate 56 'a' <> "\", \"reference\": true")
  assertLeft "reference input script hash without body is rejected" "REFERENCE_SCRIPT_BODY_MISSING"
    (decodeYaciUTxO (B8.pack badRefScript))

  bodyWithoutHash <- mutated "reference script body without hash"
    "\"script_ref\": null" "\"script_ref\": \"00\""
  assertLeft "reference script body without hash is rejected" "REFERENCE_SCRIPT_HASH_MISSING"
    (decodeYaciUTxO (B8.pack bodyWithoutHash))

  malformedRefScript <- mutatedFrom "malformed serialized reference script" packet
    "\"reference_script_hash\": null"
    ("\"reference_script_hash\": \"" <> replicate 56 'a' <> "\", \"reference\": true")
  malformedRefScript <- mutatedFrom "malformed serialized reference script body" malformedRefScript
    "\"script_ref\": null" "\"script_ref\": \"00\""
  assertLeft "malformed reference script CBOR is rejected" "REFERENCE_SCRIPT_CBOR_INVALID"
    (decodeYaciUTxO (B8.pack malformedRefScript))

  emptyRefScriptHash <- mutated "empty reference script hash"
    "\"reference_script_hash\": null" "\"reference_script_hash\": \"\""
  assertLeft "empty reference script hash is rejected" "REFERENCE_SCRIPT_HASH_EMPTY"
    (decodeYaciUTxO (B8.pack emptyRefScriptHash))

  badRefScriptType <- mutated "reference script hash of wrong type"
    "\"reference_script_hash\": null" "\"reference_script_hash\": true"
  assertLeft "wrong reference script hash type is rejected" "FIELD_NOT_TEXT:reference_script_hash"
    (decodeYaciUTxO (B8.pack badRefScriptType))

  badRefScriptBodyType <- mutated "reference script body of wrong type"
    "\"script_ref\": null" "\"script_ref\": true"
  assertLeft "wrong reference script body type is rejected" "FIELD_NOT_TEXT:script_ref"
    (decodeYaciUTxO (B8.pack badRefScriptBodyType))

  assertLeft "malformed JSON is rejected" "expecting record key literal"
    (decodeYaciUTxO (B8.pack "{"))
  assertLeft "missing observed field is rejected" "MISSING_FIELD:observed"
    (decodeYaciUTxO (B8.pack "{}"))
  assertLeft "unexpected top-level type is rejected" "EXPECTED_OBJECT"
    (decodeYaciUTxO (B8.pack "[]"))

  putStrLn "NOTE: fixture tests never substitute for the current-run native Yaci P2.8 evidence gate."
