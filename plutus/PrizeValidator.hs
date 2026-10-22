{-# LANGUAGE DataKinds           #-}
{-# LANGUAGE NoImplicitPrelude   #-}
{-# LANGUAGE OverloadedStrings   #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE TemplateHaskell     #-}
{-# LANGUAGE ViewPatterns        #-}
-- PlutusScriptV2 must not use UPLC 1.1.0 `case` on builtin pairs/lists.
{-# OPTIONS_GHC -fplugin-opt Plinth.Plugin:target-version=1.0.0 #-}

module PrizeValidator
  ( mkValidator
  , compiledValidatorFactory
  ) where

import PlutusLedgerApi.V2
import PlutusLedgerApi.V2.Contexts
import PlutusTx
import PlutusTx.Prelude hiding (unless)
import qualified PlutusTx.Builtins as Builtins
import qualified PlutusTx.AssocMap as AssocMap
import qualified Economic

import Beacon
  ( playerCommitment
  , deriveBeacon
  , deriveTicketSeed
  , deriveSymbolsSeed
  , encodeBeaconTarget
  , ticketCommitment
  , sameTarget
  , field
  )

import GameRules
  ( PrizeTable
  , classifyRowTier
  , classifyTier
  , generateSymbols
  , rowPayoutTotal
  )

import Types
  ( PrizeAction (..)
  , PrizeDatum (..)
  , PrizeStatus (..)
  , BeaconStatus (..)
  , BeaconTarget (..)
  , BeaconRegistryDatum (..)
  , B1PrizePoolDatum (..)
  )

import OracleTypes
  ( OracleStateId
  )

-- ============================================================
-- Helpers
-- Compact trace labels keep the shared V2 validator publishable under Cardano's
-- transaction-size ceiling. These labels change diagnostics only, not predicates.
-- Trace-label dictionary (code = original diagnostic):
--   01 = Prize: own input is not script
--   02 = Prize: missing own input
--   03 = Prize: B1PrizePool input missing
--   04 = Prize: registry ref missing
--   05 = Prize: not pending sync
--   06 = Prize: already synced
--   07 = Prize: registry not ready
--   08 = Prize: round mismatch
--   09 = Prize: target mismatch
--   10 = Prize: empty registry R
--   11 = Prize: multi input
--   12 = Prize: value not preserved (sync)
--   13 = Prize: bad sync continuing
--   14 = Prize: B1PrizePool output missing
--   15 = Prize: pool prize hash mismatch
--   16 = Prize: input pool prize hash mismatch
--   17 = Prize: payout exceeds effective pool
--   18 = Prize: pool liabilities wrong
--   19 = Prize: pool reserve must decrease
--   20 = Prize: pool liquidity unchanged
--   21 = Prize: pool count wrong
--   22 = Prize: reveal window closed
--   23 = Prize: already revealed
--   24 = Prize: beacon not ready
--   25 = Prize: empty beacon
--   26 = Prize: beacon rederive mismatch
--   27 = Prize: bad player secret
--   28 = Prize: bad ticket commitment
--   29 = Prize: bad symbols len
--   30 = Prize: multi pool input
--   31 = Prize: value not preserved (reveal)
--   32 = Prize: bad reveal continuing
--   33 = Prize: pool accounting wrong
--   34 = Prize: pool prize hash changed on expire
--   35 = Prize: pool liquidity changed on expire
--   36 = Prize: pool liabilities changed on expire
--   37 = Prize: pool reserve release
--   38 = Prize: pool reserve non-negative
--   39 = Prize: pool count release
--   40 = Prize: pool locked Jackpot changed
--   41 = Prize: pool Jackpot floor changed
--   42 = Prize: pool suspended classes changed
--   43 = Prize: pool prize hash changed
--   44 = Prize: no continuing PrizeDatum on expire
--   45 = Prize: not pending
--   46 = Prize: beacon state invalid
--   47 = Prize: invalid ticket price
--   48 = Prize: prize amount must be zero
--   49 = Prize: expiry not reached
--   50 = Prize: pool input count
--   51 = Prize: pool liquidity wrong
--   52 = Prize: pool reserve unchanged
--   53 = Prize: pool count unchanged
--   54 = Prize: owner sig
--   55 = Prize: not revealed
--   56 = Prize: already claimed
--   57 = Prize: zero prize
--   58 = Prize: claim window closed
--   59 = Prize: payout
--   60 = Prize: value not preserved (claim)
--   61 = Prize: bad claim continuing
-- ============================================================

{-# INLINABLE claimAddress #-}
claimAddress :: PubKeyHash -> Address
claimAddress pkh =
  Address (PubKeyCredential pkh) Nothing

-- Restored local helpers: the raw-Data Claim rewrite removed these definitions,
-- but Sync/Reveal/Expire/Claim still depend on them.
{-# INLINABLE ownScriptHash #-}
ownScriptHash :: ScriptContext -> ScriptHash
ownScriptHash ctx =
  case findOwnInput ctx of
    Just i ->
      case addressCredential (txOutAddress (txInInfoResolved i)) of
        ScriptCredential h ->
          h
        _ ->
          traceError "01"
    Nothing ->
      traceError "02"

{-# INLINABLE ownInputResolved #-}
ownInputResolved :: ScriptContext -> TxOut
ownInputResolved ctx =
  case findOwnInput ctx of
    Just i ->
      txInInfoResolved i
    Nothing ->
      traceError "02"

{-# INLINABLE countOwnScriptInputs #-}
countOwnScriptInputs :: ScriptContext -> Integer
countOwnScriptInputs ctx =
  go (txInfoInputs (scriptContextTxInfo ctx))
  where
    thisHash = ownScriptHash ctx
    go [] = 0
    go (i:is) =
      case addressCredential (txOutAddress (txInInfoResolved i)) of
        ScriptCredential h
          | h == thisHash ->
              1 + go is
        _ ->
          go is

{-# INLINABLE countOwnScriptOutputs #-}
countOwnScriptOutputs :: ScriptContext -> Integer
countOwnScriptOutputs ctx =
  go (txInfoOutputs (scriptContextTxInfo ctx))
  where
    thisHash = ownScriptHash ctx
    go [] = 0
    go (o:os) =
      case addressCredential (txOutAddress o) of
        ScriptCredential h
          | h == thisHash ->
              1 + go os
        _ ->
          go os

-- Direct Value lookup with zero-on-missing semantics.
{-# INLINABLE assetAmount #-}
assetAmount :: Value -> CurrencySymbol -> TokenName -> Integer
assetAmount value cs tn =
  case AssocMap.lookup cs (getValue value) of
    Nothing -> 0
    Just tokens ->
      case AssocMap.lookup tn tokens of
        Nothing -> 0
        Just amount -> amount

{-# INLINABLE ticketOwnerPkh #-}
ticketOwnerPkh
  :: CurrencySymbol
  -> TokenName
  -> [TxInInfo]
  -> Maybe PubKeyHash
ticketOwnerPkh _ _ [] = Nothing
ticketOwnerPkh cs tn (i:is) =
  let resolved = txInInfoResolved i
  in
    if assetAmount (txOutValue resolved) cs tn == 1
      then
        case addressCredential (txOutAddress resolved) of
          PubKeyCredential pkh ->
            Just pkh
          _ ->
            Nothing
      else
        ticketOwnerPkh cs tn is

{-# INLINABLE rawConstr #-}
rawConstr :: BuiltinData -> Maybe (Integer, [BuiltinData])
rawConstr d =
  Builtins.matchData
    d
    (\tag fields -> Just (tag, fields))
    (\_ -> Nothing)
    (\_ -> Nothing)
    (\_ -> Nothing)
    (\_ -> Nothing)

{-# INLINABLE rawList #-}
rawList :: BuiltinData -> Maybe [BuiltinData]
rawList d =
  Builtins.matchData
    d
    (\_ _ -> Nothing)
    (\_ -> Nothing)
    (\xs -> Just xs)
    (\_ -> Nothing)
    (\_ -> Nothing)

{-# INLINABLE rawField #-}
rawField :: Integer -> [BuiltinData] -> Maybe BuiltinData
rawField _ [] = Nothing
rawField n (x:xs)
  | n <= 0 = Just x
  | otherwise = rawField (n - 1) xs

{-# INLINABLE rawConstrField #-}
rawConstrField :: Integer -> Integer -> BuiltinData -> Maybe BuiltinData
rawConstrField expectedTag fieldIndex d =
  case rawConstr d of
    Just (tag, fields) ->
      if tag == expectedTag
        then rawField fieldIndex fields
        else Nothing
    Nothing -> Nothing

{-# INLINABLE rawSignatories #-}
rawSignatories :: BuiltinData -> Maybe [BuiltinData]
rawSignatories rawCtx =
  case rawConstrField 0 0 rawCtx of
    Nothing -> Nothing
    Just rawInfo ->
      case rawConstrField 0 8 rawInfo of
        Nothing -> Nothing
        Just rawSigs -> rawList rawSigs

{-# INLINABLE rawContainsData #-}
rawContainsData :: BuiltinData -> [BuiltinData] -> Bool
rawContainsData _ [] = False
rawContainsData expected (x:xs) =
  Builtins.equalsData expected x || rawContainsData expected xs

{-# INLINABLE rawAddressOf #-}
rawAddressOf :: BuiltinData -> Maybe BuiltinData
rawAddressOf rawTxOut = rawConstrField 0 0 rawTxOut

{-# INLINABLE rawOutputAtAddress #-}
rawOutputAtAddress
  :: BuiltinData
  -> [BuiltinData]
  -> [TxOut]
  -> Value
rawOutputAtAddress _ [] _ = mempty
rawOutputAtAddress _ _ [] = mempty
rawOutputAtAddress expectedAddr (rawOut:rawRest) (out:rest) =
  case rawAddressOf rawOut of
    Just rawAddr ->
      if Builtins.equalsData expectedAddr rawAddr
        then txOutValue out <> rawOutputAtAddress expectedAddr rawRest rest
        else rawOutputAtAddress expectedAddr rawRest rest
    Nothing -> rawOutputAtAddress expectedAddr rawRest rest

{-# INLINABLE rawClaimantValue #-}
rawClaimantValue :: BuiltinData -> BuiltinData -> [TxOut] -> Value
rawClaimantValue ownerHash rawCtx outputs =
  let
    rawExpectedAddress =
      Builtins.mkConstr 0
        [ Builtins.mkConstr 0 [ownerHash]
        , Builtins.mkConstr 1 []
        ]
  in
    case rawConstrField 0 0 rawCtx of
      Nothing -> mempty
      Just rawInfo ->
        case rawConstrField 0 2 rawInfo of
          Nothing -> mempty
          Just rawOutputsData ->
            case rawList rawOutputsData of
              Nothing -> mempty
              Just rawOutputs -> rawOutputAtAddress rawExpectedAddress rawOutputs outputs

{-# INLINABLE continuingScriptOuts #-}
continuingScriptOuts :: ScriptHash -> [TxOut] -> [TxOut]
continuingScriptOuts _ [] = []
continuingScriptOuts h (o:os) =
  case addressCredential (txOutAddress o) of
    ScriptCredential h'
      | h' == h ->
          o : continuingScriptOuts h os
    _ ->
      continuingScriptOuts h os

{-# INLINABLE valuePreserved #-}
valuePreserved :: ScriptContext -> Bool
valuePreserved ctx =
  let
    ownVal = txOutValue (ownInputResolved ctx)
    ownHash = ownScriptHash ctx
    outs =
      continuingScriptOuts
        ownHash
        (txInfoOutputs (scriptContextTxInfo ctx))
  in
    case outs of
      [o] ->
        txOutValue o == ownVal
      _ ->
        False

{-# INLINABLE decodePrizeDatum #-}
decodePrizeDatum :: TxInfo -> TxOut -> Maybe PrizeDatum
decodePrizeDatum info out =
  case txOutDatum out of
    OutputDatum d ->
      fromBuiltinData (getDatum d)
    OutputDatumHash dh ->
      case findDatum dh info of
        Just d ->
          fromBuiltinData (getDatum d)
        Nothing ->
          Nothing
    NoOutputDatum ->
      Nothing

{-# INLINABLE findSingleContinuing #-}
findSingleContinuing :: ScriptContext -> Maybe PrizeDatum
findSingleContinuing ctx =
  let
    info = scriptContextTxInfo ctx
    ownHash = ownScriptHash ctx
    isOwnScriptOut o =
      case addressCredential (txOutAddress o) of
        ScriptCredential h ->
          h == ownHash
        _ ->
          False
    go [] found = found
    go (o:os) found =
      if isOwnScriptOut o
        then
          case found of
            Just _ ->
              Nothing
            Nothing ->
              go os (decodePrizeDatum info o)
        else
          go os found
  in
    go (txInfoOutputs info) Nothing

{-# INLINABLE resultBinding #-}
resultBinding :: BuiltinByteString -> BuiltinByteString -> BuiltinByteString
resultBinding digest syms =
  sha2_256 (appendByteString (field digest) (field syms))

-- ============================================================
-- B1PrizePool cross-validation
-- ============================================================

{-# INLINABLE decodeB1PrizePoolDatum #-}
decodeB1PrizePoolDatum :: TxInfo -> TxOut -> Maybe B1PrizePoolDatum
decodeB1PrizePoolDatum info out =
  case txOutDatum out of
    OutputDatum d ->
      fromBuiltinData (getDatum d)
    OutputDatumHash dh ->
      case findDatum dh info of
        Just d ->
          fromBuiltinData (getDatum d)
        Nothing ->
          Nothing
    NoOutputDatum ->
      Nothing

{-# INLINABLE findB1PrizePoolOutput #-}
findB1PrizePoolOutput :: TxInfo -> BuiltinByteString -> Maybe B1PrizePoolDatum
findB1PrizePoolOutput info poolHashB = go (txInfoOutputs info) Nothing
  where
    poolHash = ScriptHash poolHashB
    go [] found = found
    go (o:os) found =
      case addressCredential (txOutAddress o) of
        ScriptCredential h
          | h == poolHash ->
              case found of
                Just _ ->
                  -- More than one continuing pool output is ambiguous and
                  -- must fail closed rather than selecting the first one.
                  Nothing
                Nothing ->
                  case decodeB1PrizePoolDatum info o of
                    Just d  -> go os (Just d)
                    Nothing -> Nothing
        _ -> go os found

{-# INLINABLE readPoolInput #-}
readPoolInput :: TxInfo -> BuiltinByteString -> B1PrizePoolDatum
readPoolInput info poolHashB = go (txInfoInputs info)
  where
    poolHash = ScriptHash poolHashB
    go [] = traceError "03"
    go (i:is) =
      case addressCredential (txOutAddress (txInInfoResolved i)) of
        ScriptCredential h
          | h == poolHash ->
              case decodeB1PrizePoolDatum info (txInInfoResolved i) of
                Just d  -> d
                Nothing -> go is
        _ -> go is

-- | Count B1PrizePool inputs in the transaction.
{-# INLINABLE countPoolInputs #-}
countPoolInputs :: TxInfo -> BuiltinByteString -> Integer
countPoolInputs info poolHashB = go (txInfoInputs info)
  where
    poolHash = ScriptHash poolHashB
    go [] = 0
    go (i:is) =
      case addressCredential (txOutAddress (txInInfoResolved i)) of
        ScriptCredential h
          | h == poolHash -> 1 + go is
        _ -> go is

-- | Claim allowed only if tx validity range ends at or before expiresAt.
-- Uses POSIX time from txInfoValidRange (ms-compatible Integer compare).
{-# INLINABLE claimBeforeExpiry #-}
claimBeforeExpiry :: Integer -> TxInfo -> Bool
claimBeforeExpiry expiresAt info =
  case ivTo (txInfoValidRange info) of
    UpperBound (Finite t) _ ->
      getPOSIXTime t <= expiresAt
    _ ->
      False

-- | EXPIRE is valid only when the validity interval lower bound is at/after
-- the ticket's crystallized expiry boundary.
{-# INLINABLE expireAtOrAfter #-}
expireAtOrAfter :: Integer -> TxInfo -> Bool
expireAtOrAfter expiresAt info =
  case ivFrom (txInfoValidRange info) of
    LowerBound (Finite t) _ ->
      getPOSIXTime t >= expiresAt
    _ ->
      False

{-# INLINABLE identityFieldsEq #-}
identityFieldsEq :: PrizeDatum -> PrizeDatum -> Bool
identityFieldsEq a b =
     pdTicketPolicy a == pdTicketPolicy b
  && pdTicketName a == pdTicketName b
  && pdPlayerCommitment a == pdPlayerCommitment b
  && pdPriceUsdm a == pdPriceUsdm b
  && pdCommitment a == pdCommitment b
  && pdGameVersion a == pdGameVersion b
  && pdTicketNonce a == pdTicketNonce b
  && pdPaymentPolicy a == pdPaymentPolicy b
  && pdPaymentName a == pdPaymentName b
  && sameTarget (pdBeaconTarget a) (pdBeaconTarget b)
  && pdPrizePoolHash a == pdPrizePoolHash b
  && pdIssuedAt a == pdIssuedAt b
  && pdExpiresAt a == pdExpiresAt b
  -- pdRow1Tier / pdRow2Tier are mutable Reveal outputs. Their canonical
  -- values are independently checked against GameRules in validateReveal.
  -- Every OTHER transition that continues the datum must keep them frozen
  -- through rowTiersUnchanged below.

-- | Row tiers are written exactly once, by Reveal. Sync (before Reveal) and
-- Claim (after Reveal) must carry them over unchanged so the on-chain record
-- of the revealed result stays immutable.
{-# INLINABLE rowTiersUnchanged #-}
rowTiersUnchanged :: PrizeDatum -> PrizeDatum -> Bool
rowTiersUnchanged a b =
     pdRow1Tier a == pdRow1Tier b
  && pdRow2Tier a == pdRow2Tier b

-- ============================================================
-- Registry reference
-- ============================================================


{-# INLINABLE isRegistryRef #-}
isRegistryRef :: ScriptHash -> TxInInfo -> Bool
isRegistryRef regHash i =
  case addressCredential (txOutAddress (txInInfoResolved i)) of
    ScriptCredential h ->
      h == regHash
    _ ->
      False

{-# INLINABLE decodeRegistryDatum #-}
decodeRegistryDatum :: TxInfo -> TxOut -> Maybe BeaconRegistryDatum
decodeRegistryDatum info out =
  case txOutDatum out of
    OutputDatum d ->
      fromBuiltinData (getDatum d)
    OutputDatumHash dh ->
      case findDatum dh info of
        Just d ->
          fromBuiltinData (getDatum d)
        Nothing ->
          Nothing
    NoOutputDatum ->
      Nothing

{-# INLINABLE readRegistry #-}
readRegistry :: ScriptHash -> TxInfo -> Maybe BeaconRegistryDatum
readRegistry regHash info =
  go (txInfoReferenceInputs info)
  where
    go [] = Nothing
    go (i:is) =
      if isRegistryRef regHash i
        then decodeRegistryDatum info (txInInfoResolved i)
        else go is

-- ============================================================
-- SyncBeacon
-- ============================================================

{-# INLINABLE validateSyncBeacon #-}
validateSyncBeacon
  :: ScriptHash
  -> PrizeDatum
  -> ScriptContext
  -> Bool
validateSyncBeacon regHash datum ctx =
  let
    info = scriptContextTxInfo ctx
    target = pdBeaconTarget datum
  in
    case readRegistry regHash info of
      Nothing ->
        traceIfFalse "04" False

      Just reg ->
        let
          nextOk =
            case findSingleContinuing ctx of
              Nothing ->
                False
              Just n ->
                   identityFieldsEq n datum
                && rowTiersUnchanged n datum
                && pdPrizeAmount n == pdPrizeAmount datum
                && pdStatus n == Pending
                && pdBeaconStatus n == BeaconReady
                && pdBeaconValue n == brBeaconValue reg
                && pdMcHash n == brMcHash reg
                && pdMateriosContext n == brMateriosContext reg
                && lengthOfByteString (pdResult n) == 0
                && pdPrizeTier n == 0
        in
             traceIfFalse "05" (pdStatus datum == Pending)
          && traceIfFalse "06" (pdBeaconStatus datum == BeaconPending)
          && traceIfFalse "07" (brStatus reg == BeaconReady)
          && traceIfFalse "08" (brRound reg == btRound target)
          && traceIfFalse "09" (sameTarget (brTarget reg) target)
          && traceIfFalse "10" (lengthOfByteString (brBeaconValue reg) > 0)
          && traceIfFalse "11" (countOwnScriptInputs ctx == 1)
          && traceIfFalse "12" (valuePreserved ctx)
          && traceIfFalse "13" nextOk

-- ============================================================
-- Reveal
-- Economic finality: reveal is allowed only up to pdExpiresAt.
-- After expiry the payment commitment dissolves and REVEAL
-- must not create a new liability.
-- ============================================================

{-# INLINABLE validateReveal #-}
validateReveal
  :: PrizeTable
  -> PrizeDatum
  -> BuiltinByteString
  -> ScriptContext
  -> Bool
validateReveal table datum playerSecret ctx =
  let
    info = scriptContextTxInfo ctx
    prizePoolBs = pdPrizePoolHash datum
    ownPrizeHash = ownScriptHash ctx
    target = pdBeaconTarget datum
    roundId = btRound target
    ticketId = pdTicketName datum
    beaconValue = pdBeaconValue datum

    expectedPlayerCommitment =
      playerCommitment roundId (pdTicketNonce datum) playerSecret

    ticketBinding =
      ticketCommitment
        ticketId
        (pdPlayerCommitment datum)
        (pdGameVersion datum)
        (pdTicketNonce datum)
        (pdPriceUsdm datum)
        (encodeBeaconTarget target)

    expectedR =
      deriveBeacon
        (btNetworkId target)
        (btRound target)
        (btMainchainRef target)
        (pdMcHash datum)
        (pdMateriosContext datum)
        (btVersion target)

    finalSeed =
      deriveTicketSeed
        roundId
        (pdTicketNonce datum)
        playerSecret
        beaconValue
        (pdGameVersion datum)

    symbolsSeed = deriveSymbolsSeed finalSeed
    expectedSymbols = generateSymbols symbolsSeed
    expectedResult =
      resultBinding (sha2_256 symbolsSeed) expectedSymbols
    row1 =
      consByteString (indexByteString expectedSymbols 0)
        (consByteString (indexByteString expectedSymbols 1)
          (consByteString (indexByteString expectedSymbols 2) emptyByteString))
    row2 =
      consByteString (indexByteString expectedSymbols 3)
        (consByteString (indexByteString expectedSymbols 4)
          (consByteString (indexByteString expectedSymbols 5) emptyByteString))
    row1Tier = classifyRowTier row1
    row2Tier = classifyRowTier row2
    tier = classifyTier expectedSymbols
    amountUsdm =
      rowPayoutTotal table row1Tier row2Tier (pdPriceUsdm datum)

    nextOk =
      case findSingleContinuing ctx of
        Nothing ->
          False
        Just n ->
             identityFieldsEq n datum
          && pdBeaconStatus n == BeaconReady
          && pdBeaconValue n == beaconValue
          && pdMcHash n == pdMcHash datum
          && pdMateriosContext n == pdMateriosContext datum
          && pdStatus n == Revealed
          && pdResult n == expectedResult
          && pdPrizeTier n == tier
          && pdRow1Tier n == row1Tier
          && pdRow2Tier n == row2Tier
          && pdPrizeAmount n == amountUsdm

    -- B1PrizePool cross-validation: pool accounting must be consistent
    -- with the crystallised payout in the PrizeDatum output.
    -- This ensures PrizeValidator and B1PrizePool update atomically.
    -- Effective pool invariant: payout must be affordable before reveal.
    poolOk =
      case findB1PrizePoolOutput info prizePoolBs of
        Nothing ->
          traceIfFalse "14" False
        Just poolOut ->
          let
            poolIn = readPoolInput info prizePoolBs
            newReserve = ppUnresolvedReserve poolOut
            oldReserve = ppUnresolvedReserve poolIn
          in
               traceIfFalse "15"
                 (ppPrizeHash poolOut == ownPrizeHash)
            && traceIfFalse "16"
                 (ppPrizeHash poolIn == ownPrizeHash)
            && traceIfFalse "17"
                 (amountUsdm
                    <= ppTotalLiquidity poolIn
                      - ppPendingLiabilities poolIn
                      - ppUnresolvedReserve poolIn
                      - ppLockedJackpot poolIn)
            && traceIfFalse "18"
                 (ppPendingLiabilities poolOut
                    == ppPendingLiabilities poolIn + amountUsdm)
            && traceIfFalse "19"
                 (newReserve < oldReserve)
            && traceIfFalse "20"
                 (ppTotalLiquidity poolOut == ppTotalLiquidity poolIn)
            && traceIfFalse "21"
                 (ppUnresolvedTicketCount poolOut
                    == ppUnresolvedTicketCount poolIn - 1)
    in
       traceIfFalse "22"
         (claimBeforeExpiry (pdExpiresAt datum) info)
    && traceIfFalse "23" (pdStatus datum == Pending)
    && traceIfFalse "24" (pdBeaconStatus datum == BeaconReady)
    && traceIfFalse "25" (lengthOfByteString beaconValue > 0)
    && traceIfFalse "26" (beaconValue == expectedR)
    && traceIfFalse "27" (expectedPlayerCommitment == pdPlayerCommitment datum)
    && traceIfFalse "28" (ticketBinding == pdCommitment datum)
    && traceIfFalse "29" (lengthOfByteString expectedSymbols == 6)
    && traceIfFalse "11" (countOwnScriptInputs ctx == 1)
    && traceIfFalse "30" (countPoolInputs info prizePoolBs == 1)
    && traceIfFalse "31" (valuePreserved ctx)
    && traceIfFalse "32" nextOk
    && traceIfFalse "33" poolOk

-- ============================================================
-- Expire
-- Canonical semantics: consume the Pending PrizeDatum at/after expiry.
-- No continuing PrizeDatum is produced. The ticket NFT is independent and
-- remains transferable; EXPIRE only closes the economic promise and releases
-- its unresolved reserve from the PrizePool.
-- ============================================================

{-# INLINABLE validateExpire #-}
validateExpire
  :: PrizeDatum
  -> ScriptContext
  -> Bool
validateExpire datum ctx =
  let
    info = scriptContextTxInfo ctx
    prizePoolBs = pdPrizePoolHash datum
    ownPrizeHash = ownScriptHash ctx

    poolOk =
      case findB1PrizePoolOutput info prizePoolBs of
        Nothing ->
          traceIfFalse "14" False
        Just poolOut ->
          let
            poolIn = readPoolInput info prizePoolBs
            expectedReserve =
              ppUnresolvedReserve poolIn
                - pdPriceUsdm datum
            expectedCount =
              ppUnresolvedTicketCount poolIn - 1
          in
               traceIfFalse "15"
                 (ppPrizeHash poolOut == ownPrizeHash)
            && traceIfFalse "16"
                 (ppPrizeHash poolIn == ownPrizeHash)
            && traceIfFalse "34"
                 (ppPrizeHash poolOut == ppPrizeHash poolIn)
            && traceIfFalse "35"
                 (ppTotalLiquidity poolOut == ppTotalLiquidity poolIn)
            && traceIfFalse "36"
                 (ppPendingLiabilities poolOut == ppPendingLiabilities poolIn)
            && traceIfFalse "37"
                 (ppUnresolvedReserve poolOut == expectedReserve)
            && traceIfFalse "38"
                 (expectedReserve >= 0)
            && traceIfFalse "39"
                 (ppUnresolvedTicketCount poolOut == expectedCount)
            && traceIfFalse "40"
                 (ppLockedJackpot poolOut == ppLockedJackpot poolIn)
            && traceIfFalse "41"
                 (ppJackpotThreshold poolOut == ppJackpotThreshold poolIn)
            && traceIfFalse "42"
                 (ppSuspendedClasses poolOut == ppSuspendedClasses poolIn)
            && traceIfFalse "43"
                 (ppPrizeHash poolOut == ppPrizeHash poolIn)

  in
       traceIfFalse "11" (countOwnScriptInputs ctx == 1)
    && traceIfFalse "44"
         (countOwnScriptOutputs ctx == 0)
    && traceIfFalse "45" (pdStatus datum == Pending)
    && traceIfFalse "46"
         (pdBeaconStatus datum == BeaconPending
            || pdBeaconStatus datum == BeaconReady)
    && traceIfFalse "47" (pdPriceUsdm datum > 0)
    && traceIfFalse "48" (pdPrizeAmount datum == 0)
    && traceIfFalse "49"
         (expireAtOrAfter (pdExpiresAt datum) info)
    && traceIfFalse "50" (countPoolInputs info prizePoolBs == 1)
    && traceIfFalse "33" poolOk

-- ============================================================
-- Claim
-- Constitution: pay once, keep NFT (no mandatory burn), status → Claimed
-- ============================================================

{-# INLINABLE validateClaim #-}
validateClaim
  :: OracleStateId
  -> PubKeyHash
  -> PrizeDatum
  -> BuiltinData
  -> ScriptContext
  -> Bool
validateClaim oracleState oraclePublisher datum rawCtx ctx =
  let
    info = scriptContextTxInfo ctx
    prizePoolBs = pdPrizePoolHash datum
    ownPrizeHash = ownScriptHash ctx
    ticketCs = CurrencySymbol (pdTicketPolicy datum)
    ticketTn = TokenName (pdTicketName datum)

    maybeOwner =
      ticketOwnerPkh ticketCs ticketTn (txInfoInputs info)

    -- Derive the ticket owner once from typed TxInfo, which is also the
    -- owner used to construct the exact settlement address. Keep signer
    -- membership on the raw BuiltinData representation: the legacy Yaci/Scalus
    -- Plutus V2 evaluator exposes signatories as Data at this boundary, whereas
    -- txSignedBy lowers to byte-string equality and has failed this path.
    -- This avoids a second raw traversal of every input and Value map while
    -- preserving the owner/signatory membership predicate for ledger TxInfo.
    ownerSigned =
      case maybeOwner of
        Nothing -> False
        Just ownerHash ->
          case rawSignatories rawCtx of
            Nothing -> False
            Just rawSigs -> rawContainsData (toBuiltinData ownerHash) rawSigs

    -- C-03: Oracle-based settlement verification. Construct the canonical
    -- enterprise address from the typed PubKeyHash before comparing raw address
    -- Data, so the credential is encoded once as PubKeyHash Data.
    claimantValue =
      case maybeOwner of
        Just ownerHash ->
          rawClaimantValue (toBuiltinData ownerHash) rawCtx (txInfoOutputs info)
        Nothing -> mempty
    paidUsdm =
      Economic.totalUsdmValue
        info
        oracleState
        oraclePublisher
        claimantValue
    paid = paidUsdm == pdPrizeAmount datum

    -- Continuing UTxO marked Claimed; frozen economic fields immutable.
    nextOk =
      case findSingleContinuing ctx of
        Nothing ->
          False
        Just n ->
             identityFieldsEq n datum
          && rowTiersUnchanged n datum
          && pdBeaconStatus n == pdBeaconStatus datum
          && pdBeaconValue n == pdBeaconValue datum
          && pdMcHash n == pdMcHash datum
          && pdMateriosContext n == pdMateriosContext datum
          && pdStatus n == Claimed
          && pdResult n == pdResult datum
          && pdPrizeTier n == pdPrizeTier datum
          && pdPrizeAmount n == pdPrizeAmount datum

    -- B1PrizePool cross-validation: pool accounting must be consistent
    -- with the claimed payout. Claim reduces both totalLiquidity and
    -- pendingLiabilities by the exact crystallised payout.
    payout = pdPrizeAmount datum
    poolOk =
      case findB1PrizePoolOutput info prizePoolBs of
        Nothing ->
          traceIfFalse "14" False
        Just poolOut ->
          let
            poolIn = readPoolInput info prizePoolBs
          in
               traceIfFalse "15"
                 (ppPrizeHash poolOut == ownPrizeHash)
            && traceIfFalse "16"
                 (ppPrizeHash poolIn == ownPrizeHash)
            && traceIfFalse "51"
                 (ppTotalLiquidity poolOut
                    == ppTotalLiquidity poolIn - payout)
            && traceIfFalse "18"
                 (ppPendingLiabilities poolOut
                    == ppPendingLiabilities poolIn - payout)
            && traceIfFalse "52"
                 (ppUnresolvedReserve poolOut == ppUnresolvedReserve poolIn)
            && traceIfFalse "53"
                 (ppUnresolvedTicketCount poolOut
                    == ppUnresolvedTicketCount poolIn)
  in
       traceIfFalse "54" ownerSigned
    && traceIfFalse "55" (pdStatus datum == Revealed)
    && traceIfFalse "11" (countOwnScriptInputs ctx == 1)
    && traceIfFalse "30" (countPoolInputs info prizePoolBs == 1)
    && traceIfFalse "57" (pdPrizeAmount datum > 0)
    && traceIfFalse "58" (claimBeforeExpiry (pdExpiresAt datum) info)
    && traceIfFalse "59" paid
    && traceIfFalse "60" (valuePreserved ctx)
    && traceIfFalse "61" nextOk
    && traceIfFalse "33" poolOk
    -- NFT burn is NOT required (constitution: keep after claim).

-- ============================================================
-- Entry
-- ============================================================

{-# INLINABLE mkValidator #-}
mkValidator
  :: ScriptHash
  -> PrizeTable
  -> BuiltinData
  -> PubKeyHash
  -> PrizeDatum
  -> PrizeAction
  -> ScriptContext
  -> Bool
mkValidator regHash table oracleStateData oraclePublisher datum action ctx =
  case action of
    SyncBeacon ->
      validateSyncBeacon regHash datum ctx
    Reveal playerSecret ->
      validateReveal table datum playerSecret ctx
    Claim ->
      validateClaim
        (unsafeFromBuiltinData oracleStateData)
        oraclePublisher
        datum
        (toBuiltinData ctx)
        ctx
    Expire ->
      validateExpire datum ctx


{-# INLINABLE wrap #-}
wrap
  :: ScriptHash
  -> PrizeTable
  -> BuiltinData
  -> PubKeyHash
  -> BuiltinData
  -> BuiltinData
  -> BuiltinData
  -> BuiltinUnit
wrap regHash table oracleState oraclePublisher d r ctx =
  let
    action = unsafeFromBuiltinData r
    datum = unsafeFromBuiltinData d
    decodedCtx = unsafeFromBuiltinData ctx
    result =
      case action of
        Claim ->
          validateClaim
            (unsafeFromBuiltinData oracleState)
            oraclePublisher
            datum
            ctx
            decodedCtx
        SyncBeacon ->
          validateSyncBeacon regHash datum decodedCtx
        Reveal playerSecret ->
          validateReveal table datum playerSecret decodedCtx
        Expire ->
          validateExpire datum decodedCtx
  in
    check result

compiledValidatorFactory
  :: CompiledCode
       ( ScriptHash
         -> PrizeTable
         -> BuiltinData
         -> PubKeyHash
         -> BuiltinData
         -> BuiltinData
         -> BuiltinData
         -> BuiltinUnit
       )
compiledValidatorFactory =
  $$(compile [|| wrap ||])
