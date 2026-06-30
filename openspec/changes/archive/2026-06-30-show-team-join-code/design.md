## Context

The backend already generates a `joinCode` (format `QA-XXXXXX`) when a team is created and stores it in the database. Both the `POST /api/teams/create` response and the `GET /api/teams/:teamId/dashboard` response already include `joinCode`. The client `Team` type already has `joinCode?: string | null`. Nothing needs to change on the server side.

The gap is purely frontend: `DashboardHeader` ignores `dashboard.team.joinCode`, and `TeamSetupPanel.handleCreateTeam` calls `createTeam()` but discards its return value instead of capturing and displaying the code.

## Goals / Non-Goals

**Goals:**
- Show `joinCode` in the `DashboardHeader` component (sourced from `dashboard.team.joinCode`)
- Show `joinCode` in `TeamSetupPanel` after a successful team creation (sourced from `createTeam()` return value)
- Provide a copy-to-clipboard interaction for the displayed code

**Non-Goals:**
- Regenerating / rotating join codes
- Restricting who can see the join code (any dashboard member sees it)
- Backend changes of any kind

## Decisions

**Where to show on the dashboard**: Inside `DashboardHeader`, below the team name. The `dashboard` prop is already passed in and contains `team.joinCode`. No new props or state needed.

**After team creation**: `TeamSetupPanel.handleCreateTeam` currently calls `createTeam()` then immediately calls `onCompleted()`. Instead, capture the returned `joinCode`, store it in local state, and render it. A "Continue to dashboard" button calls `onCompleted()`. This keeps the flow sequential without a separate modal.

**Copy to clipboard**: Use `navigator.clipboard.writeText()` with a toggled "Copied!" confirmation label. No external library needed.

## Risks / Trade-offs

- `navigator.clipboard` requires a secure context (HTTPS or localhost). The deployed app uses HTTPS so this is fine. If clipboard write fails, the code is still visible and selectable.
- `joinCode` may be `null` for teams created before the field was added. Both display sites should guard with a null check and render nothing in that case.

## Migration Plan

No migration needed — all changes are frontend-only additions.
