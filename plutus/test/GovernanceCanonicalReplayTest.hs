module Main where

import Governance
import GovernanceEventSchema
import GovernanceCanonicalReplay
import GovernanceAuthorization
import RulesetRegistry

assert :: String -> Bool -> IO ()
assert label ok = if ok then putStrLn ("PASS " ++ label) else error ("FAIL " ++ label)

proposal0 :: Proposal
proposal0 = Proposal
  { proposalId=1, proposalClass=DocumentationOnly
  , proposalSnapshot=Snapshot 1 100 [(1,60),(2,40)]
  , proposalCreatedAt=100
  , communityReviewOpenedAt=Nothing, votingOpenedAt=Nothing
  , votingClosedAt=Nothing, finalizationAt=Nothing
  , emergencyActivatedAt=Nothing, proposalVotes=[]
  , proposalDelegations=[], proposalGates=GateResult True True True True
  , proposalStatus=Draft }

ruleset :: RulesetDefinition
ruleset = RulesetDefinition 1 "commitment-v1" 0 Nothing

event1 :: CanonicalEvent
event1 = CanonicalEvent "evt-001" 1 1 EProposalSubmitted Proposer 100
  (PayloadProposalSubmitted proposal0) "commitment-v1" Nothing
  [EvidenceRef "ev-001"] AcceptedEvent

event2 :: CanonicalEvent
event2 = CanonicalEvent "evt-002" 1 1 EStatusChanged System 101
  (PayloadStatusChanged 1 Proposed 101) "commitment-v1" (Just "evt-001")
  [EvidenceRef "ev-002"] AcceptedEvent

main :: IO ()
main = do
  let rs=[ruleset]
  assert "payload/id/type/timestamp binding" (eventSchemaValid event1 && eventSchemaValid event2)
  assert "authorization/evidence/ruleset" (canonicalGovernanceEventValid rs Nothing event1)
  assert "predecessor continuity" (canonicalGovernanceEventValid rs (Just event1) event2)
  assert "wrong predecessor rejected"
    (not (canonicalGovernanceEventValid rs (Just event2) event1))
  case replayCanonical rs emptyState [event1,event2] of
    Right st -> assert "canonical replay executes" (eventsApplied st == 2)
    Left e -> error e
  assert "wrong actor rejected"
    (not (canonicalGovernanceEventValid rs Nothing event1 { actorClass = System }))
  assert "wrong ruleset rejected"
    (not (canonicalGovernanceEventValid rs Nothing event1 { payloadCommitment = "wrong" }))
  assert "missing evidence rejected"
    (not (canonicalGovernanceEventValid rs Nothing event1 { evidenceRefs = [] }))
  putStrLn "GOV-29 EXECUTABLE CANONICAL REPLAY CHECKS PASSED"
