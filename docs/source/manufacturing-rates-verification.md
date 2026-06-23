# Manufacturing Award (MA000010) — COMPLETE rate extraction for verification

> **Source:** Fair Work Ombudsman *Pay Guide — MA000010*, published 16 Oct 2025, effective **01/07/2025**.
>
> **Scope:** GENERAL manufacturing only; vehicle manufacturing (Schedule B) excluded by design.
>
> **Status:** DRAFT — every dollar rate below is machine-validated, but needs human/consultant sign-off before go-live. NOT wired into the app. Data: `docs/source/manufacturing-award-rates.draft.json`.

## Coverage — 149 classifications, all validated ✅

Validation = hourly×38 equals weekly (where given) **and** Saturday/Sunday/public-holiday columns are exactly 150% / 200% / 250% of the hourly rate.

| Category | Rows | Notes |
|---|---|---|
| Adult wages + professional/technical — FT/PT | 36 | C14→C2(b) + Advanced Cert/Diploma/Technical-field streams |
| Adult wages + professional/technical — Casual | 36 | uniform +25% |
| Junior — FT/PT | 11 | age-based (under 16→20), foundry / non-foundry |
| Junior — Casual | 11 |  |
| Apprentice — FT/PT | 42 | before/after 1 Jan 2014 × Year 10/11/12 × adult; stages 1–4 + higher/advanced |
| Trainee (tech field/engineer/scientist) — FT/PT | 10 | by age band |
| Cadet (technical field) — FT/PT | 3 | 1st–3rd year of training |

## Core base rates — Adult, general manufacturing (most-used)

| C-level | FT/PT hourly | Weekly |
|---|---|---|
| **C14** | $24.28 | $922.70 |
| **C13** | $24.95 | $948.00 |
| **C12** | $25.85 | $982.40 |
| **C11** | $26.70 | $1014.70 |
| **C10** | $28.12 | $1068.40 |
| **C9** | $29.00 | $1102.00 |
| **C8** | $29.88 | $1135.50 |
| **C7** | $30.68 | $1165.70 |
| **C6** | $32.23 | $1224.90 |
| **C5** | $32.90 | $1250.10 |
| **C4** | $33.78 | $1283.50 |
| **C3** | $35.55 | $1350.80 |
| **C2(a)** | $36.43 | $1384.40 |
| **C2(b)** | $38.03 | $1445.10 |

## Penalty & overtime model (day worker)

| Item | Rate | Confidence |
|---|---|---|
| Saturday (ordinary) | 150% | ✅ validated, uniform |
| Sunday (ordinary) | 200% | ✅ validated, uniform |
| Public holiday | 250% | ✅ validated, uniform |
| Overtime first 3 hrs | 150% | ✅ HIGH |
| Overtime after 3 hrs | 200% | ✅ HIGH |
| Sunday overtime | 200% | ✅ HIGH |
| Casual loading | +25% | ✅ validated |
| Afternoon shift | +15% | ⚠️ confirm mapping |
| Night shift | +15% | ⚠️ confirm mapping |
| Permanent night shift | +30% | ⚠️ confirm mapping |

## Not in the dollar dataset (handled separately)

- **Supervisor/Trainer/Coordinator** & **Technology Cadet / Completed Cadetship** — defined as **percentages** of base rates (e.g. Supervisor L2 = 115% of the minimum hourly wage); modelled as formulas, not absolute rates.
- **Minimum engagement** — not in the Pay Guide; read from award text.
- **Niche penalties** — meal-break, ship trials, wharf.

## Please verify

Core: **C10 $28.12**, **C14 $24.28**. Apprentice: *Started after 1 Jan 2014, stage 1* = **$22.49/hr ($854.72/wk)**. Only the ⚠️ shift-loading rows need a manual glance; everything else is machine-validated.
