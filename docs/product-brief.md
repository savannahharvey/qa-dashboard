# Product Brief

## Project

`qa-dashboard` is a dashboard for making team goals visible, measurable, and easier to discuss. Team members can sign in, join a team, view team goals, and see individual goals that support those team goals.

## Problem

Team goals can become hard to track when they live in scattered conversations, spreadsheets, assignments, or memory. QA progress can also become difficult to understand when test and coverage signals are separated from the goals they support. The dashboard should create one shared place where goals, ownership, and QA progress are clear.

## Audience

- Team members who need to understand current goals and progress.
- Team leads or project owners who need to define goals and identify risk.
- Instructors, reviewers, or stakeholders who need a quick view of team health.

## Goals

- Make team goals tangible and trackable.
- Connect individual goals to team goals.
- Show who owns each goal.
- Track initial QA metrics for unit, API, and UI tests.
- Gather QA metrics from Azure DevOps test result and coverage endpoints after the sample dashboard foundation is stable.
- Show progress in a way that is easy to scan.
- Encourage collaboration by making blocked or at-risk goals visible.
- Start with a simple foundation that can grow into a fuller dashboard.

## Non-Goals

- This project is not a full project management system at the start.
- This project does not need complex analytics in the first version.
- The first dashboard view can be read-only.
- Dates and deadlines are optional.
- Automated repo metric collection is not required in the first dashboard foundation, but Azure DevOps is the planned first integration.

## Initial Success Criteria

- A user can see a list of team goals.
- A user can see individual goals that support team goals.
- A user can see who owns each goal.
- A user can see measurable progress for each goal.
- A user can tell which goals are active, completed, or at risk.
- A user can see tests passing and test coverage for unit, API, and UI tests.
- A user can eventually see Azure DevOps-sourced test status and coverage without changing how goals are displayed.
- The project has specs that describe behavior before implementation begins.

## Figma Alignment

The current Figma Make prototype defines the first visible product shape: unauthenticated landing, sign-in, sign-up, protected dashboard, team board, and create-goal views. Specs should preserve those screens as planned implementation surfaces while keeping domain behavior documented in requirements before code is written.
