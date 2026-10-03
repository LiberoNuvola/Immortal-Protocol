{-# LANGUAGE DeriveGeneric #-}

module Main where

import Data.Aeson
  ( FromJSON
  , Value (..)
  , eitherDecode
  , withObject
  , (.:)
  , (.:?)
  , (.!=)
  )
import qualified Data.ByteString.Lazy as BL
import GHC.Generics (Generic)
import System.Exit (exitFailure)

import UniversalEconomicKernel as Kernel
import UniversalEconomicState

data VectorFile = VectorFile
  { vectors :: [Vector]
  }
  deriving (Generic, Show)

data Vector = Vector
  { vectorId :: String
  , vectorName :: String
  , vectorEev :: Maybe Integer
  , vectorProtectedCapital :: Maybe Integer
  , vectorExpected :: Maybe Expected
  , vectorDecomposition :: Maybe Decomposition
  , vectorCases :: Maybe [VectorCase]
  , vectorStatus :: Maybe String
  , vectorCarAmount :: Maybe Integer
  , vectorOtherProtectedCapital :: Maybe Integer
  }
  deriving (Generic, Show)

data Expected = Expected
  { expectedRawSurplus :: Maybe Integer
  , expectedSolvency :: Maybe Bool
  }
  deriving (Generic, Show)

data Decomposition = Decomposition
  { crystallizedLiabilities :: Integer
  , worstCaseExposure :: Integer
  , safetyCapital :: Integer
  , reserveProtection :: Integer
  , mandatoryFutureCosts :: Integer
  , additionalProtectedCapital :: Integer
  }
  deriving (Generic, Show)

data VectorCase = VectorCase
  { caseEev :: Integer
  , caseProtectedCapital :: Integer
  , caseExpectedRawSurplus :: Integer
  }
  deriving (Generic, Show)

instance FromJSON VectorFile where
  parseJSON = withObject "VectorFile" $ \o ->
    VectorFile <$> o .: "vectors"

instance FromJSON Vector where
  parseJSON = withObject "Vector" $ \o ->
    Vector
      <$> o .: "id"
      <*> o .: "name"
      <*> o .:? "eev"
      <*> o .:? "protectedCapital"
      <*> o .:? "expected"
      <*> o .:? "decomposition"
      <*> o .:? "cases"
      <*> o .:? "status"
      <*> o .:? "carAmount"
      <*> o .:? "otherProtectedCapital"

instance FromJSON Expected where
  parseJSON = withObject "Expected" $ \o ->
    Expected <$> o .:? "rawSurplus" <*> o .:? "solvency"

instance FromJSON Decomposition where
  parseJSON = withObject "Decomposition" $ \o ->
    Decomposition
      <$> o .: "crystallizedLiabilities"
      <*> o .: "worstCaseExposure"
      <*> o .: "safetyCapital"
      <*> o .: "reserveProtection"
      <*> o .: "mandatoryFutureCosts"
      <*> o .: "additionalProtectedCapital"

instance FromJSON VectorCase where
  parseJSON = withObject "VectorCase" $ \o ->
    VectorCase
      <$> o .: "eev"
      <*> o .: "protectedCapital"
      <*> o .: "expectedRawSurplus"

stateFor :: Integer -> Maybe Decomposition -> UniversalEconomicState
stateFor pc decomposition =
  case decomposition of
    Just d ->
      UniversalEconomicState
        (crystallizedLiabilities d)
        0
        0
        (worstCaseExposure d)
        (safetyCapital d)
        (reserveProtection d)
        (mandatoryFutureCosts d)
        (additionalProtectedCapital d)
    Nothing ->
      UniversalEconomicState
        0 0 0 0 0 0 0 pc

assertPass :: Bool -> String -> IO ()
assertPass condition label =
  if condition
    then putStrLn ("PASS: " ++ label)
    else do
      putStrLn ("FAIL: " ++ label)
      exitFailure

checkVector :: Vector -> IO ()
checkVector v =
  case (vectorEev v, vectorProtectedCapital v, vectorExpected v) of
    (Just eev, Just pc, Just expected) -> do
      let state = stateFor pc (vectorDecomposition v)
          actualPc = Kernel.protectedCapital state
          actualSurplus = Kernel.rawSurplus eev state
          actualSolvency = Kernel.solvencyInvariant eev state

      assertPass
        (actualPc == pc)
        (vectorId v ++ " ProtectedCapital")

      case expectedRawSurplus expected of
        Nothing -> pure ()
        Just expectedSurplus ->
          assertPass
            (actualSurplus == expectedSurplus)
            (vectorId v ++ " RawSurplus")

      case expectedSolvency expected of
        Nothing -> pure ()
        Just expectedValue ->
          assertPass
            (actualSolvency == expectedValue)
            (vectorId v ++ " solvency")

    _ -> pure ()

checkCases :: Vector -> IO ()
checkCases v =
  case vectorCases v of
    Nothing -> pure ()
    Just cases ->
      mapM_
        (\c ->
          let state = stateFor (caseProtectedCapital c) Nothing
              actual = Kernel.rawSurplus (caseEev c) state
          in assertPass
               (actual == caseExpectedRawSurplus c)
               (vectorId v ++ " state-locality case"))
        cases

main :: IO ()
main = do
  decoded <- eitherDecode <$> BL.readFile "../Adapter/REFERENCE/conformance/immortal-portability-vectors.v1.json"
  file <-
    case decoded of
      Left err -> putStrLn ("FAIL: cannot decode portability vectors: " ++ err) >> exitFailure
      Right value -> pure value

  let executable = filter (\v -> vectorStatus v == Nothing) (vectors file)
      pending = filter (\v -> vectorStatus v /= Nothing) (vectors file)

  assertPass (length executable == 8) "V01-V07 and V10 are executable"
  assertPass (length pending == 2) "V08-V09 remain explicitly pending"

  mapM_ checkVector executable
  mapM_ checkCases executable

  case filter (\v -> vectorId v == "V10") executable of
    [v] ->
      case (vectorCarAmount v, vectorOtherProtectedCapital v, vectorProtectedCapital v) of
        (Just car, Just other, Nothing) ->
          assertPass
            (car + other == 500)
            "V10 CAR remains a protected conditional commitment in the fixture"
        _ -> assertPass False "V10 CAR fixture fields present"
    _ -> assertPass False "V10 present"

  let v05 = filter (\v -> vectorId v == "V05") executable
  case v05 of
    [v] ->
      case vectorDecomposition v of
        Just d ->
          assertPass
            ( crystallizedLiabilities d
              + worstCaseExposure d
              + safetyCapital d
              + reserveProtection d
              + mandatoryFutureCosts d
              + additionalProtectedCapital d
              == maybe (-1) id (vectorProtectedCapital v)
            )
            "V05 decomposition witness"
        Nothing -> assertPass False "V05 decomposition witness present"
    _ -> assertPass False "V05 present"

  putStrLn "ALL IMMORTAL PORTABILITY VECTOR / UNIVERSAL KERNEL TESTS PASSED"
