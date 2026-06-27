# Tasks: Team Creation and Joining

## Spec Tasks

- [x] Create team creation and joining spec.
- [x] Define team setup requirements.
- [x] Define design notes.

## Implementation Tasks

- [ ] Decide the exact team creation endpoint contract.
- [ ] Add backend support for creating a team.
- [ ] Return updated session membership after team creation.
- [ ] Preserve the existing join-team flow.
- [ ] Add team setup UI for create or join.
- [ ] Route signed-in users without a team into the setup flow.
- [ ] Redirect users to the dashboard after create or join succeeds.
- [ ] Add a dashboard action that returns to team setup.
- [ ] Keep the current team in auth state after session reload.

## Verification Tasks

- [ ] Verify a signed-in user can create a team.
- [ ] Verify a signed-in user can join an existing team.
- [ ] Verify validation errors appear for blank team name and join code.
- [ ] Verify the dashboard opens with the correct team after create or join.
- [ ] Verify the setup flow is skipped when the session already has a team.
- [ ] Verify the dashboard can return to the team setup screen without signing out.
