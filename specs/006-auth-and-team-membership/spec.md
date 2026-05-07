# Spec: Auth and Team Membership

## Status

Draft

## Spec Type

Domain/data spec. This spec describes authentication behavior, user identity, team membership, protected data scope, and backend-ready rules.

## Summary

Allow team members to sign in with a username and password, then join a team so the dashboard can show goals and metrics for the correct group.

## User Stories

As a team member, I want to sign in with a username and password so that my goals and team membership are associated with me.

As a new team member, I want to create an account so that I can join my team and use the dashboard.

As a team member, I want to join a team so that I can view the team's QA dashboard.

## Scope

- Username and password sign-in.
- Username and password sign-up.
- User identity for goal ownership.
- Joining an existing team.
- Associating a user with a team.

## Out of Scope

- Single sign-on.
- Multi-factor authentication.
- Password reset.
- Team administration roles.
- Invites and approval workflows.

## Open Questions

- Should joining a team require a team code?
- Can a user belong to more than one team?

## Decisions

- The first implementation should include a sign-up page because the Figma prototype includes `SignUpPage`.
- Auth state should be exposed to the app through an auth context or equivalent boundary.
