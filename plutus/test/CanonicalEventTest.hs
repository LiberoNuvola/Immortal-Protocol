module Main where
import CanonicalEvent
assert :: String -> Bool -> IO ()
assert l ok = if ok then putStrLn ("PASS " ++ l) else error ("FAIL " ++ l)
mk :: EventId -> EventType -> Maybe EventId -> [String] -> CanonicalEvent
mk i t p ev = CanonicalEvent i 1 1 t GovernanceActor i ("commit-" ++ show i) p ev EventProposed
main :: IO ()
main = do
 let e1=mk 1 ProposalCreated Nothing []; e2=mk 2 ProposalClassified (Just 1) []; e3=mk 3 ImpactReviewCompleted (Just 2) []; e4=mk 4 EvidenceRecorded (Just 3) ["e4"]; e5=mk 5 CommunityReviewOpened (Just 4) ["r5"]; e6=mk 6 VotingOpened (Just 5) ["s6"]; e7=mk 7 VoteCast (Just 6) []; e8=mk 8 VotingClosed (Just 7) []; e9=mk 9 DecisionFinalized (Just 8) ["challenge-expired"]
 assert "first event" (validEvent 1 [] e1)
 assert "predecessor" (validEvent 1 [e1] e2)
 assert "wrong predecessor" (not (validEvent 1 [e1] e3))
 assert "ruleset binding" (not (validEvent 2 [] e1))
 assert "commitment required" (not (validEvent 1 [] e1 {payloadCommitment=""}))
 assert "evidence required" (not (validEvent 1 [e1,e2,e3] (mk 4 EvidenceRecorded (Just 3) [])))
 assert "transition" (not (validEvent 1 [e1,e2,e3,e4] e6))
 assert "deterministic replay" (case replayCanonical 1 [e1,e2,e3,e4,e5,e6,e7,e8,e9] of Right h -> length h == 9; Left _ -> False)
 assert "invalid event cannot mutate" (case replayCanonical 1 [e1,e3] of Left _ -> True; Right _ -> False)
 putStrLn "GOV-19 CANONICAL EVENT CHECKS PASSED"
