# Requirements: Repo QA Metrics

## Functional Requirements

### Requirement 1: Track Tests Passing

The system must represent whether unit, API, and UI tests are passing.

Acceptance criteria:

- Given unit tests are passing, when metrics are shown, then unit tests are marked passing.
- Given API tests are failing, when metrics are shown, then API tests are marked failing.
- Given UI test status is unavailable, when metrics are shown, then UI tests are marked unavailable.

### Requirement 2: Track Test Coverage

The system must represent test coverage for unit, API, and UI tests.

Acceptance criteria:

- Given unit test coverage is 82%, when metrics are shown, then unit coverage displays 82%.
- Given coverage data is unavailable, when metrics are shown, then coverage displays as unavailable.
- Given coverage is above a goal target, when metrics are shown, then the related goal can be marked complete.

### Requirement 3: Connect Metrics to Goals

QA metrics must be usable as progress values for goals.

Acceptance criteria:

- Given a team goal targets 90% unit test coverage and current coverage is 82%, then progress is calculated from 82 out of 90.
- Given a goal tracks tests passing, then passing status can count as complete and failing status can count as incomplete.

## Non-Functional Requirements

- Metric data should be easy to replace with automated repo data later.
- Metric calculations should be testable.
- Unavailable metrics should not break the dashboard.
