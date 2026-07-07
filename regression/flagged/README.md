# Flagged-answer inbox (production feedback → regression)

Drop one JSON report per production-reported wrong answer here, then run:

```bash
npm run flag:to-regression
```

Each report is validated and appended as a permanent case to the matching
`regression/questions/<vertical>.json`, and the report is moved to `processed/`.
The new case **fails** the suite until the underlying rate data or grounding
logic is fixed — that is how a real-world miss becomes a guardrail.

- Copy `TEMPLATE.json` to a new file (e.g. `2026-07-07-ma000009-cook-level3.json`).
- `award` must be one of: MA000009, MA000119, MA000010, MA000100, MA000004, MA000027, MA000120.
- `assert.kind` must be one the runner understands: `resolves`, `resolves_unresolved`,
  `scalar`, `penalty`, `pay_rate`, `allowance` (see `scripts/run-regression.mjs`).

Full procedure: **[docs/maintenance-pipeline.md](../../docs/maintenance-pipeline.md)**.
