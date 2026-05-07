# Spec: Dashboard Page

## Status

Draft

## Spec Type

UI/page spec. This spec describes the protected dashboard screen, team board layout, dashboard navigation, and Figma-aligned presentation.

## Figma Source

Figma Make pages/components: `DashboardLayout` and `TeamBoard`.

## Summary

Create the protected dashboard page where signed-in users can see their team's goals, individual goal relationships, owners, statuses, progress, and QA metrics.

## User Story

As a signed-in team member, I want to see my team's dashboard so that I can understand current goals, quality status, and where collaboration is needed.

## Scope

- Protected dashboard route at `/dashboard`.
- Dashboard layout shell.
- Team board content.
- Goal summary and goal list.
- QA metric summary.
- Navigation to create a goal.
- Empty and unavailable states.

## Out of Scope

- Public landing content.
- Auth form implementation.
- Full goal editing.
- Historical analytics.
- Automated CI integration.

## Decisions

- The dashboard page maps to the Figma prototype's `DashboardLayout` and `TeamBoard`.
- `/dashboard` is the primary authenticated route.
- The first dashboard implementation may use sample data.
- Dashboard behavior must continue to satisfy `specs/005-dashboard-foundation/` and `specs/008-repo-qa-metrics/`.

## Related Specs

- `specs/004-create-goal-page/`
- `specs/005-dashboard-foundation/`
- `specs/007-goal-management/`
- `specs/008-repo-qa-metrics/`
