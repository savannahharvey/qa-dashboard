## Context

`QaMetric` rows with `kind=TESTS_PASSING` use the `value` field to store test counts per category (UNIT, API, UI). The most recent row per category is the current test count. This data is already being fetched and stored by the Azure DevOps integration — no new ingestion is needed.

## Goals / Non-Goals

**Goals:**
- Use the three most recent `QaMetric` count values to compute the current distribution.
- Compare to a hardcoded default target (70/20/10) with a deviation-based score.
- Donut chart and comparison bars in the frontend panel.

**Non-Goals:**
- Per-team customizable target ratios (future work; hardcode defaults for MVP).
- Historical balance trend over time (current snapshot only).
- Breakdown below category level (e.g., sub-types of unit tests).

## Decisions

**Use `QaMetric.value` as the test count, not a separate count field.**
The `value` field stores a count when `kind=TESTS_PASSING`. This is already the pattern in use. No new column or table needed.

**Deviation-based score formula: `score = (1 - totalDeviation / 2) * 100`.**
Total deviation is the sum of `|actual% - target%|` across three categories. The maximum possible deviation is 2.0 (e.g., 100% on one category, 0% on the others). Dividing by 2 normalizes to [0, 1]. This gives a smooth, intuitive score: perfect match = 100, completely inverted pyramid ≈ 0. Alternative considered: letter grades — rejected in favor of a numeric score consistent with other panels.

**Inline SVG donut using `stroke-dasharray` on a `<circle>` element.**
No chart library. Three arcs share one circle's circumference, each drawn with a `stroke-dasharray` and `stroke-dashoffset` to position them around the ring. This is a standard CSS/SVG pattern with no dependencies.

**Target bars use a `<progress>`-like CSS bar with a tick mark at the target percentage.**
Each of the three categories gets a horizontal bar showing the actual percentage. A thin vertical line at the target position makes the comparison immediately clear without labels.

## Risks / Trade-offs

- **Missing category data**: if a team has no UI tests configured, the UI `QaMetric` value will be null. → Treat missing values as 0; note the partial data with a warning message on the panel.
- **Sample data distortion**: teams using SAMPLE data source rather than Azure DevOps will see a balance based on seeded values, not real test counts. → Label the panel with the data source so the user knows it may not be accurate.
