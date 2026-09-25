{-# LANGUAGE OverloadedStrings #-}

module YaciUTxO
  ( decodeYaciUTxO
  ) where

import Cardano.Ledger.Address (Addr)
import Cardano.Ledger.Babbage.TxOut (BabbageTxOut (..))
import Cardano.Ledger.Babbage (BabbageEra)
import Cardano.Ledger.BaseTypes (StrictMaybe (..))
import Cardano.Ledger.Coin (Coin (..))
import Cardano.Ledger.Core (TopTx)
import Cardano.Ledger.Plutus.Data
  ( DataHash
  , Datum (..)
  , BinaryData
  , hashBinaryData
  , makeBinaryData
  )
import Cardano.Ledger.Mary.Value (MaryValue)
import Cardano.Ledger.State (UTxO (..))
import Cardano.Ledger.TxIn (TxIn)
import Data.Aeson
  ( Value (..)
  , eitherDecodeStrict'
  , fromJSON
  , Result (..)
  )
import qualified Data.Aeson as Aeson
import qualified Data.Aeson.Key as Key
import qualified Data.Aeson.KeyMap as KeyMap
import qualified Data.ByteString as BS
import qualified Data.ByteString.Base16 as B16
import Data.ByteString.Short (toShort)
import qualified Data.Map.Strict as Map
import qualified Data.Set as Set
import Data.Text (Text)
import qualified Data.Text as Text
import qualified Data.Text.Read as TR

decodeYaciUTxO :: BS.ByteString -> Either String (UTxO BabbageEra)
decodeYaciUTxO bytes = do
  root <- eitherDecodeStrict' bytes
  observed <- objectField root "observed"
  inputs <- arrayField observed "inputs"
  parsed <- traverse parseInput inputs
  let txIns = map fst parsed
  if Set.size (Set.fromList txIns) /= length txIns
    then Left "DUPLICATE_YACI_UTXO_INPUT"
    else Right (UTxO (Map.fromList parsed))

parseInput :: Value -> Either String (TxIn, BabbageTxOut BabbageEra)
parseInput value = do
  txHash <- textField value "tx_hash"
  outputIndex <- integerField value "output_index"
  if outputIndex < 0 || outputIndex > 65535
    then Left "INVALID_YACI_OUTPUT_INDEX"
    else pure ()

  let refText = txHash <> "#" <> Text.pack (show outputIndex)
  txIn <- parseNative "TxIn" refText

  addressHex <- textField value "ledger_address_hex"
  addr <- parseNative "Addr" addressHex

  amounts <- arrayField value "amount"
  maryValue <- parseMaryValue amounts

  datum <- parseDatum value
  referenceScript <- optionalTextField value "reference_script_hash"
  case referenceScript of
    Just h | not (Text.null h) ->
      Left "REFERENCE_SCRIPT_BODY_MISSING"
    _ -> pure ()

  pure
    ( txIn
    , BabbageTxOut
        addr
        maryValue
        datum
        SNothing
    )

parseMaryValue :: [Value] -> Either String MaryValue
parseMaryValue items = do
  (lovelace, policies) <- foldr step (Right (Nothing, Map.empty)) items
  coin <- case lovelace of
    Nothing -> Left "MISSING_LOVELACE"
    Just n | n < 0 -> Left "NEGATIVE_LOVELACE"
    Just n -> Right (Coin n)

  let json =
        Object
          ( KeyMap.fromList
              [ (Key.fromText "lovelace", Number (fromInteger coinValue))
              , (Key.fromText "policies", policiesJson policies)
              ]
          )

  parseNative "MaryValue" json
  where
    coinValue =
      case lovelaceValue items of
        Just n -> n
        Nothing -> 0

    lovelaceValue [] = Nothing
    lovelaceValue (x : xs) =
      case textField x "unit" of
        Right "lovelace" -> either (const Nothing) Just (integerField x "quantity")
        _ -> lovelaceValue xs

    step item acc = do
      (mLov, policies) <- acc
      unit <- textField item "unit"
      quantity <- integerField item "quantity"
      if quantity < -9223372036854775808 || quantity > 9223372036854775807
        then Left "INVALID_ASSET_QUANTITY_RANGE"
        else pure ()

      case unit of
        "lovelace" ->
          case mLov of
            Just _ -> Left "DUPLICATE_LOVELACE"
            Nothing -> Right (Just quantity, policies)

        _ -> do
          let clean = strip0x unit
          if Text.length clean < 56 || Text.length clean > 120 || odd (Text.length clean)
            then Left "INVALID_ASSET_UNIT"
            else do
              let (policyHex, assetHex) = Text.splitAt 56 clean
              validateHexText "policy_id" policyHex
              if Text.length assetHex > 64
                then Left "ASSET_NAME_TOO_LONG"
                else do
                  validateHexText "asset_name" assetHex
                  let policyKey = Key.fromText (Text.toLower policyHex)
                      assetKey = Key.fromText (Text.toLower assetHex)
                      newAsset = Object (KeyMap.singleton assetKey (Number (fromInteger quantity)))
                      nextPolicies =
                        case KeyMap.lookup policyKey policies of
                          Nothing -> KeyMap.insert policyKey newAsset policies
                          Just (Object existing) ->
                            if KeyMap.member assetKey existing
                              then errorLeft "DUPLICATE_ASSET_UNIT"
                              else
                                KeyMap.insert
                                  policyKey
                                  (Object (KeyMap.insert assetKey (Number (fromInteger quantity)) existing))
                                  policies
                          Just _ -> errorLeft "INVALID_POLICY_OBJECT"
                  pure (mLov, nextPolicies)

    policiesJson = Object

parseDatum :: Value -> Either String (Datum BabbageEra)
parseDatum value = do
  mHash <- optionalTextField value "data_hash"
  mInline <- optionalTextField value "inline_datum"

  case (mHash, mInline) of
    (Nothing, Nothing) -> Right NoDatum
    (Just hashText, Nothing) ->
      DatumHash <$> parseNative "DataHash" (String (strip0x hashText))
    (Nothing, Just inlineText) ->
      inlineDatum inlineText Nothing
    (Just hashText, Just inlineText) -> do
      expected <- parseNative "DataHash" (String (strip0x hashText))
      inlineDatum inlineText (Just expected)

inlineDatum :: Text -> Maybe DataHash -> Either String (Datum BabbageEra)
inlineDatum textHash expected = do
  raw <- decodeHexText "inline_datum" textHash
  let binary :: Either String (BinaryData BabbageEra) =
        makeBinaryData (toShort raw)
  datumData <- case binary of
    Left err -> Left ("INVALID_INLINE_DATUM: " <> err)
    Right bd -> Right bd

  case expected of
    Nothing -> Right (Datum datumData)
    Just expectedHash ->
      if hashBinaryData datumData == expectedHash
        then Right (Datum datumData)
        else Left "INLINE_DATUM_HASH_MISMATCH"

objectField :: Value -> Text -> Either String Value
objectField value key = do
  object <- asObject value
  case KeyMap.lookup (Key.fromText key) object of
    Nothing -> Left ("MISSING_FIELD:" <> Text.unpack key)
    Just v -> Right v

arrayField :: Value -> Text -> Either String [Value]
arrayField value key = do
  v <- objectField value key
  case v of
    Array arr -> Right (toList arr)
    _ -> Left ("FIELD_NOT_ARRAY:" <> Text.unpack key)

textField :: Value -> Text -> Either String Text
textField value key = do
  v <- objectField value key
  case v of
    String t -> Right t
    _ -> Left ("FIELD_NOT_TEXT:" <> Text.unpack key)

optionalTextField :: Value -> Text -> Either String (Maybe Text)
optionalTextField value key = do
  object <- asObject value
  case KeyMap.lookup (Key.fromText key) object of
    Nothing -> Right Nothing
    Just Null -> Right Nothing
    Just (String t) -> Right (Just t)
    Just _ -> Left ("FIELD_NOT_TEXT:" <> Text.unpack key)

integerField :: Value -> Text -> Either String Integer
integerField value key = do
  t <- textField value key
  case TR.decimal t of
    Right (n, rest) | Text.null rest -> Right n
    _ ->
      case Text.stripPrefix "-" t of
        Just rest ->
          case TR.decimal rest of
            Right (n, trailing) | Text.null trailing -> Right (-n)
            _ -> Left ("INVALID_INTEGER:" <> Text.unpack key)
        Nothing -> Left ("INVALID_INTEGER:" <> Text.unpack key)

asObject :: Value -> Either String (KeyMap.KeyMap Value)
asObject (Object o) = Right o
asObject _ = Left "EXPECTED_OBJECT"

parseNative :: Aeson.FromJSON a => String -> Value -> Either String a
parseNative label value =
  case fromJSON value of
    Error err -> Left (label <> ": " <> err)
    Success decoded -> Right decoded

strip0x :: Text -> Text
strip0x value =
  case Text.stripPrefix "0x" (Text.toLower value) of
    Just clean -> clean
    Nothing -> value

validateHexText :: String -> Text -> Either String ()
validateHexText field value =
  case B16.decode (Text.encodeUtf8 value) of
    Left _ -> Left ("INVALID_HEX:" <> field)
    Right _ -> Right ()

decodeHexText :: String -> Text -> Either String BS.ByteString
decodeHexText field value = do
  let clean = strip0x value
  if Text.null clean || odd (Text.length clean)
    then Left ("INVALID_HEX:" <> field)
    else
      case B16.decode (Text.encodeUtf8 clean) of
        Left _ -> Left ("INVALID_HEX:" <> field)
        Right bytes -> Right bytes

errorLeft :: String -> a
errorLeft message = error message

toList :: Foldable f => f a -> [a]
toList = foldr (:) []
