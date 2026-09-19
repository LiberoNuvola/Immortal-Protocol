# IMMORTAL Protocol --- Licensing Release Checklist

Before declaring the licensing package released on `b1-hardening`:

-   [ ] Copy the existing MPL-2.0 license text from `Licence/Licence` to
    root `LICENSE`.
-   [ ] Add `LICENSE-DOCS.md` for CC BY 4.0 documentation.
-   [ ] Add `Licence/LICENSING-MATRIX.md`.
-   [ ] Add `Licence/NOTICE-THIRDPARTY.md`.
-   [ ] Add `Licence/BRAND-AND-TRADEMARKS.md`.
-   [ ] Update README license section to point to the above files.
-   [ ] Confirm third-party notices/licenses remain intact.
-   [ ] Confirm `blockfrost-proxy` remains separately ISC-licensed.
-   [ ] Confirm no semantic or implementation changes were introduced by
    the licensing pass.
-   [ ] Run a final repository-wide license/provenance consistency
    check.
-   [ ] Commit the licensing-only changes on `b1-hardening`.

Trademark work is intentionally separate: `IMMORTAL PROTOCOL` remains at
the pre-filing checkpoint documented in Notion.
