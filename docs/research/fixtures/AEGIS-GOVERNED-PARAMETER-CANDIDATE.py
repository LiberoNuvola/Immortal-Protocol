#!/usr/bin/env python3
"""Apply a candidate AEGIS governed-parameter fix to a disposable checkout only.

The caller must run this against an ephemeral clone pinned to the expected
AEGIS commit. The script intentionally fails closed if source context changes.
It is not an upstream patch or a deployment tool.
"""
from __future__ import annotations

import argparse
from pathlib import Path
import sys


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


def read(root: Path, relative: str) -> str:
    path = root / relative
    if not path.is_file():
        raise RuntimeError(f"Missing expected source file: {path}")
    return path.read_text(encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True, type=Path,
                        help="contracts directory of the disposable AEGIS checkout")
    args = parser.parse_args()
    root = args.root.resolve()

    config = read(root, "aiken.toml")
    if 'compiler = "v1.1.22"' not in config:
        raise RuntimeError("Unexpected Aiken compiler pin; refusing candidate patch")

    pricing = read(root, "lib/aegis/pricing.ak")
    vault = read(root, "lib/aegis/vault.ak")
    pool_vault = read(root, "validators/pool_vault.ak")

    # 1. Expose an exact parameterized coverage/premium predicate while
    # preserving the old 50x helper for legacy default-profile unit tests.
    # Replace only the function definition, not its surrounding prose: exact
    # Unicode punctuation in upstream comments is intentionally left untouched.
    old_pricing = """pub fn is_ratio_acceptable(premium: Int, coverage: Int) -> Bool {
  premium > 0 && coverage <= premium * max_coverage_ratio
}
"""
    new_pricing = """pub fn is_ratio_acceptable(premium: Int, coverage: Int) -> Bool {
  is_ratio_acceptable_with_limit(premium, coverage, max_coverage_ratio)
}

/// Exact governed coverage/premium predicate used by the immutable vault.
/// Multiplication avoids integer-division truncation at the configured boundary.
pub fn is_ratio_acceptable_with_limit(
  premium: Int,
  coverage: Int,
  max_coverage_ratio_b: Int,
) -> Bool {
  premium > 0 && max_coverage_ratio_b > 0
    && coverage <= premium * max_coverage_ratio_b
}
"""
    pricing = replace_once(pricing, old_pricing, new_pricing, "pricing ratio predicate")

    # 2. Split the baseline API into the configured production predicate and a
    # compatibility wrapper for existing unit tests that model the default 50x.
    vault = replace_once(
        vault,
        "use aegis/pricing.{is_ratio_acceptable}",
        "use aegis/pricing.{is_ratio_acceptable, is_ratio_acceptable_with_limit}",
        "vault pricing import",
    )
    vault = replace_once(
        vault,
        "  max_policy_term_ms, max_reading_validity_ms, min_policy_term_ms, min_premium,",
        "  max_coverage_ratio, max_policy_term_ms, max_reading_validity_ms,\n"
        "  min_policy_term_ms, min_premium,",
        "vault default ratio import",
    )
    vault = replace_once(
        vault,
        "pub fn underwrite_baseline_ok(\n",
        "pub fn underwrite_baseline_ok_with_ratio(\n",
        "parameterized baseline function name",
    )
    vault = replace_once(
        vault,
        "  min_premium_b: Int,\n  term_min_ms: Int,\n  term_max_ms: Int,\n) -> Bool {",
        "  min_premium_b: Int,\n  term_min_ms: Int,\n  term_max_ms: Int,\n"
        "  max_coverage_ratio_b: Int,\n) -> Bool {",
        "parameterized baseline signature",
    )
    vault = replace_once(
        vault,
        "premium >= min_premium_b && is_ratio_acceptable(premium, coverage),",
        "premium >= min_premium_b && is_ratio_acceptable_with_limit(\n"
        "      premium,\n      coverage,\n      max_coverage_ratio_b,\n    ),",
        "governed ratio in baseline predicate",
    )
    baseline_wrapper = """/// Compatibility wrapper for default-profile unit tests and callers.
/// The validator production path uses underwrite_baseline_ok_with_ratio.
pub fn underwrite_baseline_ok(
  risk_class: RiskClass,
  resolved_spot: Int,
  resolved_min_12h: Int,
  strike: Int,
  premium: Int,
  coverage: Int,
  term_ms: Int,
  in_mandate: Bool,
  in_depeg_allowlist: Bool,
  min_premium_b: Int,
  term_min_ms: Int,
  term_max_ms: Int,
) -> Bool {
  underwrite_baseline_ok_with_ratio(
    risk_class,
    resolved_spot,
    resolved_min_12h,
    strike,
    premium,
    coverage,
    term_ms,
    in_mandate,
    in_depeg_allowlist,
    min_premium_b,
    term_min_ms,
    term_max_ms,
    max_coverage_ratio,
  )
}

"""
    vault = replace_once(
        vault,
        "pub fn underwrite_baseline_ok_with_ratio(\n",
        baseline_wrapper + "pub fn underwrite_baseline_ok_with_ratio(\n",
        "insert legacy baseline wrapper",
    )

    # 3. Parameterize the live-book cap while retaining the original exact
    # one-third helper semantics for the existing low-level accounting tests.
    vault = replace_once(
        vault,
        "///   cap:    post active_coverage * 3 <= post pool_total (the 33% book cap)\n"
        "pub fn underwrite_ok(\n"
        "  old: VaultState,\n"
        "  new: VaultState,\n"
        "  coverage: Int,\n"
        "  premium: Int,\n"
        "  net_growth: Int,\n"
        "  own_lovelace: Int,\n"
        "  cont_lovelace: Int,\n"
        "  marker_minted: Int,\n"
        "  policy_lovelace: Int,\n"
        "  min_utxo: Int,\n"
        ") -> Bool {",
        "///   cap: governed utilisation_bps in the production path; the legacy\n"
        "///         helper retains the original exact one-third boundary.\n"
        "fn underwrite_ok_internal(\n"
        "  old: VaultState,\n"
        "  new: VaultState,\n"
        "  coverage: Int,\n"
        "  premium: Int,\n"
        "  net_growth: Int,\n"
        "  own_lovelace: Int,\n"
        "  cont_lovelace: Int,\n"
        "  marker_minted: Int,\n"
        "  policy_lovelace: Int,\n"
        "  min_utxo: Int,\n"
        "  utilisation_bps: Int,\n"
        "  legacy_one_third: Bool,\n"
        ") -> Bool {",
        "parameterized accounting function header",
    )
    vault = replace_once(
        vault,
        "    // 33% accumulation cap (lifts pool.ak): the live book <= 1/3 of the total\n"
        "    nc * 3 <= post_total,",
        "    // Production uses the enacted registry bps; the legacy wrapper\n"
        "    // preserves the original exact one-third boundary for old unit tests.\n"
        "    if legacy_one_third {\n"
        "      nc * 3 <= post_total\n"
        "    } else {\n"
        "      utilisation_bps > 0 && nc * 10_000 <= post_total * utilisation_bps\n"
        "    },",
        "parameterized accounting cap expression",
    )
    accounting_wrappers = """/// Compatibility helper preserving the historic exact one-third cap for
/// existing low-level tests. The live validator calls the governed variant.
pub fn underwrite_ok(
  old: VaultState,
  new: VaultState,
  coverage: Int,
  premium: Int,
  net_growth: Int,
  own_lovelace: Int,
  cont_lovelace: Int,
  marker_minted: Int,
  policy_lovelace: Int,
  min_utxo: Int,
) -> Bool {
  underwrite_ok_internal(
    old, new, coverage, premium, net_growth, own_lovelace, cont_lovelace,
    marker_minted, policy_lovelace, min_utxo, 0, True,
  )
}

/// Production accounting predicate: applies the registry's enacted utilization
/// limit in basis points, with exact integer cross-multiplication.
pub fn underwrite_ok_with_utilisation(
  old: VaultState,
  new: VaultState,
  coverage: Int,
  premium: Int,
  net_growth: Int,
  own_lovelace: Int,
  cont_lovelace: Int,
  marker_minted: Int,
  policy_lovelace: Int,
  min_utxo: Int,
  utilisation_bps: Int,
) -> Bool {
  underwrite_ok_internal(
    old, new, coverage, premium, net_growth, own_lovelace, cont_lovelace,
    marker_minted, policy_lovelace, min_utxo, utilisation_bps, False,
  )
}

"""
    vault = replace_once(
        vault,
        "/// Version-independent claim TRIGGER",
        accounting_wrappers + "/// Version-independent claim TRIGGER",
        "insert accounting wrappers",
    )

    # 4. Route the registry values into the real Underwrite branch. The old
    # helpers remain imported for existing low-level unit tests below.
    pool_vault = replace_once(
        pool_vault,
        "  terms_match_datum, underwrite_baseline_ok, underwrite_ok,\n"
        "  waiting_period_pin_ok,\n",
        "  terms_match_datum, underwrite_baseline_ok, underwrite_baseline_ok_with_ratio,\n"
        "  underwrite_ok, underwrite_ok_with_utilisation, waiting_period_pin_ok,\n",
        "pool-vault imports",
    )
    pool_vault = replace_once(
        pool_vault,
        "let baseline = underwrite_baseline_ok(",
        "let baseline = underwrite_baseline_ok_with_ratio(",
        "production baseline call",
    )
    pool_vault = replace_once(
        pool_vault,
        "          budgets.min_premium,\n"
        "          budgets.term_min_ms,\n"
        "          budgets.term_max_ms,\n"
        "        )",
        "          budgets.min_premium,\n"
        "          budgets.term_min_ms,\n"
        "          budgets.term_max_ms,\n"
        "          budgets.max_coverage_ratio,\n"
        "        )",
        "pass registry ratio in production call",
    )
    pool_vault = replace_once(
        pool_vault,
        "let acct = underwrite_ok(",
        "let acct = underwrite_ok_with_utilisation(",
        "production accounting call",
    )
    pool_vault = replace_once(
        pool_vault,
        "          marker_minted,\n"
        "          policy_lovelace,\n"
        "          min_utxo_lovelace,\n"
        "        )",
        "          marker_minted,\n"
        "          policy_lovelace,\n"
        "          min_utxo_lovelace,\n"
        "          budgets.utilisation_bps,\n"
        "        )",
        "pass registry utilization in production call",
    )

    # All edits are validated in memory first; only now write into the disposable
    # checkout. The upstream repository is never addressed by this script.
    (root / "lib/aegis/pricing.ak").write_text(pricing, encoding="utf-8")
    (root / "lib/aegis/vault.ak").write_text(vault, encoding="utf-8")
    (root / "validators/pool_vault.ak").write_text(pool_vault, encoding="utf-8")

    print("Candidate applied to disposable checkout:")
    print("- pricing.ak: parameterized exact ratio helper + legacy wrapper")
    print("- vault.ak: configured baseline ratio and book-cap predicates")
    print("- pool_vault.ak: registry parameters wired into production Underwrite")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"candidate patch refused: {exc}", file=sys.stderr)
        raise SystemExit(2)
