module Main where

import Governance
import GovernanceEventSchema
import GovernanceCanonicalReplay
import GovernanceAuthorization
import RulesetRegistry hiding (rulesetVersion)
import GovernanceCommitment

assert :: String -> Bool -> IO ()
assert label ok =
  if ok then putStrLn ("PASS " ++ label)
        else error ("FAIL " ++ label)

main :: IO ()
main = do
  let s = Snapshot 1 0 [(1,60),(2,40)]
      g = GateResult True True True True
      p = Proposal 1 DocumentationOnly s 0 Nothing Nothing Nothing Nothing Nothing [] [] g Draft
      e1 = CanonicalEvent "evt-1" 1 1 EProposalSubmitted Proposer 0
             (PayloadProposalSubmitted p) "r1" Nothing [EvidenceRef "e1"] AcceptedEvent
      e2 = CanonicalEvent "evt-2" 1 1 EStatusChanged System 1
             (PayloadStatusChanged 1 Proposed 1) "r1" (Just "evt-1")
             [EvidenceRef "e2"] AcceptedEvent
      rs = [RulesetDefinition 1 "ruleset-v1" 0 Nothing]
      committed e = e { payloadCommitment = commitmentDigestHex e }
      e1c = committed e1
      e2c = committed e2
      proposalFieldVariants =
        [ p { proposalStatus = Proposed }
        , p { communityReviewOpenedAt = Just 1 }
        , p { votingOpenedAt = Just 1 }
        , p { votingClosedAt = Just 1 }
        , p { finalizationAt = Just 1 }
        , p { emergencyActivatedAt = Just 1 }
        , p { proposalVotes = [Vote 1 1 For 0] }
        , p { proposalDelegations = [Delegation 1 2] }
        , p { proposalGates = GateResult False False False False }
        ]
      oldCommitmentStillMatches candidate =
        commitmentMatches (e1c { eventPayload = PayloadProposalSubmitted candidate })

  assert "canonical event schema" (eventSchemaValid e1c)
  assert "proposal commitment binds every state-bearing Proposal field"
    (all (not . oldCommitmentStillMatches) proposalFieldVariants)
  assert "proposal creation rejects preloaded terminal lifecycle state"
    (not (eventSchemaValid
      (e1c { eventPayload = PayloadProposalSubmitted (p { proposalStatus = Accepted }) })))
  assert "proposal creation rejects preloaded lifecycle timestamps"
    (not (eventSchemaValid
      (e1c { eventPayload = PayloadProposalSubmitted (p { votingOpenedAt = Just 1 }) })))
  assert "proposal creation rejects preloaded votes"
    (not (eventSchemaValid
      (e1c { eventPayload = PayloadProposalSubmitted (p { proposalVotes = [Vote 1 1 For 0] }) })))
  assert "proposal creation rejects preloaded delegations"
    (not (eventSchemaValid
      (e1c { eventPayload = PayloadProposalSubmitted (p { proposalDelegations = [Delegation 1 2] }) })))
  assert "legacy ProposalSubmitted projection rejects a preloaded lifecycle state"
    (case applyEvent emptyState (ProposalSubmitted (p { proposalStatus = Accepted })) of
       Left _ -> True
       Right _ -> False)
  assert "canonical commitment matches" (commitmentMatches e1c)
  assert "ruleset version is registered" (rulesetVersionRegistered 1 rs)
  assert "canonical predecessor" (predecessorValid (Just e1c) e2c)
  assert "canonical body deterministic" (canonicalEventBody e1 == canonicalEventBody e1)
  assert "classified payload timestamp is bound"
    (eventSchemaValid
      (e1c { eventType = EProposalClassified
          , eventPayload = PayloadProposalClassified 1 DocumentationOnly 7
          , eventTimestamp = 7
          , payloadCommitment = payloadCommitment e1c
          }))
  assert "classified payload timestamp mismatch rejected"
    (not (eventSchemaValid
      (e1c { eventType = EProposalClassified
          , eventPayload = PayloadProposalClassified 1 DocumentationOnly 7
          , eventTimestamp = 8
          })))
  assert "gates payload timestamp is bound"
    (eventSchemaValid
      (e1 { eventType = EGatesSet
          , actorClass = Reviewer
          , eventPayload = PayloadGatesSet 1 g 8
          , eventTimestamp = 8
          , payloadCommitment = "r1"
          }))
  assert "gates payload timestamp mismatch rejected"
    (not (eventSchemaValid
      (e1 { eventType = EGatesSet
          , actorClass = Reviewer
          , eventPayload = PayloadGatesSet 1 g 8
          , eventTimestamp = 9
          , payloadCommitment = "r1"
          })))
  assert "duplicate evidence refs rejected"
    (not (eventSchemaValid (e1 { evidenceRefs = [EvidenceRef "x", EvidenceRef "x"] })))
  assert "canonical authorization accepts declared proposer role"
    (canonicalGovernanceEventValid rs Nothing e1c)
  assert "self-authorization role mismatch rejected"
    (not (canonicalGovernanceEventValid rs Nothing
      (e1c { actorClass = Reviewer })))
  assert "incompatible ruleset commitment rejected"
    (not (canonicalGovernanceEventValid rs Nothing
      (e1c { payloadCommitment = "wrong-commitment" })))
  assert "unregistered ruleset rejected"
    (not (canonicalGovernanceEventValid rs Nothing
      (e1c { rulesetVersion = 2 })))

  let Right st1 = replayCanonical rs emptyState [e1c]
      bad = e2c { predecessor = Just "wrong" }
  assert "canonical replay applies event" (eventsApplied st1 == 1)
  assert "bad predecessor rejected"
    (case replayCanonical rs emptyState [e1c, bad] of Left _ -> True; Right _ -> False)

  let directCanonical = committed (e2 { eventId = "evt-canonical-direct"
                                      , eventTimestamp = 2
                                      , eventPayload = PayloadStatusChanged 1 Canonical 2
                                      , payloadCommitment = "" })
      validSequence = replayCanonical rs emptyState [e1c, e2c]
      sequentialApplication = do
        afterFirst <- applyCanonicalEvent rs emptyState Nothing e1c
        applyCanonicalEvent rs afterFirst (Just e1c) e2c
  assert "canonical replay applies valid sequence"
    (case validSequence of Right st -> eventsApplied st == 2; Left _ -> False)
  assert "canonical replay rejects direct lifecycle jump to Canonical"
    (case replayCanonical rs emptyState [e1c, directCanonical] of Left _ -> True; Right _ -> False)
  assert "canonical-only replay is deterministic" (validSequence == sequentialApplication)

  putStrLn "CANONICAL EVENT PHASE CHECKS PASSED"
