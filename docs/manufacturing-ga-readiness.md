# Manufacturing Award (MA000010) — GA Readiness Checklist

Status as of this document: **PREVIEW**, gated behind the `manufacturing_preview`
feature flag and ring-fenced to `blakefitzgerald4@gmail.com`. Non-flagged users
see no Manufacturing anywhere, and the award fails closed server-side and client-side.

This checklist is the path from preview → General Availability (GA). Work top to
bottom: **A. Data sign-off** and **B. Security gating** are blockers; **C. Flip to
GA** is the switch; **D. SEO** can follow shortly after GA. Section **E is the
hands-on in-app test plan** — run it as the allowlisted user before flipping, and
re-run the non-flagged checks after.

---

## A. Data sign-off (BLOCKER)

The rates dataset is machine-extracted and explicitly marked not-GA.
- Source: Fair Work Ombudsman Pay Guide MA000010 (published 16 Oct 2025)
- `manufacturing-award-rates.json` → `status: "PREVIEW — machine-validated … not GA"`
- `version: "2025-2026 (interim — pre annual increase)"`, `next_review_date: 2026-07-01`

- [ ] **Human/consultant sign-off** of `manufacturing-award-rates.json` (169 classifications + penalties + loadings).
- [ ] Confirm **penalty rates** (Sat 150%, Sun 200%, public holiday 250%, OT first-3h 150% / after 200%).
- [ ] Confirm **shift loadings** vs clause 33.2 — afternoon/night +15% (33.2(d)), permanent night +30% (33.2(f)). *(Already cited in the JSON source field and in the chat grounding note.)*
- [ ] Confirm **minimum engagement** — part-time 4h (cl 10.2), casual 4h (cl 11.2), reducible to 3h by written agreement.
- [ ] Confirm **supervisor/trainer/coordinator formula** (cl 20.1(g)) — relational, not absolute-rated.
- [ ] Confirm the **annualised-wage eligibility** restriction (cl 28.1: Supervisor/Trainer/Coordinator Level I/II only) still reflected in the doc generator.
- [ ] Re-confirm **coverage boundary**: general manufacturing only — **excludes vehicle manufacturing (Schedule B)**. Decide how to handle/【warn】 vehicle-manufacturing users.
- [ ] Update `status` → `"GA"` and refresh `version`/`effective_date` once the **1 July 2026 annual wage increase** is published (re-run `scripts/extract_manufacturing_rates.py` on the new PDF — data-only, no code change).
- [ ] Set a recurring reminder for the annual Pay Guide refresh (`next_review_date`).

## B. Security / preview gating (BLOCKER)

