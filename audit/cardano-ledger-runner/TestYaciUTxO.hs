{-# LANGUAGE OverloadedStrings #-}

module Main (main) where

import qualified Data.ByteString.Char8 as B8
import System.Exit (exitFailure)

import YaciUTxO (decodeYaciUTxO)

txHash :: String
txHash = replicate 64 '0'

addressHex :: String
addressHex = '6' : '0' : replicate 56 '0'

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

assertRight :: String -> Either String a -> IO ()
assertRight label value =
  case value of
    Left err -> do
      putStrLn ("FAIL " <> label <> ": " <> err)
      exitFailure
    Right _ ->
      putStrLn ("PASS " <> label)

assertLeft :: String -> String -> Either String a -> IO ()
assertLeft label expected value =
  case value of
    Left err
      | contains expected err ->
          putStrLn ("PASS " <> label)
      | otherwise -> do
          putStrLn ("FAIL " <> label <> ": expected " <> expected <> ", got " <> err)
          exitFailure
    Right _ -> do
      putStrLn ("FAIL " <> label <> ": expected rejection")
      exitFailure

contains :: String -> String -> Bool
contains needle haystack =
  any (startsWith needle) (tails haystack)
  where
    startsWith [] _ = True
    startsWith _ [] = False
    startsWith (x:xs) (y:ys) = x == y && startsWith xs ys

    tails [] = [[]]
    tails xs@(_:rest) = xs : tails rest

main :: IO ()
main = do
  assertRight
    "native Yaci UTxO decode"
    (decodeYaciUTxO (B8.pack packet))

  let negative =
        replace "\"quantity\": \"2000000\"" "\"quantity\": \"-1\""
      missingAddress =
        replace
          "\"ledger_address_hex\": \"" 
          "\"ledger_address_hex\": \"" 
      badRefScript =
        replace
          "\"reference_script_hash\": null"
          "\"reference_script_hash\": \"aa\""

  assertLeft
    "negative UTxO quantity is rejected"
    "NEGATIVE_UTXO_QUANTITY"
    (decodeYaciUTxO (B8.pack negative))

  assertLeft
    "missing Ledger address bytes are rejected"
    "FIELD_NOT_TEXT:ledger_address_hex"
    (decodeYaciUTxO (B8.pack missingAddress))

  assertLeft
    "reference script hash without body is rejected"
    "REFERENCE_SCRIPT_BODY_MISSING"
    (decodeYaciUTxO (B8.pack badRefScript))

replace :: String -> String -> String -> String
replace needle replacement input =
  go input
  where
    go [] = []
    go value
      | startsWith needle value =
          replacement <> drop (length needle) value
      | otherwise =
          case value of
            [] -> []
            (x:xs) -> x : go xs

    startsWith [] _ = True
    startsWith _ [] = False
    startsWith (x:xs) (y:ys) = x == y && startsWith xs ys
