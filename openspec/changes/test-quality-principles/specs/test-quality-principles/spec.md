## ADDED Requirements

### Requirement: Quality principles are defined as a typed constant library
The system SHALL define at least five quality principles, each with an id, label, description, keyword list, passing threshold, and warn threshold, in `src/domain/qualityPrinciples.ts`.

#### Scenario: Five default principles are always present
- **WHEN** the quality principles service is loaded
- **THEN** the following principle ids SHALL be defined: `edge-cases`, `security`, `error-handling`, `happy-path`, `performance`

### Requirement: Principles are evaluated by scanning TestRunResult test names
The quality principles service SHALL evaluate each principle by counting unique test names from `TestRunResult` (last 30 days) that contain at least one of the principle's keywords (case-insensitive substring match).

#### Scenario: Principle passes when match count meets passing threshold
- **WHEN** the number of unique matching test names is ≥ the principle's `passingThreshold`
- **THEN** the principle status SHALL be "pass"

#### Scenario: Principle warns when match count is above warn threshold but below passing threshold
- **WHEN** the match count is > 0 and < `passingThreshold`, and the principle's `warnThreshold` is > 0
- **THEN** the principle status SHALL be "warn"

#### Scenario: Principle is missing when match count is zero
- **WHEN** no test names in the last 30 days match any of the principle's keywords
- **THEN** the principle status SHALL be "missing"

#### Scenario: Up to 3 example test names returned per principle
- **WHEN** a principle has matching test names
- **THEN** the response SHALL include up to 3 example test names that matched

### Requirement: Panel score is computed from principle statuses
The quality principles panel score SHALL equal `(pass × 1.0 + warn × 0.5) / total × 100`, rounded to the nearest integer.

#### Scenario: Score is 100 when all principles pass
- **WHEN** all five principles have status "pass"
- **THEN** the panel score SHALL be 100

#### Scenario: Score is 0 when all principles are missing
- **WHEN** all five principles have status "missing"
- **THEN** the panel score SHALL be 0

### Requirement: Panel checklist sorts missing principles to the top
The quality principles panel UI SHALL display principles sorted: missing first, warn second, pass last.

#### Scenario: Missing principles appear before passing ones
- **WHEN** the panel renders a mix of pass, warn, and missing principles
- **THEN** missing principles SHALL appear at the top of the checklist, followed by warn, then pass

### Requirement: Panel shows unavailable state when no test result data exists
The panel SHALL return `{ status: "unavailable" }` and render a prompt when `TestRunResult` has no data for the team.

#### Scenario: Unavailable state when TestRunResult is empty
- **WHEN** the team's `TestRunResult` table has no rows (or the frequently-failing-tests change is not yet active)
- **THEN** the panel SHALL show "Sync Azure DevOps test data to enable principle analysis"
