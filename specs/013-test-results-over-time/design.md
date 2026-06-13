Title: Test Results Over Time — Design

Goal
-----
Provide a clear visual history of test results so users can inspect trends, spot regressions, and measure quality over time.

Key UI Elements
---------------
- Header with repository/branch selector and time-range picker (last 7/30/90 days / custom).
- Line chart: total tests run per period (day/week) with a second line for passed tests.
- Area/stacked chart or secondary axis: pass percentage over time.
- Summary cards: total runs, average pass %, recent change (delta).
- Tooltip on hover showing date, total, passed, failed, pass % and link to sample test runs for that date.
- Controls: granularity (day/week/month), group by branch/tag, and export CSV.

Visual specifics
----------------
- Use a clean, neutral palette with accent color for pass and muted for total/failed.
- Line chart with markers for deploys or notable CI events (optional annotation layer).
- Mobile: stacked vertical layout — chart then summary cards.

Accessibility
-------------
- Ensure color contrast and provide text alternatives for charts (downloadable CSV and table view).

Interactions
------------
- Click datapoint to open a drill-down list of test runs for that date.
- Hover shows exact counts and pass %.
