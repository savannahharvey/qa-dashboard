# Spec: Home Page

## Status

Draft

## Spec Type

UI/page spec. This spec describes the public home screen, route behavior, and Figma-aligned presentation.

## Figma Source

Figma Make page/component: `LandingPage`.

## Summary

Create the public home page for unauthenticated visitors. The page should introduce the QA Dashboard and route users toward sign in or account creation.

## User Story

As a visitor, I want to understand what the QA Dashboard is for so that I can decide whether to sign in or create an account.

## Scope

- Public landing page at `/`.
- Clear product identity for QA Dashboard.
- Primary path to sign in.
- Secondary path to sign up.
- Brief explanation of team goals, progress, and QA metric visibility.

## Out of Scope

- Authenticated dashboard content.
- Goal creation.
- Long marketing content.
- Pricing or plan management.

## Decisions

- The page maps to the Figma prototype's `LandingPage`.
- The home page is public and should redirect signed-in users to `/dashboard` when appropriate.
- The page should support the app's first implementation stack from `docs/decisions/0002-frontend-stack-from-figma.md`.

## Related Specs

- `specs/002-auth-pages/`
- `specs/003-dashboard-page/`
