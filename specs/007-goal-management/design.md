# Design: Goal Management

## Data Model

```ts
type GoalScope = "team" | "individual";

type Goal = {
  id: string;
  teamId: string;
  ownerId: string;
  scope: GoalScope;
  parentGoalId?: string;
  title: string;
  description?: string;
  metricType?: string;
  testCategory?: "unit" | "api" | "ui";
  currentValue: number;
  targetValue: number;
  unit?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
};
```

## Ownership

Every goal must have an `ownerId`. For team goals, the owner is the person responsible for keeping the goal updated. For individual goals, the owner is the person responsible for completing that goal.

## Relationships

Individual goals can reference a team goal through `parentGoalId`. Team goals should not reference individual goals directly; supporting goals can be queried by parent ID.

## Date Handling

Dates are optional. Status rules should work without `dueDate`.

## Create Goal Flow

The Figma prototype includes a `CreateGoal` page. The first implementation should route goal creation from the dashboard shell and return users to the team board after a successful save.

Create-goal fields:

- Title.
- Description.
- Scope: team or individual.
- Owner.
- Parent team goal for individual goals.
- Metric type.
- Test category when the metric is QA-related.
- Current value.
- Target value.
- Unit.
- Optional due date.

Validation should live outside the page component so it can be tested directly.

## Testing Notes

- Test goal ownership validation.
- Test linking an individual goal to a team goal.
- Test goals without dates.
- Test create-goal validation.
