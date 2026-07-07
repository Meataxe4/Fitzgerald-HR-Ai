# Regression suite (new-vertical accuracy gate)

Frozen, SME-sourced regression questions that gate a vertical's launch on
accuracy. Each `questions/<vertical>.json` file holds real questions with a
correct answer frozen at generation time and a machine-checkable `assert`.

- Run it: `npm run test:regression`
- How it works, the launch gate, the procedure to launch a vertical, and how to
  add cases: **[docs/regression-suite.md](../docs/regression-suite.md)**.

Do not edit the generated `questions/*.json` by hand and then re-run the
generator — see the docs for the supported way to add curated questions.
