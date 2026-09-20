import { Emulator, Lucid } from "lucid-cardano";
import { buildScriptsFromLucid } from "./src/loadValidator.ts";

async function main() {
  const lucid = await Lucid.new(new Emulator([]), "Preprod");
  console.log("Lucid OK");

  const publisher = process.env.VITE_ORACLE_PUBLISHER_PKH ?? "";
  const oraclePolicy = process.env.VITE_ORACLE_STATE_POLICY_ID ?? "";
  const oracleName = process.env.VITE_ORACLE_STATE_TOKEN_NAME_HEX ?? "";
  const poolPolicy = process.env.VITE_B1_POOL_TOKEN_POLICY_ID ?? "";
  const poolName = process.env.VITE_B1_POOL_TOKEN_NAME_HEX ?? "";

  console.log("publisher:", publisher ? "SET" : "MISSING");
  console.log("oracle policy:", oraclePolicy ? "SET" : "MISSING");
  console.log("oracle name:", oracleName ? "SET" : "MISSING");
  console.log("pool policy:", poolPolicy ? "SET" : "MISSING");
  console.log("pool name:", poolName ? "SET" : "MISSING");

  if (!publisher) throw new Error("VITE_ORACLE_PUBLISHER_PKH is missing");

  const scripts = buildScriptsFromLucid(
    lucid,
    undefined,
    publisher,
    oraclePolicy,
    oracleName,
    poolPolicy,
    poolName,
  );

  console.log("");
  console.log("REAL PRE-RICH SCRIPT TOPOLOGY");
  console.log("counterHash:", scripts.counterHash);
  console.log("registryHash:", scripts.registryHash);
  console.log("treasuryHash:", scripts.treasuryHash);
  console.log("prizeHash:", scripts.prizeHash);
  console.log("b1PrizePoolHash:", scripts.b1PrizePoolHash);
  console.log("ticketPolicyId:", scripts.ticketPolicyId);
  console.log("prizeAddress:", scripts.prizeAddress);
  console.log("b1PrizePoolAddress:", scripts.b1PrizePoolAddress);

  console.log("P2.8-B topology construction: OK");
}

main().catch((error) => {
  console.error("P2.8-B topology check FAILED");
  console.error(error);
  process.exit(1);
});
