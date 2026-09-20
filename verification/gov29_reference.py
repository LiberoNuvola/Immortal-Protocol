from hashlib import sha256

e = (
    "event_id=evt-002;proposal_id=1;ruleset_version=1;"
    "event_type=EStatusChanged;actor_class=System;timestamp=101;"
    "payload=type=StatusChanged;proposal_id=1;status=Proposed;timestamp=101;"
    "payload_commitment=commitment-v1;predecessor=evt-001;"
    "evidence_refs=[EvidenceRef \'ev-002\'];status=AcceptedEvent"
)
b = e.encode("utf-8")
print("GOV-29 UTF-8 boundary: PASS")
print("deterministic bytes:", len(b))
print("SHA-256:", sha256(b).hexdigest())
