module Main where

import qualified Data.ByteString as BS
import qualified Data.ByteString.Short as SBS
import qualified Data.ByteString.Base16 as B16
import qualified Data.Text.Encoding as TE
import qualified Data.Text as T
import PlutusLedgerApi.Common.SerialisedScript (uncheckedDeserialiseUPLC)

historicalPolicyHex :: T.Text
historicalPolicyHex =
  "59017a59017701000032323232323232323232322253330083232325332233300d00200114a0666010444a666018002294054ccc038c008c04400528" <>
  "9980180118080009191919baf374e60240046e9cc0480053012bd8799fd8799f5820f6874f42a880915f7d79d6b23ecc55eb378b5fd8847c4004ed1c98a2eba70509ff04ff00300f30100010011323370e64646644666601600490001199980600124000eb4dd58008029bae3011001375c602260200026022002664466e9520003300d37520046601a6ea40052f5c0646464a66601e66e1d20000021375c60240022c6026004601c0026ea8c8c040c03c004c0400152201085052452d524943480048202a35ae41cdd598071918071807180700098068011bac300d001300d001300b300c0011498588c008dd480091111980291299980400088028a99980519baf300b300d00100613004300f300d00113002300c0010012323002233002002001230022330020020015573eae815cd2ab9d5744ae848c008dd5000aab9e01"

candidateTxHash :: T.Text
candidateTxHash = "f6874f42a880915f7d79d6b23ecc55eb378b5fd8847c4004ed1c98a2eba70509"

main :: IO ()
main = do
  let (decoded, rest) = B16.decode (TE.encodeUtf8 historicalPolicyHex)
  if not (BS.null rest)
    then fail "historical PRE policy hex contains non-hex suffix"
    else pure ()

  if BS.length decoded /= 381
    then fail ("unexpected serialized witness length: " <> show (BS.length decoded))
    else pure ()

  if BS.take 3 decoded /= BS.pack [0x59, 0x01, 0x7a]
    then fail "unexpected CBOR bytestring prefix"
    else pure ()

  let flatBytes = BS.drop 3 decoded
  if BS.length flatBytes /= 378
    then fail ("unexpected Flat payload length: " <> show (BS.length flatBytes))
    else pure ()

  let flatHex = TE.decodeUtf8 (B16.encode flatBytes)
  if T.isInfixOf candidateTxHash flatHex
    then putStrLn "CANDIDATE_TX_HASH_LITERAL_PRESENT=YES"
    else fail "candidate historical input hash not found in Flat payload"

  let program = uncheckedDeserialiseUPLC (SBS.toShort flatBytes)
  putStrLn "UPLC_DECODE=SUCCESS"
  putStrLn ("FLAT_PAYLOAD_BYTES=" <> show (BS.length flatBytes))
  print program
