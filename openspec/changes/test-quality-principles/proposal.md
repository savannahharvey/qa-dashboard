## Why

Having a lot of tests doesn't mean those tests are good. Teams often have comprehensive happy-path coverage but no tests for edge cases, no security checks, and no error-handling verification. Currently there is no automated way to detect these gaps — it requires a manual audit. Pattern-matching test names against known quality principle keywords can surface these gaps automatically after every Azure DevOps sync.

## What Changes

- Define a library of quality principles, each with a keyword pattern list (edge cases, security, error handling, happy path, performance).
- After each Azure DevOps sync, scan `TestRunResult` test names against each principle's keywords to determine which principles are covered.
- Add a Quality Principles panel to the Analytics page showing a sorted checklist (missing → warn → pass) with example test names per principle.
- Compute a principles score (0–100) contributing to the overall QA Health Score.

## Capabilities

### New Capabilities

- `test-quality-principles`: A keyword-pattern library and evaluation engine that scans `TestRunResult` test names to determine whether five quality principles (edge cases, security, error handling, happy path, performance) are covered, and surfaces the results as a checklist panel with scores.

### Modified Capabilities

<!-- No existing spec-level requirements are changing. Depends on TestRunResult table introduced in the frequently-failing-tests change. -->

## Impact

- `src/domain/qualityPrinciples.ts` — new file with principle definitions and keyword lists
- `src/services/qualityPrinciplesService.ts` — new file with evaluation and scoring logic
- `src/services/analyticsService.ts` — add `evaluateQualityPrinciples(teamId)` panel computation
- `src/client/components/analytics/QualityPrinciplesPanel.tsx` — new panel component
- No database changes required — reads from existing `TestRunResult` table
