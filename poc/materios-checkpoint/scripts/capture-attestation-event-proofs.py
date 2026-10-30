#!/usr/bin/env python3
"""Capture and verify Materios OrinqReceipts attestation event storage.

This script decodes historical System.Events using the runtime metadata at
each block. It does not hand-decode EventRecord SCALE layouts. For each block
containing relevant events, it writes the raw System.Events value and native
Substrate read proof; Rust verifies those bytes against that block's stateRoot.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sys
from pathlib import Path
from typing import Any


RECEIPT_ID_RE = re.compile(r"^0x[0-9a-f]{64}$", re.IGNORECASE)
HASH_RE = re.compile(r"^0x[0-9a-f]{64}$", re.IGNORECASE)
ATTESTATION_EVENT = "AttestationRecorded"
CERTIFIED_EVENT = "AvailabilityCertified"
SUBMITTED_EVENT = "ReceiptSubmitted"
COMMITTEE_MUTATIONS = {
    "CommitteeUpdated",
    "CommitteeMemberJoined",
    "CommitteeMemberLeft",
}
TARGET_EVENT_IDS = {
    ATTESTATION_EVENT,
    CERTIFIED_EVENT,
    SUBMITTED_EVENT,
}
BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"


def ss58_account_id(value: str, expected_prefix: int = 42) -> str:
    """Decode/checksum-verify a Materios SS58 AccountId32 address."""
    if not isinstance(value, str) or not value:
        raise ValueError("SS58 address is empty")
    number = 0
    for character in value:
        digit = BASE58_ALPHABET.find(character)
        if digit < 0:
            raise ValueError("SS58 address contains a non-Base58 character")
        number = number * 58 + digit

    decoded = bytearray()
    while number:
        decoded.insert(0, number & 0xff)
        number >>= 8
    leading_zeroes = len(value) - len(value.lstrip("1"))
    decoded = bytearray(b"\\x00" * leading_zeroes) + decoded

    if len(decoded) != 35:
        raise ValueError(f"SS58 AccountId32 must decode to 35 bytes, got {len(decoded)}")
    if decoded[0] != expected_prefix:
        raise ValueError(
            f"SS58 prefix mismatch: expected {expected_prefix}, got {decoded[0]}"
        )
    expected = hashlib.blake2b(b"SS58PRE" + decoded[:33], digest_size=64).digest()[:2]
    if bytes(decoded[33:35]) != expected:
        raise ValueError("SS58 checksum mismatch")
    return bytes(decoded[1:33]).hex()


def account_id_from_event_value(value: Any) -> str:
    """Normalize either an AccountId32 hex value or an SS58 address."""
    if isinstance(value, str) and value.lower().startswith("0x"):
        raw = normalize_hex(value, "event attester")
        if len(raw) != 66:
            raise ValueError("event attester hex must be a 32-byte AccountId")
        return raw[2:]
    if isinstance(value, str):
        return ss58_account_id(value)
    raw = normalize_hex(value, "event attester")
    if len(raw) != 66:
        raise ValueError("event attester bytes must be a 32-byte AccountId")
    return raw[2:]


def normalize_hex(value: Any, field: str) -> str:
    if isinstance(value, str):
        result = value if value.startswith("0x") else "0x" + value
    elif isinstance(value, (bytes, bytearray)):
        result = "0x" + bytes(value).hex()
    elif isinstance(value, (list, tuple)) and all(
        isinstance(part, int) and 0 <= part <= 255 for part in value
    ):
        result = "0x" + bytes(value).hex()
    else:
        raise ValueError(f"{field} must be hex text or byte data")
    if not re.fullmatch(r"0x(?:[0-9a-fA-F]{2})*", result):
        raise ValueError(f"{field} is not whole-byte hex")
    return result.lower()


def compact_encode(value: int) -> bytes:
    if not isinstance(value, int) or value < 0:
        raise ValueError("SCALE compact value must be a non-negative integer")
    if value < 1 << 6:
        return bytes([value << 2])
    if value < 1 << 14:
        encoded = (value << 2) | 1
        return encoded.to_bytes(2, "little")
    if value < 1 << 30:
        encoded = (value << 2) | 2
        return encoded.to_bytes(4, "little")
    length = max(4, (value.bit_length() + 7) // 8)
    if length > 67:
        raise ValueError("SCALE compact value exceeds supported byte length")
    return bytes([((length - 4) << 2) | 3]) + value.to_bytes(length, "little")


def encode_storage_proof_scale(nodes: list[str]) -> str:
    encoded = bytearray(compact_encode(len(nodes)))
    for index, node in enumerate(nodes):
        raw = bytes.fromhex(normalize_hex(node, f"proof node {index}")[2:])
        encoded.extend(compact_encode(len(raw)))
        encoded.extend(raw)
    return "0x" + encoded.hex()


def _plain(value: Any) -> Any:
    if hasattr(value, "value"):
        try:
            return value.value
        except Exception:
            return value
    return value


def event_record_to_dict(record: Any, event_index: int) -> dict[str, Any]:
    """Extract a metadata-decoded EventRecord without assuming raw SCALE layout."""
    outer = _plain(record)
    if not isinstance(outer, dict):
        raise ValueError(f"decoded System.Events record {event_index} is not a mapping")

    payload = _plain(outer.get("event", outer))
    if not isinstance(payload, dict):
        raise ValueError(f"decoded event payload {event_index} is not a mapping")

    module_id = payload.get("module_id", payload.get("pallet"))
    event_id = payload.get("event_id", payload.get("variant"))
    attributes = _plain(payload.get("attributes", payload.get("args", {})))
    if not isinstance(attributes, dict):
        raise ValueError(f"decoded event attributes {event_index} are not a mapping")

    return {
        "event_index": event_index,
        "phase": json_safe(_plain(outer.get("phase"))),
        "module_id": str(module_id) if module_id is not None else "",
        "event_id": str(event_id) if event_id is not None else "",
        "attributes": json_safe(attributes),
    }


def json_safe(value: Any) -> Any:
    value = _plain(value)
    if isinstance(value, bytes):
        return "0x" + value.hex()
    if isinstance(value, bytearray):
        return "0x" + bytes(value).hex()
    if isinstance(value, dict):
        return {str(key): json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_safe(item) for item in value]
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if hasattr(value, "value"):
        return json_safe(value.value)
    return str(value)


def _as_int(value: Any, field: str) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"{field} is not an integer") from error
    if parsed < 0:
        raise ValueError(f"{field} must be non-negative")
    return parsed


def target_event_for_receipt(
    event: dict[str, Any], receipt_id: str
) -> bool:
    if event["module_id"] != "OrinqReceipts":
        return False
    if event["event_id"] not in TARGET_EVENT_IDS:
        return False
    raw_id = event["attributes"].get("receipt_id")
    try:
        return normalize_hex(raw_id, "event receipt_id") == receipt_id.lower()
    except ValueError:
        return False


def validate_attestation_event_history(
    events: list[dict[str, Any]],
    receipt_id: str,
    cert_hash: str,
    expected_signers: list[str],
    threshold: int,
    certification_block: int,
) -> dict[str, Any]:
    """Fail closed unless event history exactly reconstructs the indexed cert."""
    if not expected_signers:
        raise ValueError("events indexer returned an empty signer list")
    expected = [signer.strip() for signer in expected_signers]
    if any(not signer for signer in expected) or len(set(expected)) != len(expected):
        raise ValueError("expected signer list is empty or contains duplicates")
    if threshold < 1:
        raise ValueError("on-chain attestation threshold must be positive")

    matching = [
        event
        for event in events
        if target_event_for_receipt(event, receipt_id)
    ]
    matching.sort(key=lambda item: (item["block_number"], item["event_index"]))

    submitted = [
        event for event in matching if event["event_id"] == SUBMITTED_EVENT
    ]
    attestations = [
        event for event in matching if event["event_id"] == ATTESTATION_EVENT
    ]
    certified = [
        event for event in matching if event["event_id"] == CERTIFIED_EVENT
    ]

    if len(submitted) != 1:
        raise ValueError(
            f"expected exactly one ReceiptSubmitted event, found {len(submitted)}"
        )
    if len(certified) != 1:
        raise ValueError(
            f"expected exactly one AvailabilityCertified event, found {len(certified)}"
        )
    if certified[0]["block_number"] != certification_block:
        raise ValueError("AvailabilityCertified event block does not match indexer")
    actual_cert_hash = normalize_hex(
        certified[0]["attributes"].get("cert_hash"), "AvailabilityCertified cert_hash"
    )
    if actual_cert_hash != cert_hash.lower():
        raise ValueError("AvailabilityCertified event cert_hash does not match indexer")

    attester_addresses: list[str] = []
    attester_account_ids: list[str] = []
    counts: list[int] = []
    event_thresholds: list[int] = []
    for event in attestations:
        attrs = event["attributes"]
        attester = attrs.get("attester")
        if not isinstance(attester, str) or not attester:
            raise ValueError("AttestationRecorded attester is missing or invalid")
        attester_addresses.append(attester)
        attester_account_ids.append(account_id_from_event_value(attester))
        counts.append(_as_int(attrs.get("count"), "AttestationRecorded count"))
        event_thresholds.append(
            _as_int(attrs.get("threshold"), "AttestationRecorded threshold")
        )

    if len(attestations) != len(expected):
        raise ValueError(
            f"AttestationRecorded event count {len(attestations)} does not match "
            f"indexer signer count {len(expected)}"
        )
    if len(set(attester_account_ids)) != len(attester_account_ids):
        raise ValueError("AttestationRecorded events contain duplicate AccountId32 values")

    expected_account_ids = [ss58_account_id(address) for address in expected]
    if set(attester_account_ids) != set(expected_account_ids):
        raise ValueError(
            "AttestationRecorded AccountId32 set differs from indexer signers: "
            f"events={sorted(attester_account_ids)} "
            f"indexer={sorted(expected_account_ids)} "
            f"event_addresses={attester_addresses} indexer_addresses={expected}"
        )
    if event_thresholds != [threshold] * len(attestations):
        raise ValueError(
            "AttestationRecorded event threshold differs from authenticated "
            "block-end threshold"
        )
    if counts != list(range(1, len(attestations) + 1)):
        raise ValueError(
            "AttestationRecorded count sequence is not exactly 1..N: "
            + repr(counts)
        )

    submitted_key = (
        submitted[0]["block_number"],
        submitted[0]["event_index"],
    )
    certified_key = (
        certified[0]["block_number"],
        certified[0]["event_index"],
    )
    if any(
        (event["block_number"], event["event_index"]) <= submitted_key
        for event in attestations
    ):
        raise ValueError("an AttestationRecorded event precedes ReceiptSubmitted")
    if any(
        (event["block_number"], event["event_index"]) >= certified_key
        for event in attestations
    ):
        raise ValueError("an AttestationRecorded event does not precede AvailabilityCertified")

    committee_changes = [
        event
        for event in events
        if event["module_id"] == "OrinqReceipts"
        and event["event_id"] in COMMITTEE_MUTATIONS
        and (
            event["block_number"],
            event["event_index"],
        ) > submitted_key
    ]
    if committee_changes:
        raise ValueError(
            "committee changed after ReceiptSubmitted and before the end of the "
            "certification block; block-end committee snapshot cannot be asserted "
            "as the committee throughout the receipt lifecycle"
        )

    for event in attestations + certified:
        phase = event.get("phase")
        if not isinstance(phase, dict) or "ApplyExtrinsic" not in phase:
            raise ValueError(
                f"{event['event_id']} event is not attributed to an ApplyExtrinsic phase"
            )

    return {
        "receipt_submitted_event": submitted[0],
        "attestation_recorded_events": attestations,
        "availability_certified_event": certified[0],
        "attester_order": attester_addresses,
        "attester_account_ids": attester_account_ids,
        "attester_count": len(attester_addresses),
        "threshold": threshold,
        "count_sequence": counts,
        "committee_changes_during_receipt_lifecycle": committee_changes,
        "receipt_submission_block": submitted[0]["block_number"],
        "certification_block": certified[0]["block_number"],
    }


def rpc_result(substrate: Any, method: str, params: list[Any]) -> Any:
    response = substrate.rpc_request(method, params)
    if not isinstance(response, dict):
        raise RuntimeError(f"{method} returned a non-object RPC response")
    if response.get("error"):
        error = response["error"]
        raise RuntimeError(
            f"{method}: {error.get('code')} {error.get('message')}"
        )
    if "result" not in response:
        raise RuntimeError(f"{method} response omitted result")
    return response["result"]


def decode_system_events(
    substrate: Any,
    block_hash: str,
    raw_events_hex: str,
) -> list[dict[str, Any]]:
    metadata = substrate.get_metadata(block_hash=block_hash)
    system = metadata.get_metadata_pallet("System")
    storage_function = system.get_storage_function("Events")
    type_string = storage_function.get_value_type_string()

    decoded = substrate.decode_scale(
        type_string,
        raw_events_hex,
        block_hash=block_hash,
        return_scale_obj=True,
    )
    elements = getattr(decoded, "elements", None)
    if elements is None:
        value = getattr(decoded, "value", None)
        if not isinstance(value, (list, tuple)):
            raise RuntimeError("metadata decoder did not return System.Events vector")
        elements = value
    return [
        event_record_to_dict(record, index)
        for index, record in enumerate(elements)
    ]


def capture(
    rpc_url: str,
    evidence_path: Path,
    output_dir: Path,
    lookback: int,
) -> dict[str, Any]:
    from substrateinterface import SubstrateInterface

    with evidence_path.open("r", encoding="utf-8") as handle:
        evidence = json.load(handle)

    receipt = evidence["receipt"]
    certification = receipt["certification"]
    receipt_id = normalize_hex(receipt["receipt_id"], "receipt_id")
    cert_hash = normalize_hex(certification["certHash"], "cert_hash")
    certification_block = _as_int(certification["block"], "certification block")
    threshold = _as_int(
        evidence["on_chain_committee_snapshot"]["attestation_threshold"],
        "on-chain attestation threshold",
    )
    indexed_signers = [
        signer["attester"]
        for signer in evidence["certification_indexer"]["signers"]
    ]

    if not RECEIPT_ID_RE.fullmatch(receipt_id):
        raise ValueError("receipt_id must be 32-byte hash")
    if not HASH_RE.fullmatch(cert_hash):
        raise ValueError("cert_hash must be 32-byte hash")
    if lookback < 1:
        raise ValueError("lookback must be a positive integer")

    substrate = SubstrateInterface(url=rpc_url, ss58_format=42)
    events_key = substrate.create_storage_key("System", "Events").to_hex()
    cert_block_hash = substrate.get_block_hash(certification_block)
    if not cert_block_hash or cert_block_hash.lower() != certification["hash"].lower():
        raise ValueError(
            "RPC chain_getBlockHash at certification height differs from indexed hash"
        )

    scan_start = max(1, certification_block - lookback)
    captured_blocks: dict[int, dict[str, Any]] = {}
    matching_events: list[dict[str, Any]] = []
    receipt_submitted_coordinate: tuple[int, int] | None = None
    scanned = 0

    for block_number in range(certification_block, scan_start - 1, -1):
        block_hash = substrate.get_block_hash(block_number)
        if not block_hash:
            raise RuntimeError(f"chain_getBlockHash returned no block at {block_number}")

        raw_value = rpc_result(
            substrate, "state_getStorage", [events_key, block_hash]
        )
        if not isinstance(raw_value, str) or not raw_value.startswith("0x"):
            raise RuntimeError(
                f"System.Events storage is absent/invalid at block {block_number}"
            )

        decoded_events = decode_system_events(substrate, block_hash, raw_value)
        scanned += 1
        target_matches = [
            event
            for event in decoded_events
            if target_event_for_receipt(event, receipt_id)
        ]
        committee_changes = [
            event
            for event in decoded_events
            if event["module_id"] == "OrinqReceipts"
            and event["event_id"] in COMMITTEE_MUTATIONS
        ]

        if target_matches or committee_changes:
            header = rpc_result(
                substrate, "chain_getHeader", [block_hash]
            )
            if not isinstance(header, dict) or not isinstance(header.get("stateRoot"), str):
                raise RuntimeError(f"invalid header for event block {block_number}")
            proof = rpc_result(
                substrate, "state_getReadProof", [[events_key], block_hash]
            )
            if not isinstance(proof, dict) or not isinstance(proof.get("proof"), list):
                raise RuntimeError(f"invalid System.Events read proof at block {block_number}")

            proof_nodes = proof["proof"]
            if not proof_nodes or not all(isinstance(node, str) for node in proof_nodes):
                raise RuntimeError(f"empty or malformed System.Events proof at block {block_number}")

            prefix = f"block-{block_number}"
            files = {
                "state_root": f"{prefix}-state-root.hex",
                "storage_key": f"{prefix}-system-events-key.hex",
                "storage_value": f"{prefix}-system-events-value.hex",
                "proof_scale": f"{prefix}-system-events-proof-scale.hex",
            }
            output_dir.mkdir(parents=True, exist_ok=True)
            (output_dir / files["state_root"]).write_text(
                normalize_hex(header["stateRoot"], "stateRoot") + "\n",
                encoding="utf-8",
            )
            (output_dir / files["storage_key"]).write_text(
                normalize_hex(events_key, "System.Events storage key") + "\n",
                encoding="utf-8",
            )
            (output_dir / files["storage_value"]).write_text(
                normalize_hex(raw_value, "System.Events storage value") + "\n",
                encoding="utf-8",
            )
            (output_dir / files["proof_scale"]).write_text(
                encode_storage_proof_scale(proof_nodes) + "\n",
                encoding="utf-8",
            )

            block_events = [
                {
                    **event,
                    "block_number": block_number,
                    "block_hash": block_hash,
                }
                for event in decoded_events
                if target_event_for_receipt(event, receipt_id)
                or (
                    event["module_id"] == "OrinqReceipts"
                    and event["event_id"] in COMMITTEE_MUTATIONS
                )
            ]
            captured_blocks[block_number] = {
                "block_number": block_number,
                "block_hash": block_hash,
                "state_root": header["stateRoot"],
                "event_count": len(decoded_events),
                "relevant_events": block_events,
                "files": files,
            }
            matching_events.extend(block_events)

        submission = [
            event
            for event in target_matches
            if event["event_id"] == SUBMITTED_EVENT
        ]
        if submission:
            if len(submission) != 1:
                raise ValueError(
                    f"multiple ReceiptSubmitted events for {receipt_id} in block {block_number}"
                )
            receipt_submitted_coordinate = (block_number, submission[0]["event_index"])
            break

    if receipt_submitted_coordinate is None:
        raise ValueError(
            f"ReceiptSubmitted event not found in {lookback} blocks before certification"
        )

    matching_events.sort(key=lambda item: (item["block_number"], item["event_index"]))
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "decoded-event-diagnostics.json").write_text(
        json.dumps(
            {
                "receipt_id": receipt_id,
                "cert_hash": cert_hash,
                "indexer_signers": indexed_signers,
                "decoded_matching_events": matching_events,
                "captured_blocks": sorted(captured_blocks),
            },
            indent=2,
        ) + "\\n",
        encoding="utf-8",
    )
    validation = validate_attestation_event_history(
        matching_events,
        receipt_id,
        cert_hash,
        indexed_signers,
        threshold,
        certification_block,
    )

    proof_blocks = [
        captured_blocks[number]
        for number in sorted(captured_blocks)
        if number >= validation["receipt_submission_block"]
    ]
    if not proof_blocks:
        raise RuntimeError("no System.Events proof blocks were captured")
    if not any(
        item["block_number"] == certification_block
        and any(
            event["event_id"] == CERTIFIED_EVENT
            for event in item["relevant_events"]
        )
        for item in proof_blocks
    ):
        raise ValueError("certification block is missing a proved AvailabilityCertified event")

    result = {
        "schema_version": "materios-attestation-event-proof-v1",
        "status": "SYSTEM_EVENTS_STORAGE_PROOFS_CAPTURED_AWAITING_RUST_VERIFICATION",
        "source": {
            "rpc": rpc_url,
            "metadata_source": "state_getMetadata at each exact block hash via substrate-interface",
        },
        "receipt_id": receipt_id,
        "cert_hash": cert_hash,
        "certification_block": certification_block,
        "certification_block_hash": cert_block_hash,
        "on_chain_threshold": threshold,
        "indexer_signers": indexed_signers,
        "scan": {
            "start_block": scan_start,
            "end_block": certification_block,
            "blocks_scanned": scanned,
            "receipt_submitted_block": validation["receipt_submission_block"],
        },
        "event_validation": validation,
        "committee_stability": {
            "no_committee_mutation_between_receipt_submission_and_certification": True,
            "semantics": "No CommitteeUpdated/CommitteeMemberJoined/CommitteeMemberLeft event was found after ReceiptSubmitted through the end of the certification block.",
        },
        "proofs": proof_blocks,
        "claims": {
            "raw_system_events_bytes_decoded_with_exact_block_metadata": True,
            "system_events_storage_read_proofs_captured": True,
            "attestation_recorded_event_signers_match_indexer_signer_list": True,
            "attestation_recorded_event_counts_are_sequential": True,
            "attestation_recorded_threshold_matches_on_chain_threshold": True,
            "availability_certified_event_matches_receipt_and_cert_hash": True,
            "committee_did_not_change_during_receipt_lifecycle": True,
            "rust_storage_proof_verification": "PENDING_WORKFLOW_STEP",
            "block_header_finality": "NOT_INDEPENDENTLY_VERIFIED",
            "individual_extrinsic_signatures": "NOT_INDEPENDENTLY_VERIFIED",
        },
        "non_claim": (
            "System.Events inclusion is only authenticated against the supplied block state roots; "
            "the block roots are not yet bound by an independently verified GRANDPA justification. "
            "This does not independently verify each signed extrinsic or GRANDPA finality."
        ),
    }

    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "MateriosAttestationEventProof.json").write_text(
        json.dumps(result, indent=2) + "\n",
        encoding="utf-8",
    )
    (output_dir / "proof-blocks.json").write_text(
        json.dumps({"proofs": [
            {
                "block_number": item["block_number"],
                "block_hash": item["block_hash"],
                "files": item["files"],
            }
            for item in proof_blocks
        ]}, indent=2) + "\n",
        encoding="utf-8",
    )
    return result


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    evidence_path = Path(
        os.environ.get(
            "MATERIOS_B3B_EVIDENCE",
            root / "out" / "MateriosB3BLiveStorageProof.json",
        )
    )
    output_dir = Path(
        os.environ.get(
            "MATERIOS_ATTESTATION_EVENTS_OUT",
            root / "out" / "attestation-events",
        )
    )
    rpc_url = os.environ.get(
        "MATERIOS_RPC_WS",
        "wss://materios.fluxpointstudios.com/preprod-rpc",
    )
    lookback = int(os.environ.get("MATERIOS_ATTESTATION_EVENT_LOOKBACK", "1024"))

    try:
        result = capture(rpc_url, evidence_path, output_dir, lookback)
    except Exception as error:
        print(f"attestation event proof capture failed: {error}", file=sys.stderr)
        return 1

    print("AttestationRecorded events:", len(result["event_validation"]["attestation_recorded_events"]))
    print("Attestation signer count:", result["event_validation"]["attester_count"])
    print("On-chain threshold:", result["on_chain_threshold"])
    print("ReceiptSubmitted block:", result["event_validation"]["receipt_submission_block"])
    print("AvailabilityCertified block:", result["certification_block"])
    print("System.Events proof blocks:", len(result["proofs"]))
    print("Attestation event proof capture: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
