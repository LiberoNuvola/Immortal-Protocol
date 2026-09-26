module Main where

import Governance
import GovernanceEventSchema
import GovernanceCanonicalReplay
import GovernanceFinality
import GovernanceDecisionWitness
import GovernanceConformanceWitness
import GovernanceCanonicalizationWitness
import GovernanceCommitment (commitmentDigestHex)
import RulesetRegistry

ruleset :: RulesetRegistry
ruleset = [RulesetDefinition 1 "ruleset-v1" 0 Nothing]

withCommitment :: CanonicalEvent -> CanonicalEvent
withCommitment e = e { payloadCommitment = commitmentDigestHex e }

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
    , decisionFinalOutcome = Accepted
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

mismatchedDecisionRulesetEvent :: CanonicalEvent
mismatchedDecisionRulesetEvent =
  finalizedEvent
    { eventPayload =
        PayloadDecisionFinalized
          (finalizationRecord { decisionRulesetVersion = 2 })
    }

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
  assert (not (canonicalizationRequiresConformance DocumentationOnly))
    "Documentation canonicalization does not require implementation conformance"
  assert (not (canonicalizationRequiresConformance VerificationTooling))
    "Verification/tooling canonicalization does not invent implementation conformance gate"
  assert (canonicalizationRequiresConformance Adapter)
    "Adapter canonicalization requires conformance"
  assert (canonicalizationRequiresConformance Application)
    "Application canonicalization requires conformance"
  assert (canonicalizationRequiresConformance Specification)
    "Specification canonicalization requires conformance"
  assert (canonicalizationRequiresConformance ConstitutionalKernel)
    "Constitutional/kernel canonicalization requires conformance"
  assert (not (canonicalizationRequiresConformance Emergency))
    "Emergency canonicalization does not silently become permanent conformance"
  assert (eventSchemaValid event1) "canonical payload matches event type"
  assert (eventSchemaValid event2) "status payload validates"
  assert (predecessorValid Nothing event1) "genesis predecessor"
  assert (predecessorValid (Just event1) event2) "predecessor chain"
  assert (lifecycleEventAdmissible (GovernanceState 1 [sampleProposal] 1) 1 Classified 1)
    "state-aware lifecycle admits valid classification"
  assert (not (lifecycleEventAdmissible (GovernanceState 1 [sampleProposal] 1) 1 Voting 1))
    "state-aware lifecycle rejects premature voting"
  assert (eventSchemaValid classifiedEvent) "classified payload timestamp matches event timestamp"
  assert (eventSchemaValid gatesEvent) "gates payload timestamp matches event timestamp"
  let classifiedTimestampMismatch =
        classifiedEvent { eventTimestamp = 8 }
  assert (not (eventSchemaValid classifiedTimestampMismatch))
    "classified payload/event timestamp mismatch rejected"
  let gatesTimestampMismatch =
        gatesEvent { eventTimestamp = 10 }
  assert (not (eventSchemaValid gatesTimestampMismatch))
    "gates payload/event timestamp mismatch rejected"
  case replayCanonical ruleset emptyState [withCommitment event1, withCommitment event2] of
    Left err -> error ("FAIL: replay rejected: " ++ err)
    Right st -> do
      assert (eventsApplied st == 2) "two canonical events applied"
      assert (length (proposals st) == 1) "proposal created from canonical payload"
      assert (proposalStatus (head (proposals st)) == Classified)
        "state derives directly from canonical events"

  let rulesetV2 =
        [ RulesetDefinition 1 "ruleset-v1" 0 Nothing
        , RulesetDefinition 2 "ruleset-v2" 100 (Just 1) ]
      futureRulesetEvent =
        withCommitment
          (event2 { rulesetVersion = 2
                  , eventTimestamp = 50
                  , eventPayload = PayloadStatusChanged 1 Proposed 50 })
      activeRulesetEvent =
        withCommitment
          (event2 { rulesetVersion = 2
                  , eventTimestamp = 100
                  , eventPayload = PayloadStatusChanged 1 Proposed 100 })
  assert "future ruleset rejected before effective timestamp"
    (not (canonicalGovernanceEventValid rulesetV2 Nothing futureRulesetEvent))
  assert "ruleset accepted at effective timestamp"
    (canonicalGovernanceEventValid rulesetV2 Nothing activeRulesetEvent)

  let duplicateIdEvent =
        withCommitment (event2 { eventId = eventId event1 })
  case replayCanonical ruleset emptyState
         [withCommitment event1, duplicateIdEvent] of
    Left _ -> putStrLn "PASS: duplicate canonical event id rejected"
    Right _ -> error "FAIL: duplicate canonical event id accepted"

  let lateEvent =
        withCommitment (event2 { eventTimestamp = 5
                               , eventPayload = PayloadStatusChanged 1 Classified 5 })
      regressedEvent =
        withCommitment
          (event2 { eventId = "evt-3"
                  , eventTimestamp = 4
                  , eventPayload = PayloadStatusChanged 1 ImpactReview 4
                  , predecessor = Just "evt-2"
                  , evidenceRefs = [EvidenceRef "regression-evidence"] })
  case replayCanonical ruleset emptyState
         [withCommitment event1, lateEvent, regressedEvent] of
    Left _ -> putStrLn "PASS: canonical event timestamp regression rejected"
    Right _ -> error "FAIL: canonical event timestamp regression accepted"
  case replayCanonical ruleset emptyState [withCommitment event1, withCommitment collapsedAcceptedEvent] of
    Left _ -> putStrLn "PASS: collapsed Accepted shortcut rejected before mutation"
    Right _ -> error "FAIL: collapsed Accepted shortcut mutated canonical state"

  assert (not (canonicalLifecycleAdmission emptyState collapsedAcceptedEvent))
    "canonical lifecycle admission rejects legacy terminal-state shortcut"

  putStrLn "GOV-28 CANONICAL LIFECYCLE ADMISSION CHECKS PASSED"
  let finalizationState = GovernanceState 1 [finalizationProposal] 0
  case applyCanonicalEvent ruleset emptyState finalizationState Nothing (withCommitment finalizedEvent) of
    Left err -> error ("FAIL: decision finalization rejected: " ++ err)
    Right st -> do
      assert (finalizationAt (head (proposals st)) == Just 259400)
        "DECISION_FINALIZED records finalization without collapsing to Canonical"
      assert (proposalStatus (head (proposals st)) == Accepted)
        "DECISION_FINALIZED advances the compatible Accepted projection"

  putStrLn "GOV-28 DECISION FINALIZATION CHECKS PASSED"
  let rejectedProposal = finalizationProposal
        { proposalId = 8
        , proposalVotes = [Vote 8 1 Against 150, Vote 8 2 Abstain 150]
        , proposalStatus = DecisionRecorded
        }
      rejectedChallenge = Challenge "ch-8" 8 250 ChallengeRejected
      rejectedRecord = finalizationRecord
        { decisionProposalId = 8
        , decisionYesWeight = 0
        , decisionNoWeight = 60
        , decisionAbstentionWeight = 40
        , decisionApprovalReached = False
        , decisionFinalOutcome = Rejected
        , decisionChallenges = [rejectedChallenge]
        , decisionCanonicalizationReference = "canon-ref-8"
        }
      rejectedEvent = finalizedEvent
        { eventProposalId = 8
        , eventPayload = PayloadDecisionFinalized rejectedRecord
        }
      rejectedState = GovernanceState 1 [rejectedProposal] 0
  case applyCanonicalEvent ruleset emptyState rejectedState Nothing (withCommitment rejectedEvent) of
    Left err -> error ("FAIL: rejected decision finalization rejected: " ++ err)
    Right st -> do
      assert (proposalStatus (head (proposals st)) == Rejected)
        "DECISION_FINALIZED preserves a failed decision as Rejected"
      assert (finalizationAt (head (proposals st)) == Just 259400)
        "Rejected decision still records deterministic finalization time"

  putStrLn "GOV-28 REJECTED DECISION FINALIZATION CHECK PASSED"
  let acceptedState = GovernanceState 1 [finalizationProposal { proposalStatus = Accepted, finalizationAt = Just 259400 }] 1
  case applyCanonicalEvent ruleset emptyState acceptedState (Just (withCommitment finalizedEvent)) (withCommitment adoptionEvent) of
    Left err -> error ("FAIL: adoption rejected: " ++ err)
    Right st -> assert (proposalStatus (head (proposals st)) == Adopted)
      "ADOPTION_RECORDED follows finalized Accepted projection"
  putStrLn "GOV-28 ADOPTION RECORD CHECK PASSED"

  assert "decision witness ruleset must match event ruleset"
    (not (eventSchemaValid mismatchedDecisionRulesetEvent))

  let conformanceRecord = ConformanceRecord
        { conformanceProposalId = 7
        , conformanceImplementationCommit = "impl-commit-7"
        , conformanceRulesetVersion = 1
        , conformanceTestVectorVersion = "gov-v0.1-tests"
        , conformanceEnvironmentToolchain = "ghc-test-env"
        , conformanceTestResults = "all-mandatory-pass"
        , conformanceFailedTestRecord = Nothing
        , conformanceCanonicalInputFixtures = "fixtures-7"
        , conformanceReplayOutput = "replay-7"
        }
      conformanceEvent = CanonicalEvent
        "evt-conformance" 7 1 EConformanceRecorded Reviewer 259402
        (PayloadConformanceRecorded conformanceRecord)
        "payload-conformance" (Just "evt-adopted") [EvidenceRef "conformance-evidence"] AcceptedEvent

  let mismatchedConformanceEvent =
        conformanceEvent
          { eventPayload =
              PayloadConformanceRecorded
                (conformanceRecord { conformanceRulesetVersion = 2 })
          }
  assert "conformance witness ruleset must match event ruleset"
    (not (eventSchemaValid mismatchedConformanceEvent))
  let adoptedState =
        GovernanceState 1
          [finalizationProposal { proposalStatus = Adopted, finalizationAt = Just 259400 }]
          2
  case applyCanonicalEvent ruleset emptyState adoptedState (Just (withCommitment adoptionEvent)) (withCommitment conformanceEvent) of
    Left err -> error ("FAIL: conformance rejected: " ++ err)
    Right st -> assert (eventsApplied st == 3)
      "CONFORMANCE_RECORDED follows Adopted projection"

  let regressedConformance =
        withCommitment
          (conformanceEvent { eventTimestamp = 1
                            , evidenceRefs = [EvidenceRef "regressed-conformance-evidence"] })
  case applyCanonicalEvent ruleset emptyState adoptedState
         (Just (withCommitment adoptionEvent)) regressedConformance of
    Left _ -> putStrLn "PASS: CONFORMANCE_RECORDED timestamp regression rejected"
    Right _ -> error "FAIL: CONFORMANCE_RECORDED timestamp regression accepted"

  let canonicalizationRecord = CanonicalizationRecord
        { canonicalizationProposalId = 7
        , canonicalizationTargetArtifact = "governance-spec-v0.1"
        , canonicalizationVersionTransition = "v0.1-rc-to-v0.1"
        , canonicalizationDecisionRecordReference = "canon-ref-7"
        , canonicalizationEvidenceReferences = ["decision-evidence-7","conformance-evidence"]
        , canonicalizationConformanceEvidence = Just "conformance-evidence"
        , canonicalizationCompatibilityUpgradeResult = Nothing
        , canonicalizationMandatoryGatesResolved = True
        , canonicalizationVersionIdentifier = "governance-v0.1"
        }
      canonicalizationEvent = CanonicalEvent
        "evt-canonicalized" 7 1 ECanonicalized System 259403
        (PayloadCanonicalized canonicalizationRecord)
        "payload-canonicalized" (Just "evt-conformance") [EvidenceRef "canonicalization-evidence"] AcceptedEvent
      canonicalizedState = GovernanceState 1 [finalizationProposal { proposalStatus = Adopted, finalizationAt = Just 259400 }] 3
  case applyCanonicalEvent ruleset emptyState canonicalizedState (Just (withCommitment conformanceEvent)) (withCommitment canonicalizationEvent) of
    Left err -> error ("FAIL: canonicalization rejected: " ++ err)
    Right st -> assert (proposalStatus (head (proposals st)) == Canonical)
      "CANONICALIZED follows Adopted + conformance projection"

  case replayCanonical ruleset finalizationState
         [ withCommitment finalizedEvent
         , withCommitment adoptionEvent
         , withCommitment conformanceEvent
         , withCommitment canonicalizationEvent
         ] of
    Left err -> error ("FAIL: canonical replay rejected valid decision reference: " ++ err)
    Right st -> assert (proposalStatus (head (proposals st)) == Canonical)
      "canonical replay binds CANONICALIZED to the finalized DecisionRecord reference"

  let mismatchedReference = canonicalizationRecord { canonicalizationDecisionRecordReference = "canon-ref-tampered" }
      mismatchedReferenceEvent = canonicalizationEvent { eventPayload = PayloadCanonicalized mismatchedReference }
  case replayCanonical ruleset finalizationState
         [ withCommitment finalizedEvent
         , withCommitment adoptionEvent
         , withCommitment conformanceEvent
         , withCommitment mismatchedReferenceEvent
         ] of
    Left _ -> putStrLn "PASS: canonicalization reference mismatch blocks canonical replay"
    Right _ -> error "FAIL: canonical replay accepted mismatched DecisionRecord reference"

  let badCanonicalization = canonicalizationRecord { canonicalizationMandatoryGatesResolved = False }
      badCanonicalizationEvent = canonicalizationEvent { eventPayload = PayloadCanonicalized badCanonicalization }
  case applyCanonicalEvent ruleset emptyState canonicalizedState (Just (withCommitment conformanceEvent)) (withCommitment badCanonicalizationEvent) of
    Left _ -> putStrLn "PASS: unresolved mandatory gate blocks CANONICALIZED"
    Right _ -> error "FAIL: CANONICALIZED accepted unresolved mandatory gate"

  let missingConformanceCanonicalization = canonicalizationEvent { predecessor = Just "evt-adopted" }
  case applyCanonicalEvent ruleset emptyState canonicalizedState (Just (withCommitment adoptionEvent)) (withCommitment missingConformanceCanonicalization) of
    Left _ -> putStrLn "PASS: missing conformance predecessor blocks CANONICALIZED"
    Right _ -> error "FAIL: CANONICALIZED bypassed conformance"

  let earlyCanonicalization = canonicalizationEvent { eventTimestamp = 259401 }
  case applyCanonicalEvent ruleset emptyState canonicalizedState (Just (withCommitment conformanceEvent)) (withCommitment earlyCanonicalization) of
    Left _ -> putStrLn "PASS: CANONICALIZED cannot precede conformance event"
    Right _ -> error "FAIL: CANONICALIZED preceded conformance"

  let tamperedConformance = conformanceRecord { conformanceFailedTestRecord = Just "mandatory-failure" }
      tamperedConformanceEvent = conformanceEvent { eventPayload = PayloadConformanceRecorded tamperedConformance }
  case applyCanonicalEvent ruleset emptyState adoptedState (Just (withCommitment adoptionEvent)) (withCommitment tamperedConformanceEvent) of
    Left _ -> putStrLn "PASS: failed conformance evidence blocks CONFORMANCE_RECORDED"
    Right _ -> error "FAIL: failed conformance evidence accepted"

  let lateChallenge = finalizationChallenge { challengeOpenedAt = 259400 }
  assert (not (validChallenges finalizationProposal [lateChallenge]))
    "reconstructed challenge at expiry boundary is invalid"

  let preExpiryFinalization = finalizedEvent { eventTimestamp = 259399 }
  case applyCanonicalEvent ruleset emptyState finalizationState Nothing (withCommitment preExpiryFinalization) of
    Left _ -> putStrLn "PASS: premature DECISION_FINALIZED rejected"
    Right _ -> error "FAIL: premature DECISION_FINALIZED mutated state"

  let upheldRecord = finalizationRecord { decisionChallenges = [finalizationChallenge { challengeStatus = ChallengeUpheld }] }
      upheldEvent = finalizedEvent { eventPayload = PayloadDecisionFinalized upheldRecord }
  case applyCanonicalEvent ruleset emptyState finalizationState Nothing (withCommitment upheldEvent) of
    Left _ -> putStrLn "PASS: upheld challenge blocks DECISION_FINALIZED"
    Right _ -> error "FAIL: upheld challenge allowed finalization"

  let tamperedRecord = finalizationRecord { decisionYesWeight = 61 }
      tamperedEvent = finalizedEvent { eventPayload = PayloadDecisionFinalized tamperedRecord }
  case applyCanonicalEvent ruleset emptyState finalizationState Nothing (withCommitment tamperedEvent) of
    Left _ -> putStrLn "PASS: tampered decision witness rejected"
    Right _ -> error "FAIL: tampered decision witness accepted"
  let wrongOutcomeRecord = finalizationRecord { decisionFinalOutcome = DecisionRecorded }
      wrongOutcomeEvent = finalizedEvent { eventPayload = PayloadDecisionFinalized wrongOutcomeRecord }
  case applyCanonicalEvent ruleset emptyState finalizationState Nothing (withCommitment wrongOutcomeEvent) of
    Left _ -> putStrLn "PASS: finalized decision must record Accepted outcome"
    Right _ -> error "FAIL: DecisionRecorded accepted as finalized outcome"

  let wrongState = GovernanceState 1 [finalizationProposal { proposalStatus = Accepted, finalizationAt = Nothing }] 0
  case applyCanonicalEvent ruleset emptyState wrongState Nothing (withCommitment finalizedEvent) of
    Left _ -> putStrLn "PASS: DECISION_FINALIZED requires DecisionRecorded projection"
    Right _ -> error "FAIL: DECISION_FINALIZED accepted wrong proposal state"

  case applyCanonicalEvent ruleset emptyState finalizationState Nothing (withCommitment adoptionEvent) of
    Left _ -> putStrLn "PASS: ADOPTION_RECORDED requires prior finalization"
    Right _ -> error "FAIL: ADOPTION_RECORDED bypassed finalization"

  let prematureAdoption = adoptionEvent { eventTimestamp = 259399, eventPayload = PayloadAdoptionRecorded 7 259399 }
  case applyCanonicalEvent ruleset emptyState acceptedState (Just (withCommitment finalizedEvent)) (withCommitment prematureAdoption) of
    Left _ -> putStrLn "PASS: ADOPTION_RECORDED timestamp cannot precede finalization"
    Right _ -> error "FAIL: ADOPTION_RECORDED preceded finalization"



-- Exact-head conformance trigger: GOV-28 replay hardening current-head evidence 2026-09-26.
