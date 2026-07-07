# Regression suite & accuracy gate (Milestone 6)

This is how Fitz HR earns the "compliant / best-in-class" claim before launching a
new award vertical. It is a **fail-closed accuracy gate**: a vertical cannot go
live (GA) until its regression suite clears `ACCURACY_THRESHOLD`, and CI enforces
this on every push and pull request.

## What it is

| Piece | Path | Role |
| --- | --- | --- |
| Question suite | `regression/questions/*.json` | 220 real new-vertical questions with frozen, SME-sourced correct answers (one file per vertical). |
| Generator | `scripts/build-regression-questions.mjs` | Derives the suite from the shipped, SME-verified Pay Guide data (`*-award-rates.json`). |
| Runner + gate | `scripts/run-regression.mjs` | Re-checks every answer against the live grounding data, reports the pass rate, and enforces the launch gate. |
| Gate test | `tests/regression-gate.test.js` | Proves the gate is enforced (fails the build), not advisory. |
| CI | `.github/workflows/regression.yml` | Runs all of the above on every push/PR and uploads a report. |

Each question freezes the correct answer as an `assert.equals` value **and** carries
an `assert` selector. The runner re-loads the live grounding data
(`*-award-rates.json` + the real `resolveAward()` from `js/app-main.js`) and
re-evaluates every selector. If the shipped data or the resolution logic ever
drifts away from the frozen answer, the assertion fails — that is the regression
signal.

Answer categories covered per vertical: award resolution (incl. fail-closed guard),
casual loading, superannuation, minimum engagement, penalty/shift loadings, pay
rates for real classifications, allowances, and data currency/review dates.

## The gate

The `AWARD_REGISTRY` in `js/app-main.js` is the single source of truth for launch
state:

- `status: 'supported'` → **LIVE (GA)** — the vertical is launched; no feature flag.
- `status: 'preview'` → gated behind its `*_preview` feature flag — **OFF** by default.

The runner reads that status and enforces:

> An award may only be `status: 'supported'` if its regression pass rate ≥ `ACCURACY_THRESHOLD`.

- A **LIVE (GA)** award below the bar → the runner exits non-zero → **the build fails**.
  You cannot merge a change that launches a vertical (flips it out of preview)
  unless its suite clears the bar. This is what keeps a below-bar vertical's feature
  flag off.
- A **preview** award below the bar → reported, but not fatal (it is correctly kept off).
- A **preview** award that clears the bar → reported as **eligible to launch**.

`ACCURACY_THRESHOLD` defaults to `0.95` and is set in the workflow env. Raise it as
coverage grows.

## Running locally

```bash
npm run test:regression      # run the suite + gate, print the score
npm run test:gate            # prove the gate is enforced (fail-closed)
npm run test:ci              # guardrail tests + gate test + suite (what CI runs)
ACCURACY_THRESHOLD=0.98 npm run test:regression   # try a higher bar
node scripts/run-regression.mjs --json report.json # also write a machine report
```

## Launching a vertical (procedure)

1. Confirm the vertical's rate data (`<vertical>-award-rates.json`) is current and
   SME-verified for the effective period.
2. Regenerate the suite so it reflects that data: `npm run build:regression`.
3. Run `npm run test:regression` and confirm the vertical is listed as **eligible
   to launch** (≥ `ACCURACY_THRESHOLD`).
4. In `js/app-main.js`, change that award's `AWARD_REGISTRY` entry from
   `status: 'preview'` (with its `flag`) to `status: 'supported'`, and remove the
   now-unused `*_preview` UI gates for it.
5. Push. CI now treats the vertical as LIVE (GA) and will **block** any future
   change that drops it below the bar.

## Adding / updating questions

- **Data changed** (e.g. the 1 July wage review): update the `*-award-rates.json`
  file, then `npm run build:regression` to re-freeze answers, and commit both.
- **New hand-authored question**: add an object to the relevant
  `regression/questions/<vertical>.json` file using an existing `assert.kind`
  (`resolves`, `resolves_unresolved`, `scalar`, `penalty`, `pay_rate`,
  `allowance`). The generator only *seeds* the file — hand-authored entries in it
  are preserved only if you do not re-run the generator, so prefer adding new
  selector types to the generator, or keep curated questions in a clearly-named
  separate file under `regression/questions/`.

### Feedback loop (production misses → new cases)

When a user-reported miss or an SME review surfaces a wrong answer for a supported
vertical, capture it as a regression case so it can never regress silently:

1. Reproduce the wrong answer and identify the correct value + FWO Pay Guide source.
2. Add a question to `regression/questions/<vertical>.json` whose `assert` encodes
   the correct value (fails today).
3. Fix the underlying grounding data or logic until `npm run test:regression`
   passes again.
4. Commit the new question alongside the fix — the suite now guards it forever.

(The automated production flag → suite intake path is Milestone 8.)
