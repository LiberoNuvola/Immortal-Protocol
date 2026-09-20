# GOV-20 — Corrective Patch
Baseline: `456a6d3f2fb60536c5cb63c962e98f95574c76cf`

The previous `registryValid` implementation inspected the tail after the current element, so a valid `[r1,r2]` chain could reject `r2.supersedes = 1`.

This patch validates adjacent registered versions directly:
`r[n].supersedes == Just (version r[n-1])`.

It preserves append-only registration, immutable versions, idempotent identical registration, monotonic versions, deterministic active lookup, and commitment binding.

This is a corrective patch, not a build/test certificate.
