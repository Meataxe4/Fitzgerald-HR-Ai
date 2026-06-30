# SCHADS Award (MA000100) — GA Readiness Checklist

Status as of this document: **PREVIEW**, gated behind the `schads_preview`
feature flag and ring-fenced to `blakefitzgerald4@gmail.com`. Non-flagged users
see no SCHADS anywhere, and the award fails closed server-side and client-side.

This checklist is the path from preview → General Availability (GA). Work top to
bottom: **A. Data sign-off** and **B. Security gating** are blockers; **C. Flip to
GA** is the switch; **D. SEO** can follow shortly after GA. Section **E is the
hands-on in-app test plan** — run it as the allowlisted user before flipping, and
re-run the non-flagged checks after.

---

## A. Data sign-off (BLOCKER)

The rates dataset is machine-extracted and explicitly marked not-GA.
- Source: Fair Work Ombudsman Pay Guide MA000100 (published 24 Jun 2026, effective 01/07/2026)
- `schads-award-rates.json` → `status: "PREVIEW — machine-validated … not GA"`
- `version: "2026-2027"`, `next_review_date: 2027-07-01`
- Extractor: `scripts/extract_schads_rates.py` (self-validating — every base-rate
  row is checked so a bad parse is caught, not shipped: FT/PT hourly×38==weekly and
  Sat 1.5 / Sun 2.0 / PH 2.5 of hourly; casual Sat 1.75 / Sun 2.25 / PH 2.75 of base).

- [ ] **Human/consultant sign-off** of `schads-award-rates.json` (152 base-rate rows + penalties + loadings + allowances).
- [ ] Confirm **penalty rates** — full-time/part-time Sat 150% / Sun 200% / public holiday 250% (clause 29); casual adds the 25% loading (175% / 225% / 275%).
- [ ] Confirm **shift loadings** — afternoon +12.5%, night +15% (clause 29.4). Afternoon shift finishes after 8pm–midnight; night shift finishes after midnight–8am.
- [ ] Confirm **minimum engagement** (clause 10.5) — social & community services employees (except disability services work) 3 hours; all other employees (home care, crisis accommodation, family day care, SACS disability work) 2 hours, per shift or broken-shift portion.
- [ ] Confirm the **four streams** and their levels: social & community services (L1–8 + pay points), crisis accommodation (L1–4), family day care (L1–5), home care (disability care L1–5 pay points + aged care Introductory→Team leader).
- [ ] Confirm **no annualised wage clause** exists in MA000100 — the Annualised Wage Agreement / Time Record templates are correctly excluded for this award (`excludeAwards: ['MA000100']`). Cash-out = Schedule K; leave-in-advance = Schedule J.
- [ ] Note: sleepover, on-call, 24-hour-care, broken-shift and remote-work penalty tables are **not modelled** in the dataset — chat directs users to the award/Pay Guide for those.
- [ ] Update `status` → `"GA"` and refresh `version`/`effective_date` once the **1 July 2027 annual wage increase** is published (re-run `scripts/extract_schads_rates.py` on the new PDF — data-only, no code change).
- [ ] Set a recurring reminder for the annual Pay Guide refresh (`next_review_date`).

## B. Security / preview gating (BLOCKER)

