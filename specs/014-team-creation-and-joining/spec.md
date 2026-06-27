# Spec: Team Creation and Joining

## Status

Draft

## Spec Type

UI/page spec. This spec describes the authenticated team setup flow that lets a signed-in user create a new team or join an existing one before entering the dashboard.

## Summary

Allow signed-in users who do not yet have an active team to either create their own team or join an existing team so the dashboard always opens in the correct team context.

## User Stories

As a signed-in user with no team, I want to create a team so that I can start my own dashboard and invite others later.

As a signed-in user with no team, I want to join an existing team so that I can use the class or project team I already belong to.

As a signed-in user with a team, I want the app to take me to my team dashboard so that I can get to work quickly.

As a signed-in user on the dashboard, I want a way to return to the team setup screen so that I can create a different team or join another one if needed.

## Scope

- Team creation form for signed-in users.
- Joining an existing team with a join code.
- Automatic membership for the user who creates a team.
- Post-auth routing into the dashboard after create or join succeeds.
- Validation and error handling for both flows.
- A navigation path from the dashboard back to the team setup screen.

## Out of Scope

- Team invites.
- Approval or moderation workflows.
- Team roles beyond basic membership.
- Multiple-team switching.
- Team renaming or deletion.

## Open Questions

- Should team creation generate a join code automatically, or should the creator choose one?
- Should the creator be treated as the team owner in the data model?
- Can a user create more than one team?

## Decisions

- The first implementation should keep join-code-based joining because that already exists in the product and backend contracts.
- A user who creates a team should immediately become a member of that team.
- The team setup flow should only appear when the signed-in session does not already have an active team.

## Related Specs

- `specs/006-auth-and-team-membership/`
- `specs/010-backend-api-contracts/`
- `specs/012-frontend-backend-integration/`
