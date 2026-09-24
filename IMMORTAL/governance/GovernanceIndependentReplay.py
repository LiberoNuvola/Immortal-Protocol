#!/usr/bin/env python3
"""
Independent deterministic replay reference for GOV-18.

This implementation intentionally does not import the Haskell governance
implementation. It models only the canonical event-chain checks and a
minimal proposal lifecycle projection.
"""
from dataclasses import dataclass, replace
from typing import Optional, Tuple

@dataclass(frozen=True)
class Event:
    event_id: str
    proposal_id: int
    ruleset_version: int
    event_type: str
    timestamp: int
    payload_commitment: str
    predecessor: Optional[str]
    status: str

@dataclass(frozen=True)
class State:
    event_count: int = 0
    last_event_id: Optional[str] = None
    proposals: Tuple[int, ...] = ()

def valid_event(prev: Optional[Event], e: Event) -> bool:
    if not e.event_id or e.proposal_id < 0 or e.ruleset_version <= 0:
        return False
    if e.timestamp < 0 or not e.payload_commitment:
        return False
    expected = None if prev is None else prev.event_id
    return e.predecessor == expected

def replay(events):
    state = State()
    prev = None
    for e in events:
        if not valid_event(prev, e):
            raise ValueError("invalid canonical event sequence")
        proposals = state.proposals
        if e.event_type == "EProposalSubmitted":
            if e.proposal_id in proposals:
                raise ValueError("duplicate proposal")
            proposals = proposals + (e.proposal_id,)
        state = replace(state, event_count=state.event_count+1,
                        last_event_id=e.event_id, proposals=proposals)
        prev = e
    return state

if __name__ == "__main__":
    events = [
        Event("evt-1", 1, 1, "EProposalSubmitted", 0, "p1", None, "AcceptedEvent"),
        Event("evt-2", 1, 1, "EStatusChanged", 1, "status:Proposed", "evt-1", "AcceptedEvent"),
    ]
    print(replay(events))
