#!/usr/bin/env python3
"""Cross-transition synthetic tests for IMMORTAL's universal kernel.

This mirrors only the kernel predicates present on b1-hardening:
protectedCapital, rawSurplus, nonNegativeState, solvencyInvariant.
EconomicGate.hs is not present in the b1-hardening cabal module inventory, so
this test deliberately does not claim to execute or mirror that separate gate.
It is not Haskell/Plutus execution, adapter conformance, or production evidence.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
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

    def raw_surplus(self, eev: int) -> int:
        return max(0, eev - self.protected_capital())

    def non_negative(self) -> bool:
        return all(v >= 0 for v in asdict(self).values())

    def solvency_invariant(self, eev: int) -> bool:
        return eev >= 0 and self.non_negative() and eev >= self.protected_capital()


@dataclass(frozen=True)
class Case:
    name: str
    transition_family: str
    state: State
    eev: int
    expected_solvent: bool
    expected_surplus: int
    explanation: str


BASE = State(10, 2, 1, 20, 5, 5, 3, 2)
CASES = [
    Case("underwrite_safe_candidate", "underwrite", BASE, 60, True, 15,
         "Protected capital is 45; unresolved reserve and ticket count are tracked but not components of ProtectedCapital in this kernel."),
    Case("claim_exact_solvency_boundary", "claim", BASE, 45, True, 0,
         "Exact EEV == ProtectedCapital is solvent; RawSurplus is zero."),
    Case("expire_below_protected_capital", "expire", BASE, 44, False, 0,
         "EEV below protected capital violates solvency."),
    Case("underwrite_negative_exposure", "underwrite",
         State(10, 2, 1, -1, 5, 5, 3, 2), 60, False, 36,
         "A negative state component fails nonNegativeState."),
    Case("claim_negative_eev", "claim", BASE, -1, False, 0,
         "Negative EEV fails solvency even when other state fields are valid."),
    Case("expire_all_zero", "expire", State(), 0, True, 0,
         "The zero state is non-negative and solvent at EEV zero."),
    Case("underwrite_surplus_clamped", "underwrite", BASE, 44, False, 0,
         "RawSurplus is clamped at zero; it does not make an insolvent state solvent."),
    Case("claim_extra_protected_cost", "claim",
         State(10, 2, 1, 20, 5, 5, 8, 2), 49, False, 0,
         "Increasing mandatory future costs raises ProtectedCapital from 45 to 50."),
    Case("expire_positive_surplus", "expire", BASE, 75, True, 30,
         "Surplus is EEV minus ProtectedCapital when positive."),
]


def main() -> None:
    results = []
    checks = 0
    for c in CASES:
        pc = c.state.protected_capital()
        surplus = c.state.raw_surplus(c.eev)
        nonnegative = c.state.non_negative()
        solvent = c.state.solvency_invariant(c.eev)
        assert solvent is c.expected_solvent, (c.name, solvent, pc)
        checks += 1
        assert surplus == c.expected_surplus, (c.name, surplus, c.expected_surplus)
        checks += 1
        assert nonnegative is all(v >= 0 for v in asdict(c.state).values())
        checks += 1
        # RawSurplus is not a solvency predicate: show the distinction explicitly.
        if c.eev < pc:
            assert surplus == 0 and not solvent
            checks += 1
        results.append({
            "scenario": c.name,
            "transition_family_label": c.transition_family,
            "protected_capital": pc,
            "eev": c.eev,
            "raw_surplus": surplus,
            "non_negative_state": nonnegative,
            "solvency_invariant": solvent,
            "explanation": c.explanation,
        })

    report = {
        "schema": "immortal-universal-kernel-cross-transition-contract-test-v2",
        "classification": "SYNTHETIC_PYTHON_MIRROR_NOT_HASKELL_PLUTUS_EXECUTION",
        "reference_branch": "b1-hardening",
        "reference_source": "IMMORTAL/kernel/UniversalEconomicKernel.hs and IMMORTAL/state/UniversalEconomicState.hs",
        "note": "EconomicGate.hs is not in the b1-hardening module inventory inspected for this test; only universal-kernel predicates are mirrored.",
        "case_count": len(results),
        "assertions_passed": checks,
        "results": results,
        "limits": [
            "Python mirrors the universal-kernel arithmetic; Haskell/Plutus was not executed.",
            "Transition-family labels are test labels, not definitions of application transition deltas.",
            "No Aegis field mapping, adapter conformance, production policy, or deployment claim follows.",
        ],
    }
    out = Path("immortal-economic-gate-cross-transition-report.json")
    out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"PASS: {len(results)} cases; {checks} assertions")
    for r in results:
        print(f"{r['scenario']}: PC={r['protected_capital']} EEV={r['eev']} surplus={r['raw_surplus']} solvent={r['solvency_invariant']}")
    print(f"Report: {out}")


if __name__ == "__main__":
    main()
