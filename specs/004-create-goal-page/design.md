# Design: Create Goal Page

## Route

`/dashboard/goals/new`

## Page Component

Use a page component equivalent to the Figma prototype's `CreateGoal`.

## Form Fields

Required fields:

- Title.
- Scope.
- Owner.
- Current value.
- Target value.

Optional fields:

- Description.
- Parent team goal for individual goals.
- Metric type.
- Test category.
- Unit.
- Due date.

## Validation Rules

- Title must not be blank.
- Scope must be `team` or `individual`.
- Owner must be present.
- Current value and target value must be numeric when the metric requires numeric progress.
- Individual goals may reference a valid team goal through `parentGoalId`.
- Due date is optional.

## Save Behavior

The first implementation can save into sample or local app state. The save boundary should be easy to replace with a backend later.

After a successful save, route the user back to `/dashboard`.

## Testing Notes

- Test valid team goal creation.
- Test valid individual goal creation.
- Test individual goal parent linking.
- Test required-field validation.
- Test failed save behavior.
- Test successful redirect to dashboard.
