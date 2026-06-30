## 1. Backend — repository & route

- [x] 1.1 Add `updateGoal(id: string, teamId: string, fields: Partial<Goal>): Promise<Goal | null>` to `src/db/repository.ts`
- [x] 1.2 Add `PUT /:teamId/goals/:id` route in `src/routes/teamRoutes.ts` using `protectedTeam` middleware and `validateAndBuildGoal` from `goalService.ts`
- [x] 1.3 Return `404` if the goal is not found or does not belong to the team

## 2. Frontend — API client

- [x] 2.1 Add `updateGoal(teamId: string, goalId: string, goal: GoalInput): Promise<{ goal: Goal }>` to `src/client/api.ts`

## 3. Frontend — Edit page

- [x] 3.1 Create `src/client/pages/EditGoalPage.tsx` — fetch goal by ID on mount, pre-populate form fields, submit via `updateGoal`, redirect to `/dashboard` on success
- [x] 3.2 Register the `/goals/:id/edit` route in `src/client/App.tsx`

## 4. Frontend — GoalCard edit button

- [x] 4.1 Add an "Edit" link/button to `src/client/components/GoalCard.tsx` that navigates to `/goals/:id/edit`

## 5. Verification

- [x] 5.1 Manually test: create a goal, click Edit, change the title, save — confirm dashboard reflects the update
- [x] 5.2 Manually test: submit the edit form with an empty title — confirm field-level error appears
- [x] 5.3 Manually test: navigate directly to `/goals/nonexistent-id/edit` — confirm graceful error handling
