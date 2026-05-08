# Tasks: Auth and Team Membership

## Spec Tasks

- [x] Create auth and team membership spec.
- [x] Define initial requirements.
- [x] Define design notes.
- [x] Decide account creation approach.
- [ ] Decide whether team joining uses a join code.
- [ ] Decide whether users can belong to multiple teams.

## Implementation Tasks

- [ ] Implement after the read-only dashboard foundation is in place.
- [ ] Add user model.
- [ ] Add team model.
- [ ] Add team membership model.
- [ ] Add sign-up flow.
- [ ] Add sign-in flow.
- [ ] Add sign-out flow.
- [ ] Add join-team flow.
- [ ] Add auth context/provider boundary.
- [ ] Scope dashboard data by current team.

## Verification Tasks

- [ ] Verify valid sign-up succeeds with Playwright.
- [ ] Verify duplicate username sign-up fails with Playwright.
- [ ] Verify valid sign-in succeeds with Playwright.
- [ ] Verify invalid sign-in fails with Playwright.
- [ ] Verify signed-in users can join a team with Playwright.
- [ ] Verify users only see their team's dashboard data with Playwright.
