# Spec: Auth and Team Membership

## Status

Draft

## Summary

Allow team members to sign in with a username and password, then join a team so the dashboard can show goals and metrics for the correct group.

## User Stories

As a team member, I want to sign in with a username and password so that my goals and team membership are associated with me.

As a team member, I want to join a team so that I can view the team's QA dashboard.

## Scope

- Username and password sign-in.
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

- Should users create their own accounts, or should accounts be seeded by an instructor or admin?
- Should joining a team require a team code?
- Can a user belong to more than one team?
