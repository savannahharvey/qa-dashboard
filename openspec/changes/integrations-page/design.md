## Context

The current codebase has `MetricSourceConfig` already in use for `source=AZURE_DEVOPS`. The table has a `UNIQUE(teamId, source)` constraint and stores credentials as a JSON string in the `settings` column. The Azure DevOps PAT is never returned to the frontend — only masked indicators are shown. The same approach applies to GitHub. The existing dashboard setup flow hosts the Azure DevOps form, which must be migrated without breaking existing configured teams.

## Goals / Non-Goals

**Goals:**
- Single page for all external integrations, discoverable from the dashboard nav.
- Live connection status check on page load for each integration (green/grey/red badge).
- GitHub PAT masked in all API responses (last 4 chars only).
- Disconnect action clears credentials but leaves existing `QaMetric` data intact.

**Non-Goals:**
- OAuth flows — PAT-based authentication only for both integrations.
- Connecting more than two integrations in this change (Jira, Slack, etc. are future work).
- Automatically re-syncing metrics when a new integration is connected (user triggers refresh manually).

## Decisions

**Reuse `MetricSourceConfig` for GitHub rather than a new table.**
The table already handles arbitrary JSON settings and has the right shape. Adding `source=GITHUB` avoids schema migration complexity. The `settings` JSON for GitHub will be `{ "repoUrl": string, "patEncrypted": string, "patMasked": string }`. Trade-off: the `settings` field is untyped JSON — acceptable given it's already used this way for Azure DevOps.

**Mask PAT server-side before any response, never store plain text after initial save.**
The PAT is encrypted (or at minimum hashed beyond recovery) before storage. The masked version (last 4 chars, rest replaced with `•`) is stored separately in `settings.patMasked` for display. This means the PAT cannot be recovered from the DB, and re-entry is required to update it. Alternative considered: symmetric encryption with a server secret — acceptable for MVP but adds key-management complexity. For now, treat the PAT as write-only.

**Live status check calls the integration's API with stored credentials on each page load.**
This ensures the badge reflects real connectivity, not just "credentials exist." Each check is done server-side (frontend never touches credentials). Azure DevOps: `GET /_apis/projects` with the stored PAT. GitHub: `GET /repos/{owner}/{repo}` with the stored PAT. Both are fast (< 300ms) and happen in parallel.

**Azure DevOps form is moved, not duplicated.**
The existing dashboard setup form for Azure DevOps is removed from the setup flow and replaced with a redirect/link to the integrations page. This avoids two places to configure the same thing.

## Risks / Trade-offs

- **PAT rotation**: if a PAT expires, the status badge turns red and the user must re-enter it. No automated expiry detection. → Accepted limitation; the red badge is the signal.
- **GitHub rate limiting**: live status checks on page load hit GitHub's API. With a PAT, the limit is 5,000 req/hour — well within expected usage. Without a PAT (public repos), 60/hour — still fine for a single-team tool.
- **Migration of existing Azure DevOps setups**: teams that already configured Azure DevOps via the old setup flow have existing `MetricSourceConfig` rows. The new integrations page reads these rows transparently — no migration needed.

## Migration Plan

1. Deploy backend route changes and `githubService.ts` (additive).
2. Deploy frontend with new `IntegrationsPage` and updated nav.
3. Remove Azure DevOps form from dashboard setup flow (replace with a link to `/dashboard/integrations`).
4. No database migration needed.
5. Rollback: re-add Azure DevOps form to setup flow; remove integrations page route.
