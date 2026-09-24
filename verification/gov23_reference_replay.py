#!/usr/bin/env python3
"""IMMORTAL GOV-23 — independent, language-neutral canonical replay reference.

This verifier intentionally implements only the GOV-22 semantic event/state
surface represented by the checked-in JSON vectors. It is an independent
reference, not an implementation-conformance proof.

It checks:
  1. deterministic event ordering through predecessor links;
  2. schema/type/proposal consistency;
  3. rejection of RejectedEvent entries;
  4. deterministic replay from one initial state;
  5. exact agreement with the expected vector state.

It does NOT verify cryptographic payload commitments, actor authorization,
evidence resolution, or the full ruleset registry. Those remain explicit
closure obligations.
"""

import json
from copy import deepcopy
from pathlib import Path


ALLOWED_TYPES = {
    "ProposalSubmitted",
    "ProposalClassified",
    "StatusChanged",
    "VoteCast",
    "DelegationSet",
    "GatesSet",
}


def validate_event(event, predecessor):
    required = {
        "event_id", "proposal_id", "ruleset_version", "event_type",
        "actor_class", "timestamp", "payload", "payload_commitment",
        "predecessor", "evidence_refs", "status"
    }
    missing = required - set(event)
    if missing:
        raise ValueError(f"missing fields: {sorted(missing)}")
    if not event["event_id"]:
        raise ValueError("empty event_id")
    if event["proposal_id"] < 0:
        raise ValueError("negative proposal_id")
    if event["ruleset_version"] <= 0:
        raise ValueError("non-positive ruleset_version")
    if event["timestamp"] < 0:
        raise ValueError("negative timestamp")
    if not event["payload_commitment"]:
        raise ValueError("empty payload_commitment")
    if event["event_type"] not in ALLOWED_TYPES:
        raise ValueError("unknown event_type")
    if event["status"] != "AcceptedEvent":
        raise ValueError("replay accepts only AcceptedEvent")
    if event["predecessor"] != predecessor:
        raise ValueError("invalid predecessor")
    if len(event["evidence_refs"]) != len(set(event["evidence_refs"])):
        raise ValueError("duplicate evidence reference")

    payload = event["payload"]
    payload_pid = payload.get("proposal_id")
    if payload_pid != event["proposal_id"]:
        raise ValueError("payload/proposal proposal_id mismatch")

    expected = {
        "ProposalSubmitted": {"proposal_class", "status"},
        "ProposalClassified": {"proposal_class"},
        "StatusChanged": {"new_status", "timestamp"},
        "VoteCast": {"voter", "choice"},
        "DelegationSet": {"delegator", "delegate"},
        "GatesSet": {"gate_result"},
    }[event["event_type"]]
    if not expected.issubset(payload):
        raise ValueError("payload missing semantic fields")

    if event["event_type"] == "StatusChanged" and payload["timestamp"] != event["timestamp"]:
        raise ValueError("payload/event timestamp mismatch")


def apply_event(state, event):
    s = deepcopy(state)
    pid = event["proposal_id"]
    et = event["event_type"]

    if et == "ProposalSubmitted":
        if any(p["proposal_id"] == pid for p in s["proposals"]):
            raise ValueError("duplicate proposal")
        s["proposals"].append({
            "proposal_id": pid,
            "status": event["payload"]["status"],
            "proposal_class": event["payload"]["proposal_class"],
        })
    elif et == "StatusChanged":
        matches = [p for p in s["proposals"] if p["proposal_id"] == pid]
        if len(matches) != 1:
            raise ValueError("status change references unknown proposal")
        matches[0]["status"] = event["payload"]["new_status"]
    elif et == "ProposalClassified":
        matches = [p for p in s["proposals"] if p["proposal_id"] == pid]
        if len(matches) != 1:
            raise ValueError("classification references unknown proposal")
        matches[0]["proposal_class"] = event["payload"]["proposal_class"]
    else:
        # GOV-23 vector scope deliberately does not silently invent semantics
        # for later event types. They must receive dedicated vectors/contracts.
        raise ValueError(f"event semantics not covered by GOV-23 vector: {et}")

    s["events_applied"] += 1
    return s


def replay(vector):
    state = deepcopy(vector["initial_state"])
    predecessor = None
    for event in vector["events"]:
        validate_event(event, predecessor)
        state = apply_event(state, event)
        predecessor = event["event_id"]
    return state


def main():
    path = Path(__file__).with_name("governance_gov23_vectors.json")
    vector = json.loads(path.read_text(encoding="utf-8"))
    a = replay(vector)
    b = replay(vector)
    expected = vector["expected_final_state"]

    assert a == b, "non-deterministic replay"
    assert a == expected, f"vector mismatch: got {a!r}, expected {expected!r}"

    print("GOV-23 independent replay: PASS")
    print("events:", a["events_applied"])
    print("final proposal status:", a["proposals"][0]["status"])


if __name__ == "__main__":
    main()
