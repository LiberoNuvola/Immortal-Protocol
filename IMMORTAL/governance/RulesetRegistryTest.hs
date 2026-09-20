module Main where
import RulesetRegistry
assert :: String -> Bool -> IO ()
assert s b=if b then putStrLn("PASS "++s) else error("FAIL "++s)
r1=RulesetDefinition 1 "commitment-v1" 0 Nothing
r2=RulesetDefinition 2 "commitment-v2" 100 (Just 1)
r2x=RulesetDefinition 2 "different-v2" 100 (Just 1)
main=do
 let rs=[r1,r2]
 assert "valid definitions" (rulesetDefinitionValid r1 && rulesetDefinitionValid r2)
 assert "deterministic canonical body" (canonicalRulesetBody r2=="version=2;commitment=commitment-v2;effective_from=100;supersedes=1")
 assert "initial registration" (registerRuleset r1 emptyRegistry==Right[r1])
 assert "append-only successor" (registerRuleset r2 [r1]==Right rs)
 assert "identical re-registration is idempotent" (registerRuleset r2 rs==Right rs)
 assert "changed existing version rejected" (registerRuleset r2x rs==Left "ruleset version is immutable")
 assert "out-of-order version rejected" (registerRuleset (RulesetDefinition 4 "v4" 200 (Just 2)) rs==Left "ruleset version must extend the registry monotonically")
 assert "active version deterministic" (activeRuleset 99 rs==Just r1 && activeRuleset 100 rs==Just r2)
 assert "commitment binding" (rulesetCompatible 2 "commitment-v2" rs && not(rulesetCompatible 2 "different-v2" rs))
 assert "registry valid" (registryValid rs)
 putStrLn "GOV-20 RULESET IMMUTABILITY CHECKS PASSED"
