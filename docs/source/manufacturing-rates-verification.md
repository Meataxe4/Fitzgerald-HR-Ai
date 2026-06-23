# Manufacturing Award (MA000010) — rate extraction for verification

> **Source:** Fair Work Ombudsman *Pay Guide — MA000010*, published 16 Oct 2025, rates effective **01/07/2025**.
>
> **Scope:** GENERAL manufacturing only; vehicle manufacturing (Schedule B) excluded by design.
>
> **Status:** DRAFT for review — NOT wired into the app. Draft data: `docs/source/manufacturing-award-rates.draft.json`. Rates superseded by the imminent annual increase — re-run `scripts/extract_manufacturing_rates.py` on the new PDF.

## Base hourly rates — Adult, general manufacturing (✅ validated)

Full-time/part-time validated by hourly×38=weekly; casual validated as exactly +25%.

| C-level | Full-time/PT hourly | Casual hourly (+25%) | Weekly (FT) |
|---|---|---|---|
| **C14** | $24.28 | $30.35 | $922.70 |
| **C13** | $24.95 | $31.19 | $948.00 |
| **C12** | $25.85 | $32.31 | $982.40 |
| **C11** | $26.70 | $33.38 | $1014.70 |
| **C10** | $28.12 | $35.15 | $1068.40 |
| **C9** | $29.00 | $36.25 | $1102.00 |
| **C8** | $29.88 | $37.35 | $1135.50 |
| **C7** | $30.68 | $38.35 | $1165.70 |
| **C6** | $32.23 | $40.29 | $1224.90 |
| **C5** | $32.90 | $41.13 | $1250.10 |
| **C4** | $33.78 | $42.23 | $1283.50 |
| **C3** | $35.55 | $44.44 | $1350.80 |
| **C2(a)** | $36.43 | $45.54 | $1384.40 |
| **C2(b)** | $38.03 | $47.54 | $1445.10 |

## Penalty & overtime model (day worker)

| Item | Rate | Confidence |
|---|---|---|
| Saturday (ordinary hours) | 150% | ✅ HIGH — validated, uniform |
| Sunday (ordinary hours) | 200% | ✅ HIGH — validated, uniform |
| Public holiday | 250% | ✅ HIGH — validated, uniform |
| Overtime — first 3 hours | 150% | ✅ HIGH |
| Overtime — after 3 hours | 200% | ✅ HIGH |
| Sunday overtime | 200% | ✅ HIGH |
| Afternoon shift loading | +15% | ⚠️ MEDIUM — confirm column mapping |
| Night shift loading | +15% | ⚠️ MEDIUM |
| Permanent night shift | +30% | ⚠️ MEDIUM |
| Casual loading | +25% | ✅ HIGH — validated |

## Not yet extracted (later passes, before go-live)

- **Juniors** (pp. 32+) and **apprentices** (pp. 47+)
- **Professional/technical stream** — Advanced Certificate / Associate Diploma / Degree → C2(b)/C1 (different column layout; deliberately not auto-trusted)
- **Minimum engagement** — not in the Pay Guide; must be read from the award text
- **Special penalties** — meal-break, ship trials, wharf (niche; low priority)

## Please verify

The base-rate table above is the core. The ⚠️ MEDIUM shift-loading rows are the only ones I'm not fully certain map to the right column — worth a glance at the award. Everything marked ✅ is machine-validated.
