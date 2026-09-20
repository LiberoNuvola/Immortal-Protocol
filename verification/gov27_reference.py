#!/usr/bin/env python3
import json
from pathlib import Path

def registry_valid(rs):
    vs=[r["version"] for r in rs]
    if len(vs)!=len(set(vs)) or any(v<=0 for v in vs): return False
    for i,r in enumerate(rs):
        if not r["commitment"] or r["effective_from"]<0: return False
        if i and r["supersedes"] != rs[i-1]["version"]: return False
    return True

def authorization_valid(e):
    return {
      ("Proposer","ProposalSubmitted"),
      ("System","ProposalClassified"),
      ("System","StatusChanged"),
      ("Voter","VoteCast"),
      ("Delegate","DelegationSet"),
      ("Reviewer","GatesSet"),
    }.__contains__((e["actor_class"],e["event_type"]))

def evidence_valid(e):
    return bool(e["evidence_refs"])

def main():
    v=json.loads(Path(__file__).with_name("gov27_vectors.json").read_text(encoding="utf-8"))
    rs=v["ruleset_registry"]; e=v["event"]
    assert registry_valid(rs)
    assert authorization_valid(e)
    assert evidence_valid(e)
    r=next(x for x in rs if x["version"]==e["ruleset_version"])
    assert r["commitment"] == e["payload_commitment"]
    print("GOV-27 authorization/evidence/ruleset reference: PASS")

    bad=json.loads(json.dumps(e)); bad["actor_class"]="Voter"
    assert not authorization_valid(bad)
    bad=json.loads(json.dumps(e)); bad["evidence_refs"]=[]
    assert not evidence_valid(bad)
    bad=json.loads(json.dumps(e)); bad["ruleset_version"]=2
    assert not any(x["version"]==bad["ruleset_version"] for x in rs)
    print("negative authorization: PASS")
    print("negative evidence: PASS")
    print("negative ruleset: PASS")

if __name__=="__main__": main()
