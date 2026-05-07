# Requirements: Auth and Team Membership

## Functional Requirements

### Requirement 1: Sign Up

Users must be able to create an account with a username and password.

Acceptance criteria:

- Given a new user enters valid account information, when they submit the sign-up form, then an account is created.
- Given the username is already taken, when the user submits the sign-up form, then they see a clear error.
- Given account creation succeeds, then the user can proceed to sign in or be signed in automatically.

### Requirement 2: Sign In

Users must be able to sign in with a username and password.

Acceptance criteria:

- Given a registered user enters valid credentials, when they submit the sign-in form, then they are signed in.
- Given a user enters invalid credentials, when they submit the sign-in form, then they see a clear error.
- Given a user is signed in, when they open the dashboard, then the dashboard can identify the current user.

### Requirement 3: Join Team

Signed-in users must be able to join a team.

Acceptance criteria:

- Given a signed-in user is not on a team, when they enter valid team join information, then they are added to the team.
- Given a signed-in user enters invalid team join information, then they see a clear error.
- Given a signed-in user belongs to a team, when they open the dashboard, then they see that team's goals.

### Requirement 4: Protect Team Data

Team dashboard data must be scoped to the signed-in user's team.

Acceptance criteria:

- Given a signed-in user belongs to Team A, when they open the dashboard, then they do not see private Team B data.
- Given a user is not signed in, when they try to access a protected dashboard view, then they are asked to sign in.

## Non-Functional Requirements

- Passwords must not be stored in plain text.
- Authentication behavior should be testable.
- Error messages should be clear without exposing sensitive security details.
