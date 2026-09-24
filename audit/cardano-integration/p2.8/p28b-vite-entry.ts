import { Emulator, Lucid } from "lucid-cardano";
import { buildScriptsFromLucid } from "../../../src/loadValidator";

async function main() {
  const lucid = await Lucid.new(new Emulator([]), "Preprod");
  console.log("P2.8-B: Lucid OK");

  const publisher = "";
  console.log("Testing buildScriptsFromLucid...");
  buildScriptsFromLucid(lucid, undefined, publisher);
  console.log("P2.8-B: topology construction OK");
}

main().catch((error) => {
  console.error("P2.8-B FAILED");
  console.error(error);
});
