# Blockfrost Preprod proxy

This service is a server-side provider boundary for the browser Lucid 0.10.11 client. It is **not deployed by GitHub Pages**: Pages serves static assets only. The proxy must be deployed separately before the DApp can perform provider-backed wallet operations.

## Server configuration

Set these variables only in the proxy hosting environment:

- `BLOCKFROST_API_KEY`: Blockfrost Preprod project credential. Never prefix it with `VITE_`, place it in frontend build variables, or return it to a browser.
- `BLOCKFROST_PROXY_ALLOWED_ORIGINS`: comma-separated exact browser origins, for example `https://app.example`. Do not use `*`.
- `BLOCKFROST_PROXY_PORT`: optional listener port (default `3001`).

Run `npm ci --no-audit --no-fund`, then `npm start`. Run deterministic tests with `npm test`.

After a real HTTPS deployment and route exercise, configure the public browser variable `VITE_BLOCKFROST_PROXY_URL` to the deployed `/blockfrost` base URL. Do not configure a placeholder or claim the browser path is operational before verifying it end-to-end.

## Enforced boundary

- Fixed upstream: Cardano Preprod Blockfrost API. Callers cannot choose an upstream host, URL, project ID, or path prefix.
- Exact method/path/query allowlist for the Lucid 0.10.11 provider surface.
- Exact Origin allowlist; absent and unrecognized origins are rejected. CORS is not authentication.
- GET requests are read-only provider queries. POST is limited to `/tx/submit`, `application/cbor`, and a bounded CBOR envelope with a definite four-item top-level array; nested definite and indefinite CBOR items are accepted only within the configured size/depth/node limits.
- The CBOR check is a transport/shape guard, not a Cardano ledger-schema, witness-signature, or transaction-validity verifier. Blockfrost remains the upstream transaction validator. The submit body is relayed byte-for-byte: this service does not hold wallet keys, sign transactions, or construct transactions on behalf of a user.
- Request body, route/query length, response stream size, timeout, and a per-process request rate are bounded.

## Production deployment requirements

The in-process rate limiter is only a secondary per-instance guard; it is not sufficient as the production abuse-control layer. Before public use, the deployment must also provide:

1. HTTPS termination and a stable, documented proxy origin.
2. Ingress-level rate limiting and request concurrency/connection limits.
3. Stable egress IP where possible, with Blockfrost project endpoint/IP restrictions configured to that egress and the minimum required API scope where supported.
4. Monitoring, alerting, and bounded operational logs that never include provider credentials or wallet material.
5. An end-to-end browser test proving the configured origin reaches this proxy and the proxy reaches the fixed Preprod upstream, including signed-CBOR submission relay.

No production host, routing rule, egress IP, or deployment provider is specified by this repository at present. These must be supplied and verified by the deployment owner; this README does not imply that a production proxy exists.
