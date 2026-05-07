# Spec: Dashboard Foundation

## Status

Draft

## Summary

Create the first usable dashboard view for tracking team goals. The dashboard should show goals, progress, and status in a simple format that can later connect to real data.

## User Story

As a team member, I want to see the team's goals and progress in one place so that I can understand what we are working toward and where we may need to collaborate.

## Scope

This spec covers the first foundation of the dashboard:

- Displaying a list of team goals.
- Displaying individual goals that support team goals.
- Showing each goal's progress.
- Showing each goal's status.
- Showing goal owners.
- Showing the first QA metrics: tests passing and test coverage.
- Supporting mocked or local sample data.

## Out of Scope

- User authentication.
- Goal editing.
- Joining or managing teams.
- Historical reporting.
- Advanced charts or analytics.
- External integrations.

## Decisions

- The first tracked QA metrics are tests passing and test coverage in the repo.
- Test categories are unit, API, and UI.
- Goals should have owners.
- Dates and deadlines are optional, not required.
- The first dashboard version is read-only.

## Related Specs

- `specs/002-auth-and-team-membership/`: username/password sign-in and team joining.
- `specs/003-goal-management/`: team goals, individual goals, and ownership.
- `specs/004-repo-qa-metrics/`: repo test and coverage metric collection.
