# SCHADS Award (MA000100) — rate extraction for verification

> **Source:** Fair Work Ombudsman *Pay Guide — MA000100*, published 24 Jun 2026, effective **01/07/2026**.
>
> **Scope:** the four base-rate streams of SCHADS. Sleepover, on-call, 24-hour-care, broken-shift and remote-work penalty tables are excluded by design.
>
> **Status:** every dollar rate below is machine-validated; structural rules (min engagement, shift loadings, penalties) are confirmed against the award text (`docs/ma000100.pdf`). Wired behind the `schads_preview` flag, pending final human/consultant sign-off before GA. Production data: `schads-award-rates.json` (repo root). Extractor: `scripts/extract_schads_rates.py`.

## Coverage — 152 base-rate rows, all validated ✅

Validation = for full-time/part-time, hourly×38 equals the published weekly **and** Saturday/Sunday/public-holiday columns are exactly 150% / 200% / 250% of the hourly rate; for casual, Saturday/Sunday/public-holiday are 175% / 225% / 275% of the base rate (= 140% / 180% / 220% of the loaded casual hourly).

| Stream | FT/PT rows | Casual rows | Levels |
|---|---|---|---|
| Social & community services (SACS) | 27 | 27 | Level 1–8 with pay points |
| Crisis accommodation | 14 | 14 | Level 1–4 with pay points |
| Family day care | 20 | 20 | Level 1–5 with pay points |
| Home care | 15 | 15 | disability care L1–5 (pay points) + aged care Introductory→Team leader |
| **Total** | **76** | **76** | |

## Core base rates — most-used (Adult, full-time/part-time)

| Stream / classification | FT/PT hourly | Weekly |
|---|---|---|
| SACS Level 1 pay point 1 | $27.55 | $1,046.90 |
| SACS Level 2 pay point 1 | $36.22 | $1,376.49 |
| SACS Level 8 pay point 3 | $71.19 | $2,705.27 |
| Crisis accommodation Level 1 pay point 1 | $40.49 | $1,538.59 |
| Family day care Level 1 pay point 1 | $27.58 | $1,048.10 |
| Home care (disability) Level 1 pay point 1 | $27.28 | $1,036.80 |
| Home care (aged) Level 2 — Home carer | $34.42 | $1,307.80 |

## Penalty & overtime model

| Item | FT/PT | Casual | Confidence |
|---|---|---|---|
| Saturday | 150% | 175% | ✅ validated, uniform |
| Sunday | 200% | 225% | ✅ validated, uniform |
| Public holiday | 250% | 275% | ✅ validated, uniform |
| Afternoon shift loading | +12.5% | +12.5% (+25% casual) | ✅ award cl 29.4 |
| Night shift loading | +15% | +15% (+25% casual) | ✅ award cl 29.4 |
| Overtime first 2 hrs (FT first 3 hrs) | 150% | 175% | ✅ rates schedule |
| Overtime after 2 hrs | 200% | 225% | ✅ rates schedule |
| Casual loading | — | +25% | ✅ validated |

## Resolved from the award text (`docs/ma000100.pdf`)

- **Minimum engagement** (clause 10.5) — part-time and casual employees are paid for a minimum per shift / broken-shift portion: social and community services employees (except disability services work) **3 hours**; all other employees **2 hours**. No separate 1-hour tier.
- **No annualised wage arrangement clause** exists in MA000100. The Annualised Wage document templates are excluded for this award.
- **Cash-out** = Schedule K; **leave-in-advance** = Schedule J.
- **Shift definitions** — afternoon shift finishes after 8pm and at or before midnight; night shift finishes after midnight and at or before 8am (clause 29.4).

## Please verify
Core: **SACS Level 1 pp1 $27.55**, **Home care (aged) Home carer $34.42**, **Crisis accommodation Level 1 pp1 $40.49**. Penalty reproduction: SACS L1pp1 Saturday = 27.55 × 1.5 = **$41.33**; casual Saturday = 27.55 × 1.75 = **$48.21** (both match the Pay Guide columns).
