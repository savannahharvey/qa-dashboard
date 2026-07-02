## Context

The `frequently-failing-tests` change introduces `TestRunResult` with individual test names. This change reads from that table to evaluate principles — no new data ingestion needed. The evaluation runs server-side at analytics request time (not on a background schedule), using the last 30 days of test names by default.

## Goals / Non-Goals

**Goals:**
- Five hardcoded principles with configurable keyword lists in a domain constants file.
- Case-insensitive substring matching against test names.
- Status per principle: pass / warn / missing, with up to 3 example test names.
- Sorted checklist UI: missing first, then warn, then pass.

**Non-Goals:**
- AI/semantic analysis of test names — keyword matching only.
- Per-team customization of which principles to check (disable/enable) — future work.
- Analysis of test file content or assertions — test names only.

## Decisions

**Principles defined in `src/domain/qualityPrinciples.ts` as a typed constant array.**
Keeping principles in source code rather than the database makes them versionable, easy to review in PRs, and always in sync with the running code. Trade-off: adding a new principle requires a code deploy. Acceptable for a curated set that changes infrequently.

**Three-level status: pass / warn / missing.**
Each principle has a `passingThreshold` (minimum test count to "pass") and a `warnThreshold` (minimum to show "warn" instead of "missing"). This avoids binary all-or-nothing grading. Example: edge cases needs 3 tests to pass, 1 to warn. Security needs just 1 to pass (any security test is better than none).

**Score formula: `(pass × 1.0 + warn × 0.5 + missing × 0) / total × 100`.**
Consistent with other panel scoring formulas in this feature set.

**Examples capped at 3 per principle.**
More than 3 example test names per principle clutters the UI. The user can search Azure DevOps directly for the full list if needed.

**Missing principles sorted to the top of the checklist.**
The most actionable items (things the team is missing entirely) surface first. This makes the panel immediately useful without requiring the user to scan the whole list.

**Unicode status icons (✓ ⚠ ✗) styled with CSS color — no icon library.**
Consistent with the project's no-dependency approach for UI components.

## Risks / Trade-offs

- **Test name quality varies widely**: test names like "test 1" or "should work" won't match any principle keywords. → This is a team education issue, not a system flaw. The panel's low scores will motivate better test naming.
- **False positives**: "should reject invalid input" matches both "edge-cases" (invalid) and "error-handling" (reject). → Expected and acceptable; both principles are genuinely covered by such a test.
- **TestRunResult not yet populated**: if `frequently-failing-tests` hasn't been deployed or no sync has run, `TestRunResult` is empty. → Panel returns `{ status: "unavailable", reason: "No test result data yet" }`.
