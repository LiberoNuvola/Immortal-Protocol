import { describe, expect, it } from "vitest";
import {
  createMateriosEvidenceAdapter,
  decodeMateriosEvidence,
  assertMateriosEvidenceJsonSize
} from "../src/materios-evidence-adapter.js";
import { hashSelectionInputs } from "../src/authority-transition.js";

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

  it("fails closed when the injected execution proof verifier rejects", async () => {
    const adapter = createMateriosEvidenceAdapter();
    const decoded = decodeMateriosEvidence(evidence());
    const selectionHash = hashSelectionInputs(decoded.authorityTransition.selectionInputs);
    const bound = {
      ...decoded,
      authorityTransition: {
        ...decoded.authorityTransition,
        selectionInputsHash: selectionHash
      },
      selectionCommitment: {
        ...decoded.selectionCommitment,
        selectionInputsHash: selectionHash
      }
    };

    let executionVerifierCalled = false;

    await expect(
      adapter.verifyTransition(
        bound,
        { verify: () => true },
        {
          verify: () => {
            executionVerifierCalled = true;
            return false;
          }
        }
      )
    ).rejects.toThrow("EXECUTION_PROOF_NOT_VERIFIED");

    expect(executionVerifierCalled).toBe(true);
  });

  it("crosses both explicit proof boundaries only when both verifiers accept", async () => {
    const adapter = createMateriosEvidenceAdapter();
    const decoded = decodeMateriosEvidence(evidence());
    const selectionHash = hashSelectionInputs(decoded.authorityTransition.selectionInputs);
    const bound = {
      ...decoded,
      authorityTransition: {
        ...decoded.authorityTransition,
        selectionInputsHash: selectionHash
      },
      selectionCommitment: {
        ...decoded.selectionCommitment,
        selectionInputsHash: selectionHash
      }
    };

    const verified = await adapter.verifyTransition(
      bound,
      { verify: () => true },
      { verify: () => true }
    );

    expect(verified.kind).toBe("verified-materios-authority-set-transition");
    expect(verified.__verifiedAuthoritySetTransition).toBe("verified");
  });

  it("has an explicit raw-input size guard", () => {
    expect(() => assertMateriosEvidenceJsonSize("x".repeat(32 * 1024 * 1024 + 1)))
      .toThrow("MATERIOS_EVIDENCE_TOO_LARGE");
  });
});
