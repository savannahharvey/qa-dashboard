# qa-dashboard
This dashboard will allow us to see our goals for our team in more tangible and trackable ways. It will encourage collaboration and team building as we work together toward our goals.

## Spec-Driven Development

This project uses a spec-driven workflow. Before implementing a feature, define the product intent, expected behavior, design decisions, and implementation tasks in the `docs/` and `specs/` folders.

Start here:

1. Read `docs/product-brief.md` to understand the project purpose.
2. Review `docs/glossary.md` for shared terms.
3. Check `docs/decisions/` for recorded project decisions.
4. Use `specs/001-dashboard-foundation/` as the first feature spec.

Current specs:

- `001-dashboard-foundation`: read-only dashboard view for goals, owners, progress, status, and initial QA metrics.
- `002-auth-and-team-membership`: username/password sign-in and joining a team.
- `003-goal-management`: team goals, individual goals, ownership, and optional dates.
- `004-repo-qa-metrics`: tests passing and test coverage for unit, API, and UI tests.

For each feature, create a new folder under `specs/` using this pattern:

```text
specs/
  002-feature-name/
    spec.md
    requirements.md
    design.md
    tasks.md
```
