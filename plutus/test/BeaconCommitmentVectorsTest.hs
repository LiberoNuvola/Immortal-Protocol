{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE TemplateHaskell #-}
{-# LANGUAGE OverloadedStrings #-}

module Main where

import Prelude
  ( Bool (False, True)
  , IO
  , Integer
  , String
  , ([])
  , (:)
  , error
  , putStrLn
  , (++)
  )

import Beacon
  ( deriveGameRoundCommitment
  , encodeBeaconTarget
  , ticketCommitment
  )
import PlutusLedgerApi.V2 (BuiltinByteString)
import PlutusTx (compile)
import PlutusTx.Code (CompiledCode)
import PlutusTx.Prelude
  ( consByteString
  , emptyByteString
  , (==)
  )
import PlutusTx.Test.Run.Code (evaluationResultMatchesHaskell)
import Types (BeaconTarget (..))

{-# INLINABLE bytes #-}
bytes :: [Integer] -> BuiltinByteString
bytes [] = emptyByteString
bytes (x:xs) = consByteString x (bytes xs)

targetVector :: CompiledCode Bool
targetVector =
  $$(compile
    [||
      encodeBeaconTarget
        (BeaconTarget 1 381 (bytes [170, 187, 204]) "v1")
        == bytes [49, 49, 51, 51, 56, 49, 51, 170, 187, 204, 50, 118, 49]
    ||])

roundCommitmentVector :: CompiledCode Bool
roundCommitmentVector =
  $$(compile
    [||
      deriveGameRoundCommitment
        (bytes [1, 2, 3])
        381
        (bytes [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
                16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31])
        "v1"
        == bytes [49, 152, 32, 99, 12, 169, 194, 224, 157, 135, 34, 112,
                  216, 204, 9, 13, 210, 100, 177, 224, 192, 244, 59, 226,
                  187, 91, 212, 165, 151, 26, 78, 116]
    ||])

ticketCommitmentVector :: CompiledCode Bool
ticketCommitmentVector =
  $$(compile
    [||
      ticketCommitment
        (bytes [1, 2, 3, 4])
        (bytes [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
                48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63])
        "v1"
        7
        250
        (bytes [49, 49, 51, 51, 56, 49, 51, 170, 187, 204, 50, 118, 49])
        == bytes [1, 140, 47, 139, 67, 80, 145, 229, 154, 209, 164, 219,
                  1, 30, 157, 65, 83, 107, 220, 209, 186, 193, 65, 198,
                  159, 196, 47, 116, 243, 41, 221, 11]
    ||])

assert :: Bool -> String -> IO ()
assert condition label =
  if condition
    then putStrLn ("PASS: " ++ label)
    else error ("FAIL: " ++ label)

main :: IO ()
main = do
  assert
    (evaluationResultMatchesHaskell targetVector (==) True)
    "Plutus CEK BeaconTarget encoding matches TypeScript golden vector"
  assert
    (evaluationResultMatchesHaskell roundCommitmentVector (==) True)
    "Plutus CEK GameRoundCommitment matches TypeScript golden vector"
  assert
    (evaluationResultMatchesHaskell ticketCommitmentVector (==) True)
    "Plutus CEK ticketCommitment V2 matches TypeScript golden vector"
  putStrLn "ALL BEACON CROSS-LANGUAGE VECTORS PASSED"
