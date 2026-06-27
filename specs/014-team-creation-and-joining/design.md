# Design: Team Creation and Joining

## Entry Point

Use the authenticated area as the entry point.

- If the session already has a team, route the user to `/dashboard`.
- If the session has no team, show a team setup view instead of a blank dashboard.

## Page Structure

The setup view should provide two paths:

- Create a team.
- Join an existing team.

The view can be implemented as a two-panel layout, tabs, or stacked cards, as long as both actions are visible without extra navigation.

## Create Team Form

Required fields:

- Team name.

Optional fields:

- Team code or other identifier, if the backend chooses to support one later.

Expected behavior:

- The creator becomes the first member of the new team.
- The response should include the new team so the auth session can update immediately.

## Join Team Form

Required fields:

- Join code.

Expected behavior:

- Joining should remain code-based for the first implementation.
- On success, the session should refresh and the user should continue into the dashboard for the joined team.

## Routing and Session Behavior

- After create or join succeeds, refresh the auth session before entering the dashboard.
- If the user already has a team membership, do not show the setup flow again unless the session is cleared.
- If the backend returns a session that includes multiple teams, the first team can remain the primary team until a later multi-team selection spec exists.

## Dashboard Return Action

Add a dashboard-level action such as `Switch team`, `Back to team setup`, or `Create/join another team`.

- The action should route the user back to the team setup experience.
- The action should not sign the user out.
- The action should preserve the existing session so the setup screen can decide whether to show create/join options based on current memberships.

## Backend Contract Assumptions

The first implementation will likely need a team creation endpoint in addition to the existing join endpoint. This spec does not lock the exact HTTP shape, but it assumes the backend can return the created team and updated session membership.

## Testing Notes

- Use component or page tests to verify the create-team and join-team forms render and validate correctly.
- Use integration tests to verify successful create/join flows update the auth session.
- Use browser tests to verify the user is sent to the dashboard after team setup succeeds.
- Use browser tests to verify the user can return from the dashboard to the team setup screen.
