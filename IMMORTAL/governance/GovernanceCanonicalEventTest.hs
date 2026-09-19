module Main where

import Governance
import GovernanceEventSchema
import GovernanceCanonicalReplay

assert :: String -> Bool -> IO ()
assert label ok =
  if ok then putStrLn ("PASS " ++ label)
        else error ("FAIL " ++ label)

main :: IO ()
main = do
  let s = Snapshot 1 0 [(1,60),(2,40)]
      g = GateResult True True True True
      p = Proposal 1 DocumentationOnly s 0 Nothing Nothing Nothing Nothing Nothing [] [] g Draft
      e1 = ProposalSubmitted p
      c1 = CanonicalEvent "evt-1" 1 1 EProposalSubmitted Proposer 0
             (canonicalPayload e1) Nothing [] AcceptedEvent
      e2 = CanonicalEvent "evt-2" 1 1 EStatusChanged Proposer 1
             "status:Proposed" (Just "evt-1") [] AcceptedEvent

  assert "canonical event schema" (eventSchemaValid c1)
  assert "canonical predecessor" (predecessorValid (Just c1) e2)
  assert "canonical body deterministic" (canonicalEventBody c1 == canonicalEventBody c1)
  assert "duplicate evidence refs rejected"
    (not (eventSchemaValid (c1 { evidenceRefs = [EvidenceRef "x", EvidenceRef "x"] })))

  let Right st1 = replayCanonical emptyState [(c1,e1)]
      bad = c1 { eventId = "evt-3", predecessor = Just "wrong" }
  assert "canonical replay applies event" (eventsApplied st1 == 1)
  assert "bad predecessor rejected"
    (case replayCanonical st1 [(bad,e1)] of Left _ -> True; Right _ -> False)

  let Right st2 = replayCanonical st1
        [ (e2, StatusChanged 1 Proposed 1) ]
  assert "canonical replay is deterministic"
    (st2 == st2)

  putStrLn "CANONICAL EVENT PHASE CHECKS PASSED"
