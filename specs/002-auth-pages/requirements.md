# Requirements: Auth Pages

## Functional Requirements

### Requirement 1: Sign In Page

The application must provide a sign-in page.

Acceptance criteria:

- Given a visitor opens `/sign-in`, then a sign-in form is shown.
- Given a user enters valid credentials, when they submit the form, then they are signed in.
- Given sign-in succeeds, then the user is routed to `/dashboard`.
- Given credentials are invalid, then a clear error is shown.

### Requirement 2: Sign Up Page

The application must provide a sign-up page.

Acceptance criteria:

- Given a visitor opens `/sign-up`, then a sign-up form is shown.
- Given a new user enters valid account details, when they submit the form, then an account is created.
- Given account creation succeeds, then the user can continue to `/dashboard` or the next required onboarding step.
- Given account details are invalid, then clear validation errors are shown.

### Requirement 3: Auth Page Navigation

Auth pages must let users move between related public routes.

Acceptance criteria:

- Given a visitor is on `/sign-in`, then they can navigate to `/sign-up`.
- Given a visitor is on `/sign-up`, then they can navigate to `/sign-in`.
- Given a visitor is on either auth page, then they can navigate back to `/`.

### Requirement 4: Protect Authenticated Routes

Auth pages must support protection of dashboard routes.

Acceptance criteria:

- Given a user is not signed in, when they try to access `/dashboard`, then they are routed to sign in or shown an auth prompt.
- Given a user is signed in, when they open `/dashboard`, then protected content is available.

## Non-Functional Requirements

- Passwords must not be stored in plain text.
- Errors should be clear without exposing sensitive details.
- Form validation should be testable.
- Pages should match the Figma visual direction.
