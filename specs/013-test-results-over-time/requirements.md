Title: Test Results Over Time — Requirements

User Stories
-----------
- As a developer, I want to see how many tests ran each day so I can detect changes in test volume.
- As a QA lead, I want to see pass percentage over time so I can detect regressions.
- As any user, I want to filter by repository, branch, and time range.

Acceptance Criteria
-------------------
- A chart showing tests run per period and pass percentage is available on a new page or dashboard pane.
- Data can be filtered by repo/branch and time-range; granularity can be day/week/month.
- Tooltips show exact counts and percentages; clicking a point shows runs for that date.
- API returns aggregated metrics efficiently for requested ranges and granularity.

Non-Functional
--------------
- Response time for metric API queries should be < 500ms for 90-day ranges with daily granularity on typical dataset sizes.
- Data retention policy: metrics stored for 2 years; older data may be archived.

Security & Privacy
------------------
- Apply existing access controls to metrics endpoints (team/project scoping).
