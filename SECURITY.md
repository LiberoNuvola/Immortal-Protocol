# Security Policy

## Status

IMMORTAL is an experimental open-source protocol and is not presented as a production security guarantee or mainnet-ready system.

The repository distinguishes:

- normative specification;
- mathematical proof;
- executable/reference-model validation;
- implementation tests;
- adapter evidence;
- application evidence;
- deployment evidence.

These categories must not be conflated.

## Reporting

Please do not publish exploitable vulnerability details in a public issue.

Use the repository's available private security-reporting mechanism where enabled, or contact the maintainers privately through the project's GitHub channels.

## Useful report contents

Include, where possible:

- affected component;
- affected commit/branch;
- reproduction steps;
- expected versus observed behavior;
- impact;
- relevant assumptions;
- mitigation proposal.

Do not include private keys, seed phrases, credentials or unrelated personal data.

## Scope

Reports may concern:

- universal economic invariants;
- kernel or transition implementations;
- adapter trust boundaries;
- application economic logic;
- randomness/evidence handling;
- expiry and claim behavior;
- accounting and protected capital;
- authorization;
- serialization;
- dependency/build/reproducibility issues.

A vulnerability in an experimental component should be described as such. The existence of a formal theorem does not imply that every implementation path satisfies it.
