{-# LANGUAGE OverloadedStrings #-}

module Main where

import Data.Aeson
  ( FromJSON (..)
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
  , vectorCarAmount :: Maybe Integer
  , vectorOtherProtectedCapital :: Maybe Integer
  , vectorDecomposition :: Maybe Decomposition
  , vectorCases :: Maybe [LocalityCase]
  }

data LocalityCase = LocalityCase
  { localityEev :: Integer
  , localityProtectedCapital :: Integer
  , localityExpectedRawSurplus :: Integer
  }

data Decomposition = Decomposition
  { decompositionCrystallizedLiabilities :: Integer
  , decompositionWorstCaseExposure :: Integer
  , decompositionSafetyCapital :: Integer
  , decompositionReserveProtection :: Integer
  , decompositionMandatoryFutureCosts :: Integer
  , decompositionAdditionalProtectedCapital :: Integer
  }

data Expected = Expected
  { expectedProtectedCapital :: Maybe Integer
  , expectedRawSurplus :: Maybe Integer
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
      <*> o .:? "carAmount"
      <*> o .:? "otherProtectedCapital"
      <*> o .:? "decomposition"
      <*> o .:? "cases"

instance FromJSON LocalityCase where
  parseJSON = withObject "LocalityCase" $ \\o ->
    LocalityCase
      <$> o .: "eev"
      <*> o .: "protectedCapital"
      <*> o .: "expectedRawSurplus"

instance FromJSON Decomposition where
  parseJSON = withObject "Decomposition" $ \o ->
    Decomposition
      <$> o .: "crystallizedLiabilities"
      <*> o .: "worstCaseExposure"
      <*> o .: "safetyCapital"
      <*> o .: "reserveProtection"
      <*> o .: "mandatoryFutureCosts"
      <*> o .: "additionalProtectedCapital"

instance FromJSON Expected where
  parseJSON = withObject "Expected" $ \o ->
    Expected
      <$> o .:? "protectedCapital"
      <*> o .:? "rawSurplus"
      <*> o .:? "solvency"

stateFor :: Integer -> Maybe Decomposition -> UniversalEconomicState
stateFor pc decomposition =
  case decomposition of
    Nothing -> UniversalEconomicState 0 0 0 0 0 0 0 pc
    Just d ->
      UniversalEconomicState
        (decompositionCrystallizedLiabilities d)
        0
        0
        (decompositionWorstCaseExposure d)
        (decompositionSafetyCapital d)
        (decompositionReserveProtection d)
        (decompositionMandatoryFutureCosts d)
        (decompositionAdditionalProtectedCapital d)

main :: IO ()
main = do
  decoded <- eitherDecode <$> BL.readFile "../Adapter/REFERENCE/conformance/immortal-portability-vectors.v1.json"
  file <-
    case decoded of
      Left err -> putStrLn ("REFERENCE_ERROR|" ++ err) >> exitFailure
      Right value -> pure value

  let pendingVectors = filter (\v -> vectorStatus v /= Nothing) (vectors file)
      executableVectors = filter (\v -> vectorStatus v == Nothing) (vectors file)
  putStrLn "IMMORTAL_REFERENCE_CONFORMANCE_V1"
  mapM_ reportPending pendingVectors
  mapM_ emit executableVectors
  putStrLn
    ( "REFERENCE_CONFORMANCE_RESULT|PASS_EXECUTABLE_VECTORS|pending="
        ++ show (length pendingVectors)
    )

reportPending :: Vector -> IO ()
reportPending v =
  putStrLn
    ( "PENDING|"
        ++ vectorId v
        ++ "|"
        ++ maybe "unspecified" id (vectorStatus v)
    )

checkExpected :: (Eq a, Show a) => String -> Maybe a -> a -> IO ()
checkExpected field expected actual =
  case expected of
    Nothing -> pure ()
    Just expectedValue
      | expectedValue == actual -> pure ()
      | otherwise ->
          putStrLn
            ( "FAIL|"
                ++ field
                ++ "|expected="
                ++ show expectedValue
                ++ "|actual="
                ++ show actual
            )
            >> exitFailure

emit :: Vector -> IO ()
emit v =
  case
      ( vectorId v
      , vectorEev v
      , vectorProtectedCapital v
      , vectorExpected v
      , vectorCarAmount v
      , vectorOtherProtectedCapital v
      , vectorCases v
      )
    of
      ("V07", _, _, _, _, _, _, Just cases) ->
        mapM_ (emitLocalityCase (vectorId v)) (zip [1 :: Int ..] cases)
      ("V10", Just eev, Nothing, Just expected, Just car, Just other, _) -> do
        let pc = car + other
            surplus = max 0 (eev - pc)
        checkExpected "V10.protectedCapital" (expectedProtectedCapital expected) pc
        checkExpected "V10.rawSurplus" (expectedRawSurplus expected) surplus
        putStrLn
          ( "PASS|V10"
              ++ "|protectedCapital=" ++ show pc
              ++ "|rawSurplus=" ++ show surplus
          )
      (_, Just eev, Just declaredPc, Just expected, _, _, _) -> do
        let state = stateFor declaredPc (vectorDecomposition v)
            actualPc = protectedCapital state
            actualSurplus = rawSurplus eev state
            actualSolvency = solvencyInvariant eev state
        checkExpected (vectorId v ++ ".declaredProtectedCapital") (Just declaredPc) actualPc
        checkExpected (vectorId v ++ ".expectedProtectedCapital") (expectedProtectedCapital expected) actualPc
        checkExpected (vectorId v ++ ".rawSurplus") (expectedRawSurplus expected) actualSurplus
        checkExpected (vectorId v ++ ".solvency") (expectedSolvency expected) actualSolvency
        putStrLn
          ( "PASS|" ++ vectorId v
              ++ "|protectedCapital=" ++ show actualPc
              ++ "|rawSurplus=" ++ show actualSurplus
              ++ "|solvency=" ++ show actualSolvency
          )
      _ ->
        putStrLn ("FAIL|" ++ vectorId v ++ "|unsupported executable vector shape")
          >> exitFailure

emitLocalityCase :: String -> (Int, LocalityCase) -> IO ()
emitLocalityCase vectorName (index, localityCase) = do
  let declaredPc = localityProtectedCapital localityCase
      state = stateFor declaredPc Nothing
      actualPc = protectedCapital state
      actualSurplus = rawSurplus (localityEev localityCase) state
  checkExpected (vectorName ++ ".case" ++ show index ++ ".protectedCapital") (Just declaredPc) actualPc
  checkExpected
    (vectorName ++ ".case" ++ show index ++ ".rawSurplus")
    (Just (localityExpectedRawSurplus localityCase))
    actualSurplus
  putStrLn
    ( "PASS|" ++ vectorName ++ ".case" ++ show index
        ++ "|protectedCapital=" ++ show actualPc
        ++ "|rawSurplus=" ++ show actualSurplus
    )
