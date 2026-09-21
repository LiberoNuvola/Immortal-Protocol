# IMMORTAL Protocol --- Licensing Matrix

Status: repository licensing package for `b1-hardening`.

  ----------------------------------------------------------------------------------------------
  Scope                    Default treatment  SPDX / status         Notes
  ------------------------ ------------------ --------------------- ----------------------------
  `IMMORTAL/kernel/**`     Software           MPL-2.0               Original IMMORTAL
                                                                    implementation; provenance
                                                                    must remain attributable.

  `IMMORTAL/state/**`      Software           MPL-2.0               Core state implementation.

  Other original IMMORTAL  Software           MPL-2.0               Unless a file carries a more
  software/tests                                                    specific upstream license
                                                                    notice.

  `verification/**`        Software/tooling   MPL-2.0               Subject to third-party
                                                                    dependency notices.

  `Adapter/CARDANO/**`     Software           MPL-2.0 for original  Upstream components retain
                                              project code          their own licenses/notices.

  `PRE-RICH/**` original   Software           MPL-2.0               Third-party material remains
  software                                                          upstream licensed.

  `IMMORTAL/docs/**`       Documentation      CC BY 4.0             See `LICENSE-DOCS.md`.

  PRE-RICH                 Documentation      CC BY 4.0             Unless explicitly marked
  specifications/docs                                               otherwise.

  Root project             Documentation      CC BY 4.0             Unless explicitly marked
  documentation/policies                                            otherwise.

  `assets/**`              Per-asset review   Not blanket-licensed  Check provenance and
                                                                    intended use asset by asset.

  `blockfrost-proxy/**`    Separate component ISC where declared    Preserve its existing
                                                                    package/license metadata and
                                                                    upstream notices.

  Third-party              Upstream license   Upstream-controlled   Do not relicense third-party
  dependencies/material                                             material under MPL-2.0 or CC
                                                                    BY 4.0.

  `IMMORTAL Protocol`      Trademark/brand    Reserved; not         See
  name/logo/branding                          licensed by MPL/CC BY `BRAND-AND-TRADEMARKS.md`.
  ----------------------------------------------------------------------------------------------

## Repository-level rules

1.  Software and documentation are separate licensing domains.
2.  A file-specific upstream license or notice controls that
    file/component where applicable.
3.  Third-party licenses and attribution notices must be preserved.
4.  The trademark/brand is not included in the software or documentation
    grant.
5.  This matrix describes project intent and repository classification;
    it is not a legal opinion.

## Current repository-layer snapshot — 2026-09-21

The licensing decisions recorded for the current project baseline remain:

- original IMMORTAL software: MPL-2.0;
- original IMMORTAL and PRE-RICH documentation/specification: CC BY 4.0;
- original PRE-RICH software: MPL-2.0;
- original Cardano Adapter software: MPL-2.0 candidate pending final provenance/dependency audit;
- third-party components remain under their upstream licenses;
- assets/branding/trademarks remain separately classified.

The current repository architecture is now explicitly layered as IMMORTAL/, Adapter/, and PRE-RICH/. This matrix must follow the actual authorship/provenance of files rather than directory names alone.

**Release gate:** no final repository-wide license freeze is claimed until SPDX placement, contributor/copyright provenance, third-party notices and component-specific exceptions have been mechanically audited on the release tree.