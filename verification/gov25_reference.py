#!/usr/bin/env python3
"""IMMORTAL GOV-25 — independent SHA-256 commitment verifier."""
import hashlib, json
from pathlib import Path

def main():
    v=json.loads(Path(__file__).with_name("gov25_vectors.json").read_text(encoding="utf-8"))
    raw=v["canonical_bytes"].encode("utf-8")
    got=hashlib.sha256(raw).hexdigest()
    assert got == v["sha256"], (got, v["sha256"])
    assert len(got)==64 and all(c in "0123456789abcdef" for c in got)

    e=v["canonical_event"]
    # Recompute each published mutation and require a changed digest.
    order=["event_id","proposal_id","ruleset_version","event_type","actor_class",
           "timestamp","payload","payload_commitment","predecessor","evidence_refs","status"]
    def ptxt(p): return json.dumps(p,ensure_ascii=False,sort_keys=True,separators=(",",":"))
    def text(e):
        vals=[e["event_id"],e["proposal_id"],e["ruleset_version"],e["event_type"],
              e["actor_class"],e["timestamp"],ptxt(e["payload"]),e["payload_commitment"],
              e["predecessor"],"".join(f"[{x}]" for x in e["evidence_refs"]),e["status"]]
        return ";".join(f"{k}={'' if x is None else x}" for k,x in zip(order,vals))
    for field, expected in v["mutation_digests"].items():
        m=json.loads(json.dumps(e))
        if field=="payload": m[field]["status"]="Classified"
        elif field=="evidence_refs": m[field]=["ev-002"]
        elif field=="predecessor": m[field]="evt-000"
        elif field=="proposal_id": m[field]=2
        elif field=="ruleset_version": m[field]=2
        elif field=="timestamp": m[field]=101
        elif field=="event_id": m[field]="evt-002"
        elif field=="event_type": m[field]="StatusChanged"
        elif field=="actor_class": m[field]="System"
        elif field=="status": m[field]="Pending"
        gotm=hashlib.sha256(text(m).encode("utf-8")).hexdigest()
        assert gotm == expected
        assert gotm != v["sha256"], f"mutation {field} did not change digest"
    print("GOV-25 SHA-256 commitment vectors: PASS")
    print("digest:", got)
    print("mutation tests:", len(v["mutation_digests"]))

if __name__=="__main__": main()
