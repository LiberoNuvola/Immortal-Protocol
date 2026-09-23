from dataclasses import dataclass
from enum import Enum

class EventType(str, Enum):
    ProposalSubmitted="ProposalSubmitted"
    ProposalClassified="ProposalClassified"
    StatusChanged="StatusChanged"
    VoteCast="VoteCast"
    DelegationSet="DelegationSet"
    GatesSet="GatesSet"

AUTH = {
    "ProposalSubmitted":"Proposer",
    "ProposalClassified":"System",
    "StatusChanged":"System",
    "VoteCast":"Voter",
    "DelegationSet":"Delegate",
    "GatesSet":"Reviewer",
}

def valid_event(e, registry):
    assert e["status"] == "AcceptedEvent"
    assert e["event_type"] in AUTH
    assert e["actor_class"] == AUTH[e["event_type"]]
    assert e["evidence_refs"]
    assert len(e["evidence_refs"]) == len(set(e["evidence_refs"]))
    assert e["ruleset_version"] in registry
    assert e["payload_commitment"] == registry[e["ruleset_version"]]
    return True

def replay_sequence(events, registry):
    prev = None
    seen = set()
    for e in events:
        assert e["event_id"] not in seen
        if prev is None:
            assert e["predecessor"] is None
        else:
            assert e["predecessor"] == prev
        valid_event(e, registry)
        seen.add(e["event_id"])
        prev = e["event_id"]
    return len(events)

if __name__ == "__main__":
    registry = {1:"commitment-v1"}
    events = [
      {"event_id":"evt-001","event_type":"ProposalSubmitted","actor_class":"Proposer",
       "status":"AcceptedEvent","ruleset_version":1,"payload_commitment":"commitment-v1",
       "predecessor":None,"evidence_refs":["ev-001"]},
      {"event_id":"evt-002","event_type":"ProposalClassified","actor_class":"System",
       "status":"AcceptedEvent","ruleset_version":1,"payload_commitment":"commitment-v1",
       "predecessor":"evt-001","evidence_refs":["ev-002"]},
    ]
    assert replay_sequence(events, registry) == 2

    negatives = []
    for field, value in [
        ("actor_class","Voter"),
        ("evidence_refs",[]),
        ("payload_commitment","wrong"),
        ("ruleset_version",99),
        ("status","RejectedEvent"),
    ]:
        bad = dict(events[0]); bad[field] = value
        try:
            valid_event(bad, registry)
        except AssertionError:
            negatives.append(field)
    assert set(negatives) == {
        "actor_class","evidence_refs","payload_commitment",
        "ruleset_version","status"
    }
    print("GOV-28 reference conformance: PASS")
    print("positive replay: PASS")
    print("negative authorization/evidence/ruleset gates: PASS")
    print("finality/challenge lifecycle: NOT IMPLEMENTED IN THIS REFERENCE")
