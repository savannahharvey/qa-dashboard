## 1. Dashboard Header — Show Join Code

- [x] 1.1 In `DashboardHeader` (`src/client/pages/DashboardPage.tsx`), read `dashboard?.team.joinCode` and render it below the team name when it is non-null
- [x] 1.2 Add a click-to-copy button next to the join code that calls `navigator.clipboard.writeText(joinCode)` and briefly shows "Copied!" feedback

## 2. Team Setup Panel — Show Join Code After Creation

- [x] 2.1 In `TeamSetupPanel.handleCreateTeam`, capture the return value of `createTeam(trimmedName)` and store the `joinCode` in a new local state variable instead of immediately calling `onCompleted()`
- [x] 2.2 When `joinCode` state is set, render the join code and a "Continue to dashboard" button in the panel; clicking the button calls `onCompleted()`
- [x] 2.3 Include a click-to-copy affordance on the post-creation join code display (reuse the same pattern from task 1.2)
