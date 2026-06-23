# Manufacturing Award (MA000010) — rate extraction for verification

> **Source:** Fair Work Ombudsman *Pay Guide — Manufacturing and Associated Industries and Occupations Award [MA000010]*, published 16 Oct 2025, rates effective **01/07/2025**.
>
> **Scope:** GENERAL manufacturing only. Vehicle manufacturing (Schedule B) is excluded by design.
>
> **Status:** DRAFT for review. Not wired into the app. Rates will be superseded by the imminent annual increase — re-run `scripts/extract_manufacturing_rates.py` against the new Pay Guide PDF.

## Adult — General manufacturing — Full-time & part-time (PDF pp. 2–4)

Every row below passed automatic validation: **hourly × 38 = weekly**, and penalty columns are exact multiples of the hourly rate.

| C-level | Hourly | Weekly | Saturday | Sunday | Public holiday | Classification titles (share this rate) |
|---|---|---|---|---|---|---|
| **C14** | $24.28 | $922.70 | 1.50× | 2.00× | 2.50× | Engineering/manufacturing |
| **C13** | $24.95 | $948.00 | 1.50× | 2.00× | 2.50× | Engineering/manufacturing |
| **C12** | $25.85 | $982.40 | 1.50× | 2.00× | 2.50× | Engineering/manufacturing |
| **C11** | $26.70 | $1014.70 | 1.50× | 2.00× | 2.50× | Engineering/manufacturing; Laboratory tester |
| **C10** | $28.12 | $1068.40 | 1.50× | 2.00× | 2.50× | Engineering/manufacturing; Engineering/manufacturing |
| **C9** | $29.00 | $1102.00 | 1.50× | 2.00× | 2.50× | Engineering/manufacturing; Engineering/laboratory |
| **C8** | $29.88 | $1135.50 | 1.50× | 2.00× | 2.50× | Engineering/manufacturing; Engineering/laboratory |
| **C7** | $30.68 | $1165.70 | 1.50× | 2.00× | 2.50× | Engineering/manufacturing; Engineering/laboratory |
| **C6** | $32.23 | $1224.90 | 1.50× | 2.00× | 2.50× | Engineering/laboratory; Advanced engineering |
| **C5** | $32.90 | $1250.10 | 1.50× | 2.00× | 2.50× | Engineering/laboratory; Advanced engineering |
| **C4** | $33.78 | $1283.50 | 1.50× | 2.00× | 2.50× | Engineering |
| **C3** | $35.55 | $1350.80 | 1.50× | 2.00× | 2.50× | Engineering |
| **C2(a)** | $36.43 | $1384.40 | 1.50× | 2.00× | 2.50× | Principal engineering; Leading technical officer |
| **C2(b)** | $38.03 | $1445.10 | 1.50× | 2.00× | 2.50× | Principal technical officer |

**Derived penalty multipliers (uniform across all classifications):** Saturday **150%**, Sunday **200%**, Public holiday **250%** (day worker).

## Still to extract / verify (next passes)

- **Casual** rates — Adult General manufacturing Casual (pp. 17–31). PDF note: *“plus 25% casual loading, or $36.66, whichever is higher”* — there is a casual minimum floor to capture.
- **Professional/technical stream** — *Advanced Certificate / Associate Diploma / Degree* rows (C2(b)/C1 with experience progression). These have a different column layout and were deliberately NOT auto-trusted.
- **Juniors** (pp. 32+) and **Apprentices** (pp. 47+).
- **Overtime & shiftwork loadings** — Tables 2–5 (overtime, continuous/non-continuous shift, break penalties).

## Please verify

Spot-check a few rows against the PDF — e.g. **C10** (the trade-qualified benchmark) should be **$28.12/hr ($1,068.40/wk)** and **C14** (entry) **$24.28/hr ($922.70/wk)**. If those match, the extraction method is sound and I'll proceed to the casual/junior/apprentice tables and build the structured rates JSON.
