# PRE-RICH B2 Deployment Contract

**Status:** IMPLEMENTATION / DEPLOYMENT TRACK — B2 is not enabled for rounds until a real committee configuration is installed.
**Branch:** `work/immortal-green-closure`

## Purpose

Turn the already-defined B2 trust mode into a real, independently verifiable attestation boundary without confusing it with the governance quorum.

B2 means:

```
N-of-M signatures over
(roundId, checkpointRef, beacon)
        ↓
B2 verifier
        ↓
B2_ATTESTED evidence
```

B2 is still an attestation trust model. It does **not** prove that the underlying external checkpoint is objectively canonical; that is the B3 property.

## Exact verifier contract

Envelope:

- `schema = PRE-RICH-B2-ATTESTATION-V1`
- `mode = B2_ATTESTED`
- `attestationVersion = v1`
- `roundId`
- `checkpointRef`
- `beacon`
- a set of member attestations `{memberId, signature}`

The signed payload is deterministically serialized from exactly:

```schema
mode
attestationVersion
roundId
checkpointRef
beacon
```

Signatures are Ed25519 and are verified against the explicitly deployed committee configuration.

The verifier rejects:

- unknown committee members;
- duplicate attestations;
- malformed signatures;
- invalid signatures;
- wrong schema/mode/version;
- missing round/checkpoint/beacon binding;
- insufficient threshold.

## Deployment rule

The service may be deployed before the committee is configured. In that state:

```configured = false
B2 results = invalid / not deployed
```

This is intentional. No synthetic members, development keys or governance identities are promoted to a production B2 committee.

A B2 mode becomes deployable only when a real committee file is installed through deployment configuration with:

1. committee member identifiers;
2. member public keys;
3. an explicitly chosen threshold;
4. evidence of committee authorization under the PRE-RICH governance path;
5. a published configuration digest.

The Beacon trust selector must then use the B2 evidence only for **new rounds**; an already-created round never silently downgrades or changes trust mode.

## Separation from governance

The B2 committee threshold is **not** copied from Governance quorum/approval parameters. Governance and Beacon attestation are separate trust domains.

## Current deployment state

The implementation target is:

```
B2 verifier service        → deploy now
B2 committee configuration → open until real members/threshold are authorized
B2 round selection         → remains disabled until configured evidence exists
B1 remains the operational fallback for new rounds
B3 remains the stronger target
```
