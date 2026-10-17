module Main where

import Governance
import GovernanceEventSchema
import GovernanceAuthorization
import GovernanceCanonicalReplay
import GovernanceCommitment
import qualified RulesetRegistry

assert :: String -> Bool -> IO ()
assert label ok =
  if ok then putStrLn ("PASS " ++ label)
        else error ("FAIL " ++ label)

main :: IO ()
main = do
  let snapshot = Snapshot 1 0 [(1,60),(2,40)]
      gates = GateResult True True True True
      proposal =
        Proposal 1 DocumentationOnly snapshot 0 Nothing Nothing Nothing Nothing
          Nothing [] [] gates Proposed
      rules = [RulesetRegistry.RulesetDefinition 1 "ruleset-v1" 0 Nothing]
      base =
        CanonicalEvent "ag-evt-1" 1 1 EProposalSubmitted Proposer 0
          (PayloadProposalSubmitted proposal) "" Nothing [EvidenceRef "ag-e1"]
          AcceptedEvent
      committed e = e { payloadCommitment = commitmentDigestHex e }
      valid = committed base

  assert "AG-01 candidate cannot self-authorize"
    (not (canonicalGovernanceEventValid rules Nothing
      (valid { actorClass = Reviewer })))

  assert "AG-04 ruleset commitment is bound"
    (not (canonicalGovernanceEventValid rules Nothing
      (valid { payloadCommitment = "mutated-commitment" })))

  assert "AG-08 unregistered ruleset is rejected"
    (not (canonicalGovernanceEventValid rules Nothing
      (valid { GovernanceEventSchema.rulesetVersion = 2 })))

  let badPredecessor =
        committed
          (CanonicalEvent "ag-evt-2" 1 1 EProposalSubmitted Proposer 1
            (PayloadProposalSubmitted proposal) "" (Just "wrong")
            [EvidenceRef "ag-e2"] AcceptedEvent)

  assert "AG-07 predecessor mismatch is rejected"
    (case replayCanonical rules emptyState [valid, badPredecessor] of
       Left _ -> True
       Right _ -> False)

  let directCanonical =
        committed
          (CanonicalEvent "ag-evt-canonical" 1 1 EStatusChanged System 1
            (PayloadStatusChanged 1 Canonical 1) "" (Just "ag-evt-1")
            [EvidenceRef "ag-e3"] AcceptedEvent)

  assert "AG-05 lifecycle amendment/adaptation boundary is preserved"
    (case replayCanonical rules (either (error . id) id (replayCanonical rules emptyState [valid]))
          [directCanonical] of
       Left _ -> True
       Right _ -> False)

  assert "AG-03 payload and event type cannot be retagged"
    (not (eventSchemaValid
      (valid { eventType = EStatusChanged })))


  assert "AG-10 missing evidence is rejected"
    (not (canonicalGovernanceEventValid rules Nothing
      (valid { evidenceRefs = [] })))

  let directAdoption =
        committed
          (CanonicalEvent "ag-evt-adopt" 1 1 EAdoptionRecorded System 1
            (PayloadAdoptionRecorded 1 1) "" (Just "ag-evt-1")
            [EvidenceRef "ag-e4"] AcceptedEvent)

  assert "AG-06 adoption cannot bypass its required predecessor state"
    (case replayCanonical rules emptyState [valid, directAdoption] of
       Left _ -> True
       Right _ -> False)


  -- AG-02: an application-level gate cannot weaken the existing constitutional gates.
  let weakenedKernelGates = GateResult True True False True
  assert "AG-02 constitutional invariant cannot be weakened by application gate"
    (not (gatesPassed ConstitutionalKernel weakenedKernelGates))

  -- AG-03: an environment-supplied timestamp is an input, not authority to skip lifecycle timing.
  let environmentTimedProposal = proposal
        { proposalStatus = CommunityReview
        , communityReviewOpenedAt = Just 100
        }
  assert "AG-03 environment timestamp cannot bypass the review interval"
    (not (statusChangeAllowed environmentTimedProposal Voting
      (100 + communityReviewSeconds - 1)))
  assert "AG-03 transition becomes time-eligible only at the declared boundary"
    (statusChangeAllowed environmentTimedProposal Voting
      (100 + communityReviewSeconds))

  -- AG-09: application policy remains profile-scoped; it does not replace kernel-class gates.
  assert "AG-09 Application requires its own conformance gate"
    (not (gatesPassed Application (GateResult True True True False)))
  assert "AG-09 application gate is not silently imposed as universal law"
    (gatesPassed VerificationTooling (GateResult True True True False))

  putStrLn "AG-01 EXECUTABLE GOVERNABILITY NEGATIVE MATRIX PASSED"
