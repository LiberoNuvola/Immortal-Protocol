{-# LANGUAGE DataKinds #-}
{-# LANGUAGE OverloadedStrings #-}

module TypedPacketDecode
  ( decodeBabbagePParams
  , decodeBabbageTx
  ) where

import Cardano.Ledger.Api (BabbageEra, PParams, Tx)
import Cardano.Ledger.Api.PParams (ppProtocolVersionL)
import Cardano.Ledger.Binary.Decoding (decodeFullAnnotator)
import Cardano.Ledger.Binary.Version (Version, mkVersion)
import Cardano.Ledger.Core (TopTx, pvMajor)
import qualified Data.Aeson as Aeson
import qualified Data.ByteString as BS
import qualified Data.ByteString.Lazy as BSL
import Cardano.Ledger.Binary.Decoding (decCBOR)
import Lens.Micro ((^.))

decodeBabbagePParams :: BS.ByteString -> Either String (PParams BabbageEra)
decodeBabbagePParams = Aeson.eitherDecodeStrict'

decodeBabbageTx :: PParams BabbageEra -> BS.ByteString -> Either String (Tx TopTx BabbageEra)
decodeBabbageTx pp bytes = do
  version <- protocolVersionToBinaryVersion pp
  case decodeFullAnnotator version "Babbage Tx" decCBOR (BSL.fromStrict bytes) of
    Left err -> Left (show err)
    Right tx -> Right tx

protocolVersionToBinaryVersion :: PParams BabbageEra -> Either String Version
protocolVersionToBinaryVersion pp =
  mkVersion (pvMajor (pp ^. ppProtocolVersionL))
