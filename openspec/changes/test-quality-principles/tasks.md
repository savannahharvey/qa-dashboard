## 1. Backend — Principle Definitions

- [ ] 1.1 Create `src/domain/qualityPrinciples.ts` with the `QUALITY_PRINCIPLES` constant array defining five principles: `edge-cases` (keywords: invalid, empty, null, boundary, overflow, edge, limit, negative; passingThreshold: 3; warnThreshold: 1), `security` (auth, permission, unauthorized, forbidden, injection, xss, csrf, token, session; passing: 1; warn: 0), `error-handling` (error, exception, fail, reject, throw, catch; passing: 2; warn: 1), `happy-path` (success, valid, correctly, creates, updates, returns; passing: 5; warn: 2), `performance` (performance, load, timeout, slow, concurrent, latency; passing: 1; warn: 0)

## 2. Backend — Evaluation Service

- [ ] 2.1 Create `src/services/qualityPrinciplesService.ts`:
  - `evaluatePrinciples(teamId, days?)` — fetches distinct test names from `TestRunResult` for the team in the lookback window; for each principle, counts keyword matches and collects up to 3 example names; returns per-principle status and score
  - `computePrincipleScore(results)` — weighted score (pass=1, warn=0.5, missing=0)
  - `generateRecommendation(results)` — returns a suggestion focused on the first missing or warn principle
- [ ] 2.2 Add `evaluateQualityPrinciples(teamId)` to `src/services/analyticsService.ts`, returning `{ status: "unavailable" }` when `TestRunResult` count for team is 0
- [ ] 2.3 Unit test: score is 100 when all five principles pass
- [ ] 2.4 Unit test: score is 0 when all five principles are missing
- [ ] 2.5 Unit test: keyword matching is case-insensitive
- [ ] 2.6 Unit test: example list is capped at 3 even when more matches exist
- [ ] 2.7 Unit test: `evaluateQualityPrinciples` returns `{ status: "unavailable" }` when `TestRunResult` is empty

## 3. Frontend — Panel Component

- [ ] 3.1 Create `src/client/components/analytics/QualityPrinciplesPanel.tsx`:
  - Renders checklist sorted missing → warn → pass
  - Status icons using Unicode (✓ green, ⚠ yellow, ✗ red) styled with CSS
  - Expandable rows showing up to 3 example test names with matched keywords bolded within the name
  - Recommendation callout box
  - Unavailable state with "Sync Azure DevOps data" message
- [ ] 3.2 Integrate `QualityPrinciplesPanel` into `AnalyticsPage.tsx` panel grid

## 4. Testing

- [ ] 4.1 Unit test: missing principles render before passing ones in the component output
- [ ] 4.2 Unit test: expanding a row reveals example test names
- [ ] 4.3 Unit test: unavailable state renders when `status === "unavailable"`
- [ ] 4.4 E2E test (with Azure DevOps synced and TestRunResult populated): at least the "happy-path" principle shows "pass" status
