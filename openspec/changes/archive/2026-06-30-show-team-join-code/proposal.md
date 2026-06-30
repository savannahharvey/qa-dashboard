## Why

After creating a team, there is no way for the team owner to find out what the join code is — it is generated on the backend and returned in the API response, but never shown in the UI. Teammates cannot be invited because the code is invisible.

## What Changes

- Display the team join code on the team dashboard header so members can share it at any time
- After creating a team, show the generated join code in the setup panel before navigating away

## Capabilities

### New Capabilities
- `team-join-code-display`: Surface the team join code in the UI — in the dashboard header for the active team, and immediately after team creation in the setup panel

### Modified Capabilities
<!-- No existing spec-level behavior changes -->

## Impact

- `src/client/pages/DashboardPage.tsx` — `DashboardHeader` and `TeamSetupPanel` components
- `src/client/api.ts` — `createTeam` return type already includes `joinCode`; no backend changes needed
- No database or API changes required; `joinCode` is already in the dashboard and team-create responses
