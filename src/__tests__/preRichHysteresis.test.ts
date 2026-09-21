import { describe, expect, it } from "vitest";
import {
  PRE_RICH_HYSTERESIS_V1,
  evolvePreRichHysteresis,
  highestActivationEligibleClass,
  highestMaintainableClassAtOrBelow,
  isActivationEligible,
  isDistributionAdmissible,
  isMaintenanceEligible,
  validatePreRichHysteresisPolicy,
  type HysteresisClass,
} from "../preRichHysteresis";

const CLASSES: readonly HysteresisClass[] = [
  { id: 1, capacityCost: 10n },
  { id: 2, capacityCost: 20n },
  { id: 3, capacityCost: 40n },
  { id: 4, capacityCost: 100n },
];

describe("PRE-RICH hysteresis reference", () => {
  it("uses the closed 8/4/4 policy", () => {
    expect(PRE_RICH_HYSTERESIS_V1).toEqual({
      activationThreshold: 8n,
      maintenanceThreshold: 4n,
      distributionThreshold: 4n,
    });
    expect(() =>
      validatePreRichHysteresisPolicy(PRE_RICH_HYSTERESIS_V1),
    ).not.toThrow();
  });

  it("uses exact activation boundaries", () => {
    expect(isActivationEligible(800n, 100n)).toBe(true);
    expect(isActivationEligible(799n, 100n)).toBe(false);
  });

  it("uses exact maintenance boundaries", () => {
    expect(isMaintenanceEligible(400n, 100n)).toBe(true);
    expect(isMaintenanceEligible(399n, 100n)).toBe(false);
  });

  it("uses the KD distribution floor exactly", () => {
    expect(isDistributionAdmissible(400n, 100n)).toBe(true);
    expect(isDistributionAdmissible(399n, 100n)).toBe(false);
  });

  it("selects the highest activation-eligible class", () => {
    expect(highestActivationEligibleClass(640n, CLASSES)).toBe(3);
    expect(highestActivationEligibleClass(639n, CLASSES)).toBe(2);
  });

  it("selects direct contraction without traversing intermediate classes", () => {
    expect(highestMaintainableClassAtOrBelow(390n, CLASSES, 4)).toBe(3);
  });

  it("preserves an active class below its activation threshold while maintenance holds", () => {
    const result = evolvePreRichHysteresis(700n, CLASSES, {
      currentActiveClass: 4,
      highestClassEverActivated: 4,
    });
    expect(result.action).toBe("RETAIN");
    expect(result.currentActiveClass).toBe(4);
    expect(result.highestClassEverActivated).toBe(4);
  });

  it("upgrades directly when a higher class crosses activation", () => {
    const result = evolvePreRichHysteresis(800n, CLASSES, {
      currentActiveClass: 2,
      highestClassEverActivated: 2,
    });
    expect(result.action).toBe("UPGRADE");
    expect(result.currentActiveClass).toBe(4);
    expect(result.highestClassEverActivated).toBe(4);
  });

  it("does not upgrade merely because maintenance holds for a higher class", () => {
    const result = evolvePreRichHysteresis(160n, CLASSES, {
      currentActiveClass: 2,
      highestClassEverActivated: 2,
    });
    expect(result.action).toBe("RETAIN");
    expect(result.currentActiveClass).toBe(2);
    expect(result.highestClassEverActivated).toBe(2);
  });

  it("contracts directly to the highest maintainable lower class", () => {
    const result = evolvePreRichHysteresis(390n, CLASSES, {
      currentActiveClass: 4,
      highestClassEverActivated: 4,
    });
    expect(result.action).toBe("CONTRACT");
    expect(result.currentActiveClass).toBe(3);
    expect(result.highestClassEverActivated).toBe(4);
  });

  it("halts safely when no class is maintainable", () => {
    const result = evolvePreRichHysteresis(39n, CLASSES, {
      currentActiveClass: 4,
      highestClassEverActivated: 4,
    });
    expect(result.action).toBe("HALT");
    expect(result.currentActiveClass).toBeNull();
    expect(result.highestClassEverActivated).toBe(4);
  });

  it("rejects an invalid policy", () => {
    expect(() =>
      validatePreRichHysteresisPolicy({
        activationThreshold: 4n,
        maintenanceThreshold: 4n,
        distributionThreshold: 4n,
      }),
    ).toThrow();
  });

  it("rejects a state whose current class exceeds its historical maximum", () => {
    expect(() =>
      evolvePreRichHysteresis(800n, CLASSES, {
        currentActiveClass: 4,
        highestClassEverActivated: 3,
      }),
    ).toThrow();
  });
});
