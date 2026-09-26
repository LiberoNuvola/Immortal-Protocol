import { describe, expect, it } from "vitest";
import {
  decodeMateriosEvidence,
  assertMateriosEvidenceJsonSize
} from "../src/materios-evidence-adapter.js";

const H = "11".repeat(32);
const UTXO = "22".repeat(32);
const PROOF = "aa".repeat(8);

function evidence(evidenceClass = "external-runtime") {
  return {
    version: 1,
    evidenceClass,
    checkpoint: {
      chainId: "materios-preprod",
      genesisHash: H,
      blockHash: H,
      blockNumber: "100"
    },
    authorityTransition: {
      kind: "materios-authority-set-transition",
      protocolVersion: 1,
      chainId: "materios-preprod",
      genesisHash: H,
      genesisUtxo: UTXO,
      fromSetId: "1",
      fromAuthorities: [
        { publicKey: H, weight: "1" }
      ],
      sidechainEpoch: "7",
      authoritySelectionRegime: {
        kind: "l1-ariadne",
        evidenceHash: H
      },
      selectionInputs: "aa",
      selectionInputsHash: H,
      proofSystem: "external-execution-proof/v1",
      toAuthorities: [
        { publicKey: "33".repeat(32), weight: "1" }
      ],
      activationBlock: {
        hash: H,
        number: "100"
      },
      toSetId: "2",
      proofBytes: PROOF
    },
    executionProof: {
      version: 1,
      chainId: "materios-preprod",
      runtimeSpecVersion: 2409,
      blockHash: H,
      method: "SessionValidatorManagement::set",
      callData: "bb",
      result: "cc",
      proofSystem: "external-execution-proof/v1",
      proofBytes: PROOF,
      proofCommitment: H
    },
    selectionCommitment: {
      blockHash: H,
      blockNumber: "100",
      selectionInputsHash: H
    }
  };
}

describe("Materios evidence adapter", () => {
  it("decodes only explicitly external-runtime evidence", () => {
    const decoded = decodeMateriosEvidence(evidence());
    expect(decoded.evidenceClass).toBe("external-runtime");
    expect(decoded.checkpoint.blockNumber).toBe(100n);
  });

  it("rejects synthetic/fixture evidence at the live boundary", () => {
    expect(() => decodeMateriosEvidence(evidence("synthetic-fixture"))).toThrow(
      "NON_RUNTIME_MATERIOS_EVIDENCE"
    );
  });

  it("rejects malformed execution proof bytes", () => {
    const value = evidence();
    value.executionProof.proofBytes = "";
    expect(() => decodeMateriosEvidence(value)).toThrow(
      "INVALID_EXECUTION_PROOF_BYTES"
    );
  });

  it("rejects block hashes with the wrong length", () => {
    const value = evidence();
    value.executionProof.blockHash = "aa";
    expect(() => decodeMateriosEvidence(value)).toThrow(
      "INVALID_EXECUTION_PROOF_BLOCK_HASH"
    );
  });

  it("rejects malformed exact block numbers", () => {
    const value = evidence();
    value.checkpoint.blockNumber = "not-a-number";
    expect(() => decodeMateriosEvidence(value)).toThrow(
      "INVALID_CHECKPOINT_BLOCK_NUMBER"
    );
  });

  it("has an explicit raw-input size guard", () => {
    expect(() => assertMateriosEvidenceJsonSize("x".repeat(32 * 1024 * 1024 + 1)))
      .toThrow("MATERIOS_EVIDENCE_TOO_LARGE");
  });
});
