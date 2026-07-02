## ADDED Requirements

### Requirement: Test type balance panel computes a ratio from existing QaMetric data
The analytics service SHALL read the most recent `QaMetric` value per category (UNIT, API, UI) with `kind=TESTS_PASSING` and compute the percentage each category represents of the total test count.

#### Scenario: Percentages computed from three categories
- **WHEN** all three categories have a non-null count value
- **THEN** the panel SHALL return the percentage for each category summing to 100%

#### Scenario: Missing category treated as zero
- **WHEN** one or more categories have no `QaMetric` value (null or absent)
- **THEN** that category SHALL contribute 0 to the total and the panel SHALL include a note indicating partial data

### Requirement: Balance score is computed from deviation against the default target
The analytics service SHALL compute a balance score (0–100) based on how close the actual ratio is to the default target (UNIT=70%, API=20%, UI=10%).

#### Scenario: Score is 100 for perfect match
- **WHEN** the actual distribution exactly matches the target (70/20/10)
- **THEN** the panel score SHALL be 100

#### Scenario: Score decreases proportionally with deviation
- **WHEN** the actual distribution deviates from the target
- **THEN** the score SHALL decrease proportionally using `(1 - totalDeviation / 2) * 100`, clamped to [0, 100]

### Requirement: Panel generates a recommendation based on the distribution
The panel SHALL return a text recommendation describing the most significant imbalance.

#### Scenario: Recommendation when unit tests are below target
- **WHEN** UNIT percentage is more than 10 percentage points below its target
- **THEN** the recommendation SHALL suggest increasing unit test coverage

#### Scenario: Recommendation when UI/e2e tests are above target
- **WHEN** UI percentage is more than 5 percentage points above its target
- **THEN** the recommendation SHALL suggest converting some e2e tests to unit or integration tests

#### Scenario: Recommendation when balance is near-target
- **WHEN** all categories are within 5 percentage points of their target
- **THEN** the recommendation SHALL indicate the distribution is healthy

### Requirement: Panel displays a donut chart and comparison bars
The test type balance panel UI SHALL display a donut chart of the three category percentages and a set of comparison bars showing actual vs. target per category.

#### Scenario: Donut chart renders three arcs
- **WHEN** the panel has data for all three categories
- **THEN** the donut chart SHALL render three colored arcs proportional to each category's percentage

#### Scenario: Target tick marks shown on comparison bars
- **WHEN** the comparison bars are rendered
- **THEN** each bar SHALL show a vertical tick mark at the target percentage position
