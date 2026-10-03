module Main where

import Data.Aeson
  ( FromJSON
  , eitherDecode
  , withObject
  , (.:)
  , (.:?)
  )
import qualified Data.ByteString.Lazy as BL
import System.Exit (exitFailure)
import UniversalEconomicKernel
import UniversalEconomicState

data VectorFile = VectorFile
  { vectors :: [Vector]
  }

data Vector = Vector
  { vectorId :: String
  , vectorEev :: Maybe Integer
  , vectorProtectedCapital :: Maybe Integer
  , vectorExpected :: Maybe Expected
  , vectorStatus :: Maybe String
  }

data Expected = Expected
  { expectedRawSurplus :: Maybe Integer
  , expectedSolvency :: Maybe Bool
  }

instance FromJSON VectorFile where
  parseJSON = withObject "VectorFile" $ \o ->
    VectorFile <$> o .: "vectors"

instance FromJSON Vector where
  parseJSON = withObject "Vector" $ \o ->
    Vector
      <$> o .: "id"
      <*> o .:? "eev"
      <*> o .:? "protectedCapital"
      <*> o .:? "expected"
      <*> o .:? "status"

instance FromJSON Expected where
  parseJSON = withObject "Expected" $ \o ->
    Expected <$> o .:? "rawSurplus" <*> o .:? "solvency"

stateFor :: Integer -> UniversalEconomicState
stateFor pc =
  UniversalEconomicState 0 0 0 0 0 0 0 pc

main :: IO ()
main = do
  decoded <- eitherDecode <$> BL.readFile "../../Adapter/REFERENCE/conformance/immortal-portability-vectors.v1.json"
  file <-
    case decoded of
      Left err -> putStrLn ("REFERENCE_ERROR|" ++ err) >> exitFailure
      Right value -> pure value

  putStrLn "IMMORTAL_REFERENCE_CONFORMANCE_V1"
  mapM_ emit (filter (\v -> vectorStatus v == Nothing) (vectors file))

emit :: Vector -> IO ()
emit v =
  case (vectorEev v, vectorProtectedCapital v, vectorExpected v) of
    (Just eev, Just pc, Just expected) -> do
      let state = stateFor pc
          actualPc = protectedCapital state
          actualSurplus = rawSurplus eev state
          actualSolvency = solvencyInvariant eev state
          expectedSurplus = maybe "NA" show (expectedRawSurplus expected)
          expectedSolvent = maybe "NA" show (expectedSolvency expected)
      putStrLn
        ( vectorId v
          ++ "|protectedCapital=" ++ show actualPc
          ++ "|rawSurplus=" ++ show actualSurplus
          ++ "|solvency=" ++ show actualSolvency
          ++ "|expectedRawSurplus=" ++ expectedSurplus
          ++ "|expectedSolvency=" ++ expectedSolvent
        )
    _ -> pure ()
