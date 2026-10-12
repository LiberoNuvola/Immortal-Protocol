#!/usr/bin/env python3
"""IMMORTAL multi-invariant economic admission prototype.

Offline synthetic experiment only. Not production economics, not an Aiken
interpreter, not a Cardano transaction test, and not a mapping of Aegis datum
fields. Policy thresholds are illustrative and unapproved.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
import json
from pathlib import Path

FIXED_LOCAL_CAP = 0.33


@dataclass(frozen=True)
class EconomicState:
    name: str
    qualified_assets: float
    protected_capital: float  # includes the reserve component; never subtract reserve twice
    reserve_component: float
    reserve_floor: float
    existing_coverage: float
    proposed_coverage: float
    dynamic_cap: float
    evidence_qualified: bool
    stress: str
    expected_accept: bool
    expected_reasons: tuple[str, ...]


def evaluate(s: EconomicState) -> dict:
    reasons: list[str] = []
    if not s.evidence_qualified:
        reasons.append("EVIDENCE_NOT_QUALIFIED")
    numeric = (
        s.qualified_assets, s.protected_capital, s.reserve_component,
        s.reserve_floor, s.existing_coverage, s.proposed_coverage, s.dynamic_cap,
    )
    if any(v < 0 for v in numeric):
        reasons.append("NEGATIVE_ECONOMIC_INPUT")
    if s.qualified_assets <= 0:
        reasons.append("NO_QUALIFIED_ASSET_BASE")
    if s.reserve_component < s.reserve_floor:
        reasons.append("RESERVE_FLOOR_BREACH")
    total_coverage = s.existing_coverage + s.proposed_coverage
    if s.qualified_assets > 0 and total_coverage / s.qualified_assets > s.dynamic_cap:
        reasons.append("DYNAMIC_COVERAGE_LIMIT_BREACH")
    # protected_capital already includes reserve_component. Do not subtract the
    # reserve again; this makes the no-double-counting convention explicit.
    post_admission_headroom = (
        s.qualified_assets - s.protected_capital - total_coverage
    )
    if post_admission_headroom < 0:
        reasons.append("PROTECTED_CAPITAL_OR_OBLIGATION_SHORTFALL")
    if s.stress == "high" and s.proposed_coverage > 0 and s.dynamic_cap > 0.15:
        reasons.append("HIGH_STRESS_CAP_NOT_CONTRACTED")
    accepted = not reasons
    fixed_ratio = total_coverage / s.qualified_assets if s.qualified_assets > 0 else None
    fixed_accept = (
        fixed_ratio is not None
        and fixed_ratio <= FIXED_LOCAL_CAP
        and s.evidence_qualified
    )
    return {
        "scenario": s.name,
        "accepted": accepted,
        "reasons": reasons,
        "qualified_assets": s.qualified_assets,
        "protected_capital_including_reserve": s.protected_capital,
        "reserve_component_not_subtracted_twice": s.reserve_component,
        "total_coverage_after_admission": total_coverage,
        "post_admission_headroom": post_admission_headroom,
        "coverage_ratio": fixed_ratio,
        "fixed_33_percent_comparison_accept": fixed_accept,
        "dynamic_cap": s.dynamic_cap,
    }


CASES = [
    EconomicState("favourable_incremental_capacity", 100, 30, 15, 10, 20, 15, .40, True, "low", True, ()),
    EconomicState("fixed_cap_passes_but_reserve_floor_fails", 100, 25, 8, 10, 10, 5, .33, True, "low", False, ("RESERVE_FLOOR_BREACH",)),
    EconomicState("fixed_cap_passes_but_protected_capital_fails", 100, 70, 15, 10, 20, 15, .33, True, "low", False, ("PROTECTED_CAPITAL_OR_OBLIGATION_SHORTFALL",)),
    EconomicState("fixed_cap_passes_but_dynamic_cap_fails", 100, 30, 15, 10, 20, 15, .30, True, "medium", False, ("DYNAMIC_COVERAGE_LIMIT_BREACH",)),
    EconomicState("high_stress_requires_contracted_cap", 100, 30, 15, 10, 10, 10, .25, True, "high", False, ("HIGH_STRESS_CAP_NOT_CONTRACTED",)),
    EconomicState("unqualified_evidence", 100, 30, 15, 10, 10, 5, .40, False, "low", False, ("EVIDENCE_NOT_QUALIFIED",)),
    EconomicState("all_invariants_pass", 100, 30, 15, 10, 20, 10, .33, True, "medium", True, ()),
    EconomicState("negative_input", 100, 30, 15, 10, 20, -1, .33, True, "low", False, ("NEGATIVE_ECONOMIC_INPUT",)),
    EconomicState("no_qualified_assets", 0, 0, 0, 0, 0, 0, .33, True, "low", False, ("NO_QUALIFIED_ASSET_BASE",)),
]


def main() -> None:
    results = [evaluate(s) for s in CASES]
    by_name = {r["scenario"]: r for r in results}
    checks = 0
    for s in CASES:
        r = by_name[s.name]
        assert r["accepted"] is s.expected_accept, (s.name, r)
        checks += 1
        for reason in s.expected_reasons:
            assert reason in r["reasons"], (s.name, reason, r["reasons"])
            checks += 1
    # A meaningful differential: local ratio passes, combined IMMORTAL-like
    # economic gate rejects because reserve/protected-capital constraints fail.
    assert by_name["fixed_cap_passes_but_reserve_floor_fails"]["fixed_33_percent_comparison_accept"]
    assert not by_name["fixed_cap_passes_but_reserve_floor_fails"]["accepted"]
    checks += 1
    assert by_name["favourable_incremental_capacity"]["accepted"]
    assert not by_name["favourable_incremental_capacity"]["fixed_33_percent_comparison_accept"]
    checks += 1
    # Reserve is a component of protected_capital and is not subtracted twice.
    r = by_name["all_invariants_pass"]
    assert r["post_admission_headroom"] == 100 - 30 - (20 + 10)
    checks += 1

    report = {
        "schema": "immortal-multi-invariant-admission-prototype-v1",
        "classification": "SYNTHETIC_OFFCHAIN_EXPERIMENT_NOT_PRODUCTION_POLICY",
        "scenario_count": len(results),
        "assertions_passed": checks,
        "accounting_convention": "protected_capital includes reserve_component; reserve is checked against floor but not subtracted twice",
        "results": results,
        "limitations": [
            "Synthetic state; no authenticated on-chain data.",
            "No Aiken validator or Cardano transaction executed.",
            "The 33% comparison is an abstract local-cap baseline, not a reimplementation of Aegis underwrite_ok.",
            "No production thresholds, field mapping, safety, profitability, or integration claim is established.",
        ],
    }
    target = Path("immortal-multi-invariant-admission-report.json")
    target.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"PASS: {len(results)} scenarios; {checks} assertions")
    for r in results:
        print(f"{r['scenario']}: accepted={r['accepted']} fixed_compare={r['fixed_33_percent_comparison_accept']} reasons={','.join(r['reasons']) or 'NONE'}")
    print(f"Report: {target}")


if __name__ == "__main__":
    main()
