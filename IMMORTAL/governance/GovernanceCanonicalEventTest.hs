module Main where

import Governance
import GovernanceEventSchema
import GovernanceCanonicalReplay
import RulesetRegistry
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

  assert "canonical event schema" (eventSchemaValid e1c)
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
    (case replayCanonical rs st1 [bad] of Left _ -> True; Right _ -> False)

  let Right st2 = replayCanonical rs st1 [e2c]
      directCanonical = committed (e2 { eventId = "evt-canonical-direct"
                                      , eventTimestamp = 2
                                      , eventPayload = PayloadStatusChanged 1 Canonical 2
                                      , payloadCommitment = "" })
  assert "canonical replay rejects direct lifecycle jump to Canonical"
    (case replayCanonical rs st1 [directCanonical] of Left _ -> True; Right _ -> False)
      Right st2' = replayCanonical rs emptyState [e1c, e2c]
  assert "canonical-only replay is deterministic" (st2 == st2')

  putStrLn "CANONICAL EVENT PHASE CHECKS PASSED"
