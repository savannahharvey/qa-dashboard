# Spec: Goal Management

## Status

Draft

## Spec Type

Domain/data spec. This spec describes goal data, ownership, relationships, creation behavior, and validation rules that UI screens must satisfy.

## Summary

Allow teams to define team goals and individual goals. Individual goals should support team goals, and every goal should have an owner.

## User Stories

As a team member, I want my individual goals to connect to team goals so that my work clearly supports the team's success.

As a team member, I want goals to have owners so that responsibility is visible.

As a team member, I want to create a goal from the dashboard so that new team or individual goals can be tracked.

## Scope

- Team goals.
- Individual goals.
- Goal ownership.
- Linking individual goals to team goals.
- Creating goals.
- Optional dates.

## Out of Scope

- Goal editing for the read-only dashboard foundation.
- Automated reminders.
- Goal comments or discussion threads.
- Goal approval workflows.

## Decisions

- Goals must have owners.
- Dates are optional.
- Individual goals should be able to support team goals.
- The Figma prototype includes a create-goal page, so goal creation should be planned as the first write workflow after the read-only dashboard foundation.
