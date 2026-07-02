## Why

Azure DevOps configuration is buried inside the dashboard setup flow, making it hard to find and impossible to update without going through setup again. Adding a GitHub repository connection is also blocked by this because there's no clean place to put it. A dedicated integrations page gives both integrations a permanent, discoverable home.

## What Changes

- Move Azure DevOps configuration out of the dashboard setup flow into a new `/dashboard/integrations` page.
- Add GitHub repository connection support (repo URL + optional PAT) stored in `MetricSourceConfig`.
- Add a live connection status check for each integration on page load.
- Add a disconnect action that clears credentials without deleting existing metric data.
- Add "Integrations" to the dashboard navigation.

## Capabilities

### New Capabilities

- `integrations-page`: A dedicated page at `/dashboard/integrations` where team members can view, configure, and disconnect external integrations (Azure DevOps and GitHub).
- `github-integration`: Stores a GitHub repository URL and optional PAT in `MetricSourceConfig` (source=GITHUB); provides a live connectivity check against the GitHub API.

### Modified Capabilities

- `azure-devops-test-results`: The Azure DevOps configuration form is relocated from the dashboard setup flow to the integrations page. No functional changes to how data is fetched; only the entry point for configuration changes.

## Impact

- `src/client/pages/IntegrationsPage.tsx` — new page (to be created)
- `src/client/App.tsx` — new `/dashboard/integrations` route
- `src/client/components/AppShell.tsx` (or header) — add "Integrations" nav link
- `src/routes/` — new integrations routes (`GET`, `POST`, `DELETE`)
- `src/services/` — new `githubService.ts` for GitHub API connectivity check
- `src/db/repository.ts` — read/write `MetricSourceConfig` for GITHUB source
- `MetricSourceConfig` table — no schema change; uses existing `source` TEXT column with new value `GITHUB`
