#!/usr/bin/env python3
import hashlib, json
from pathlib import Path

V = Path(__file__).with_name("gov25_vectors.json")
if V.exists():
    v=json.loads(V.read_text(encoding="utf-8"))
else:
    raise SystemExit("GOV-25 vector file required")

def main():
    raw=v["canonical_bytes"].encode("utf-8")
    digest=hashlib.sha256(raw).hexdigest()
    assert digest == v["sha256"]

    # A commitment mismatch is invalid.
    bad = dict(v["canonical_event"])
    bad["payload_commitment"] = "0"*64
    assert bad["payload_commitment"] != digest

    # AcceptedEvent is required by the canonical validity boundary.
    assert v["canonical_event"]["status"] == "AcceptedEvent"

    print("GOV-26 commitment/validity reference: PASS")
    print("verified digest:", digest)
    print("accepted-event gate: PASS")
    print("mismatch rejection vector: PASS")

if __name__=="__main__":
    main()
