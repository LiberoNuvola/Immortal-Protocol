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
    [EvidenceRef "proposal-evidence"]
    AcceptedEvent

collapsedAcceptedEvent :: CanonicalEvent
collapsedAcceptedEvent =
  CanonicalEvent
    "evt-accepted-shortcut" 1 1 EStatusChanged System 10
    (PayloadStatusChanged 1 Accepted 10)
    "payload-commitment-accepted-shortcut"
    (Just "evt-1")
    [EvidenceRef "shortcut-evidence"]
    AcceptedEvent

event2 :: CanonicalEvent
event2 =
  CanonicalEvent
    "evt-2" 1 1 EStatusChanged System 1
    (PayloadStatusChanged 1 Classified 1)
    "payload-commitment-2"
    (Just "evt-1")
    [EvidenceRef "classification-evidence"]
    AcceptedEvent


classifiedEvent :: CanonicalEvent
classifiedEvent =
  CanonicalEvent
    "evt-classified" 1 1 EProposalClassified System 7
    (PayloadProposalClassified 1 DocumentationOnly 7)
    "payload-classified"
    (Just "evt-1")
    [EvidenceRef "classification-evidence"]
    AcceptedEvent

gatesEvent :: CanonicalEvent
gatesEvent =
  CanonicalEvent
    "evt-gates" 1 1 EGatesSet Reviewer 9
    (PayloadGatesSet 1 (GateResult True True True True) 9)
    "payload-gates"
    (Just "evt-classified")
    [EvidenceRef "gate-evidence"]
    AcceptedEvent

main :: IO ()
main = do
  assert (eventSchemaValid event1) "canonical payload matches event type"
  assert (eventSchemaValid event2) "status payload validates"
  assert (predecessorValid Nothing event1) "genesis predecessor"
  assert (predecessorValid (Just event1) event2) "predecessor chain"
  assert (eventSchemaValid classifiedEvent) "classified payload timestamp matches event timestamp"
  assert (eventSchemaValid gatesEvent) "gates payload timestamp matches event timestamp"
  case replayCanonical emptyState [event1, event2] of
    Left err -> error ("FAIL: replay rejected: " ++ err)
    Right st -> do
      assert (eventsApplied st == 2) "two canonical events applied"
      assert (length (proposals st) == 1) "proposal created from canonical payload"
      assert (proposalStatus (head (proposals st)) == Classified)
        "state derives directly from canonical events"
  case replayCanonical emptyState [event1, collapsedAcceptedEvent] of
    Left _ -> putStrLn "PASS: collapsed Accepted shortcut rejected before mutation"
    Right _ -> error "FAIL: collapsed Accepted shortcut mutated canonical state"

  assert (not (canonicalLifecycleAdmission emptyState collapsedAcceptedEvent))
    "canonical lifecycle admission rejects legacy terminal-state shortcut"

  putStrLn "GOV-28 CANONICAL LIFECYCLE ADMISSION CHECKS PASSED"
