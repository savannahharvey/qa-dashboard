# Requirements: Home Page

## Functional Requirements

### Requirement 1: Show Product Purpose

The home page must explain that QA Dashboard helps teams track goals, ownership, progress, and QA metrics.

Acceptance criteria:

- Given a visitor opens `/`, then they can identify the product as QA Dashboard.
- Given a visitor reads the page, then they can understand that the app tracks team goals and QA progress.

### Requirement 2: Provide Auth Navigation

The home page must provide clear paths to authentication pages.

Acceptance criteria:

- Given a visitor opens `/`, then a sign-in action is available.
- Given a visitor opens `/`, then a sign-up action is available.
- Given a visitor chooses sign in, then they are routed to `/sign-in`.
- Given a visitor chooses sign up, then they are routed to `/sign-up`.

### Requirement 3: Handle Signed-In Users

Signed-in users should not be stranded on the public home page.

Acceptance criteria:

- Given a signed-in user opens `/`, then they can navigate to `/dashboard`.
- Given automatic redirect is implemented, then signed-in users opening `/` are sent to `/dashboard`.

## Non-Functional Requirements

- The page should match the Figma visual direction.
- The page should be responsive.
- The page should avoid showing protected team data.
