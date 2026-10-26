{-# LANGUAGE DataKinds #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TypeApplications #-}

module YaciUTxO
  ( decodeYaciUTxO
  , decodeYaciUTxOAtVersion
  ) where

import Cardano.Ledger.Address (decodeAddrEither)
import Cardano.Ledger.Babbage.TxOut (BabbageTxOut (..))
import Cardano.Ledger.Conway (ConwayEra)
import Cardano.Ledger.BaseTypes (StrictMaybe (..), TxIx (..))
import Cardano.Ledger.Binary (decodeFullAnnotator, decCBOR, natVersion)
import Cardano.Ledger.Binary.Version (Version)
import Cardano.Ledger.Core (Script, ScriptHash, hashScript)
import Cardano.Ledger.Coin (Coin (..))
import Cardano.Ledger.Mary.Value
  ( AssetName (..)
  , MaryValue (..)
  , MultiAsset (..)
  , PolicyID
  )
import Cardano.Ledger.Plutus.Data
  ( DataHash
  , Datum (..)
  , BinaryData
  , hashBinaryData
  , makeBinaryData
  )
import Cardano.Ledger.State (UTxO (..))
import Cardano.Ledger.TxIn (TxId, TxIn (..))
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
import qualified Data.ByteString.Lazy as BSL
import qualified Data.ByteString.Base16 as B16
import Data.ByteString.Short (toShort)
import qualified Data.Map.Strict as Map
import qualified Data.Set as Set
import qualified Data.Text.Encoding as TextEnc
import Control.Monad (foldM)
import Data.Text (Text)
import qualified Data.Text as Text
import qualified Data.Text.Read as TR

decodeYaciUTxO :: BS.ByteString -> Either String (UTxO ConwayEra)
decodeYaciUTxO = decodeYaciUTxOAtVersion (natVersion @11)

decodeYaciUTxOAtVersion :: Version -> BS.ByteString -> Either String (UTxO ConwayEra)
decodeYaciUTxOAtVersion version bytes = do
  root <- eitherDecodeStrict' bytes
  observed <- objectField root "observed"
  inputs <- arrayField observed "inputs"
  parsed <- traverse (parseInput version) inputs
  let txIns = map fst parsed
  if Set.size (Set.fromList txIns) /= length txIns
    then Left "DUPLICATE_YACI_UTXO_INPUT"
    else Right (UTxO (Map.fromList parsed))

parseInput :: Version -> Aeson.Value -> Either String (TxIn, BabbageTxOut ConwayEra)
parseInput version value = do
  txHash <- textField value "tx_hash"
  outputIndex <- integerValueField value "output_index"
  if outputIndex < 0 || outputIndex > 65535
    then Left "INVALID_YACI_OUTPUT_INDEX"
    else pure ()

  txId <- parseNative "TxId" (String txHash)
  let txIn = TxIn txId (TxIx (fromIntegral outputIndex))

  addressHex <- textField value "ledger_address_hex"
  addressBytes <- decodeHexText "ledger_address_hex" addressHex
  addr <-
    case decodeAddrEither addressBytes of
      Left err -> Left ("INVALID_LEDGER_ADDRESS:" <> err)
      Right decoded -> Right decoded

  amounts <- arrayField value "amount"
  maryValue <- parseMaryValue amounts

  datum <- parseDatum value
  referenceScriptHash <- optionalTextField value "reference_script_hash"
  referenceScriptBody <- optionalTextField value "script_ref"
  isReferenceInput <- optionalBoolField value "reference"
  referenceScript <- parseReferenceScript version isReferenceInput referenceScriptHash referenceScriptBody

  pure
    ( txIn
    , BabbageTxOut
        addr
        maryValue
        datum
        referenceScript
    )

parseMaryValue :: [Aeson.Value] -> Either String MaryValue

parseReferenceScript
  :: Version
  -> Bool
  -> Maybe Text
  -> Maybe Text
  -> Either String (StrictMaybe (Script ConwayEra))
parseReferenceScript version isReferenceInput mHash mBody =
  case (mHash, mBody) of
    (Nothing, Nothing)
      | isReferenceInput -> Right SNothing
      | otherwise -> Right SNothing
    (Just hashText, Nothing)
      | Text.null hashText -> Left "REFERENCE_SCRIPT_HASH_EMPTY"
      | isReferenceInput -> Left "REFERENCE_SCRIPT_BODY_MISSING"
      | otherwise -> Right SNothing
    (Nothing, Just _) -> Left "REFERENCE_SCRIPT_HASH_MISSING"
    (Just hashText, Just bodyHex)
      | Text.null hashText -> Left "REFERENCE_SCRIPT_HASH_EMPTY"
      | otherwise -> do
          bodyBytes <- decodeHexText "script_ref" bodyHex
          script <- case decodeFullAnnotator version "Yaci reference script" decCBOR (BSL.fromStrict bodyBytes) of
            Left err -> Left ("REFERENCE_SCRIPT_CBOR_INVALID:" <> show err)
            Right decoded -> Right decoded
          expectedHash <- parseNative "ScriptHash" (String (strip0x hashText))
          if hashScript @ConwayEra script == expectedHash
            then Right (SJust script)
            else Left "REFERENCE_SCRIPT_HASH_MISMATCH"


parseMaryValue items = do
  (mLovelace, assets) <- foldM step (Nothing, Map.empty) items

  lovelace <- case mLovelace of
    Nothing -> Left "MISSING_LOVELACE"
    Just n
      | n < 0 -> Left "NEGATIVE_LOVELACE"
      | n > 18446744073709551615 -> Left "LOVELACE_OUT_OF_RANGE"
      | otherwise -> Right n

  Right (MaryValue (Coin lovelace) (MultiAsset assets))
  where
    step (mLov, assets) item = do
      unit <- textField item "unit"
      quantity <- integerValueField item "quantity"

      if quantity < 0
        then Left "NEGATIVE_UTXO_QUANTITY"
        else if quantity > 9223372036854775807
          then Left "ASSET_QUANTITY_OUT_OF_RANGE"
          else pure ()

      case unit of
        "lovelace" ->
          case mLov of
            Just _ -> Left "DUPLICATE_LOVELACE"
            Nothing -> Right (Just quantity, assets)

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
                  policyId <- parseNative "PolicyID" (String (Text.toLower policyHex))
                  assetBytes <- decodeHexText "asset_name" assetHex
                  let assetName = AssetName (toShort assetBytes)
                  case Map.lookup policyId assets of
                    Nothing ->
                      Right
                        ( mLov
                        , Map.insert policyId (Map.singleton assetName quantity) assets
                        )
                    Just existing
                      | Map.member assetName existing ->
                          Left "DUPLICATE_ASSET_UNIT"
                      | otherwise ->
                          Right
                            ( mLov
                            , Map.insert
                                policyId
                                (Map.insert assetName quantity existing)
                                assets
                            )

parseDatum :: Aeson.Value -> Either String (Datum ConwayEra)
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

inlineDatum :: Text -> Maybe DataHash -> Either String (Datum ConwayEra)
inlineDatum textHash expected = do
  raw <- decodeHexText "inline_datum" textHash
  let binary = makeBinaryData (toShort raw) :: Either String (BinaryData ConwayEra)
  datumData <- case binary of
    Left err -> Left ("INVALID_INLINE_DATUM: " <> err)
    Right bd -> Right bd

  case expected of
    Nothing -> Right (Datum datumData)
    Just expectedHash ->
      if hashBinaryData datumData == expectedHash
        then Right (Datum datumData)
        else Left "INLINE_DATUM_HASH_MISMATCH"

objectField :: Aeson.Value -> Text -> Either String Aeson.Value
objectField value key = do
  object <- asObject value
  case KeyMap.lookup (Key.fromText key) object of
    Nothing -> Left ("MISSING_FIELD:" <> Text.unpack key)
    Just v -> Right v

arrayField :: Aeson.Value -> Text -> Either String [Aeson.Value]
arrayField value key = do
  v <- objectField value key
  case v of
    Array arr -> Right (toList arr)
    _ -> Left ("FIELD_NOT_ARRAY:" <> Text.unpack key)

textField :: Aeson.Value -> Text -> Either String Text
textField value key = do
  v <- objectField value key
  case v of
    String t -> Right t
    _ -> Left ("FIELD_NOT_TEXT:" <> Text.unpack key)

optionalTextField :: Aeson.Value -> Text -> Either String (Maybe Text)
optionalTextField value key = do
  object <- asObject value
  case KeyMap.lookup (Key.fromText key) object of
    Nothing -> Right Nothing
    Just Null -> Right Nothing
    Just (String t) -> Right (Just t)
    Just _ -> Left ("FIELD_NOT_TEXT:" <> Text.unpack key)

optionalBoolField :: Aeson.Value -> Text -> Either String Bool
optionalBoolField value key = do
  object <- asObject value
  case KeyMap.lookup (Key.fromText key) object of
    Nothing -> Right False
    Just Null -> Right False
    Just (Bool flag) -> Right flag
    Just _ -> Left ("FIELD_NOT_BOOLEAN:" <> Text.unpack key)

optionalNullableField :: Aeson.Value -> Text -> Either String (Maybe Aeson.Value)
optionalNullableField value key = do
  object <- asObject value
  case KeyMap.lookup (Key.fromText key) object of
    Nothing -> Right Nothing
    Just Null -> Right Nothing
    Just body -> Right (Just body)

parseInteger :: String -> Text -> Either String Integer
parseInteger label input =
  case TR.signed TR.decimal input of
    Left err -> Left ("INVALID_INTEGER:" <> label <> ":" <> err)
    Right (n, rest)
      | Text.null rest -> Right n
      | otherwise -> Left ("INVALID_INTEGER:" <> label <> ":trailing characters")

integerValueField :: Aeson.Value -> Text -> Either String Integer
integerValueField value key = do
  v <- objectField value key
  case v of
    String t -> parseInteger (Text.unpack key) t
    Number _ ->
      case Aeson.fromJSON v of
        Error err -> Left ("INVALID_INTEGER:" <> err)
        Success n -> Right n
    _ -> Left ("FIELD_NOT_INTEGER:" <> Text.unpack key)

asObject :: Aeson.Value -> Either String (KeyMap.KeyMap Aeson.Value)
asObject (Object o) = Right o
asObject _ = Left "EXPECTED_OBJECT"

parseNative :: Aeson.FromJSON a => String -> Aeson.Value -> Either String a
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
  case B16.decode (TextEnc.encodeUtf8 value) of
    Left _ -> Left ("INVALID_HEX:" <> field)
    Right _ -> Right ()

decodeHexText :: String -> Text -> Either String BS.ByteString
decodeHexText field value = do
  let clean = strip0x value
  if Text.null clean || odd (Text.length clean)
    then Left ("INVALID_HEX:" <> field)
    else
      case B16.decode (TextEnc.encodeUtf8 clean) of
        Left _ -> Left ("INVALID_HEX:" <> field)
        Right bytes -> Right bytes


toList :: Foldable f => f a -> [a]
toList = foldr (:) []
