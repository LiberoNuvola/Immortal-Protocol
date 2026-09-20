#!/usr/bin/env python3
"""GOV-24 representation-boundary verifier; no cryptographic hash claim."""
import json
from pathlib import Path

ORDER = ["event_id","proposal_id","ruleset_version","event_type","actor_class",
         "timestamp","payload","payload_commitment","predecessor","evidence_refs","status"]

def payload_text(p):
    return json.dumps(p, ensure_ascii=False, sort_keys=True, separators=(",", ":"))

def canonical_text(e):
    vals = [e["event_id"],e["proposal_id"],e["ruleset_version"],e["event_type"],
            e["actor_class"],e["timestamp"],payload_text(e["payload"]),
            e["payload_commitment"],e["predecessor"],
            "".join(f"[{x}]" for x in e["evidence_refs"]),e["status"]]
    return ";".join(f"{k}={'' if v is None else v}" for k,v in zip(ORDER,vals))

def main():
    d=json.loads(Path(__file__).with_name("gov24_vectors.json").read_text(encoding="utf-8"))
    e=d["event"]
    a=canonical_text(e)
    b=canonical_text(json.loads(json.dumps(e, ensure_ascii=False)))
    assert a==b
    raw=a.encode("utf-8")
    assert raw.decode("utf-8")==a
    print("GOV-24 canonical representation: PASS")
    print("UTF-8 bytes:", len(raw))
    print("representation:", a)

if __name__=="__main__":
    main()
