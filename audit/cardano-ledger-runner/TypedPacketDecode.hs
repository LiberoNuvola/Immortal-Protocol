{-# LANGUAGE DataKinds #-}
{-# LANGUAGE OverloadedStrings #-}

module TypedPacketDecode
  ( decodeBabbagePParams
  , decodeBabbageTx
  ) where

import Cardano.Ledger.Api (BabbageEra, PParams, Tx)
import Cardano.Ledger.Api.PParams (ppProtocolVersionL)
import Cardano.Ledger.Binary.Decoding (decodeFull')
import Cardano.Ledger.Binary.Version (Version, mkVersion)
import Cardano.Ledger.Core (TopTx, pvMajor)
import qualified Data.Aeson as Aeson
import qualified Data.ByteString as BS
import Lens.Micro ((^.))

decodeBabbagePParams :: BS.ByteString -> Either String (PParams BabbageEra)
decodeBabbagePParams = Aeson.eitherDecodeStrict'

decodeBabbageTx :: PParams BabbageEra -> BS.ByteString -> Either String (Tx TopTx BabbageEra)
decodeBabbageTx pp bytes = do
  version <- protocolVersionToBinaryVersion pp
  case decodeFull' version bytes of
    Left err -> Left (show err)
    Right tx -> Right tx

protocolVersionToBinaryVersion :: PParams BabbageEra -> Either String Version
protocolVersionToBinaryVersion pp =
  mkVersion (pvMajor (pp ^. ppProtocolVersionL))
