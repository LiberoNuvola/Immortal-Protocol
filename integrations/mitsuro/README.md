# Mitsuro read-only bridge for IMMORTAL JEV

A minimal MCP stdio server for reading public GitHub evidence. It does not install Mitsuro, configure a connection, or claim a live integration.

## Safety boundaries
- Fixed repository `LiberoNuvola/Immortal-Protocol` and branch `work/immortal-green-closure`.
- Unauthenticated GitHub REST GET requests only; no token needed or read.
- No filesystem tools, shell, git writes, workflow dispatch/rerun, issue/PR creation, wallet access, or on-chain actions.
- Four read tools only; explicit path allowlist; output capped at 24,000 characters; HTTP timeout 10 seconds.
- This tool surface is not an OS sandbox. Run under a dedicated account/container with no secrets or sensitive mounts. Outbound HTTPS to api.github.com is required.
- The historical run #1718 registry is explicitly labeled historical, not current certification.

## Run
Requires Node.js 20+ and no npm dependencies:
```sh
node integrations/mitsuro/jev-readonly-mcp.mjs
```
It speaks newline-delimited JSON-RPC over stdio and opens no listening port.

## Mitsuro configuration example
Review current Mitsuro docs first. Add as a project MCP server only after code review, then explicitly connect it. Do not auto-connect. Example only; this file does not activate the server:
```json
{
  "mcpServers": {
    "immortal-jev-readonly": {
      "command": "node",
      "args": ["integrations/mitsuro/jev-readonly-mcp.mjs"],
      "cwd": "."
    }
  }
}
```
Mitsuro must be granted only the process permission required to launch Node. Network egress to api.github.com should be restricted at OS/container level if the MCP permission model cannot independently limit outbound destinations.

## Tools
- `get_branch_head()`
- `get_ci_status({ commitSha? })`
- `read_jev_registry()`
- `read_allowed_file({ path })`

No arbitrary URLs, arbitrary repository paths, auth headers, or write operations are exposed.
