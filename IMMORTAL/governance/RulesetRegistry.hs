module RulesetRegistry
  ( RulesetVersion, RulesetDefinition(..), RulesetRegistry, emptyRegistry
  , canonicalRulesetBody, rulesetDefinitionValid, registryValid
  , registerRuleset, lookupRuleset, activeRuleset, rulesetCompatible
  ) where
type RulesetVersion = Integer
data RulesetDefinition = RulesetDefinition { rulesetVersion :: RulesetVersion, rulesetCommitment :: String, effectiveFrom :: Integer, supersedes :: Maybe RulesetVersion } deriving (Eq,Show,Ord)
type RulesetRegistry = [RulesetDefinition]
emptyRegistry :: RulesetRegistry
emptyRegistry=[]
canonicalRulesetBody r="version="++show(rulesetVersion r)++";commitment="++rulesetCommitment r++";effective_from="++show(effectiveFrom r)++";supersedes="++maybe "" show(supersedes r)
rulesetDefinitionValid r=rulesetVersion r>0 && not(null(rulesetCommitment r)) && effectiveFrom r>=0 && case supersedes r of Nothing->True; Just v->v>0 && v<rulesetVersion r
registryValid rs=all rulesetDefinitionValid rs && unique vs && increasing vs && supersessionOK rs where
 vs=map rulesetVersion rs
 unique xs=length xs==length(dedup xs)
 dedup []=[]; dedup(x:xs)=x:dedup(filter(/=x)xs)
 increasing []=True
 increasing [_]=True
 increasing(a:b:xs)=a<b && increasing(b:xs)
 supersessionOK []=True
 supersessionOK [_]=True
 supersessionOK(r:n:xs)=supersedes n==Just(rulesetVersion r) && supersessionOK(n:xs)
registerRuleset r rs
 |not(rulesetDefinitionValid r)=Left"invalid ruleset definition"
 |not(registryValid rs)=Left"existing registry is invalid"
 |otherwise=case lookupRuleset(rulesetVersion r) rs of
   Just old|old==r->Right rs
           |otherwise->Left"ruleset version is immutable"
   Nothing|appendable r rs->Right(rs++[r])
          |otherwise->Left"ruleset version must extend the registry monotonically"
 where
  appendable x []=supersedes x==Nothing
  appendable x ys=case reverse ys of latest:_->rulesetVersion x>rulesetVersion latest && supersedes x==Just(rulesetVersion latest); []->False
lookupRuleset _ []=Nothing
lookupRuleset v(r:rs)|rulesetVersion r==v=Just r|otherwise=lookupRuleset v rs
activeRuleset now=foldl choose Nothing where
 choose Nothing r|effectiveFrom r<=now=Just r|otherwise=Nothing
 choose cur@(Just old) r|effectiveFrom r<=now && effectiveFrom r>=effectiveFrom old=Just r|otherwise=cur
rulesetCompatible v c rs=case lookupRuleset v rs of Just r->rulesetCommitment r==c; Nothing->False
