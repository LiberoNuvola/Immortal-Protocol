#!/usr/bin/env python3
"""Synthetic cross-transition contract test for IMMORTAL's existing EconomicGate.

This mirrors the visible predicate interface for research fixtures only. It
does not execute Haskell/Plutus, establish a profile mapping, or prove adapter
conformance. Candidate post-states are synthetic and transition deltas are not
normative application semantics.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
import json
from pathlib import Path


@dataclass(frozen=True)
class State:
    crystallized_liabilities: int = 0
    unresolved_reserve: int = 0
    unresolved_ticket_count: int = 0
    worst_case_exposure: int = 0
    safety_capital: int = 0
    reserve_protection: int = 0
    mandatory_future_costs: int = 0
    additional_protected_capital: int = 0

    def protected_capital(self) -> int:
        return (
            self.crystallized_liabilities + self.worst_case_exposure
            + self.safety_capital + self.reserve_protection
            + self.mandatory_future_costs + self.additional_protected_capital
        )

    def non_negative(self) -> bool:
        return all(v >= 0 for v in asdict(self).values())

    def solvency(self, eev: int) -> bool:
        return eev >= 0 and self.non_negative() and eev >= self.protected_capital()


@dataclass(frozen=True)
class GateInput:
    authoritative_truth_verified: bool
    eev_fresh: bool
    obligations_complete: bool
    eev: int
    available_liquidity: int
    required_liquidity: int
    safe_post_state: bool
    all_successors_in_certified_kernel: bool


@dataclass(frozen=True)
class Case:
    name: str
    transition: str
    candidate: State
    gate: GateInput
    expected_economic_gate: bool
    expected_execution_admissible: bool
    explanation: str


def evaluate(candidate: State, g: GateInput) -> dict:
    checks = {
        "authoritative_truth_verified": g.authoritative_truth_verified,
        "eev_fresh": g.eev_fresh,
        "obligations_complete": g.obligations_complete,
        "available_liquidity_nonnegative": g.available_liquidity >= 0,
        "required_liquidity_nonnegative": g.required_liquidity >= 0,
        "required_liquidity_within_available": g.required_liquidity <= g.available_liquidity,
        "candidate_solvency": candidate.solvency(g.eev),
        "safe_post_state": g.safe_post_state,
        "all_successors_in_certified_kernel": g.all_successors_in_certified_kernel,
    }
    economic_gate = all(checks[k] for k in list(checks)[:7])
    viability_gate = g.safe_post_state and g.all_successors_in_certified_kernel
    return {
        "economic_gate": economic_gate,
        "viability_gate": viability_gate,
        "execution_admissible": economic_gate and viability_gate,
        "failed_checks": [k for k, passed in checks.items() if not passed],
        "protected_capital": candidate.protected_capital(),
        "eev": g.eev,
        "headroom": g.eev - candidate.protected_capital(),
        "checks": checks,
    }


BASE = State(
    crystallized_liabilities=10, unresolved_reserve=5, unresolved_ticket_count=2,
    worst_case_exposure=20, safety_capital=5, reserve_protection=5,
    mandatory_future_costs=3, additional_protected_capital=2,
)
GOOD = GateInput(True, True, True, 60, 20, 10, True, True)

CASES = [
    Case("underwrite_safe_candidate", "underwrite", BASE, GOOD, True, True,
         "Synthetic post-state inside the declared protected-capital boundary."),
    Case("underwrite_exposure_over_economic_value", "underwrite",
         State(10, 5, 3, 40, 5, 5, 3, 2),
         GateInput(True, True, True, 60, 20, 10, True, True), False, False,
         "Increased worst-case exposure makes ProtectedCapital exceed EEV."),
    Case("claim_requires_unavailable_liquidity", "claim", BASE,
         GateInput(True, True, True, 60, 4, 8, True, True), False, False,
         "A solvent candidate still fails the separate immediate-liquidity condition."),
    Case("expire_no_immediate_liquidity", "expire", BASE,
         GateInput(True, True, True, 60, 0, 0, True, True), True, True,
         "A zero-immediate-liquidity action is not forced to show positive surplus."),
    Case("claim_stale_eev", "claim", BASE,
         GateInput(True, False, True, 60, 20, 10, True, True), False, False,
         "Stale EEV evidence blocks admission."),
    Case("expire_incomplete_obligations", "expire", BASE,
         GateInput(True, True, False, 60, 0, 0, True, True), False, False,
         "An incomplete obligation inventory blocks admission."),
    Case("safe_economic_gate_but_viability_unproven", "underwrite", BASE,
         GateInput(True, True, True, 60, 20, 10, True, False), True, False,
         "Immediate economic safety alone is insufficient when successor closure is not established."),
    Case("negative_state_component", "claim",
         State(10, 5, 2, -1, 5, 5, 3, 2), GOOD, False, False,
         "The universal state predicate rejects a negative component."),
    Case("unverified_authoritative_truth", "underwrite", BASE,
         GateInput(False, True, True, 60, 20, 10, True, True), False, False,
         "The gate does not manufacture truth; missing verification fails closed."),
]


def main() -> None:
    results = []
    for c in CASES:
        result = evaluate(c.candidate, c.gate)
        assert result["economic_gate"] is c.expected_economic_gate, (c.name, result)
        assert result["execution_admissible"] is c.expected_execution_admissible, (c.name, result)
        result.update({"scenario": c.name, "transition_family": c.transition, "explanation": c.explanation})
        results.append(result)

    # Explicitly verify that the gate accepts zero required liquidity for an
    # expiry-like action, and that execution admissibility adds the viability gate.
    assert next(r for r in results if r["scenario"] == "expire_no_immediate_liquidity")["economic_gate"]
    assert not next(r for r in results if r["scenario"] == "safe_economic_gate_but_viability_unproven")["execution_admissible"]

    report = {
        "schema": "immortal-economic-gate-cross-transition-contract-test-v1",
        "classification": "SYNTHETIC_PYTHON_MIRROR_NOT_HASKELL_OR_PLUTUS_EXECUTION",
        "case_count": len(results),
        "assertions_passed": 2 * len(CASES) + 2,
        "reference_contract": [
            "EconomicGate.economicGate",
            "EconomicGate.viabilityGate",
            "EconomicGate.executionAdmissible",
            "UniversalEconomicKernel.protectedCapital",
            "UniversalEconomicKernel.nonNegativeState",
            "UniversalEconomicKernel.solvencyInvariant",
        ],
        "transition_families": ["underwrite", "claim", "expire"],
        "results": results,
        "limits": [
            "Python mirrors the inspected predicate shape; Haskell/Plutus was not executed.",
            "All states and values are synthetic and do not represent Aegis datum fields.",
            "Transition-family labels do not define application-specific transition semantics.",
            "No adapter conformance, production safety, or deployment claim follows.",
        ],
    }
    out = Path("immortal-economic-gate-cross-transition-report.json")
    out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"PASS: {len(results)} cases; {report['assertions_passed']} assertions")
    for r in results:
        print(f"{r['scenario']}: economic={r['economic_gate']} execution={r['execution_admissible']} failed={','.join(r['failed_checks']) or 'NONE'}")
    print(f"Report: {out}")


if __name__ == "__main__":
    main()
