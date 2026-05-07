# Spec: Repo QA Metrics

## Status

Draft

## Spec Type

Domain/data spec. This spec describes QA metric data, status interpretation, coverage rules, and goal progress integration.

## Summary

Track the first QA metrics for the dashboard: tests passing and test coverage for unit, API, and UI tests in the repo.

## User Story

As a team member, I want to see whether our repo tests are passing and how much coverage we have so that our quality goals are based on measurable evidence.

## Scope

- Unit test passing status.
- Unit test coverage.
- API test passing status.
- API test coverage.
- UI test passing status.
- UI test coverage.
- Sample or manually entered metric data until automation is added.

## Out of Scope

- Continuous integration integration.
- Historical trend charts.
- Automatic test runner detection.
- External code quality tools.

## Decisions

- The first QA metrics are tests passing and test coverage.
- Metrics are grouped into unit, API, and UI categories.
- The dashboard foundation can use sample metrics before repo automation exists.
- QA metrics should be displayable both as summary dashboard cards and as goal-linked progress signals.
