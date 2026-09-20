module RulesetRegistry
  ( RulesetVersion, RulesetDefinition(..), RulesetRegistry, emptyRegistry
  , canonicalRulesetBody, rulesetDefinitionValid, registryValid
  , registerRuleset, lookupRuleset, activeRuleset, rulesetCompatible
  ) where

type RulesetVersion = Integer

data RulesetDefinition = RulesetDefinition
  { rulesetVersion :: RulesetVersion
  , rulesetCommitment :: String
  , effectiveFrom :: Integer
  , supersedes :: Maybe RulesetVersion
  } deriving (Eq,Show,Ord)

type RulesetRegistry = [RulesetDefinition]

emptyRegistry :: RulesetRegistry
emptyRegistry=[]

canonicalRulesetBody :: RulesetDefinition -> String
canonicalRulesetBody r =
  "version="++show (rulesetVersion r)++
  ";commitment="++rulesetCommitment r++
  ";effective_from="++show (effectiveFrom r)++
  ";supersedes="++maybe "" show (supersedes r)

rulesetDefinitionValid :: RulesetDefinition -> Bool
rulesetDefinitionValid r =
  rulesetVersion r>0 && not (null (rulesetCommitment r)) &&
  effectiveFrom r>=0 &&
  case supersedes r of Nothing->True; Just v->v>0 && v<rulesetVersion r

registryValid :: RulesetRegistry -> Bool
registryValid rs =
  all rulesetDefinitionValid rs && uniqueVersions (map rulesetVersion rs) &&
  increasing (map rulesetVersion rs) && supersessionOK rs
  where
    uniqueVersions xs=length xs==length (dedup xs)
    dedup []=[]; dedup (x:xs)=x:dedup(filter(/=x)xs)
    increasing []=True
    increasing [_]=True
    increasing (a:b:xs)=a<b && increasing(b:xs)
    supersessionOK []=True
    supersessionOK (r:xs)=case supersedes r of
      Nothing->supersessionOK xs
      Just v->v `elem` map rulesetVersion xs || v==0 || supersessionOK xs

registerRuleset :: RulesetDefinition -> RulesetRegistry -> Either String RulesetRegistry
registerRuleset r rs
  | not (rulesetDefinitionValid r)=Left "invalid ruleset definition"
  | not (registryValid rs)=Left "existing registry is invalid"
  | otherwise=case lookupRuleset (rulesetVersion r) rs of
      Just old | old==r -> Right rs
               | otherwise -> Left "ruleset version is immutable"
      Nothing | appendable r rs -> Right (rs++[r])
              | otherwise -> Left "ruleset version must extend the registry monotonically"
  where
    appendable x []=supersedes x==Nothing
    appendable x ys=case reverse ys of
      latest:_ -> rulesetVersion x>rulesetVersion latest &&
                  supersedes x==Just(rulesetVersion latest)
      []->False

lookupRuleset :: RulesetVersion -> RulesetRegistry -> Maybe RulesetDefinition
lookupRuleset _ []=Nothing
lookupRuleset v (r:rs)|rulesetVersion r==v=Just r|otherwise=lookupRuleset v rs

activeRuleset :: Integer -> RulesetRegistry -> Maybe RulesetDefinition
activeRuleset now=foldl choose Nothing
  where
    choose Nothing r|effectiveFrom r<=now=Just r
                     |otherwise=Nothing
    choose cur@(Just old) r|effectiveFrom r<=now && effectiveFrom r>=effectiveFrom old=Just r
                            |otherwise=cur

rulesetCompatible :: RulesetVersion -> String -> RulesetRegistry -> Bool
rulesetCompatible v c rs=case lookupRuleset v rs of
  Just r->rulesetCommitment r==c
  Nothing->False
