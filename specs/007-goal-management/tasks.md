# Tasks: Goal Management

## Spec Tasks

- [x] Create goal management spec.
- [x] Define ownership and relationship requirements.
- [x] Define optional date behavior.
- [ ] Decide who can create team goals.
- [ ] Decide who can create individual goals.
- [x] Align first create-goal flow with Figma prototype.
- [x] Add backend create-goal API contract reference.

## Implementation Tasks

- [ ] Implement goal creation after the read-only dashboard foundation and auth flow are in place.
- [ ] Add goal scope support.
- [ ] Require goal owner.
- [ ] Support individual goal parent links.
- [ ] Support goals without dates.
- [ ] Display team goals with supporting individual goals.
- [ ] Add create-goal route.
- [ ] Add create-goal form.
- [ ] Validate create-goal inputs.
- [ ] Save created goals into the current data source.
- [ ] Implement create-goal endpoint from `specs/010-backend-api-contracts/`.

## Verification Tasks

- [ ] Verify team goals display owners with Playwright.
- [ ] Verify individual goals display owners with Playwright.
- [ ] Verify individual goals can support team goals with Playwright.
- [ ] Verify goals without dates are valid with Vitest or Playwright.
- [ ] Verify valid goals can be created with Playwright.
- [ ] Verify invalid create-goal submissions show validation errors with Playwright.
