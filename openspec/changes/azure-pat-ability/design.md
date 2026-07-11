## Context

`MetricSourceConfig` (Postgres) stores one row per `(teamId, source)` with a free-form `settings` JSON text column and an `enabled` flag. Azure org/project/pipeline mapping already flow through this column via the Integrations page. The PAT does not — `teamRoutes.ts` explicitly 400s any settings payload containing `pat`/`token`/`AZURE_DEVOPS_PAT`/`personalAccessToken`, and `azureMetricsService.ts` only ever reads the token from `process.env[tokenEnv ?? "AZURE_DEVOPS_PAT"]`. That makes the integration single-tenant in practice: one operator-set token serves every team.

This design adds encrypted, per-team PAT storage so each team can connect their own Azure DevOps org, while keeping the existing env-var token as a fallback so the current deployment doesn't regress.

## Goals / Non-Goals

**Goals:**
- A team can submit an Azure DevOps PAT through the Integrations page; it is encrypted before it touches the database and never returned to the client in plaintext.
- Azure sync and pipeline listing use a team's own PAT when present, falling back to the shared `AZURE_DEVOPS_PAT` env var otherwise.
- A team can tell whether a PAT is on file and can replace or clear it, without the app ever re-displaying the token.
- Sync/pipeline-listing failures surface a real reason (missing PAT, Azure API rejection, DB error) in the UI instead of a generic empty state.

**Non-Goals:**
- Multiple PATs per team (one Azure org connection per team per source, matching the existing `(teamId, source)` key).
- Key management infrastructure (KMS, per-tenant keys, key rotation tooling) — a single static server-side key is sufficient at this project's scale.
- Automatic PAT expiration detection/renewal reminders.

## Decisions

**Encryption: AES-256-GCM with a single server-side `ENCRYPTION_KEY` env var.**
Node's built-in `crypto` module needs no new dependency. GCM gives authenticated encryption (tamper detection via auth tag), which matters since this ciphertext lives in a DB anyone with read access to could otherwise attempt to modify. A KMS (AWS KMS, GCP KMS) was considered and rejected: it adds a paid service and network round-trip for a token that's a few dozen bytes, for an app currently running on Render's free tier. `ENCRYPTION_KEY` is a 32-byte value (hex-encoded in env), generated once and stored in Render alongside `DATABASE_URL`.

**Storage: one new column on `MetricSourceConfig`, not a new table.**
`MetricSourceConfig` is already keyed 1:1 per `(teamId, source)`, which is exactly the granularity a PAT needs. A new `encryptedPat TEXT` column stores a single self-describing string (`iv:authTag:ciphertext`, each base64), avoiding a 3-column spread or a join to a new secrets table for what is one value.

**API contract: PAT is a distinct field, never round-tripped.**
`POST /:teamId/metrics/config` accepts an optional `pat` field alongside `settings`, handled separately from the JSON blob that's already stored as-is. `GET /:teamId/metrics/config` returns a boolean `hasPat` instead of any token material. Sending `pat: ""` (empty string) clears the stored token. This replaces the current blanket rejection of PAT-shaped keys with an explicit, narrow channel for the one secret the API is meant to accept.

**Token resolution order: team's encrypted PAT, then env var fallback.**
`azureMetricsService.ts` decrypts `config.encryptedPat` when present; if absent, it falls back to today's `getEnv(tokenEnv ?? "AZURE_DEVOPS_PAT")` behavior. This keeps the current shared-token deployment working unmodified for any team that hasn't set its own PAT — not a breaking change.

**Diagnostics: surface what the backend already computes.**
`refreshAzureMetrics`, `listAzurePipelines`, and the config GET response already produce `diagnostics` messages (missing config, DB failure, Azure API failure) — `IntegrationsPage.tsx` just doesn't render them today. This change wires those messages into the Azure DevOps card's status area instead of adding new backend diagnostics.

## Risks / Trade-offs

- **[Risk]** `ENCRYPTION_KEY` leaks alongside a DB dump → all stored PATs are recoverable. **Mitigation**: same handling as `DATABASE_URL` today (Render env var, `sync: false`, never committed); GCM at least prevents silent tampering, and this is strictly better than the current alternative (no per-team secret storage at all).
- **[Risk]** `ENCRYPTION_KEY` rotation invalidates all stored PATs (can no longer decrypt). **Mitigation**: document that rotating the key requires teams to re-enter their PAT; out of scope to build multi-key support now, called out as an open question below.
- **[Risk]** Azure PATs expire on their own schedule (30/90/180 days), independent of anything this app controls, and a team may not notice until sync silently goes stale. **Mitigation**: covered by the diagnostics-surfacing change — an expired/invalid PAT produces a visible "could not sync" message with reason, rather than a quiet empty state.
- **[Trade-off]** A single global encryption key (vs. per-team keys) is simpler to operate but means a single key compromise affects every stored PAT. Acceptable given current scale; revisit if this becomes a multi-tenant product with stricter isolation requirements.

## Migration Plan

1. Generate and add `ENCRYPTION_KEY` to Render's env vars for `qa-dashboard-api` (and to local `.env` / `.env.example` as a placeholder) — must exist before the encryption code path deploys.
2. Ship an additive DB migration: `ALTER TABLE "MetricSourceConfig" ADD COLUMN "encryptedPat" TEXT`. Nullable, no backfill — no PATs are stored today.
3. Deploy backend changes (encrypt/decrypt helper, updated `teamRoutes.ts` and `azureMetricsService.ts`). Safe to deploy immediately after the migration since the column starts NULL and the env-var fallback path is unchanged.
4. Deploy frontend changes (PAT input, masked/clear UI, diagnostics display).
5. Rollback: revert the backend/frontend deploy. The `encryptedPat` column is additive and harmless to leave in place even if unused by rolled-back code.

## Open Questions

- Should the UI show a partial fingerprint (e.g., last 4 characters) of a stored PAT for reassurance, or is a plain "PAT saved" boolean enough for v1? Defaulting to boolean-only for this change; can add later without a schema change.
- Key rotation / multi-key support (e.g., versioned key prefix on the stored value) is deferred until there's an actual operational need to rotate `ENCRYPTION_KEY`.
