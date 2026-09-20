module Main where

import Governance
import GovernanceEventSchema
import GovernanceCanonicalReplay

assert :: Bool -> String -> IO ()
assert condition label =
  if condition
    then putStrLn ("PASS: " ++ label)
    else error ("FAIL: " ++ label)

sampleProposal :: Proposal
sampleProposal =
  Proposal
    { proposalId = 1
    , proposalClass = DocumentationOnly
    , proposalSnapshot = Snapshot 1 0 [(10,1)]
    , proposalCreatedAt = 0
    , communityReviewOpenedAt = Nothing
    , votingOpenedAt = Nothing
    , votingClosedAt = Nothing
    , finalizationAt = Nothing
    , emergencyActivatedAt = Nothing
    , proposalVotes = []
    , proposalDelegations = []
    , proposalGates = GateResult True True True True
    , proposalStatus = Proposed
    }

event1 :: CanonicalEvent
event1 =
  CanonicalEvent
    "evt-1" 1 1 EProposalSubmitted Proposer 0
    (PayloadProposalSubmitted sampleProposal)
    "payload-commitment-1"
    Nothing
    []
    AcceptedEvent

event2 :: CanonicalEvent
event2 =
  CanonicalEvent
    "evt-2" 1 1 EStatusChanged System 1
    (PayloadStatusChanged 1 Classified 1)
    "payload-commitment-2"
    (Just "evt-1")
    []
    AcceptedEvent

main :: IO ()
main = do
  assert (eventSchemaValid event1) "canonical payload matches event type"
  assert (eventSchemaValid event2) "status payload validates"
  assert (predecessorValid Nothing event1) "genesis predecessor"
  assert (predecessorValid (Just event1) event2) "predecessor chain"
  case replayCanonical emptyState [event1, event2] of
    Left err -> error ("FAIL: replay rejected: " ++ err)
    Right st -> do
      assert (eventsApplied st == 2) "two canonical events applied"
      assert (length (proposals st) == 1) "proposal created from canonical payload"
      assert (proposalStatus (head (proposals st)) == Classified)
        "state derives directly from canonical events"
  putStrLn "GOV-22 CANONICAL EVENT STATE WIRING CHECKS PASSED"
