## Why

Azure DevOps sync currently only works with a single, shared Personal Access Token set as a server environment variable (`AZURE_DEVOPS_PAT`) by whoever operates the deployment. The Integrations page lets a team enter their own organization and project, but the API explicitly rejects `pat`/`token` fields in the settings payload (`teamRoutes.ts`), so there is no way for a team to actually connect their own Azure DevOps org — sync only works if the operator manually drops a token into Render for everyone to share. This blocks any real multi-team use of the integration.

## What Changes

- Allow each team to submit their own Azure DevOps PAT through the Integrations page and store it encrypted at rest, instead of rejecting PAT fields outright.
- Add server-side AES-256-GCM encryption/decryption for stored PATs, keyed by a new `ENCRYPTION_KEY` server env var. Plaintext PATs are never persisted and never echoed back to the client.
- Update `refreshAzureMetrics` / `listAzurePipelines` to resolve the token from the team's stored encrypted PAT first, falling back to the shared `AZURE_DEVOPS_PAT` env var when a team hasn't set one (preserves current single-tenant behavior as a fallback, **not a BREAKING change**).
- Add PAT input, masked "saved" state, and a clear/replace control to the Azure DevOps card on the Integrations page, so a team can tell whether a token is on file without ever seeing it rendered back.
- Surface the `diagnostics` messages already returned by the backend (missing/invalid PAT, DB failure, Azure API failure) in the Integrations UI instead of dropping them, so a team can tell *why* a sync or pipeline load failed.

## Capabilities

### New Capabilities
- `azure-pat-storage`: encrypted per-team storage, replacement, and clearing of an Azure DevOps PAT, with no plaintext round-trip to the client.

### Modified Capabilities
- `azure-devops-test-results`: token resolution now prefers a team-supplied encrypted PAT over the shared server env var; env var remains a fallback.
- `integrations-page`: Azure DevOps card gains PAT entry/masking/clear controls and displays sync/connection diagnostics instead of hiding them.

## Impact

- `src/routes/teamRoutes.ts` — remove the blanket PAT/token rejection; add a dedicated PAT field handled separately from `settings` JSON, never returned by GET.
- `src/services/azureMetricsService.ts` — resolve token from per-team encrypted storage first, env var fallback second.
- `src/db/repository.ts` + new migration — add encrypted PAT storage to `MetricSourceConfig` (e.g. `encryptedToken`, `tokenIv` columns) alongside the existing `settings` column.
- `src/client/pages/IntegrationsPage.tsx` + `src/client/api.ts` — PAT input, masked/clear UI, diagnostics display.
- New required env var: `ENCRYPTION_KEY` (Render + `.env.example`).
- `db/migrations/` — new migration adding encrypted-token columns to `MetricSourceConfig`.
