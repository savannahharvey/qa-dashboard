# Tasks: Create Goal Page

## Spec Tasks

- [x] Create page spec.
- [x] Define page requirements.
- [x] Define design notes.

## Implementation Tasks

- [ ] Defer until after the read-only dashboard foundation is implemented.
- [ ] Add `/dashboard/goals/new` route.
- [ ] Protect create-goal route.
- [ ] Build create-goal page.
- [ ] Add goal scope control.
- [ ] Add owner selection.
- [ ] Add parent team goal selection for individual goals.
- [ ] Add metric fields.
- [ ] Add optional due date field.
- [ ] Add validation logic.
- [ ] Add save behavior.
- [ ] Route to `/dashboard` after successful save.
- [ ] Match Figma create-goal visual direction.

## Verification Tasks

- [ ] Verify anonymous users cannot view the page with Playwright.
- [ ] Verify signed-in users can view the page with Playwright.
- [ ] Verify valid team goal creation with Playwright.
- [ ] Verify valid individual goal creation with Playwright.
- [ ] Verify validation errors render with Playwright.
- [ ] Verify successful save returns to `/dashboard` with Playwright.
- [ ] Verify mobile and desktop layouts with Playwright.
