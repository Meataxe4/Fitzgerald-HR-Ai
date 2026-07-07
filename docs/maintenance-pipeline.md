# Maintenance pipeline (Milestone 8)

How Fitz HR stays compliant *after* launch without manual archaeology. Three
loops, all built on the rates JSON (`*-award-rates.json`) that already grounds the
app, `chat.js`, and the regression suite.

| Concern | Tooling | CI |
| --- | --- | --- |
| Apply the 1 July wage review / ad-hoc variations | data edit + `validate:rates` + `build:regression` | `validate:rates` runs in `test:ci` |
| Rate data goes stale | `scripts/check-staleness.mjs` | warn in regression workflow; **weekly strict alert** in `staleness.yml` |
| Production misses feed the suite | `scripts/flag-to-regression.mjs` + `regression/flagged/` | new case runs in the gate |

---

## 1. Applying a wage-review update (data-only)

The annual Fair Work review takes effect **1 July**; ad-hoc variations happen
occasionally. Updating rates is a **data-only** change — no app logic changes.

1. For each affected `*-award-rates.json`:
   - Update the numeric fields from the new **FWO Pay Guide** (pay `rates`,
     `penalty_rates`, `allowances`, `casual_loading`, `superannuation_rate`).
   - Bump the dates: set `effective_date` to the new effective date and
     `next_review_date` to the next review (usually +1 year), and update
     `version` and `source` (Pay Guide publication date).
2. `npm run validate:rates` — structural check (dates valid, `effective_date` <
   `next_review_date`, `ma_number` matches, every rate/allowance well-formed).
3. `npm run build:regression` — re-freeze the regression answers from the new data.
4. `npm run test:ci` — guardrails + gate + suite must pass.
5. Commit the changed `*-award-rates.json` **and** the regenerated
   `regression/questions/*.json` together.

That is the whole procedure — no code changes required.

## 2. Staleness check & alert

`scripts/check-staleness.mjs` compares each award's `next_review_date` to today.

```bash
npm run check:staleness                 # report + warn (exit 0)
node scripts/check-staleness.mjs --strict          # exit 1 if any award is overdue
node scripts/check-staleness.mjs --warn-days 45     # "due soon" window (default 30)
STALENESS_TODAY=2027-07-02 npm run check:staleness  # pin "today" (tests)
```

- **In the regression workflow** it runs in warn mode — every push surfaces
  upcoming/overdue dates as `::warning::`/`::error::` annotations, non-blocking.
- **`.github/workflows/staleness.yml`** runs **weekly** (Mon 00:00 UTC) in
  `--strict` mode. If any award is past its review date it **fails and opens (or
  updates) a GitHub issue** labelled `staleness` — the alert that the annual
  update is due. Fix by following §1; the issue can then be closed.

## 3. Production feedback → regression cases

Closes the loop back into the Milestone 6 accuracy gate: a user-reported wrong
answer becomes a permanent guardrail.

1. **Capture.** A miss is reported (in-app feedback modal, support email, or SME
   review). Identify the award, the correct value, and the FWO Pay Guide source.
2. **File it.** Copy `regression/flagged/TEMPLATE.json` to a new report in
   `regression/flagged/` describing the correct answer as a machine-checkable
   `assert` (kinds: `resolves`, `resolves_unresolved`, `scalar`, `penalty`,
   `pay_rate`, `allowance`).
3. **Intake.** `npm run flag:to-regression` validates each report, appends it as a
   case to the right `regression/questions/<vertical>.json` (tagged
   `"origin": "production-flag"`), and moves the report to
   `regression/flagged/processed/`.
4. **Watch it fail.** `npm run test:regression` — the new case fails because the
   grounding is currently wrong. (For a LIVE/GA award this also fails CI, blocking
   release until fixed.)
5. **Fix & re-verify.** Correct the underlying `*-award-rates.json` data (then
   `build:regression`) or the grounding logic until the suite passes.
6. **Commit** the fix, the new regression case, and the processed report together.

The miss can now never regress silently — it is guarded forever.
