{-# LANGUAGE OverloadedStrings #-}

module Main (main) where

import qualified Data.ByteString.Char8 as B8
import qualified Data.Map.Strict as Map
import System.Exit (exitFailure)

import Cardano.Ledger.Babbage.TxOut (BabbageTxOut (..))
import Cardano.Ledger.Coin (Coin (..))
import Cardano.Ledger.Mary.Value (MaryValue (..), MultiAsset (..))
import Cardano.Ledger.State (UTxO (..))
import YaciUTxO (decodeYaciUTxO)

txHash :: String
txHash = replicate 64 '0'

addressHex :: String
addressHex = "007290ea8fa9433c1045a4c8473959ad608e6c03a58c7de33bdbd3ce6f295b987135610616f3c74e11c94d77b6ced5ccc93a7d719cfb135062"

packet :: String
packet =
  unlines
    [ "{"
    , "  \"observed\": {"
    , "    \"inputs\": ["
    , "      {"
    , "        \"tx_hash\": \"" <> txHash <> "\","
    , "        \"output_index\": 0,"
    , "        \"address\": \"addr_test1placeholder\","
    , "        \"ledger_address_hex\": \"" <> addressHex <> "\","
    , "        \"amount\": [{\"unit\": \"lovelace\", \"quantity\": \"2000000\"}],"
    , "        \"data_hash\": null,"
    , "        \"inline_datum\": null,"
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
    | otherwise -> putStrLn ("FAIL " <> label <> ": expected " <> expected <> ", got " <> err) >> exitFailure
  Right _ -> putStrLn ("FAIL " <> label <> ": decoder accepted invalid input (expected " <> expected <> ")") >> exitFailure

contains :: String -> String -> Bool
contains needle haystack = any (startsWith needle) (tails haystack)
  where
    tails [] = [[]]
    tails xs@(_:rest) = xs : tails rest

-- Replace exactly one occurrence. Drift or ambiguous targets abort the fixture.
replaceOnce :: String -> String -> String -> Either String String
replaceOnce needle replacement input
  | null needle = Left "replaceOnce: empty search string"
  | otherwise = case splitOnce needle input of
      Nothing -> Left "replaceOnce: target not found"
      Just (before, after)
        | contains needle (drop (length needle) after) -> Left "replaceOnce: target occurs more than once"
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

mutated :: String -> String -> String -> IO String
mutated label needle replacement = case replaceOnce needle replacement packet of
  Left err -> putStrLn ("FAIL fixture mutation " <> label <> ": " <> err) >> exitFailure
  Right result
    | result == packet -> putStrLn ("FAIL fixture mutation " <> label <> ": no change") >> exitFailure
    | otherwise -> putStrLn ("PASS fixture mutation " <> label <> " (one exact target)") >> pure result

main :: IO ()
main = do
  decoded <- assertRight "native Yaci UTxO decode" (decodeYaciUTxO (B8.pack packet))
  case decoded of
    UTxO entries -> do
      if Map.size entries /= 1 then failTest ("expected one UTxO, got " <> show (Map.size entries)) else putStrLn "PASS decoded UTxO entry count"
      case Map.toList entries of
        [(_, BabbageTxOut _ (MaryValue (Coin lovelace) (MultiAsset assets)) _ _)] -> do
          if lovelace == 2000000 then putStrLn "PASS exact lovelace amount preserved" else failTest ("unexpected lovelace amount " <> show lovelace)
          if Map.null assets then putStrLn "PASS empty multi-asset value preserved" else failTest "unexpected assets in canonical fixture"
        _ -> failTest "expected exactly one decoded Babbage output"

  negative <- mutated "negative quantity" "\"quantity\": \"2000000\"" "\"quantity\": \"-1\""
  assertLeft "negative UTxO quantity is rejected" "NEGATIVE_UTXO_QUANTITY" (decodeYaciUTxO (B8.pack negative))

  missingAddress <- mutated "missing Ledger address" ("\"ledger_address_hex\": \"" <> addressHex <> "\",") ""
  assertLeft "missing Ledger address bytes are rejected" "MISSING_FIELD:ledger_address_hex" (decodeYaciUTxO (B8.pack missingAddress))

  invalidAddress <- mutated "invalid Ledger address" ("\"ledger_address_hex\": \"" <> addressHex <> "\"") "\"ledger_address_hex\": \"zz\""
  assertLeft "invalid Ledger address hex is rejected" "INVALID_HEX:ledger_address_hex" (decodeYaciUTxO (B8.pack invalidAddress))

  badTxHash <- mutated "invalid tx hash" ("\"tx_hash\": \"" <> txHash <> "\"") "\"tx_hash\": \"not-a-ledger-txid\""
  assertLeft "malformed transaction id is rejected" "TxId:" (decodeYaciUTxO (B8.pack badTxHash))

  badIndex <- mutated "output index out of range" "\"output_index\": 0" "\"output_index\": 65536"
  assertLeft "output index above supported bound is rejected" "INVALID_YACI_OUTPUT_INDEX" (decodeYaciUTxO (B8.pack badIndex))
  negativeIndex <- mutated "negative output index" "\"output_index\": 0" "\"output_index\": -1"
  assertLeft "negative output index is rejected" "INVALID_YACI_OUTPUT_INDEX" (decodeYaciUTxO (B8.pack negativeIndex))

  badQuantity <- mutated "malformed quantity" "\"quantity\": \"2000000\"" "\"quantity\": \"two-million\""
  assertLeft "malformed quantity is rejected" "INVALID_INTEGER:quantity" (decodeYaciUTxO (B8.pack badQuantity))

  missingAmount <- mutated "missing amount" "\"amount\": [{\"unit\": \"lovelace\", \"quantity\": \"2000000\"}]," ""
  assertLeft "missing required amount is rejected" "MISSING_FIELD:amount" (decodeYaciUTxO (B8.pack missingAmount))

  badDatum <- mutated "invalid inline datum hex" "\"inline_datum\": null" "\"inline_datum\": \"zz\""
  assertLeft "invalid inline datum hex is rejected" "INVALID_HEX:inline_datum" (decodeYaciUTxO (B8.pack badDatum))

  malformedHash <- mutated "malformed datum hash" "\"data_hash\": null" ("\"data_hash\": \"" <> replicate 64 'z' <> "\"")
  assertLeft "malformed datum hash is rejected" "DataHash:" (decodeYaciUTxO (B8.pack malformedHash))

  badRefScript <- mutated "reference script hash without body" "\"reference_script_hash\": null" ("\"reference_script_hash\": \"" <> replicate 56 'a' <> "\"")
  assertLeft "reference script hash without body is rejected" "REFERENCE_SCRIPT_BODY_MISSING" (decodeYaciUTxO (B8.pack badRefScript))

  assertLeft "malformed JSON is rejected" "Error in $:" (decodeYaciUTxO (B8.pack "{"))
  assertLeft "missing observed field is rejected" "MISSING_FIELD:observed" (decodeYaciUTxO (B8.pack "{}"))
  assertLeft "unexpected top-level type is rejected" "EXPECTED_OBJECT" (decodeYaciUTxO (B8.pack "[]"))

  if decodeYaciUTxO (B8.pack packet) == decodeYaciUTxO (B8.pack packet) then putStrLn "PASS deterministic decode result" else failTest "decoder is nondeterministic"
  where
    failTest msg = putStrLn ("FAIL " <> msg) >> exitFailure