- [ ] **Server-side gating gap** — `netlify/functions/chat.js` `resolveServerAward()` resolves SCHADS for **anyone** who sends `primaryAward: "…MA000100…"`, with no entitlement check (same known defense-in-depth gap as Manufacturing). A hand-crafted API call could pull preview SCHADS facts (low risk — data isn't secret — but it bypasses the preview gate). **Fix before GA OR accept at GA** (once GA the gate is moot). If keeping preview longer, pass the user's entitlement/flags to the function and verify there.
- [ ] Confirm the client gates hold (verified this build):
  - Onboarding button `#onboardingSchadsBtn` is `hidden` unless `hasFeature('schads_preview')`.
  - Settings `<option>` only rendered when `hasFeature('schads_preview')`.
  - `resolveAward()` (client) + `resolveServerAward()` fail closed → UNRESOLVED for non-flagged users.

## C. Flip to GA (the switch)

When A and B are signed off:
- [ ] `AWARD_REGISTRY.MA000100` in `js/app-main.js`: `status: 'preview'` → `'supported'`; remove the `flag: 'schads_preview'` gate.
- [ ] Remove the `hasFeature('schads_preview')` guards on the onboarding button (`js/app-main.js` ~`onboardingCurrentStep === 2`) and the settings dropdown option (~`settingsPrimaryAward`).
- [ ] Decide whether to keep `schads_preview` in `ALLOWLISTED_EMAILS` (`js/app-firebase.js`) — no longer needed once GA.
- [ ] `schads-award-rates.json` `status` no longer says "gated behind … flag".
- [ ] Run `npm test` and `node --check` on `js/app-main.js`, `js/app-firebase.js`, `netlify/functions/chat.js`.

## D. SEO / content (after GA — do NOT do while preview)

Rationale: public SEO for SCHADS while it's gated would promise a feature users can't access.
- [ ] Create `schads-award-guide.html` (mirror `restaurant-award-guide.html`), `index, follow`.
- [ ] Add it to `sitemap.xml`.
- [ ] Draft a SCHADS blog cluster mirroring the restaurant set (rates 2026, casual conversion, shift loadings, minimum engagement, sleepovers/on-call, public holiday).
- [ ] Broaden homepage (`index.html`) title/meta/keywords + add a SCHADS FAQ to the JSON-LD, alongside the existing Hospitality + Restaurant entries.
- [ ] Add SCHADS to the landing feature copy ("Restaurant, Hospitality **and Community Services / SCHADS** awards").

## E. In-app test plan — KEY ACTIONS FOR YOU TO TEST

Sign in as **blakefitzgerald4@gmail.com** (the allowlisted user) unless a step says otherwise.

### E1. Onboarding & award selection
- [ ] Start onboarding → at the Award step, the **SCHADS** option is visible.
- [ ] Select SCHADS → the **business-type list** shows community-services types (disability/home care/crisis accommodation etc.), **not** pubs/bars/cafés.
- [ ] Finish onboarding without errors; profile saves with the SCHADS award.

### E2. Settings
- [ ] Open Settings → award dropdown shows **"Social, Community, Home Care & Disability Services Award (MA000100) — preview"**.
- [ ] Switch to SCHADS, save → confirm rates reload (no console errors) and the app reflects the new award.
- [ ] Switch back to Hospitality and to Restaurant → confirm each switch sticks.

### E3. Award Rate Calculator (quick modal)
- [ ] Tools → Award Calculator. Subtitle names the **SCHADS** award.
- [ ] Classification dropdown lists SCHADS classifications, not hospitality roles.
- [ ] Day options show **Saturday ×1.5, Sunday ×2, Public Holiday ×2.5**.

### E4. Award Wizard (stepped calculator)
- [ ] Tools → Award Wizard → step 1 asks for the **stream** (SACS / crisis accommodation / family day care / home care), then classification, then employment type.
- [ ] Complete a flow → result card shows the SCHADS rate + penalties; for a casual the penalties reproduce the Pay Guide (e.g. SACS Level 1 pp1 casual → Saturday $48.21).

### E5. Chat grounding (the important one)
Ask each and check the answer is **SCHADS-correct** and never says "hospitality":
- [ ] *"What are the weekend and public holiday penalty rates?"* → Sat **150%**, Sun **200%**, PH **250%** (FT/PT); casual **175% / 225% / 275%**.
- [ ] *"What's the minimum shift for a casual support worker?"* → **2 hours** (clause 10.5); **3 hours** for social & community services employees.
- [ ] *"What are the afternoon/night shift loadings?"* → **+12.5%** afternoon, **+15%** night.
- [ ] *"How much should I pay a Level 3 home care worker?"* → should **decline the exact base rate**, point to the Award Wizard, and frame around **MA000100**.
- [ ] Persona check: reads as a **community services** HR assistant, no "front of house / hospitality" language.

### E6. Documents (Document Builder)
- [ ] The **Annualised Wage Agreement** and **Annualised Wage Time Record** tiles are **hidden** for SCHADS (MA000100 has no annualised wage clause).
- [ ] Generate a **cash-out** → cites **MA000100 Schedule K**; a **leave-in-advance** → cites **MA000100 Schedule J**.
- [ ] Classification dropdowns in the doc forms show the **SCHADS stream/level scale**.

### E7. Compliance frameworks (Fitz Watch)
- [ ] The **Customer Aggression** framework is **hidden** (licensed-hospitality only).
- [ ] The **Psychosocial hazard** register uses **community-services hazards** (client aggression, lone/remote work, vicarious trauma), not hospitality ones.

### E8. Negative test — NON-flagged user (CRITICAL)
Sign in as **any other account** (not the allowlisted email):
- [ ] Onboarding award step does **NOT** show SCHADS.
- [ ] Settings dropdown does **NOT** list SCHADS.
- [ ] If you set the award to Hospitality/Restaurant, everything works as before (no regressions).
- [ ] (Optional, technical) A direct `POST /.netlify/functions/chat` with `primaryAward: "MA000100"` still returns SCHADS facts — this is the **B. server-gating gap**; expected until fixed.

---

### Sign-off

| Gate | Owner | Date | Notes |
|---|---|---|---|
| A. Data sign-off | | | |
| B. Security gating | | | |
| C. GA flip | | | |
| D. SEO live | | | |
| E. In-app test pass | | | |
