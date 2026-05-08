# Tasks: Auth Pages

## Spec Tasks

- [x] Create page spec.
- [x] Define page requirements.
- [x] Define design notes.

## Implementation Tasks

- [ ] Implement after the read-only dashboard foundation is planned and sample auth data exists.
- [ ] Add `/sign-in` route.
- [ ] Add `/sign-up` route.
- [ ] Build sign-in page.
- [ ] Build sign-up page.
- [ ] Add auth provider/context.
- [ ] Add protected route behavior.
- [ ] Add validation and error states.
- [ ] Add post-auth routing to `/dashboard`.
- [ ] Match Figma auth page visual direction.

## Verification Tasks

- [ ] Verify sign-in page renders with Playwright.
- [ ] Verify sign-up page renders with Playwright.
- [ ] Verify valid sign in reaches `/dashboard` with Playwright.
- [ ] Verify invalid sign in shows an error with Playwright.
- [ ] Verify valid sign up creates a user with Playwright.
- [ ] Verify invalid sign up shows validation errors with Playwright.
- [ ] Verify anonymous users cannot view protected dashboard content with Playwright.
