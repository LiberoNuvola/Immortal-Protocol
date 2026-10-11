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
          traceError "Prize: own input is not script"
    Nothing ->
      traceError "Prize: missing own input"

{-# INLINABLE ownInputResolved #-}
ownInputResolved :: ScriptContext -> TxOut
ownInputResolved ctx =
  case findOwnInput ctx of
    Just i ->
      txInInfoResolved i
    Nothing ->
      traceError "Prize: missing own input"

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

{-# INLINABLE rawTicketOwnerHash #-}
rawTicketOwnerHash
  :: CurrencySymbol
  -> TokenName
  -> BuiltinData
  -> Maybe BuiltinData
rawTicketOwnerHash ticketCs ticketTn rawCtx =
  case rawConstrField 0 0 rawCtx of
    Nothing -> Nothing
    Just rawInfo ->
      case rawConstrField 0 0 rawInfo of
        Nothing -> Nothing
        Just rawInputsData ->
          case rawList rawInputsData of
            Nothing -> Nothing
            Just rawInputs ->
              rawTicketOwnerHashInInputs ticketCs ticketTn rawInputs

{-# INLINABLE rawTicketOwnerHashInInputs #-}
rawTicketOwnerHashInInputs
  :: CurrencySymbol
  -> TokenName
  -> [BuiltinData]
  -> Maybe BuiltinData
rawTicketOwnerHashInInputs _ _ [] = Nothing
rawTicketOwnerHashInInputs ticketCs ticketTn (rawInput:rest) =
  case rawConstrField 0 1 rawInput of
    Nothing -> Nothing
    Just rawOut ->
      case rawConstrField 0 1 rawOut of
        Nothing -> Nothing
        Just rawValue ->
          case rawAssetAmount ticketCs ticketTn rawValue of
            Just amount ->
              if amount == 1
                then
                  case rawConstrField 0 0 rawOut of
                    Nothing -> Nothing
                    Just rawAddress ->
                      case rawConstrField 0 0 rawAddress of
                        Just rawCredential ->
                          case rawConstr rawCredential of
                            Just (tag, fields) ->
                              if tag == 0
                                then rawField 0 fields
                                else Nothing
                            Nothing -> Nothing
                        Nothing -> Nothing
                else rawTicketOwnerHashInInputs ticketCs ticketTn rest
            Nothing -> rawTicketOwnerHashInInputs ticketCs ticketTn rest

{-# INLINABLE rawMapPairs #-}
rawMapPairs :: BuiltinData -> Maybe [(BuiltinData, BuiltinData)]
rawMapPairs d =
  Builtins.matchData
    d
    (\_ _ -> Nothing)
    (\entries -> Just entries)
    (\_ -> Nothing)
    (\_ -> Nothing)
    (\_ -> Nothing)

{-# INLINABLE rawAssetAmount #-}
rawAssetAmount
  :: CurrencySymbol
  -> TokenName
  -> BuiltinData
  -> Maybe Integer
rawAssetAmount ticketCs ticketTn rawValue =
  case rawMapPairs rawValue of
    Just currencies -> rawTokenAmount ticketCs ticketTn currencies
    Nothing -> Nothing

{-# INLINABLE rawTokenAmount #-}
rawTokenAmount
  :: CurrencySymbol
  -> TokenName
  -> [(BuiltinData, BuiltinData)]
  -> Maybe Integer
rawTokenAmount _ _ [] = Nothing
rawTokenAmount ticketCs ticketTn ((rawCs, rawTokensData):rest) =
  if Builtins.equalsData rawCs (toBuiltinData ticketCs)
    then
      case rawMapPairs rawTokensData of
        Just tokens -> rawTokenAmountForName ticketTn tokens
        Nothing -> Nothing
    else rawTokenAmount ticketCs ticketTn rest

{-# INLINABLE rawTokenAmountForName #-}
rawTokenAmountForName
  :: TokenName
  -> [(BuiltinData, BuiltinData)]
  -> Maybe Integer
rawTokenAmountForName _ [] = Nothing
rawTokenAmountForName ticketTn ((rawTn, rawAmount):rest) =
  if Builtins.equalsData rawTn (toBuiltinData ticketTn)
    then fromBuiltinData rawAmount
    else rawTokenAmountForName ticketTn rest

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

{-# INLINABLE rawOwnerSigned #-}
rawOwnerSigned :: CurrencySymbol -> TokenName -> BuiltinData -> Bool
rawOwnerSigned ticketCs ticketTn rawCtx =
  case rawTicketOwnerHash ticketCs ticketTn rawCtx of
    Nothing -> False
    Just rawOwner ->
      case rawSignatories rawCtx of
        Nothing -> False
        Just rawSigs -> rawContainsData rawOwner rawSigs

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
    go [] = traceError "Prize: B1PrizePool input missing"
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
        traceIfFalse "Prize: registry ref missing" False

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
             traceIfFalse "Prize: not pending sync" (pdStatus datum == Pending)
          && traceIfFalse "Prize: already synced" (pdBeaconStatus datum == BeaconPending)
          && traceIfFalse "Prize: registry not ready" (brStatus reg == BeaconReady)
          && traceIfFalse "Prize: round mismatch" (brRound reg == btRound target)
          && traceIfFalse "Prize: target mismatch" (sameTarget (brTarget reg) target)
          && traceIfFalse "Prize: empty registry R" (lengthOfByteString (brBeaconValue reg) > 0)
          && traceIfFalse "Prize: multi input" (countOwnScriptInputs ctx == 1)
          && traceIfFalse "Prize: value not preserved (sync)" (valuePreserved ctx)
          && traceIfFalse "Prize: bad sync continuing" nextOk

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
          traceIfFalse "Prize: B1PrizePool output missing" False
        Just poolOut ->
          let
            poolIn = readPoolInput info prizePoolBs
            newReserve = ppUnresolvedReserve poolOut
            oldReserve = ppUnresolvedReserve poolIn
          in
               traceIfFalse "Prize: pool prize hash mismatch"
                 (ppPrizeHash poolOut == ownPrizeHash)
            && traceIfFalse "Prize: input pool prize hash mismatch"
                 (ppPrizeHash poolIn == ownPrizeHash)
            && traceIfFalse "Prize: payout exceeds effective pool"
                 (amountUsdm
                    <= ppTotalLiquidity poolIn
                      - ppPendingLiabilities poolIn
                      - ppUnresolvedReserve poolIn
                      - ppLockedJackpot poolIn)
            && traceIfFalse "Prize: pool liabilities wrong"
                 (ppPendingLiabilities poolOut
                    == ppPendingLiabilities poolIn + amountUsdm)
            && traceIfFalse "Prize: pool reserve must decrease"
                 (newReserve < oldReserve)
            && traceIfFalse "Prize: pool liquidity unchanged"
                 (ppTotalLiquidity poolOut == ppTotalLiquidity poolIn)
            && traceIfFalse "Prize: pool count wrong"
                 (ppUnresolvedTicketCount poolOut
                    == ppUnresolvedTicketCount poolIn - 1)
    in
       traceIfFalse "Prize: reveal window closed"
         (claimBeforeExpiry (pdExpiresAt datum) info)
    && traceIfFalse "Prize: already revealed" (pdStatus datum == Pending)
    && traceIfFalse "Prize: beacon not ready" (pdBeaconStatus datum == BeaconReady)
    && traceIfFalse "Prize: empty beacon" (lengthOfByteString beaconValue > 0)
    && traceIfFalse "Prize: beacon rederive mismatch" (beaconValue == expectedR)
    && traceIfFalse "Prize: bad player secret" (expectedPlayerCommitment == pdPlayerCommitment datum)
    && traceIfFalse "Prize: bad ticket commitment" (ticketBinding == pdCommitment datum)
    && traceIfFalse "Prize: bad symbols len" (lengthOfByteString expectedSymbols == 6)
    && traceIfFalse "Prize: multi input" (countOwnScriptInputs ctx == 1)
    && traceIfFalse "Prize: multi pool input" (countPoolInputs info prizePoolBs == 1)
    && traceIfFalse "Prize: value not preserved (reveal)" (valuePreserved ctx)
    && traceIfFalse "Prize: bad reveal continuing" nextOk
    && traceIfFalse "Prize: pool accounting wrong" poolOk

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
          traceIfFalse "Prize: B1PrizePool output missing" False
        Just poolOut ->
          let
            poolIn = readPoolInput info prizePoolBs
            expectedReserve =
              ppUnresolvedReserve poolIn
                - pdPriceUsdm datum
            expectedCount =
              ppUnresolvedTicketCount poolIn - 1
          in
               traceIfFalse "Prize: pool prize hash mismatch"
                 (ppPrizeHash poolOut == ownPrizeHash)
            && traceIfFalse "Prize: input pool prize hash mismatch"
                 (ppPrizeHash poolIn == ownPrizeHash)
            && traceIfFalse "Prize: pool prize hash changed on expire"
                 (ppPrizeHash poolOut == ppPrizeHash poolIn)
            && traceIfFalse "Prize: pool liquidity changed on expire"
                 (ppTotalLiquidity poolOut == ppTotalLiquidity poolIn)
            && traceIfFalse "Prize: pool liabilities changed on expire"
                 (ppPendingLiabilities poolOut == ppPendingLiabilities poolIn)
            && traceIfFalse "Prize: pool reserve release"
                 (ppUnresolvedReserve poolOut == expectedReserve)
            && traceIfFalse "Prize: pool reserve non-negative"
                 (expectedReserve >= 0)
            && traceIfFalse "Prize: pool count release"
                 (ppUnresolvedTicketCount poolOut == expectedCount)
            && traceIfFalse "Prize: pool locked Jackpot changed"
                 (ppLockedJackpot poolOut == ppLockedJackpot poolIn)
            && traceIfFalse "Prize: pool Jackpot floor changed"
                 (ppJackpotThreshold poolOut == ppJackpotThreshold poolIn)
            && traceIfFalse "Prize: pool suspended classes changed"
                 (ppSuspendedClasses poolOut == ppSuspendedClasses poolIn)
            && traceIfFalse "Prize: pool prize hash changed"
                 (ppPrizeHash poolOut == ppPrizeHash poolIn)

  in
       traceIfFalse "Prize: multi input" (countOwnScriptInputs ctx == 1)
    && traceIfFalse "Prize: no continuing PrizeDatum on expire"
         (countOwnScriptOutputs ctx == 0)
    && traceIfFalse "Prize: not pending" (pdStatus datum == Pending)
    && traceIfFalse "Prize: beacon state invalid"
         (pdBeaconStatus datum == BeaconPending
            || pdBeaconStatus datum == BeaconReady)
    && traceIfFalse "Prize: invalid ticket price" (pdPriceUsdm datum > 0)
    && traceIfFalse "Prize: prize amount must be zero" (pdPrizeAmount datum == 0)
    && traceIfFalse "Prize: expiry not reached"
         (expireAtOrAfter (pdExpiresAt datum) info)
    && traceIfFalse "Prize: pool input count" (countPoolInputs info prizePoolBs == 1)
    && traceIfFalse "Prize: pool accounting wrong" poolOk

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

    ownerSigned = rawOwnerSigned ticketCs ticketTn rawCtx

    rawOwner =
      rawTicketOwnerHash ticketCs ticketTn rawCtx

    -- C-03: Oracle-based settlement verification. Sum every output to the
    -- ticket owner's enterprise address by comparing the raw Plutus Data
    -- representation, avoiding typed Address/PubKeyHash equality at this
    -- evaluator boundary.
    claimantValue =
      case rawOwner of
        Just ownerHash -> rawClaimantValue ownerHash rawCtx (txInfoOutputs info)
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
          traceIfFalse "Prize: B1PrizePool output missing" False
        Just poolOut ->
          let
            poolIn = readPoolInput info prizePoolBs
          in
               traceIfFalse "Prize: pool prize hash mismatch"
                 (ppPrizeHash poolOut == ownPrizeHash)
            && traceIfFalse "Prize: input pool prize hash mismatch"
                 (ppPrizeHash poolIn == ownPrizeHash)
            && traceIfFalse "Prize: pool liquidity wrong"
                 (ppTotalLiquidity poolOut
                    == ppTotalLiquidity poolIn - payout)
            && traceIfFalse "Prize: pool liabilities wrong"
                 (ppPendingLiabilities poolOut
                    == ppPendingLiabilities poolIn - payout)
            && traceIfFalse "Prize: pool reserve unchanged"
                 (ppUnresolvedReserve poolOut == ppUnresolvedReserve poolIn)
            && traceIfFalse "Prize: pool count unchanged"
                 (ppUnresolvedTicketCount poolOut
                    == ppUnresolvedTicketCount poolIn)
  in
       traceIfFalse "Prize: owner sig" ownerSigned
    && traceIfFalse "Prize: not revealed" (pdStatus datum == Revealed)
    && traceIfFalse "Prize: already claimed" (pdStatus datum /= Claimed)
    && traceIfFalse "Prize: multi input" (countOwnScriptInputs ctx == 1)
    && traceIfFalse "Prize: multi pool input" (countPoolInputs info prizePoolBs == 1)
    && traceIfFalse "Prize: zero prize" (pdPrizeAmount datum > 0)
    && traceIfFalse "Prize: claim window closed" (claimBeforeExpiry (pdExpiresAt datum) info)
    && traceIfFalse "Prize: payout" paid
    && traceIfFalse "Prize: value not preserved (claim)" (valuePreserved ctx)
    && traceIfFalse "Prize: bad claim continuing" nextOk
    && traceIfFalse "Prize: pool accounting wrong" poolOk
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
    decodedCtx = unsafeFromBuiltinData ctx
    result =
      case action of
        Claim ->
          validateClaim
            (unsafeFromBuiltinData oracleState)
            oraclePublisher
            (unsafeFromBuiltinData d)
            ctx
            decodedCtx
        _ ->
          mkValidator
            regHash
            table
            oracleState
            oraclePublisher
            (unsafeFromBuiltinData d)
            action
            decodedCtx
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
