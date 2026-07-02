## ADDED Requirements

### Requirement: Test Results page shows frequently failing tests table
The Test Results page SHALL include a "Frequently Failing Tests" section displaying a sortable table of tests ranked by failure rate.

#### Scenario: Table renders with data
- **WHEN** a team has Azure DevOps connected and at least one test has a failure rate above the threshold
- **THEN** the section SHALL display a table with columns: Test Name, Category, Total Runs, Failures, Failure Rate, Last Failed

#### Scenario: Empty state shown when no tests exceed threshold
- **WHEN** no tests in the selected window exceed the failure rate threshold
- **THEN** the section SHALL display a message: "No tests exceeded the failure threshold in the selected period"

### Requirement: Failure rate column uses color-coded severity pill
The failure rate value in the table SHALL be rendered as a color-coded pill indicating severity.

#### Scenario: Green pill for low failure rate
- **WHEN** a test's failure rate is below 10%
- **THEN** the pill SHALL be rendered in green

#### Scenario: Yellow pill for medium failure rate
- **WHEN** a test's failure rate is between 10% and 30%
- **THEN** the pill SHALL be rendered in yellow

#### Scenario: Red pill for high failure rate
- **WHEN** a test's failure rate exceeds 30%
- **THEN** the pill SHALL be rendered in red

### Requirement: Table supports filtering by category and time window
The user SHALL be able to filter the failing tests table by test category and lookback window without a full page reload.

#### Scenario: Category filter updates table
- **WHEN** the user selects a category (UNIT, API, or UI) from the filter dropdown
- **THEN** the table SHALL update to show only tests matching that category

#### Scenario: Time window filter updates table
- **WHEN** the user selects a time window (7, 30, or 90 days)
- **THEN** the table SHALL update to show only results from that lookback period

### Requirement: Table columns are sortable
The user SHALL be able to sort the table by any column by clicking the column header.

#### Scenario: Sort by failure rate descending (default)
- **WHEN** the table first loads
- **THEN** rows SHALL be ordered by failure rate descending

#### Scenario: Sort by column on header click
- **WHEN** the user clicks a column header
- **THEN** the table SHALL re-sort by that column, toggling between ascending and descending on subsequent clicks
