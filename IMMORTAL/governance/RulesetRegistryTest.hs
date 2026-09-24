module Main where
import RulesetRegistry
assert s b=if b then putStrLn("PASS "++s) else error("FAIL "++s)
r1=RulesetDefinition 1 "commitment-v1" 0 Nothing
r2=RulesetDefinition 2 "commitment-v2" 100 (Just 1)
r3=RulesetDefinition 3 "commitment-v3" 200 (Just 2)
r2x=RulesetDefinition 2 "different-v2" 100 (Just 1)
main=do
 let rs=[r1,r2]; rs3=[r1,r2,r3]
 assert"valid three-version chain"(registryValid rs3)
 assert"initial registration"(registerRuleset r1 emptyRegistry==Right[r1])
 assert"append-only successor"(registerRuleset r2[r1]==Right rs)
 assert"idempotent identical re-registration"(registerRuleset r2 rs==Right rs)
 assert"changed existing version rejected"(registerRuleset r2x rs==Left"ruleset version is immutable")
 assert"out-of-order version rejected"(registerRuleset(RulesetDefinition 4 "v4" 300(Just 2))rs==Left"ruleset version must extend the registry monotonically")
 assert"wrong predecessor rejected"(registerRuleset(RulesetDefinition 3 "v3" 200(Just 1))rs==Left"ruleset version must extend the registry monotonically")
 assert"active version deterministic"(activeRuleset 99 rs==Just r1 && activeRuleset 100 rs==Just r2)
 assert"commitment binding"(rulesetCompatible 2 "commitment-v2" rs && not(rulesetCompatible 2 "different-v2" rs))
 putStrLn"GOV-20 CORRECTIVE CHECKS PASSED"
