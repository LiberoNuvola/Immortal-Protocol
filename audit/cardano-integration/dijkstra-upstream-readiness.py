#!/usr/bin/env python3
"""Snapshot upstream Dijkstra nested-transaction readiness; never claims a ledger PASS."""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

PULLS = {
    "cardano-node-6677": "https://api.github.com/repos/IntersectMBO/cardano-node/pulls/6677",
    "cardano-node-6709": "https://api.github.com/repos/IntersectMBO/cardano-node/pulls/6709",
    "cardano-ledger-6189": "https://api.github.com/repos/IntersectMBO/cardano-ledger/pulls/6189",
    "cardano-api-1361": "https://api.github.com/repos/IntersectMBO/cardano-api/pulls/1361",
    "cardano-cli-1453": "https://api.github.com/repos/IntersectMBO/cardano-cli/pulls/1453",
}


def fetch(url: str) -> dict:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "IMMORTAL-Dijkstra-Upstream-Readiness-Audit",
    }
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    observed_at = dt.datetime.now(dt.timezone.utc).isoformat()
    records = {}
    errors = {}
    for key, url in PULLS.items():
        try:
            data = fetch(url)
            records[key] = {
                "url": data.get("html_url", url),
                "title": data.get("title"),
                "state": data.get("state"),
                "merged": data.get("merged"),
                "merged_at": data.get("merged_at"),
                "updated_at": data.get("updated_at"),
                "draft": data.get("draft"),
                "head_sha": (data.get("head") or {}).get("sha"),
                "base_sha": (data.get("base") or {}).get("sha"),
                "body": data.get("body") or "",
            }
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            errors[key] = f"{type(exc).__name__}: {exc}"

    node_integration = records.get("cardano-node-6677", {})
    dijkstra_tests = records.get("cardano-node-6709", {})
    if errors:
        gate = "INDETERMINATE_UPSTREAM_API_ERROR"
    elif not node_integration.get("merged") or not dijkstra_tests.get("merged"):
        gate = "BLOCKED_UPSTREAM_INTEGRATION_NOT_MERGED"
    else:
        # Merge state is necessary but never sufficient to claim local runtime success.
        gate = "UPSTREAM_MERGED_LOCAL_D2_REPRODUCTION_REQUIRED"

    evidence = {
        "schema": "immortal.dijkstra-upstream-readiness.v1",
        "observed_at_utc": observed_at,
        "scope": "upstream metadata snapshot only; no node started and no transaction submitted",
        "gate": gate,
        "audit_completed": not errors,
        "ledger_test_pass": False,
        "d2_runtime_reproduction": "NOT_RUN_BY_THIS_WORKFLOW",
        "pull_requests": records,
        "errors": errors,
        "next_action": (
            "Resolve API collection errors and rerun snapshot."
            if errors else
            "Keep D2 blocked until the pinned local node integration test passes with retained logs and ledger evidence."
            if gate == "BLOCKED_UPSTREAM_INTEGRATION_NOT_MERGED" else
            "Run the exact upstream top-level Plutus V4 Guard property on the pinned local Dijkstra testnet; merge state is not a runtime pass."
        ),
    }
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(evidence, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Dijkstra upstream readiness snapshot: {gate}")
    print(f"Evidence written to: {output}")
    print("ledger_test_pass=false (this workflow does not run a node or submit transactions)")
    if errors:
        for key, error in errors.items():
            print(f"ERROR {key}: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
