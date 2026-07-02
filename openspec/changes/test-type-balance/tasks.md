## 1. Backend — Balance Computation

- [ ] 1.1 Add target ratio constants `DEFAULT_TEST_TYPE_TARGET = { UNIT: 0.70, API: 0.20, UI: 0.10 }` to `src/domain/metrics.ts`
- [ ] 1.2 Add `computeTestTypeBalance(teamId)` to `src/services/analyticsService.ts`:
  - Reads the most recent `QaMetric` row per category with `kind=TESTS_PASSING`
  - Computes percentages (missing category = 0, flagged as partial data)
  - Computes total deviation and score using `(1 - totalDeviation / 2) * 100`, clamped to [0, 100]
  - Generates recommendation string based on imbalance direction
- [ ] 1.3 Unit test: score is 100 when actual exactly matches default target
- [ ] 1.4 Unit test: score decreases correctly for known deviation input
- [ ] 1.5 Unit test: recommendation string matches correct case for unit-low, ui-high, and near-target scenarios
- [ ] 1.6 Unit test: missing category is treated as 0 and partial data flag is set

## 2. Frontend — Panel Component

- [ ] 2.1 Create `src/client/components/analytics/TestTypeBalancePanel.tsx`:
  - Donut chart using inline SVG (`stroke-dasharray` on `<circle>` elements, one per category)
  - Three horizontal comparison bars with a vertical tick mark at target percentage
  - Recommendation callout box
  - Partial data warning when one or more categories are missing
- [ ] 2.2 Integrate `TestTypeBalancePanel` into `AnalyticsPage.tsx` panel grid

## 3. Testing

- [ ] 3.1 Unit test: donut arcs' `stroke-dasharray` values sum to the full circle circumference
- [ ] 3.2 Unit test: target tick mark is positioned at the correct percentage on each bar
- [ ] 3.3 Unit test: partial data warning renders when a category value is null
- [ ] 3.4 E2E test: panel renders with Azure DevOps connected; three colored arcs visible in the donut
