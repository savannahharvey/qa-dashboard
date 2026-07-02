## Context

The `frequently-failing-tests` change introduces the `TestRunResult` table with individual test names per Azure DevOps run. The user flow matching engine queries this table. Without that change deployed first, matching has nothing to work with (graceful empty state). User flows themselves require no external data — they are entirely team-authored content stored in PostgreSQL.

## Goals / Non-Goals

**Goals:**
- Simple keyword-extraction from plain-text step descriptions (tokenize, remove stop words, lowercase).
- Substring matching of extracted keywords against test names in `TestRunResult`.
- Coverage status per flow: covered / partially covered / not covered.
- Dismiss action for false-positive matches.
- Analytics panel with overall coverage score.

**Non-Goals:**
- Semantic/AI-based matching — keyword overlap only.
- Import/export of user flows.
- Version history for flow edits.
- Ordering/prioritizing flows by importance.

## Decisions

**Two-table design: `UserFlow` (definitions) + `UserFlowMatch` (computed matches).**
Separating definitions from computed matches keeps the match data refreshable without touching the user-authored content. Matches are recomputed after each Azure DevOps sync; dismissed matches are preserved across recomputes via the `dismissed` flag. Alternative considered: storing matches as JSON in `UserFlow` — rejected because it would make dismissal and querying by match harder.

**Keyword extraction strips stop words and punctuation; matches on substring containment.**
Test names like "should allow a user to sign up successfully" naturally contain the important tokens from a flow step "user signs up." Substring matching (e.g., `testName.toLowerCase().includes(keyword)`) catches partial words and avoids the need for stemming. Trade-off: some false positives (e.g., "sign" matching "design test"). The dismiss action handles these.

**`UNIQUE(userFlowId, testName)` on `UserFlowMatch` prevents duplicate matches.**
Recomputing matches after each sync uses `INSERT ... ON CONFLICT DO NOTHING` to preserve the `dismissed` flag on existing rows. New test names not previously seen are inserted fresh.

**Coverage status thresholds:**
- "Covered": ≥ 1 non-dismissed match AND `matchedKeywords.length / flow.keywords.length ≥ 0.5`.
- "Partially covered": ≥ 1 non-dismissed match but keyword ratio < 0.5.
- "Not covered": 0 non-dismissed matches.
These thresholds are simple enough to explain to users and adjust if needed.

**Score formula: `(covered × 1.0 + partially × 0.5) / total × 100`.**
Partial coverage counts as half credit. Consistent with the quality principles scoring approach.

## Risks / Trade-offs

- **Keyword instability**: if a team refactors step wording, existing keywords in `UserFlow.keywords` go stale until the flow is re-saved. → Keyword re-extraction happens on every edit — no manual step needed.
- **Test name volatility**: renamed tests break existing matches. → Matches are recomputed from scratch on each sync, so renamed tests naturally drop from matches and appear as new candidates.
- **Performance**: for teams with many flows and many test results, matching is O(flows × tests × keywords). At realistic scales (< 100 flows, < 5,000 test names) this is fast enough to run synchronously post-sync. → Add a guard: skip matching if `TestRunResult` count > 10,000 and log a warning.

## Migration Plan

1. Run migration to create `UserFlow` and `UserFlowMatch` tables.
2. Deploy backend routes and matching service.
3. Deploy frontend page and analytics panel.
4. Matching runs automatically on the next Azure DevOps sync — no manual trigger needed.
5. Rollback: remove routes and matching trigger; drop tables.
