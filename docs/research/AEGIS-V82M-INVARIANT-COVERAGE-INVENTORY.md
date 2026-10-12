# Aegis V8.2M — Source-Grounded Invariant Coverage Inventory

**Purpose:** identify what IMMORTAL would add beyond Aegis, not to re-audit or certify Aegis.  
**Pinned source:** `realdecimalist/aegis-contracts@6549246ff053457c93e6d68e44791efa2ef2f972`.  
**Reviewed anchors:** `contracts/validators/pool_vault.ak`, `contracts/lib/aegis/vault.ak`, `contracts/lib/aegis/test_helpers/security_tests.ak`, and the pinned README.

## Coverage matrix

| Property / transition | Where the inspected source enforces it | Current evidence level | Incremental IMMORTAL value established? |
|---|---|---|---|
| Vault identity and continuation | `pool_vault.ak`: exactly one continuation with pool NFT; base guard preserves non-lovelace assets and registry NFT | Validator-context source; full tx execution is not established by source inspection alone | No |
| AddLiquidity accounting | `vault.ak:add_liquidity_ok`; called by validator; binds deposit, continuation, LP mint/supply delta, active coverage and reserve | Pure predicate plus validator wiring; pinned Aiken suite passes | No |
| RemoveLiquidity accounting | `vault.ak:remove_liquidity_ok`; validator computes non-vault payouts and checks burn/payout relation | Pure predicate plus validator wiring; pinned Aiken suite passes | No |
| Revenue reserve accounting | `vault.ak:deposit_revenue_ok`; reserve increases exactly by amount, no aLP movement | Pure predicate plus validator wiring; pinned Aiken suite passes | No |
| Underwrite pool cap and local accounting | `vault.ak:underwrite_ok`: coverage/premium, continuation, active coverage delta, marker, policy funding and `active_coverage * 3 <= post_total`; validator additionally binds policy datum, registry/config rails, oracle mandate/provider and price/terms | Predicate plus substantial validator-context checks; 1,162-test Aiken baseline passed | No; this is already a local risk gate |
| Claim accounting | `vault.ak:claim_ok` and `claim_trigger_ok`; validator binds consumed policy, payout, marker, payout destination, oracle/trigger/freshness and continuation | Predicate and validator wiring; Aiken baseline passed, but this inventory is not a separate end-to-end transaction replay | No; do not pitch reserve-first as an IMMORTAL innovation |
| Expire accounting and timing | `vault.ak:expire_ok`; validator arm and policy/marker checks; source requires expiry timing through transaction validity bounds | Predicate and validator wiring; Aiken baseline passed | No |
| Governance/configuration bounds | `registry_v2.ak` and `pool_vault.ak`: governed config rails, NFT-authenticated registry, timelock and point-of-use checks | Source documented and compiled in passing Aiken suite | No |
| Oracle authenticity / freshness / policy pinning | Oracle and observer modules plus validator-context checks; policy terms/pins are bound at sale and reused at settlement | Source documented and compiled in passing Aiken suite | No |
| Cross-pool aggregate solvency / shared liabilities | No cross-pool/shared-liability requirement established by the reviewed vault model or README | Not established; absence from reviewed files is not proof the broader product has no such need | **Unproven candidate only** |
| IMMORTAL-qualified capital model (liability-first partition, ProtectedCapital, evidence perimeter) | IMMORTAL kernel/bridge, not currently shown to be enforced by Aegis validators | Bridge projection remains `UNVERIFIABLE`; no approved mapping | Potential capability, but no Aegis-specific benefit proved |

## Interpretation

The pinned Aiken run is meaningful compilation/test evidence: the baseline reports 1,162 passing tests and zero failures. It is not proof that every security claim has a full transaction-context test, nor proof of IMMORTAL conformity.

The key comparison is not “Aegis has no economic controls.” It demonstrably has many. The question is whether Aegis has a real economic perimeter wider than its individual vault's state—for example, shared liabilities or capital supporting more than one pool—that its existing local gates cannot enforce.

## Required product question

**Does Decimalist need one economic admission decision across multiple pools/products or shared obligations, beyond Aegis's existing per-vault rules?**

- **If yes:** request one real scenario and its authoritative data sources. Build the smallest differential test where Aegis-local checks accept a transition but the approved global policy must reject it. Prove the state and the rule; do not invent obligations or thresholds.
- **If no:** do not add IMMORTAL merely to duplicate the 33% cap, reserve arithmetic, claim checks, or governance rails. The current evidence supports compatibility research, not a compelling integration pitch.

## Evidence links

- [Pinned Aegis source commit](https://github.com/realdecimalist/aegis-contracts/commit/6549246ff053457c93e6d68e44791efa2ef2f972)
- [Aegis pinned Aiken baseline in IMMORTAL CI](https://github.com/LiberoNuvola/Immortal-Protocol/actions/runs/38286601502)
- [IMMORTAL–Aegis bridge contract](AEGIS-IMMORTAL-CONFORMANCE-BRIDGE-v1.md)
- [Value-oriented gap analysis](AEGIS-IMMORTAL-VALUE-GAP-ANALYSIS-v1.md)
