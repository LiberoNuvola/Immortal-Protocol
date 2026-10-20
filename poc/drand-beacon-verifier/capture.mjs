import { writeFile, mkdir } from "node:fs/promises";
import { verifyFixedRound } from "./verify.mjs";

const round = Number(process.env.DRAND_ROUND ?? "42");
const evidence = await verifyFixedRound(round);
await mkdir("out", { recursive: true });
await writeFile("out/DrandVerifiedBeacon.json", JSON.stringify(evidence, null, 2) + "\n");
console.log(JSON.stringify({
  profile: evidence.profile,
  beaconId: evidence.beaconId,
  chainHash: evidence.chainHash,
  round: evidence.round,
  verification: evidence.verification,
  evidencePath: "out/DrandVerifiedBeacon.json",
  scope: evidence.scope,
}, null, 2));
