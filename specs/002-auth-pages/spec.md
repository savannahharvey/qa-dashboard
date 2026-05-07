# Spec: Auth Pages

## Status

Draft

## Spec Type

UI/page spec. This spec describes the sign-in and sign-up screens, form presentation, navigation, and Figma-aligned page behavior.

## Figma Source

Figma Make pages/components: `SignInPage`, `SignUpPage`, and `AuthContext`.

## Summary

Create sign-in and sign-up pages so users can access protected dashboard features with an authenticated identity.

## User Stories

As a returning user, I want to sign in so that I can access my team's dashboard.

As a new user, I want to sign up so that I can join a team and begin tracking goals.

## Scope

- Sign-in page at `/sign-in`.
- Sign-up page at `/sign-up`.
- Username and password forms.
- Auth state handoff to the application.
- Navigation between sign-in, sign-up, and home.
- Redirect to the dashboard after successful auth.

## Out of Scope

- Password reset.
- Multi-factor authentication.
- Single sign-on.
- Social login.
- Admin account management.

## Decisions

- Auth pages map to the Figma prototype's `SignInPage` and `SignUpPage`.
- Auth state should be managed through an auth provider or equivalent boundary.
- Auth behavior must continue to satisfy `specs/006-auth-and-team-membership/`.

## Related Specs

- `specs/001-home-page/`
- `specs/003-dashboard-page/`
- `specs/006-auth-and-team-membership/`
