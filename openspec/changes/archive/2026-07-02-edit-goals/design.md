## Context

The dashboard already has a `CreateGoalPage` with a full goal form and a `POST /api/teams/:teamId/goals` route backed by `goalService.ts`. The `GoalCard` component renders each goal but has no edit affordance. The `repository.ts` layer handles DB access.

## Goals / Non-Goals

**Goals:**
- Add an Edit button to `GoalCard` linking to `/goals/:id/edit`
- Add `EditGoalPage` that reuses the same form fields as `CreateGoalPage`, pre-populated from the existing goal
- Add `PUT /api/teams/:teamId/goals/:id` route + `repository.updateGoal` method
- Add `updateGoal` API function in `src/client/api.ts`

**Non-Goals:**
- Inline editing directly on the card
- Partial PATCH updates (full replacement is simpler and consistent with create)
- Changing a goal's team assignment

## Decisions

**Reuse form UI, don't abstract yet** — `CreateGoalPage` and `EditGoalPage` share the same fields. Rather than immediately extracting a shared `GoalForm` component (which would be the right long-term move), we copy the form to `EditGoalPage` to keep scope small. A follow-up refactor can consolidate them.

**Route: `/goals/:id/edit`** — Follows the standard REST-like URL pattern already used by `/goals/new` (create). Needs a new route entry in `App.tsx`.

**Fetch goal on mount** — `EditGoalPage` fetches the individual goal by ID to pre-populate the form. Since the dashboard already loads all goals, we could pass state via router, but fetching on mount is more robust (direct URL access, refresh).

**`PUT /api/teams/:teamId/goals/:id`** — Scoped under the team route for consistency with `POST /:teamId/goals`. The team membership check (`protectedTeam` middleware) already exists and guards it.

## Risks / Trade-offs

- [Stale data] User navigates to edit a goal that was just deleted by another user → the PUT returns 404; show a user-friendly error and redirect to dashboard.
- [Form duplication] Copying `CreateGoalPage` to `EditGoalPage` creates drift risk → acceptable short-term; note in code for later consolidation.

## Open Questions

- Should the Edit button appear for all users or only the goal owner / team admin? (Assuming all authenticated team members for now — matches the current create permission model.)
