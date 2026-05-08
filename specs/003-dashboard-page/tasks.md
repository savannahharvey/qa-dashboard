# Tasks: Dashboard Page

## Spec Tasks

- [x] Create page spec.
- [x] Define page requirements.
- [x] Define design notes.

## Implementation Tasks

- [ ] Implement as the first protected product surface after sample data and business-rule utilities exist.
- [ ] Add `/dashboard` route.
- [ ] Build protected dashboard layout.
- [ ] Build team board page.
- [ ] Use sample dashboard data from `docs/sample-data.md`.
- [ ] Render QA metric summary cards.
- [ ] Render team goals.
- [ ] Render supporting individual goals.
- [ ] Render owner, status, and progress for each goal.
- [ ] Add empty states.
- [ ] Add unavailable metric states.
- [ ] Add create-goal navigation.
- [ ] Match Figma dashboard visual direction.

## Verification Tasks

- [ ] Verify anonymous users cannot see dashboard content with Playwright.
- [ ] Verify signed-in users can see dashboard content with Playwright.
- [ ] Verify goals render from sample data with Playwright.
- [ ] Verify QA metrics render from sample data with Playwright.
- [ ] Verify empty state renders with Playwright.
- [ ] Verify create-goal action routes to `/dashboard/goals/new` with Playwright.
- [ ] Verify mobile and desktop layouts with Playwright.
