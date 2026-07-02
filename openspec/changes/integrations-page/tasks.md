## 1. Backend — GitHub Service

- [ ] 1.1 Create `src/services/githubService.ts` with `checkConnectivity(repoUrl, pat?)` that calls `GET /repos/{owner}/{repo}` and returns `{ status: "connected" | "error", message?: string }`
- [ ] 1.2 Add `getGithubConfig(teamId)` and `saveGithubConfig(teamId, { repoUrl, pat })` methods to `src/db/repository.ts` (reads/writes `MetricSourceConfig` for `source=GITHUB`)
- [ ] 1.3 Ensure PAT is masked before any write to `settings.patMasked` and never returned in full from any method

## 2. Backend — Integrations Routes

- [ ] 2.1 Create `src/routes/integrationsRoutes.ts` with `GET /api/teams/:teamId/integrations` that returns status for both AZURE_DEVOPS and GITHUB (runs live checks in parallel)
- [ ] 2.2 Add `POST /api/teams/:teamId/integrations/github` route to save GitHub config and return updated status
- [ ] 2.3 Add `DELETE /api/teams/:teamId/integrations/:source` route to clear config and disable the integration
- [ ] 2.4 Register integrations routes in `src/app.ts`
- [ ] 2.5 Unit test: `GET /integrations` returns `status: "error"` when stored PAT fails connectivity check

## 3. Frontend — API Client

- [ ] 3.1 Add `getIntegrations(teamId)`, `saveGithubIntegration(teamId, data)`, and `deleteIntegration(teamId, source)` to `src/client/api.ts`

## 4. Frontend — Components

- [ ] 4.1 Create `src/client/components/IntegrationCard.tsx` — reusable card with status badge (Connected/Not connected/Error), summary line, Configure button, and Disconnect link
- [ ] 4.2 Create `src/client/components/AzureDevOpsForm.tsx` — extract and refactor the existing Azure DevOps config form from the dashboard setup flow
- [ ] 4.3 Create `src/client/components/GitHubForm.tsx` — repo URL field and optional masked PAT field

## 5. Frontend — Page & Routing

- [ ] 5.1 Create `src/client/pages/IntegrationsPage.tsx` composing two `IntegrationCard` instances with their respective forms
- [ ] 5.2 Add `/dashboard/integrations` route in `src/client/App.tsx`
- [ ] 5.3 Add "Integrations" nav link in the dashboard shell/header
- [ ] 5.4 Replace or redirect the Azure DevOps config entry point in the dashboard setup flow to point to `/dashboard/integrations`

## 6. Testing

- [ ] 6.1 Unit test: `IntegrationCard` renders "Not connected" state when no config is present
- [ ] 6.2 Unit test: `IntegrationCard` renders "Error" state when status is "error"
- [ ] 6.3 Unit test: PAT field in `GitHubForm` shows masked value when config already exists
- [ ] 6.4 E2E test: navigate to integrations page, submit GitHub form with a valid repo URL, verify card updates to "Connected"
- [ ] 6.5 E2E test: click Disconnect on a connected integration and verify card resets to "Not connected"
