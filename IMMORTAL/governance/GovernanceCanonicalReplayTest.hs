module Main where

import Governance
import GovernanceEventSchema
import GovernanceCanonicalReplay
import GovernanceFinality
import GovernanceDecisionWitness

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


finalizationProposal :: Proposal
finalizationProposal =
  Proposal
    { proposalId = 7
    , proposalClass = DocumentationOnly
    , proposalSnapshot = Snapshot 11 100 [(1,60),(2,40)]
    , proposalCreatedAt = 100
    , communityReviewOpenedAt = Nothing
    , votingOpenedAt = Nothing
    , votingClosedAt = Just 200
    , finalizationAt = Nothing
    , emergencyActivatedAt = Nothing
    , proposalVotes = [Vote 7 1 For 150, Vote 7 2 Abstain 150]
    , proposalDelegations = []
    , proposalGates = GateResult True True True True
    , proposalStatus = DecisionRecorded
    }

finalizationChallenge :: Challenge
finalizationChallenge = Challenge "ch-7" 7 250 ChallengeRejected

finalizationRecord :: DecisionRecord
finalizationRecord =
  DecisionRecord
    { decisionProposalId = 7
    , decisionProposalClass = DocumentationOnly
    , decisionSnapshotId = 11
    , decisionSnapshotAt = 100
    , decisionEligibleWeight = 100
    , decisionYesWeight = 60
    , decisionNoWeight = 0
    , decisionAbstentionWeight = 40
    , decisionQuorumReached = True
    , decisionApprovalReached = True
    , decisionRequiredGates = GateResult True True True True
    , decisionFinalOutcome = DecisionRecorded
    , decisionRulesetVersion = 1
    , decisionChallenges = [finalizationChallenge]
    , decisionCanonicalizationReference = "canon-ref-7"
    }

finalizedEvent :: CanonicalEvent
finalizedEvent =
  CanonicalEvent
    "evt-finalized" 7 1 EDecisionFinalized System 259400
    (PayloadDecisionFinalized finalizationRecord)
    "payload-finalized"
    Nothing
    [EvidenceRef "finalization-evidence"]
    AcceptedEvent


adoptionEvent :: CanonicalEvent
adoptionEvent =
  CanonicalEvent
    "evt-adopted" 7 1 EAdoptionRecorded System 259401
    (PayloadAdoptionRecorded 7 259401)
    "payload-adoption"
    (Just "evt-finalized")
    [EvidenceRef "adoption-evidence"]
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
  let finalizationState = GovernanceState 1 [finalizationProposal] 0
  case applyCanonicalEvent emptyState finalizationState Nothing finalizedEvent of
    Left err -> error ("FAIL: decision finalization rejected: " ++ err)
    Right st -> do
      assert (finalizationAt (head (proposals st)) == Just 259400)
        "DECISION_FINALIZED records finalization without collapsing to Canonical"
      assert (proposalStatus (head (proposals st)) == Accepted)
        "DECISION_FINALIZED advances the compatible Accepted projection"

  putStrLn "GOV-28 DECISION FINALIZATION CHECKS PASSED"
  let acceptedState = GovernanceState 1 [finalizationProposal { proposalStatus = Accepted, finalizationAt = Just 259400 }] 1
  case applyCanonicalEvent emptyState acceptedState (Just finalizedEvent) adoptionEvent of
    Left err -> error ("FAIL: adoption rejected: " ++ err)
    Right st -> assert (proposalStatus (head (proposals st)) == Adopted)
      "ADOPTION_RECORDED follows finalized Accepted projection"
  putStrLn "GOV-28 ADOPTION RECORD CHECK PASSED"

  let lateChallenge = finalizationChallenge { challengeOpenedAt = 259400 }
  assert (not (validChallenges finalizationProposal [lateChallenge]))
    "reconstructed challenge at expiry boundary is invalid"

  let preExpiryFinalization = finalizedEvent { eventTimestamp = 259399 }
  case applyCanonicalEvent emptyState finalizationState Nothing preExpiryFinalization of
    Left _ -> putStrLn "PASS: premature DECISION_FINALIZED rejected"
    Right _ -> error "FAIL: premature DECISION_FINALIZED mutated state"

  let upheldRecord = finalizationRecord { decisionChallenges = [finalizationChallenge { challengeStatus = ChallengeUpheld }] }
      upheldEvent = finalizedEvent { eventPayload = PayloadDecisionFinalized upheldRecord }
  case applyCanonicalEvent emptyState finalizationState Nothing upheldEvent of
    Left _ -> putStrLn "PASS: upheld challenge blocks DECISION_FINALIZED"
    Right _ -> error "FAIL: upheld challenge allowed finalization"

  let tamperedRecord = finalizationRecord { decisionYesWeight = 61 }
      tamperedEvent = finalizedEvent { eventPayload = PayloadDecisionFinalized tamperedRecord }
  case applyCanonicalEvent emptyState finalizationState Nothing tamperedEvent of
    Left _ -> putStrLn "PASS: tampered decision witness rejected"
    Right _ -> error "FAIL: tampered decision witness accepted"

  let wrongState = GovernanceState 1 [finalizationProposal { proposalStatus = Accepted, finalizationAt = Nothing }] 0
  case applyCanonicalEvent emptyState wrongState Nothing finalizedEvent of
    Left _ -> putStrLn "PASS: DECISION_FINALIZED requires DecisionRecorded projection"
    Right _ -> error "FAIL: DECISION_FINALIZED accepted wrong proposal state"

  case applyCanonicalEvent emptyState finalizationState Nothing adoptionEvent of
    Left _ -> putStrLn "PASS: ADOPTION_RECORDED requires prior finalization"
    Right _ -> error "FAIL: ADOPTION_RECORDED bypassed finalization"

  let prematureAdoption = adoptionEvent { eventTimestamp = 259399, eventPayload = PayloadAdoptionRecorded 7 259399 }
  case applyCanonicalEvent emptyState acceptedState (Just finalizedEvent) prematureAdoption of
    Left _ -> putStrLn "PASS: ADOPTION_RECORDED timestamp cannot precede finalization"
    Right _ -> error "FAIL: ADOPTION_RECORDED preceded finalization"


