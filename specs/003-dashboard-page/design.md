# Design: Dashboard Page

## Route

`/dashboard`

## Page Components

Use page components equivalent to the Figma prototype's `DashboardLayout` and `TeamBoard`.

## Layout Notes

- Protected dashboard shell.
- Header or dashboard navigation.
- Team context.
- QA metric summary cards.
- Goal summary.
- Team goal and individual goal sections or cards.
- Create-goal action.

## Data Dependencies

Initial implementation can use sample data for:

- Current user.
- Current team.
- Team goals.
- Individual goals.
- QA metrics.

The sample data should be shaped so it can later be replaced by a backend or automated metric source.

## State Handling

- Loading state while dashboard data is unavailable.
- Empty state when the team has no goals.
- Unavailable state for missing QA metrics.
- At-risk state for blocked or failing goals.

## Testing Notes

- Test dashboard protection.
- Test sample data rendering.
- Test goal empty state.
- Test unavailable metric state.
- Test create-goal navigation.
- Test responsive layout.
