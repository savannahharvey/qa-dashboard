## 1. Database

- [ ] 1.1 Write migration `db/migrations/add_user_flows.sql` — create `UserFlow` table (id, teamId, name, steps TEXT[], keywords TEXT[], createdAt, updatedAt)
- [ ] 1.2 Add `UserFlowMatch` table to the same migration (id, userFlowId, testName, category, matchedKeywords TEXT[], dismissed BOOLEAN default false, createdAt) with `UNIQUE(userFlowId, testName)`

## 2. Backend — Repository

- [ ] 2.1 Add `insertUserFlow`, `updateUserFlow`, `deleteUserFlow`, `getUserFlows` to `src/db/repository.ts`
- [ ] 2.2 Add `upsertUserFlowMatches(matches[])` using `INSERT ... ON CONFLICT(userFlowId, testName) DO UPDATE SET matchedKeywords=... WHERE dismissed=false` to preserve dismissed rows
- [ ] 2.3 Add `dismissUserFlowMatch(userFlowId, testName)` to set `dismissed=true`

## 3. Backend — Matching Service

- [ ] 3.1 Create `src/services/userFlowMatchingService.ts`:
  - `extractKeywords(steps)` — tokenize, lowercase, remove stop words, return unique tokens
  - `matchFlowsToTests(teamId)` — for each flow, iterate `TestRunResult` test names, find keyword overlaps, upsert matches; skip if TestRunResult count > 10,000
  - `computeFlowCoverage(flow, matches)` — returns "covered" | "partially covered" | "not covered"
  - `computeUserFlowScore(flows)` — weighted score (covered=1, partial=0.5, none=0)
- [ ] 3.2 Unit test: `extractKeywords` removes stop words and punctuation, lowercases tokens
- [ ] 3.3 Unit test: `matchFlowsToTests` returns correct matches for known test name + keyword pair
- [ ] 3.4 Unit test: coverage status boundaries (0 matches → "not covered"; ratio ≥ 0.5 → "covered")

## 4. Backend — Azure DevOps Integration Hook

- [ ] 4.1 Call `userFlowMatchingService.matchFlowsToTests(teamId)` at the end of the Azure DevOps refresh in `src/services/azureMetricsService.ts`

## 5. Backend — API Routes

- [ ] 5.1 Create `src/routes/userFlowRoutes.ts` with:
  - `GET /api/teams/:teamId/user-flows`
  - `POST /api/teams/:teamId/user-flows`
  - `PUT /api/teams/:teamId/user-flows/:flowId`
  - `DELETE /api/teams/:teamId/user-flows/:flowId`
  - `POST /api/teams/:teamId/user-flows/:flowId/dismiss-match` (body: `{ testName }`)
- [ ] 5.2 Add `computeUserFlowCoverage(teamId)` to `src/services/analyticsService.ts`
- [ ] 5.3 Register user flow routes in `src/app.ts`

## 6. Frontend — API Client

- [ ] 6.1 Add `getUserFlows`, `createUserFlow`, `updateUserFlow`, `deleteUserFlow`, `dismissFlowMatch` to `src/client/api.ts`

## 7. Frontend — User Flows Page

- [ ] 7.1 Create `src/client/components/UserFlowCard.tsx` — expandable card showing flow name, coverage badge, steps list, and matched test names with dismiss buttons
- [ ] 7.2 Create `src/client/components/UserFlowForm.tsx` — name field + dynamic step input list ("Add step" button)
- [ ] 7.3 Create `src/client/pages/UserFlowsPage.tsx` composing the flow list and add/edit form
- [ ] 7.4 Add `/dashboard/user-flows` route to `src/client/App.tsx`
- [ ] 7.5 Add "User Flows" nav link in the dashboard shell/header

## 8. Frontend — Analytics Panel

- [ ] 8.1 Create `src/client/components/analytics/UserFlowCoveragePanel.tsx` with coverage counts, score, uncovered flow list, and empty state
- [ ] 8.2 Integrate into `AnalyticsPage.tsx` panel grid

## 9. Testing

- [ ] 9.1 Unit test: `UserFlowCard` shows "Not covered" badge when match list is empty
- [ ] 9.2 Unit test: dismiss button calls `dismissFlowMatch` and removes the match from the displayed list
- [ ] 9.3 E2E test: create a user flow, sync Azure DevOps, verify matched tests appear under the flow card
- [ ] 9.4 E2E test: dismiss a matched test and verify it no longer appears in the flow's match list
