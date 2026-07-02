## Why

A healthy test suite follows the testing pyramid: many unit tests, fewer integration tests, and even fewer end-to-end tests. Teams that invert this pyramid end up with slow, brittle test suites that don't catch regressions efficiently. The dashboard already categorizes tests as UNIT, API, and UI — but never shows whether the distribution is healthy. This change surfaces that ratio and compares it to a recommended target so teams know if they need to shift their investment.

## What Changes

- Add a Test Type Balance panel to the Analytics page showing the current unit/integration/e2e ratio as a donut chart.
- Compare the actual ratio against a configurable target (default: 70% unit, 20% integration, 10% e2e).
- Compute a balance score (0–100) based on deviation from the target.
- Generate a text recommendation describing the imbalance and what to do about it.

## Capabilities

### New Capabilities

- `test-type-balance`: Computes the ratio of UNIT/API/UI tests from existing `QaMetric` data, compares it against a target ratio, and produces a balance score and recommendation for the analytics panel.

### Modified Capabilities

<!-- No existing spec-level requirements are changing. Uses existing QaMetric data; no new data fetching needed. -->

## Impact

- `src/services/analyticsService.ts` — add `computeTestTypeBalance(teamId)` panel computation
- `src/domain/metrics.ts` (or new `src/domain/testTypeBalance.ts`) — target ratio constants and scoring formula
- `src/client/components/analytics/TestTypeBalancePanel.tsx` — new panel component with donut chart and comparison bars
- No database changes required — uses existing `QaMetric` rows
