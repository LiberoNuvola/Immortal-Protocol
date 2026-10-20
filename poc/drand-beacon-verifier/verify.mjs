import { fetchBeacon, quicknetClientV2 } from "drand-client";

export const QUICKNET = Object.freeze({
  beaconId: "quicknet",
  chainHash: "52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971",
  publicKey: "83cf0f2896adee7eb8b5f01fcad3912212c437e0073e911fb90022d3e760183c8c4b450b6a0a6c3ac6a5776a2d1064510d1fec758c921cc22b0e17e63aaf4bcb5ed66304de9cf809bd274ca73bab4af5a6e9c76a4bc09e76eae8991ef5ece45a",
  schemeID: "bls-unchained-g1-rfc9380",
});

export async function verifyFixedRound(round, client = quicknetClientV2()) {
  if (!Number.isSafeInteger(round) || round < 1) {
    throw new Error("round must be a positive safe integer");
  }

  const info = await client.chain().info();
  if (
    info.hash !== QUICKNET.chainHash ||
    info.public_key !== QUICKNET.publicKey ||
    info.schemeID !== QUICKNET.schemeID ||
    info.metadata?.beaconID !== QUICKNET.beaconId
  ) {
    throw new Error("drand chain identity does not match pinned Quicknet profile");
  }

  // fetchBeacon performs expected-round checking, randomness/signature consistency,
  // and BLS verification because disableBeaconVerification remains false.
  const beacon = await fetchBeacon(client, round);
  if (beacon.round !== round) {
    throw new Error("verified beacon round differs from preselected round");
  }

  return {
    profile: "IMMORTAL-DRAND-QUICKNET-V1-POC",
    beaconId: QUICKNET.beaconId,
    chainHash: QUICKNET.chainHash,
    publicKey: QUICKNET.publicKey,
    schemeID: QUICKNET.schemeID,
    round: beacon.round,
    signature: beacon.signature,
    previous_signature: "previous_signature" in beacon ? beacon.previous_signature : null,
    randomness: beacon.randomness,
    verification: "PASS",
    scope: "off-chain drand signature verification only; not Materios finality, not Cardano validation",
  };
}
