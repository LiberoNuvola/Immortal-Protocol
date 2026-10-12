#!/usr/bin/env python3
"""Offline, illustrative Aegis/IMMORTAL adaptive-admission experiment.

NOT production economics, NOT an Aiken interpreter, NOT a transaction test.
All policy thresholds are experiment-only and require explicit approval before
any production use. This script tests the shape of the decision interface and
compares it to Aegis's source-inspected fixed 33% local cap.
"""
from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path

FIXED_CAP = 0.33


@dataclass(frozen=True)
class Scenario:
    name: str
    active_coverage: float
    pool_total_after: float
    reserve_adequacy: float
    capital_headroom: float
    stress: str
    evidence_valid: bool
    expected_dynamic_cap: float
    expected_dynamic_accept: bool
    expected_fixed_accept: bool
    rationale: str


def adaptive_cap(s: Scenario) -> tuple[float, str]:
    """Illustrative policy table only; values are not approved economics."""
    if not s.evidence_valid:
        return 0.0, "fail-closed: economic evidence invalid or incomplete"
    if s.reserve_adequacy < 1.0:
        return 0.15, "contract: reserve adequacy below experiment floor"
    if s.stress == "high":
        return 0.15, "contract: high stress"
    if s.reserve_adequacy >= 1.5 and s.capital_headroom >= 1.5 and s.stress == "low":
        return 0.40, "expand: strong reserve and capital headroom, low stress"
    if s.reserve_adequacy >= 1.2 and s.capital_headroom >= 1.2 and s.stress != "high":
        return 0.33, "normal: adequate reserve and capital headroom"
    return 0.25, "cautious: conditions do not justify expansion"


def recover_cap(current_cap: float, candidate_cap: float, consecutive_safe: int,
               required_safe: int = 2, step: float = 0.08) -> tuple[float, str]:
    """Illustrative hysteresis: contract immediately, recover gradually."""
    if candidate_cap < current_cap:
        return candidate_cap, "immediate contraction"
    if candidate_cap <= current_cap:
        return current_cap, "no expansion required"
    if consecutive_safe < required_safe:
        return current_cap, "recovery held: insufficient consecutive safe observations"
    return round(min(candidate_cap, current_cap + step), 6), "staged recovery: one bounded step"


def run_case(s: Scenario) -> dict:
    # The ratio uses the proposed post-transition aggregate denominator supplied
    # by the fixture. This is not a substitute for reproducing Aegis's predicate.
    ratio = s.active_coverage / s.pool_total_after if s.pool_total_after > 0 else float("inf")
    fixed_accept = ratio <= FIXED_CAP
    cap, reason = adaptive_cap(s)
    dynamic_accept = ratio <= cap
    return {
        "scenario": s.name,
        "post_transition_coverage_ratio": round(ratio, 6) if ratio != float("inf") else None,
        "fixed_cap": FIXED_CAP,
        "fixed_accept": fixed_accept,
        "illustrative_dynamic_cap": cap,
        "dynamic_accept": dynamic_accept,
        "dynamic_reason": reason,
        "rationale": s.rationale,
    }


CASES = [
    Scenario("favourable_capacity", 36, 100, 1.7, 1.8, "low", True, .40, True, False,
             "Illustrates additional capacity when both reserve and capital headroom are strong."),
    Scenario("ordinary_boundary", 30, 100, 1.3, 1.3, "medium", True, .33, True, True,
             "Normal conditions preserve the existing 33% comparison point."),
    Scenario("stress_below_fixed_cap", 28, 100, 1.1, 1.1, "high", True, .15, False, True,
             "Illustrates a dynamic rejection even where the fixed local cap would accept."),
    Scenario("reserve_inadequate", 20, 100, .8, 1.4, "low", True, .15, False, True,
             "Capital headroom alone cannot override insufficient reserve adequacy."),
    Scenario("stale_or_missing_evidence", 10, 100, 1.8, 1.8, "low", False, 0.0, False, True,
             "Fail-closed when authoritative economic evidence is not qualified."),
    Scenario("capital_headroom_weak", 27, 100, 1.1, .9, "medium", True, .25, False, True,
             "Contraction when capital headroom is weak."),
    Scenario("adverse_ratio", 38, 100, 1.7, 1.8, "low", True, .40, False, False,
             "Even favourable state cannot admit a transition exceeding its adaptive cap."),
]


def main() -> None:
    results = [run_case(c) for c in CASES]
    by_name = {r["scenario"]: r for r in results}
    for c in CASES:
        r = by_name[c.name]
        assert r["illustrative_dynamic_cap"] == c.expected_dynamic_cap, c.name
        assert r["dynamic_accept"] is c.expected_dynamic_accept, c.name
        assert r["fixed_accept"] is c.expected_fixed_accept, c.name

    favourable = by_name["favourable_capacity"]
    stress = by_name["stress_below_fixed_cap"]
    invalid = by_name["stale_or_missing_evidence"]
    assert favourable["dynamic_accept"] and not favourable["fixed_accept"]
    assert not stress["dynamic_accept"] and stress["fixed_accept"]
    assert invalid["illustrative_dynamic_cap"] == 0 and not invalid["dynamic_accept"]

    # Hysteresis/recovery checks: immediate contraction, no one-snapshot rebound,
    # then a bounded step after repeated safe observations.
    contraction = recover_cap(0.33, 0.15, 0)
    held_recovery = recover_cap(0.15, 0.40, 1)
    staged_recovery = recover_cap(0.15, 0.40, 2)
    assert contraction[0] == 0.15 and contraction[1] == "immediate contraction"
    assert held_recovery[0] == 0.15
    assert staged_recovery[0] == 0.23

    report = {
        "schema": "aegis-immortal-adaptive-admission-experiment-v1",
        "classification": "ILLUSTRATIVE_OFFCHAIN_EXPERIMENT_NOT_PRODUCTION_POLICY",
        "fixed_cap_source": "Aegis V8 source-inspected local 33% cap; source commit documented in bridge",
        "dynamic_policy": "experiment-only thresholds; not approved or proposed as production constants",
        "case_count": len(results),
        "checks_passed": 3 * len(CASES) + 6,
        "hysteresis_checks": {
            "contraction": {"cap": contraction[0], "reason": contraction[1]},
            "single_safe_observation": {"cap": held_recovery[0], "reason": held_recovery[1]},
            "two_safe_observations": {"cap": staged_recovery[0], "reason": staged_recovery[1]},
            "classification": "illustrative mechanism only; thresholds and recovery cadence unapproved",
        },
        "results": results,
        "limits": [
            "No Aiken predicate or Cardano transaction was executed.",
            "Scenario inputs are synthetic and are not authenticated Aegis observations.",
            "The ratio fixture is a comparison abstraction, not a reimplementation of Aegis underwrite_ok.",
            "No production safety, profitability, or deployment claim follows from this experiment.",
        ],
    }
    out = Path("aegis-immortal-adaptive-experiment-report.json")
    out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"PASS: {len(results)} scenarios; {report['checks_passed']} assertions")
    print(f"Report: {out}")
    for r in results:
        print(f"{r['scenario']}: fixed={r['fixed_accept']} dynamic={r['dynamic_accept']} "
              f"cap={r['illustrative_dynamic_cap']:.0%} ({r['dynamic_reason']})")


if __name__ == "__main__":
    main()
