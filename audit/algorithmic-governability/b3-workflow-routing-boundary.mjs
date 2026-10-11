#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
const assert=(c,m)=>{if(!c)throw new Error("FAIL: "+m);console.log("PASS: "+m)}
const root=process.cwd()
for(const relative of [".github/workflows/materios-b3-real-fixture-capture.yml",".github/workflows/materios-b3-execution-verifier.yml",".github/workflows/materios-evidence-conformance.yml"]){const file=path.join(root,relative);assert(fs.existsSync(file),relative+" exists");const source=fs.readFileSync(file,"utf8");assert(!source.includes("work/immortal-green-closure"),relative+" does not route B3 automation through Green Closure");assert(source.includes("work/b3-materios-provenance-evidence"),relative+" routes B3 push automation to the dedicated B3 evidence branch")}
console.log("ALL B3 WORKFLOW ROUTING CHECKS PASSED")
