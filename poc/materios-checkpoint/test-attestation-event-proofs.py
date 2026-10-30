import importlib.util
import unittest
from pathlib import Path

SCRIPT = (
    Path(__file__).resolve().parent
    / "scripts"
    / "capture-attestation-event-proofs.py"
)
SPEC = importlib.util.spec_from_file_location("capture_attestation_event_proofs", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC is not None and SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


RECEIPT_ID = "0x" + "11" * 32
CERT_HASH = "0x" + "22" * 32
SIGNERS = [
    "5Dd7WuLMyb71NT1Bea6oEZH8Je3MkQzamHVeU4tmQbtPWq2v",
    "5FHyiV88YBjxMjjZroQKcjW2nGyvHsGrPYmP7HhUNBxEpdZ7",
    "5FNdLcDWmnDxtsUwznPaxFr9u7nop3K2kmYmvTaZRTVQExkT",
]


def event(index, block, event_id, attributes):
    return {
        "event_index": index,
        "block_number": block,
        "block_hash": "0x" + f"{block:064x}",
        "phase": {"ApplyExtrinsic": index},
        "module_id": "OrinqReceipts",
        "event_id": event_id,
        "attributes": attributes,
    }


def valid_history():
    result = [event(0, 100, "ReceiptSubmitted", {"receipt_id": RECEIPT_ID})]
    for count, signer in enumerate(SIGNERS, start=1):
        result.append(
            event(
                count,
                100 + count,
                "AttestationRecorded",
                {
                    "receipt_id": RECEIPT_ID,
                    "attester": signer,
                    "count": count,
                    "threshold": 3,
                },
            )
        )
    result.append(
        event(
            4,
            103,
            "AvailabilityCertified",
            {"receipt_id": RECEIPT_ID, "cert_hash": CERT_HASH},
        )
    )
    return result


class AttestationEventProofTests(unittest.TestCase):
    def test_scale_compact_encoding_boundaries(self):
        self.assertEqual(MODULE.compact_encode(0).hex(), "00")
        self.assertEqual(MODULE.compact_encode(63).hex(), "fc")
        self.assertEqual(MODULE.compact_encode(64).hex(), "0101")
        self.assertEqual(MODULE.compact_encode(16383).hex(), "fdff")
        self.assertEqual(MODULE.compact_encode(16384).hex(), "02000100")

    def test_storage_proof_scale_vec_bytes(self):
        encoded = MODULE.encode_storage_proof_scale(["0x0102", "0xaabbcc"])
        self.assertEqual(encoded, "0x080801020caabbcc")

    def test_complete_proof_coverage_includes_blocks_without_relevant_events(self):
        self.assertEqual(
            MODULE.require_complete_proof_block_coverage([100, 101, 102, 103], 100, 103),
            [100, 101, 102, 103],
        )

    def test_rejects_missing_system_events_proof_for_intermediate_block(self):
        with self.assertRaisesRegex(ValueError, "not complete and contiguous"):
            MODULE.require_complete_proof_block_coverage([100, 102, 103], 100, 103)

    def test_rejects_duplicate_system_events_proof_block(self):
        with self.assertRaisesRegex(ValueError, "not complete and contiguous"):
            MODULE.require_complete_proof_block_coverage([100, 101, 101, 102], 100, 102)

    def test_rejects_system_events_proof_outside_receipt_lifecycle(self):
        with self.assertRaisesRegex(ValueError, "not complete and contiguous"):
            MODULE.require_complete_proof_block_coverage([99, 100, 101, 102], 100, 102)

    def test_ss58_addresses_decode_to_expected_account_ids(self):
        expected = [
            "44f3bafbc393f24fcfabbf57d4ca73a6a6b5df358cdaa9480a517a97f189964b",
            "8ed446c7114fbeb751866e6752dedf36fba9b3d2832a9fc50a005e00ed0ab124",
            "925fe8605fe32a53a7b391498fc1b0ab91d3af7319607bd70b850b4f5fa9d255",
        ]
        self.assertEqual(
            [MODULE.ss58_account_id(address) for address in SIGNERS],
            expected,
        )

    def test_metadata_event_ss58_prefix_zero_normalizes_to_indexer_prefix_42(self):
        event_addresses = [
            "12ZQfEbRqNNUoz1hcD9oNi7HAG31SiYiqnE8dMt7xguuhAqa",
            "14JvUwUadZVSLQVTxRSb6QgJkjnTWLsAqGHG5kZuyYWvRRzX",
            "14EGrpPCPy1RoGk5pSTKktLBdtyZzApzU3VsGagpvGym19Za",
        ]
        expected = [
            MODULE.ss58_account_id(address)
            for address in SIGNERS
        ]
        self.assertEqual(
            [MODULE.account_id_from_event_value(address) for address in event_addresses],
            expected,
        )

    def test_attester_event_hex_and_ss58_normalize_to_same_account_id(self):
        account_id = MODULE.ss58_account_id(SIGNERS[0])
        self.assertEqual(
            MODULE.account_id_from_event_value("0x" + account_id),
            account_id,
        )
        self.assertEqual(
            MODULE.account_id_from_event_value(SIGNERS[0]),
            account_id,
        )

    def test_ss58_checksum_is_verified(self):
        mutated = SIGNERS[0][:-1] + ("1" if SIGNERS[0][-1] != "1" else "2")
        with self.assertRaisesRegex(ValueError, "checksum mismatch"):
            MODULE.ss58_account_id(mutated)

    def test_valid_event_history_matches_indexer_and_threshold(self):
        result = MODULE.validate_attestation_event_history(
            valid_history(), RECEIPT_ID, CERT_HASH, SIGNERS, 3, 103
        )
        self.assertEqual(result["attester_count"], 3)
        self.assertEqual(result["count_sequence"], [1, 2, 3])
        self.assertEqual(result["receipt_submission_block"], 100)

    def test_rejects_missing_attestation(self):
        history = valid_history()
        history = [item for item in history if item["event_id"] != "AttestationRecorded" or item["attributes"]["count"] != 2]
        with self.assertRaisesRegex(ValueError, "event count"):
            MODULE.validate_attestation_event_history(
                history, RECEIPT_ID, CERT_HASH, SIGNERS, 3, 103
            )

    def test_preserves_authenticated_event_signer_mismatch_when_requested(self):
        history = valid_history()
        history[1]["attributes"]["attester"] = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
        result = MODULE.validate_attestation_event_history(
            history,
            RECEIPT_ID,
            CERT_HASH,
            SIGNERS,
            3,
            103,
            allow_signer_mismatch=True,
        )
        self.assertFalse(result["signer_set_matches"])
        self.assertEqual(
            result["signer_set_mismatch"]["event_only_account_ids"],
            ["d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d"],
        )

    def test_rejects_signer_list_mismatch(self):
        history = valid_history()
        history[1]["attributes"]["attester"] = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
        with self.assertRaisesRegex(ValueError, "AccountId32 set differs"):
            MODULE.validate_attestation_event_history(
                history, RECEIPT_ID, CERT_HASH, SIGNERS, 3, 103
            )

    def test_rejects_wrong_count_sequence(self):
        history = valid_history()
        history[2]["attributes"]["count"] = 3
        with self.assertRaisesRegex(ValueError, "count sequence"):
            MODULE.validate_attestation_event_history(
                history, RECEIPT_ID, CERT_HASH, SIGNERS, 3, 103
            )

    def test_rejects_threshold_drift(self):
        history = valid_history()
        history[2]["attributes"]["threshold"] = 4
        with self.assertRaisesRegex(ValueError, "threshold differs"):
            MODULE.validate_attestation_event_history(
                history, RECEIPT_ID, CERT_HASH, SIGNERS, 3, 103
            )

    def test_rejects_wrong_cert_hash(self):
        history = valid_history()
        history[-1]["attributes"]["cert_hash"] = "0x" + "33" * 32
        with self.assertRaisesRegex(ValueError, "cert_hash does not match"):
            MODULE.validate_attestation_event_history(
                history, RECEIPT_ID, CERT_HASH, SIGNERS, 3, 103
            )

    def test_rejects_committee_change_after_submission_including_after_cert_event(self):
        history = valid_history()
        history.append(
            event(
                5,
                103,
                "CommitteeMemberJoined",
                {"who": SIGNERS[0], "committee_size": 69},
            )
        )
        with self.assertRaisesRegex(ValueError, "committee changed"):
            MODULE.validate_attestation_event_history(
                history, RECEIPT_ID, CERT_HASH, SIGNERS, 3, 103
            )

    def test_rejects_attestation_event_without_extrinsic_phase(self):
        history = valid_history()
        history[1]["phase"] = {"Initialization": None}
        with self.assertRaisesRegex(ValueError, "ApplyExtrinsic"):
            MODULE.validate_attestation_event_history(
                history, RECEIPT_ID, CERT_HASH, SIGNERS, 3, 103
            )


if __name__ == "__main__":
    unittest.main()