- [ ] **Server-side gating gap** — `netlify/functions/chat.js` `resolveServerAward()` resolves Manufacturing for **anyone** who sends `primaryAward: "manufacturing"`, with no entitlement check. A hand-crafted API call could pull preview Manufacturing facts (low risk — data isn't secret — but it bypasses the preview gate). **Fix before GA OR accept at GA** (once GA the gate is moot). If keeping preview longer, pass the user's entitlement/flags to the function and verify there.
- [ ] Confirm the client gates hold (already verified this session):
  - Onboarding button `#onboardingManufacturingBtn` is `hidden` unless `hasFeature('manufacturing_preview')`.
  - Settings `<option>` only rendered when `hasFeature('manufacturing_preview')`.
  - `resolveAward()` (client) + `resolveServerAward()` fail closed → UNRESOLVED for non-flagged users.

## C. Flip to GA (the switch)

When A and B are signed off:
- [ ] `AWARD_REGISTRY.MA000010` in `js/app-main.js`: `status: 'preview'` → `'supported'`; remove the `flag: 'manufacturing_preview'` gate.
- [ ] Remove the `hasFeature('manufacturing_preview')` guards on the onboarding button (`js/app-main.js` ~`onboardingCurrentStep === 2`) and the settings dropdown option (~`settingsPrimaryAward`).
- [ ] Decide whether to keep `manufacturing_preview` in `ALLOWLISTED_EMAILS` (`js/app-firebase.js`) — no longer needed once GA; safe to drop the manufacturing entry.
- [ ] `manufacturing-award-rates.json` `status` no longer says "gated behind … flag".
- [ ] Run `npm test` (currently 36/36) and `node --check` on `js/app-main.js`, `js/app-tools.js`, `netlify/functions/chat.js`.

## D. SEO / content (after GA — do NOT do while preview)

Rationale: public SEO for Manufacturing while it's gated would promise a feature users can't access.
- [ ] Create `manufacturing-award-guide.html` (mirror `restaurant-award-guide.html`), `index, follow`.
- [ ] Add it to `sitemap.xml`.
- [ ] Draft a Manufacturing blog cluster mirroring the restaurant set (rates 2026, casual conversion, shift loadings, minimum engagement, annualised wage cl 28, public holiday).
- [ ] Broaden homepage (`index.html`) title/meta/keywords + add a Manufacturing FAQ to the JSON-LD, alongside the existing Hospitality + Restaurant entries.
- [ ] Add Manufacturing to the landing feature copy ("Restaurant, Hospitality **and Manufacturing** awards").

## E. In-app test plan — KEY ACTIONS FOR YOU TO TEST

Sign in as **blakefitzgerald4@gmail.com** (the allowlisted user) unless a step says otherwise.

### E1. Onboarding & award selection
- [ ] Start onboarding → at the Award step, the **Manufacturing** option is visible.
- [ ] Select Manufacturing → the **business-type list** shows manufacturing types (factory/production etc.), **not** pubs/bars/cafés.
- [ ] Finish onboarding without errors; profile saves with the Manufacturing award.

### E2. Settings
- [ ] Open Settings → award dropdown shows **"Manufacturing and Associated Industries Award (MA000010) — preview"**.
- [ ] Switch to Manufacturing, save → confirm rates reload (no console errors) and the app reflects the new award.
- [ ] Switch back to Hospitality and to Restaurant → confirm each switch sticks and updates the app.

### E3. Award Rate Calculator (quick modal)
- [ ] Tools → Award Calculator. Subtitle names the **Manufacturing** award.
- [ ] Classification dropdown lists **C-levels (C14 → C2)**, not hospitality roles.
- [ ] Day options show **Saturday ×1.5, Sunday ×2, Public Holiday ×2.5**.
- [ ] Run a calc (e.g. C10 + Saturday + 8h) → penalty rate and total look right; overtime row uses the manufacturing multiplier.

### E4. Award Wizard (stepped calculator)
- [ ] Tools → Award Wizard → steps use the **Manufacturing classification picker** (C-levels / apprentice / junior / trainee / cadet), not the hospitality role wizard.
- [ ] Complete a flow → result card shows the manufacturing rate + penalties.

### E5. Chat grounding (the important one)
Ask each and check the answer is **Manufacturing-correct** and never says "hospitality":
- [ ] *"What are the weekend and public holiday penalty rates?"* → Sat **150%**, Sun **200%**, public holiday **250%**.
- [ ] *"What's the minimum shift length for a casual?"* → **4 consecutive hours (cl 11.2)**, reducible to 3h by written agreement — NOT "no minimum".
- [ ] *"What are the afternoon/night shift loadings?"* → **+15%** (afternoon/night), **+30%** permanent night.
- [ ] *"How much should I pay a Level 5 employee?"* → should **decline exact base rate**, point to the Award Wizard, and frame around **MA000010** (not a dollar base rate).
- [ ] Persona check: the assistant should read as a **manufacturing** HR assistant, with no "front of house / hospitality" language.

### E6. Documents (Document Builder)
- [ ] Generate **Annualised Wage Agreement** → cites **Clause 28**, shows the **Supervisor/Trainer/Coordinator Level I/II eligibility** warning, and the manufacturing absorbed-provisions list (cl 32/33/17.2(g)/(h)/18.5(b)/30/34.4).
- [ ] Generate **Annualised Wage Time Record** → cites **Clause 28.3(c)**.
- [ ] Generate a **cash-out** and a **warning letter** → wording is award-neutral/manufacturing-framed (no "hospitality HR").
- [ ] Classification dropdowns in the doc forms show the **C-level scale**.

### E7. Compliance frameworks (Fitz Watch)
- [ ] The **Customer Aggression** framework is **hidden** (licensed-hospitality only).
- [ ] The **Psychosocial hazard** register uses **manufacturing hazards** (plant/production), not hospitality ones.
- [ ] General frameworks (bullying, warnings, probation, leave) remain available.

### E8. Negative test — NON-flagged user (CRITICAL)
Sign in as **any other account** (not the allowlisted email):
- [ ] Onboarding award step does **NOT** show Manufacturing.
- [ ] Settings dropdown does **NOT** list Manufacturing.
- [ ] If you set the award to Hospitality/Restaurant, everything works as before (no regressions).
- [ ] (Optional, technical) A direct `POST /.netlify/functions/chat` with `primaryAward: "manufacturing"` still returns Manufacturing facts — this is the **B. server-gating gap**; expected until fixed.

---

### Sign-off

| Gate | Owner | Date | Notes |
|---|---|---|---|
| A. Data sign-off | | | |
| B. Security gating | | | |
| C. GA flip | | | |
| D. SEO live | | | |
| E. In-app test pass | | | |
