# Spec: Create Goal Page

## Status

Draft

## Spec Type

UI/page spec. This spec describes the create-goal screen, form presentation, route behavior, and Figma-aligned interaction flow.

## Figma Source

Figma Make page/component: `CreateGoal`.

## Summary

Create the protected page for adding new team or individual goals from the dashboard.

## User Story

As a signed-in team member, I want to create a goal so that new team outcomes and individual contributions can be tracked on the dashboard.

## Scope

- Protected create-goal route at `/dashboard/goals/new`.
- Goal creation form.
- Team and individual goal support.
- Optional parent team goal for individual goals.
- Metric fields for progress tracking.
- Validation and save behavior.
- Return path to the dashboard.

## Out of Scope

- Editing existing goals.
- Deleting goals.
- Goal comments.
- Approval workflows.
- Automated metric creation.

## Decisions

- The create-goal page maps to the Figma prototype's `CreateGoal`.
- Create goal is the first planned write workflow after the read-only dashboard foundation.
- Goal creation behavior must continue to satisfy `specs/007-goal-management/`.

## Related Specs

- `specs/003-dashboard-page/`
- `specs/007-goal-management/`
