# Design: Auth and Team Membership

## Data Model

```ts
type User = {
  id: string;
  username: string;
  displayName?: string;
  passwordHash?: string;
};

type Team = {
  id: string;
  name: string;
  joinCode?: string;
};

type TeamMembership = {
  userId: string;
  teamId: string;
};
```

## Auth Notes

- Store password hashes only.
- Keep authentication separate from dashboard rendering.
- The dashboard should receive a current user and team context after sign-in.
- The Figma prototype includes an `AuthContext`; implementation should use an auth provider or equivalent boundary to keep auth state out of individual page components.
- Include sign-in and sign-up pages in the first app scaffold.

## Team Joining Notes

The simplest first approach is a join code. A later spec can add invites, admin approval, or multiple teams per user.

## Testing Notes

- Test successful sign-in.
- Test invalid sign-in.
- Test joining a team.
- Test dashboard scoping by team.
