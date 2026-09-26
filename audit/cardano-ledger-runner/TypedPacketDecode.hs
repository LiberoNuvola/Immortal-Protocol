{-# LANGUAGE DataKinds #-}
{-# LANGUAGE OverloadedStrings #-}

module TypedPacketDecode
  ( decodeBabbagePParams
  , decodeBabbageTx
  , decodeBabbageUTxO
  , decodeYaciEpochInfo
  , decodeYaciSystemStart
  , evaluateBabbageTx
  ) where

import Cardano.Ledger.Api (BabbageEra, PParams, Tx)
import Cardano.Ledger.Api.PParams (ppProtocolVersionL)
import Cardano.Ledger.Binary.Decoding (decodeFullAnnotator, decCBOR)
import Cardano.Ledger.Binary.Version (Version, mkVersion)
import Cardano.Ledger.Core (TopTx, pvMajor)
import Cardano.Ledger.State (UTxO)
import Cardano.Ledger.Api.Scripts.ExUnits (RedeemerReportWithLogs, evalTxExUnitsWithLogs)
import Cardano.Slotting.EpochInfo.API (EpochInfo)
import Cardano.Slotting.EpochInfo.Impl (fixedEpochInfo)
import Cardano.Slotting.Slot (EpochSize (..))
import Cardano.Slotting.Time
  ( SystemStart (..)
  , slotLengthFromMillisec
  )
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
import qualified Data.Text as Text
import qualified Data.Text.Read as TR
import Data.Time.Clock.POSIX (posixSecondsToUTCTime)
import Lens.Micro ((^.))
import YaciUTxO (decodeYaciUTxO)

decodeBabbagePParams :: BS.ByteString -> Either String (PParams BabbageEra)
decodeBabbagePParams = eitherDecodeStrict'

decodeBabbageTx :: PParams BabbageEra -> BS.ByteString -> Either String (Tx TopTx BabbageEra)
decodeBabbageTx pp bytes = do
  version <- protocolVersionToBinaryVersion pp
  case decodeFullAnnotator version "Babbage Tx" decCBOR (BSL.fromStrict bytes) of
    Left err -> Left (show err)
    Right tx -> Right tx

decodeBabbageUTxO :: BS.ByteString -> Either String (UTxO BabbageEra)
decodeBabbageUTxO = decodeYaciUTxO

decodeYaciSystemStart :: BS.ByteString -> Either String SystemStart
decodeYaciSystemStart bytes = do
  root <- eitherDecodeStrict' bytes
  raw <- textAt root ["startTimeRaw"]
  yaciInfo <- textAt root ["rawInfo"]
  seconds <- parseInteger "startTimeRaw" raw
  yaciStart <- parseLabeledInteger "Start Time" yaciInfo
  if seconds < 0
    then Left "INVALID_SYSTEM_START"
    else if yaciStart /= seconds
      then Left "YACI_SYSTEM_START_MISMATCH"
      else Right (SystemStart (posixSecondsToUTCTime (fromInteger seconds)))

decodeYaciEpochInfo :: BS.ByteString -> Either String (EpochInfo (Either Text.Text))
decodeYaciEpochInfo bytes = do
  root <- eitherDecodeStrict' bytes
  genesis <- objectAt root ["genesisResponse"]
  yaciInfo <- textAt root ["yaciDevkitInfo"]
  genesisEpochSize <- integerValueAt genesis "epoch_length"
  exactEpochSize <- parseLabeledInteger "Epoch Length" yaciInfo
  if genesisEpochSize <= 0 || genesisEpochSize > 18446744073709551615
    then Left "INVALID_EPOCH_LENGTH"
    else if exactEpochSize /= genesisEpochSize
      then Left "YACI_EPOCH_LENGTH_MISMATCH"
      else do
        slotSeconds <- parseLabeledDecimal "Slot Length" yaciInfo
        slotMillis <- parseMilliseconds "Slot Length" slotSeconds
        if slotMillis <= 0
          then Left "INVALID_SLOT_LENGTH"
          else
            Right $
              fixedEpochInfo
                (EpochSize (fromInteger genesisEpochSize))
                (slotLengthFromMillisec slotMillis)

parseLabeledInteger :: Text.Text -> Text.Text -> Either String Integer
parseLabeledInteger label content = do
  value <- parseLabeledDecimal label content
  parseInteger (Text.unpack label) value

parseLabeledDecimal :: Text.Text -> Text.Text -> Either String Text.Text
parseLabeledDecimal label content =
  case [ extracted
       | line <- Text.lines content
       , let marker = label <> "] "
       , let (_, suffix) = Text.breakOn marker line
       , Text.isPrefixOf marker suffix
       , let afterMarker = Text.drop (Text.length marker) suffix
       , let extracted = Text.takeWhile (/= ' ') afterMarker
       ] of
    value : _ -> if Text.null value
      then Left ("MISSING_YACI_INFO:" <> Text.unpack label)
      else Right value
    [] -> Left ("MISSING_YACI_INFO:" <> Text.unpack label)

protocolVersionToBinaryVersion :: PParams BabbageEra -> Either String Version
protocolVersionToBinaryVersion pp =
  mkVersion (pvMajor (pp ^. ppProtocolVersionL))

objectAt :: Value -> [Text.Text] -> Either String Value
objectAt value [] = Right value
objectAt value (key : rest) = do
  object <- case value of
    Object o -> Right o
    _ -> Left ("EXPECTED_OBJECT:" <> Text.unpack key)
  child <- case KeyMap.lookup (Key.fromText key) object of
    Nothing -> Left ("MISSING_FIELD:" <> Text.unpack key)
    Just v -> Right v
  objectAt child rest

textAt :: Value -> [Text.Text] -> Either String Text.Text
textAt value path = do
  v <- objectAt value path
  case v of
    String t -> Right t
    _ -> Left ("FIELD_NOT_TEXT:" <> Text.unpack (last path))

integerValueAt :: Value -> Text.Text -> Either String Integer
integerValueAt value key = do
  v <- objectAt value [key]
  case v of
    Number _ ->
      case fromJSON v of
        Error err -> Left ("INVALID_INTEGER:" <> Text.unpack key <> ":" <> err)
        Success n -> Right n
    String t -> parseInteger (Text.unpack key) t
    _ -> Left ("FIELD_NOT_INTEGER:" <> Text.unpack key)

parseInteger :: String -> Text.Text -> Either String Integer
parseInteger field value =
  case TR.decimal value of
    Right (n, rest) | Text.null rest -> Right n
    _ ->
      case Text.stripPrefix "-" value of
        Just rest ->
          case TR.decimal rest of
            Right (n, trailing) | Text.null trailing -> Right (-n)
            _ -> Left ("INVALID_INTEGER:" <> field)
        Nothing -> Left ("INVALID_INTEGER:" <> field)

parseMilliseconds :: String -> Text.Text -> Either String Integer
parseMilliseconds field value =
  let clean = Text.strip value
      (wholeText, fractionWithDot) = Text.breakOn "." clean
  in do
    whole <- parseInteger field wholeText
    if whole < 0
      then Left ("INVALID_" <> field)
      else case fractionWithDot of
        "" -> Right (whole * 1000)
        "." -> Left ("INVALID_" <> field)
        frac0 -> do
          let frac = Text.drop 1 frac0
          if Text.null frac || Text.length frac > 3
            then Left ("INVALID_" <> field)
            else
              if Text.all (\c -> c >= '0' && c <= '9') frac
                then
                  let padded = frac <> Text.replicate (3 - Text.length frac) "0"
                  case TR.decimal padded of
                    Right (n, rest) | Text.null rest ->
                      Right (whole * 1000 + n)
                    _ -> Left ("INVALID_" <> field)
                else Left ("INVALID_" <> field)

evaluateBabbageTx ::
  PParams BabbageEra ->
  Tx TopTx BabbageEra ->
  UTxO BabbageEra ->
  EpochInfo (Either Text.Text) ->
  SystemStart ->
  RedeemerReportWithLogs BabbageEra
evaluateBabbageTx = evalTxExUnitsWithLogs
