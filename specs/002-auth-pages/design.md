# Design: Auth Pages

## Routes

- `/sign-in`
- `/sign-up`

## Page Components

Use page components equivalent to the Figma prototype's `SignInPage` and `SignUpPage`.

## Form Fields

Sign in:

- Username.
- Password.

Sign up:

- Username.
- Password.
- Optional display name if supported by the first data model.

## Auth Boundary

Use an auth provider or equivalent app-level boundary for:

- Current user.
- Sign-in action.
- Sign-up action.
- Sign-out action.
- Protected route checks.

## Routing Behavior

- Successful sign in routes to `/dashboard`.
- Successful sign up routes to `/dashboard` or a team-join step if team membership is required first.
- Failed auth keeps the user on the current page and shows an error.

## Testing Notes

- Test valid and invalid sign in.
- Test valid and invalid sign up.
- Test protected route behavior.
- Test navigation between auth pages.
