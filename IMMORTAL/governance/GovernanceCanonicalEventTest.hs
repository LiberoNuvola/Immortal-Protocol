module Main where

import Governance
import GovernanceEventSchema
import GovernanceCanonicalReplay
import RulesetRegistry

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
      rs = [RulesetDefinition 1 "r1" 0 Nothing]

  assert "canonical event schema" (eventSchemaValid e1)
  assert "canonical predecessor" (predecessorValid (Just e1) e2)
  assert "canonical body deterministic" (canonicalEventBody e1 == canonicalEventBody e1)
  assert "classified payload timestamp is bound"
    (eventSchemaValid
      (e1 { eventType = EProposalClassified
          , eventPayload = PayloadProposalClassified 1 DocumentationOnly 7
          , eventTimestamp = 7
          , payloadCommitment = "r1"
          }))
  assert "gates payload timestamp is bound"
    (eventSchemaValid
      (e1 { eventType = EGatesSet
          , actorClass = Reviewer
          , eventPayload = PayloadGatesSet 1 g 8
          , eventTimestamp = 8
          , payloadCommitment = "r1"
          }))
  assert "duplicate evidence refs rejected"
    (not (eventSchemaValid (e1 { evidenceRefs = [EvidenceRef "x", EvidenceRef "x"] })))

  let Right st1 = replayCanonical rs emptyState [e1]
      bad = e2 { predecessor = Just "wrong" }
  assert "canonical replay applies event" (eventsApplied st1 == 1)
  assert "bad predecessor rejected"
    (case replayCanonical rs st1 [bad] of Left _ -> True; Right _ -> False)

  let Right st2 = replayCanonical rs st1 [e2]
      Right st2' = replayCanonical rs emptyState [e1, e2]
  assert "canonical-only replay is deterministic" (st2 == st2')

  putStrLn "CANONICAL EVENT PHASE CHECKS PASSED"
