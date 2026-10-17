// Shared Aiken expression builders for Haskell-produced datum snapshots.
// Snapshot shape: { dataHex, fields: {...} } as emitted by
// plutus/test/RevealSchemaFixtures.hs (prizeDatumSnapshot / poolDatumSnapshot).
// Every value is validated before being interpolated into generated source.

export const hex = (value, label) => {
  if (typeof value !== 'string' || !/^(?:[0-9a-f]{2})*$/.test(value)) {
    throw new Error('Malformed hex field: ' + label);
  }
  return value;
};

export const integer = (value, label) => {
  if (!Number.isSafeInteger(value)) throw new Error('Malformed integer field: ' + label);
  return value;
};

const PRIZE_STATUSES = new Set(['Pending', 'Revealed', 'Claimed']);
const BEACON_STATUSES = new Set(['BeaconPending', 'BeaconReady']);

function requireSnapshot(snapshot, label, kind) {
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.fields || typeof snapshot.fields !== 'object') {
    throw new Error('Missing ' + kind + ' snapshot: ' + label);
  }
  return snapshot.fields;
}

export function prizeDatum(snapshot, label) {
  const v = requireSnapshot(snapshot, label, 'PrizeDatum');
  const b = (key) => '#"' + hex(v[key], label + '.' + key) + '"';
  const n = (key) => String(integer(v[key], label + '.' + key));
  const target = v.beaconTarget;
  if (!target || typeof target !== 'object') throw new Error('Missing BeaconTarget: ' + label);
  if (!PRIZE_STATUSES.has(v.status) || !BEACON_STATUSES.has(v.beaconStatus)) {
    throw new Error('Unknown datum status: ' + label);
  }
  const targetExpr = 'reveal_types.BeaconTarget { '
    + 'network_id: ' + integer(target.networkId, label + '.networkId') + ', '
    + 'round: ' + integer(target.round, label + '.round') + ', '
    + 'mainchain_ref: #"' + hex(target.mainchainRefHex, label + '.mainchainRefHex') + '", '
    + 'version: #"' + hex(target.versionHex, label + '.versionHex') + '" }';
  return 'reveal_types.PrizeDatum { '
    + 'ticket_policy: ' + b('ticketPolicyHex') + ', '
    + 'ticket_name: ' + b('ticketNameHex') + ', '
    + 'player_commitment: ' + b('playerCommitmentHex') + ', '
    + 'price_usdm: ' + n('priceUsdm') + ', '
    + 'commitment: ' + b('commitmentHex') + ', '
    + 'game_version: ' + b('gameVersionHex') + ', '
    + 'ticket_nonce: ' + n('ticketNonce') + ', '
    + 'prize_amount: ' + n('prizeAmount') + ', '
    + 'payment_policy: ' + b('paymentPolicyHex') + ', '
    + 'payment_name: ' + b('paymentNameHex') + ', '
    + 'status: reveal_types.' + v.status + ', '
    + 'result: ' + b('resultHex') + ', '
    + 'prize_tier: ' + n('prizeTier') + ', '
    + 'beacon_target: ' + targetExpr + ', '
    + 'beacon_status: reveal_types.' + v.beaconStatus + ', '
    + 'beacon_value: ' + b('beaconValueHex') + ', '
    + 'mc_hash: ' + b('mcHashHex') + ', '
    + 'materios_context: ' + b('materiosContextHex') + ', '
    + 'prize_pool_hash: ' + b('prizePoolHashHex') + ', '
    + 'issued_at: ' + n('issuedAt') + ', '
    + 'expires_at: ' + n('expiresAt') + ', '
    + 'row1_tier: ' + n('row1Tier') + ', '
    + 'row2_tier: ' + n('row2Tier') + ' }';
}

function poolFields(snapshot, label, constructor) {
  const v = requireSnapshot(snapshot, label, 'B1PrizePool datum');
  const n = (key) => String(integer(v[key], label + '.' + key));
  return constructor + ' { '
    + 'total_liquidity: ' + n('totalLiquidity') + ', '
    + 'pending_liabilities: ' + n('pendingLiabilities') + ', '
    + 'unresolved_reserve: ' + n('unresolvedReserve') + ', '
    + 'unresolved_ticket_count: ' + n('unresolvedTicketCount') + ', '
    + 'locked_jackpot: ' + n('lockedJackpot') + ', '
    + 'jackpot_threshold: ' + n('jackpotThreshold') + ', '
    + 'suspended_classes: ' + n('suspendedClasses') + ', '
    + 'prize_hash: #"' + hex(v.prizeHashHex, label + '.prizeHashHex') + '" }';
}

/** On-chain datum type (reveal_types.B1PrizePoolDatum). */
export const poolDatum = (snapshot, label) => poolFields(snapshot, label, 'reveal_types.B1PrizePoolDatum');

/** Pure-predicate pool view (reveal_context_guards.RevealPoolState). */
export const poolState = (snapshot, label) => poolFields(snapshot, label, 'RevealPoolState');
