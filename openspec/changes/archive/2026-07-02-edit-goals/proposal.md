## Why

Users can create goals but have no way to update them after creation — if a title, target value, or other field is wrong, the only recourse is to delete and recreate the goal. Adding edit support closes this gap and makes the dashboard practical for ongoing use.

## What Changes

- Add an "Edit" button to each `GoalCard` that opens an edit form pre-populated with the goal's current data.
- Add an edit goal page (or modal) reusing the same fields as `CreateGoalPage`.
- Add a `PUT /api/goals/:id` endpoint to persist updates.
- Wire the frontend to call the update endpoint and refresh the dashboard on success.

## Capabilities

### New Capabilities

- `goal-editing`: Allows a user to update an existing goal's fields (title, description, target value, current value, metric type, test category, status, scope) and persist the changes.

### Modified Capabilities

<!-- No existing spec-level requirements are changing. -->

## Impact

- `src/client/components/GoalCard.tsx` — add Edit button
- `src/client/pages/` — new `EditGoalPage.tsx` (or shared form component)
- `src/server/` — new `PUT /api/goals/:id` route handler
- Database — existing goals table; no schema changes needed
