import { describe, expect, it } from "vitest";
import {
  decodeAuthorityListHex,
  decodeFrnkDigestLog,
  decodeU64LeHex
} from "../src/scan-grandpa-digest-history.mjs";

function compact(value) {
  if (value < 64) return Buffer.from([value << 2]);
  if (value < 16384) {
    const v = (value << 2) | 1;
    return Buffer.from([v & 255, (v >> 8) & 255]);
  }
  throw new Error("test compact too large");
}

function authorityList(publicKey, weight = 1n) {
  const key = Buffer.from(publicKey, "hex");
  const w = Buffer.alloc(8);
  w.writeBigUInt64LE(weight);
  return Buffer.concat([compact(1), key, w]);
}

function frnkLog(payload) {
  return "0x" + Buffer.concat([
    Buffer.from([4]),
    Buffer.from("FRNK", "ascii"),
    compact(payload.length),
    payload
  ]).toString("hex");
}

describe("GRANDPA digest history SCALE decoder", () => {
  const key = "11".repeat(32);

  it("decodes CurrentSetId as little-endian u64", () => {
    expect(decodeU64LeHex("0x5211000000000000")).toBe(4434n);
  });

  it("decodes the runtime authority list", () => {
    const raw = "0x04" + key + "0100000000000000";
    expect(decodeAuthorityListHex(raw)).toEqual([
      { public_key: "0x" + key, weight: "1" }
    ]);
  });

  it("decodes a ScheduledChange digest and its authority list", () => {
    const payload = Buffer.concat([
      Buffer.from([1]),
      authorityList(key),
      Buffer.from([0, 0, 0, 0])
    ]);
    expect(decodeFrnkDigestLog(frnkLog(payload))).toEqual({
      kind: "ScheduledChange",
      delay: 0,
      authorities: [{ public_key: "0x" + key, weight: "1" }]
    });
  });

  it("decodes a ForcedChange digest with median and delay", () => {
    const median = Buffer.alloc(4);
    median.writeUInt32LE(1234);
    const delay = Buffer.alloc(4);
    delay.writeUInt32LE(5);
    const payload = Buffer.concat([
      Buffer.from([2]),
      median,
      authorityList(key, 7n),
      delay
    ]);
    expect(decodeFrnkDigestLog(frnkLog(payload))).toEqual({
      kind: "ForcedChange",
      median_last_finalized: 1234,
      delay: 5,
      authorities: [{ public_key: "0x" + key, weight: "7" }]
    });
  });

  it("decodes OnDisabled, Pause and Resume logs", () => {
    const disabled = Buffer.alloc(4);
    disabled.writeUInt32LE(2);
    const delay = Buffer.alloc(4);
    delay.writeUInt32LE(9);
    expect(decodeFrnkDigestLog(frnkLog(Buffer.concat([Buffer.from([3]), disabled]))))
      .toEqual({ kind: "OnDisabled", authority_index: 2 });
    expect(decodeFrnkDigestLog(frnkLog(Buffer.concat([Buffer.from([4]), delay]))))
      .toEqual({ kind: "Pause", delay: 9 });
    expect(decodeFrnkDigestLog(frnkLog(Buffer.concat([Buffer.from([5]), delay]))))
      .toEqual({ kind: "Resume", delay: 9 });
  });

  it("ignores non-FRNK digest items", () => {
    expect(decodeFrnkDigestLog("0x066175726100")).toBeNull();
  });
});
