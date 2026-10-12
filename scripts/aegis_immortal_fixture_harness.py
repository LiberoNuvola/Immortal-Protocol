#!/usr/bin/env python3
"""Validate the arithmetic and declared invariants in Aegis V8 bridge fixtures.

This is a fixture-consistency harness, NOT an Aiken interpreter or validator test.
It must never be reported as evidence that an on-chain transaction passes.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

FIXTURE_DIR = Path(__file__).resolve().parents[1] / "docs" / "research" / "fixtures"
SCHEMA = "aegis-immortal-v8-accounting-fixture-v1"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def check_single(path: Path, data: dict) -> int:
    fid = data.get("fixture_id", path.stem)
    require(data.get("schema") == SCHEMA, f"{fid}: unsupported/missing schema")
    args = data.get("predicate_arguments", {})
    pre = data.get("pre_state", {})
    post = data.get("post_state", {})
    checks = data.get("derived_checks", {})
    expected = data.get("expected", {})
    predicate = data.get("source", {}).get("predicate")
    count = 0

    if predicate == "underwrite_ok":
        cont = args["own_lovelace"] + args["net_growth"] - args["coverage"]
        require(cont == args["cont_lovelace"], f"{fid}: continuation equation mismatch")
        require(cont == checks["continuation_equation"]["expected"], f"{fid}: declared continuation expected mismatch")
        require(max(0, cont - args["min_utxo"] - pre["reserve"]) == checks["post_backing"]["expected"],
                f"{fid}: post backing mismatch")
        backing = max(0, cont - args["min_utxo"] - pre["reserve"])
        pool_total = backing + post["active_coverage"]
        require(pool_total == checks["post_pool_total"]["expected"], f"{fid}: pool total mismatch")
        require(post["active_coverage"] * 3 <= pool_total, f"{fid}: accumulation cap violated")
        require(args["policy_lovelace"] >= args["coverage"], f"{fid}: policy funding insufficient")
        require(post["active_coverage"] == pre["active_coverage"] + args["coverage"], f"{fid}: active coverage delta mismatch")
        require(post["reserve"] == pre["reserve"], f"{fid}: reserve changed on Underwrite")
        require(args["marker_minted"] == 1, f"{fid}: marker mint mismatch")
        require(expected.get("aegis_underwrite_ok") is True, f"{fid}: expected predicate result must be true")
        count += 8

    elif predicate == "claim_ok":
        payout = args["payout"]
        require(payout == args["policy_coverage"], f"{fid}: payout differs from policy coverage")
        require(args["cont_lovelace"] == args["own_lovelace"] + args["policy_lovelace"] - payout,
                f"{fid}: continuation equation mismatch")
        require(post["active_coverage"] == pre["active_coverage"] - payout, f"{fid}: active coverage delta mismatch")
        draw = min(payout, pre["reserve"])
        require(post["reserve"] == pre["reserve"] - draw, f"{fid}: reserve-first delta mismatch")
        require(post["lp_supply"] == pre["lp_supply"], f"{fid}: LP supply changed on Claim")
        require(args["marker_minted"] == -1, f"{fid}: marker burn mismatch")
        require(expected.get("aegis_claim_ok") is True, f"{fid}: expected predicate result must be true")
        count += 6

    elif predicate == "expire_ok":
        coverage = args["coverage"]
        require(coverage > 0 and coverage <= pre["active_coverage"], f"{fid}: invalid expiry coverage")
        require(args["cont_lovelace"] == args["own_lovelace"] + args["policy_lovelace"],
                f"{fid}: continuation equation mismatch")
        require(post["active_coverage"] == pre["active_coverage"] - coverage, f"{fid}: active coverage delta mismatch")
        require(post["reserve"] == pre["reserve"], f"{fid}: reserve changed on Expire")
        require(post["lp_supply"] == pre["lp_supply"], f"{fid}: LP supply changed on Expire")
        require(args["marker_minted"] == -1, f"{fid}: marker burn mismatch")
        require(expected.get("aegis_expire_ok") is True, f"{fid}: expected predicate result must be true")
        count += 6
    else:
        raise AssertionError(f"{fid}: unknown predicate {predicate!r}")

    require(expected.get("immortal_projection") == "UNVERIFIABLE",
            f"{fid}: projection must remain UNVERIFIABLE until profile approval")
    return count


def check_adversarial(path: Path, data: dict) -> int:
    require(data.get("schema") == SCHEMA, f"{path.name}: unsupported/missing schema")
    cases = data.get("cases")
    require(isinstance(cases, list) and cases, f"{path.name}: cases missing")
    for case in cases:
        cid = case["case_id"]
        args = case["predicate_arguments"]
        if case["predicate"] == "claim_ok":
            require(args["payout"] != args["policy_coverage"],
                    f"{cid}: fixture no longer violates payout equality")
        elif case["predicate"] == "expire_ok":
            require(args["cont_lovelace"] != args["own_lovelace"] + args["policy_lovelace"],
                    f"{cid}: fixture no longer violates continuation equation")
        else:
            raise AssertionError(f"{cid}: unsupported adversarial predicate")
        require(case["expected"] == "REJECT", f"{cid}: expected result must be REJECT")
    return len(cases)


def main() -> int:
    files = sorted(FIXTURE_DIR.glob("AEGIS-V8-*.json"))
    if not files:
        print(f"FAIL: no fixtures found under {FIXTURE_DIR}", file=sys.stderr)
        return 1

    checks = 0
    cases = 0
    failures = []
    for path in files:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if "cases" in data:
                n = check_adversarial(path, data)
                cases += n
                print(f"PASS fixture structure/invariant intent: {path.name} ({n} adversarial cases)")
            else:
                n = check_single(path, data)
                checks += n
                cases += 1
                print(f"PASS fixture arithmetic/declared invariants: {path.name} ({n} checks)")
        except (AssertionError, KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
            failures.append((path.name, str(exc)))
            print(f"FAIL: {path.name}: {exc}", file=sys.stderr)

    if failures:
        print(f"RESULT: FAIL ({len(failures)} fixture file(s) failed)", file=sys.stderr)
        return 1
    print(f"RESULT: PASS — {cases} fixture(s)/case(s), {checks} arithmetic/invariant checks.")
    print("SCOPE: fixture consistency only; no Aiken execution, full-validator evaluation, or IMMORTAL mapping.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
