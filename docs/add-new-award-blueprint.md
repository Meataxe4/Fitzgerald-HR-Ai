# Add-a-New-Award Blueprint

A reusable playbook for adding (or updating) a Modern Award in Fitz HR so the app
is **award-aware, compliant, and 100% accurate to the relevant award**. Hand this
file to Claude with the new award's details filled into **Section 1**, and it has
everything it needs: what you'll provide, the decisions already made, every file
to touch, and how to verify.

This was distilled from the Hospitality (MA000009) / Restaurant (MA000119) /
Manufacturing (MA000010) builds. Related docs:
`docs/guardrails-award-resolution.md`, `docs/manufacturing-ga-readiness.md`,
`docs/architecture-current.md`.

---

## SECTION 1 — What I (the user) give you for a new award

Fill this in and provide the files. **Accuracy rule: every figure and clause must
come from the official sources below — never guess, never copy another award.**

**Award identity**
- [ ] Award name + code (e.g. "Clerks — Private Sector Award **MA000002**")
- [ ] Short industry word for prompts/UI (e.g. `clerical`) and a one-line sector
      description (e.g. "private-sector clerical and administrative employees")
- [ ] Coverage boundary / exclusions (what this award does NOT cover)

**Official source documents (REQUIRED — this is the compliance backbone)**
- [ ] **FWO Pay Guide PDF** for the award (current financial year) — the source for rates
- [ ] **Full award text PDF** (from the Fair Work Commission) — the source for clauses/rules.
      Save it to `docs/<code-lowercase>.pdf` (e.g. `docs/ma000002.pdf`)
- [ ] Effective date + next annual-review date of the rates

**Rates data** (you provide the PDF; I produce the JSON — see Section 3, Step 1)
- [ ] Classification list with base hourly rates (adult; plus junior/apprentice/
      trainee/cadet streams if the award has them)
- [ ] Penalty rates: Saturday, Sunday, public holiday (full-time/part-time AND casual
      if they differ), overtime tiers
- [ ] Any loadings: evening/night (flat $/hr OR %), shift loadings, casual loading %
- [ ] Minimum engagement: full-time / part-time / casual minimum hours per shift (+ clause refs)
- [ ] Any special rate formulas (e.g. supervisor relational rates) + clause refs

**Structural / UX**
- [ ] Business/venue types that map to this award (for the onboarding + settings picker)
- [ ] Is this **calculatorType: `role`** (a small fixed set of job roles, like hospitality)
      or **`classification`** (a level/grade scale, like manufacturing C-levels)?
- [ ] Example roles (3) and departments (3) for placeholder hints
- [ ] Which compliance frameworks apply / don't (e.g. is the licensed-venue
      "Customer Aggression" procedure relevant?) + any industry-specific psychosocial hazards

**Annualised wage / key clause references** (from the award text PDF)
- [ ] The annualised-wage clause number + any eligibility restriction
- [ ] Which award provisions the annualised wage absorbs (the clause list)
- [ ] Cash-out and leave provisions if they differ from the NES baseline

**Rollout**
- [ ] Preview-gated first (allowlisted email only), or straight to GA?
- [ ] If preview: which email(s) on the allowlist?

---

## SECTION 2 — Decisions already made (don't re-ask me unless I flag a change)

These are my standing preferences from prior awards:

1. **Fail closed, always.** An unresolved/unsupported award must NEVER silently
   default to Hospitality. Calculators refuse; chat answers only at the NES/Fair
   Work floor. (See `docs/guardrails-award-resolution.md`.)
2. **Hospitality/Restaurant behaviour must stay byte-identical** when adding a new
   award — assert it in tests. New award = additive only.
3. **Neutral fallback for unresolved awards.** Role/department/example/industry
   helpers return profession-agnostic wording (e.g. "team member", "systems",
   "WHS induction") — NOT a hospitality bias.
4. **Industry adjective mapping:** Hospitality + Restaurant both map to
   `hospitality` for persona prose; a genuinely different industry gets its own word.
5. **New awards start preview-gated** behind a feature flag + allowlisted email,
   unless I explicitly say GA. UI hides it; the registry fails closed so a forced
   selection still won't resolve.
6. **No public SEO for a preview award.** Wait until GA, then mirror the restaurant
   content cluster. (Putting it live would promise a gated feature.)
7. **Source of truth = the official PDFs.** Rates from the FWO Pay Guide; clauses
   from the award text. Cite clause numbers in generated docs. Flag anything not
   yet human-verified as PREVIEW in the rates JSON `status` field.
8. **Verify before claiming done:** `npm test` (currently green), `node --check`
   on every changed JS file, and a jsdom check of award-switching for each new path.
9. **Commit + push to the working branch; do NOT open a PR unless I ask.**
10. **Keep model identity / internal IDs out of commits, code, and PRs.**

---

## SECTION 3 — The update map (every surface, in order)

Files: `js/app-main.js`, `js/app-tools.js`, `netlify/functions/chat.js`,
`app.html`, `index.html`, `<code>-award-rates.json`, `docs/`.

### Step 1 — Rates data (the foundation)
- [ ] Produce `<code-lowercase>-award-rates.json` from the FWO Pay Guide PDF.
      Reuse/extend `scripts/extract_manufacturing_rates.py` (self-validating:
      `rate × multiplier` must reproduce the PDF's published penalty dollars).
- [ ] JSON shape must match the others: `award_name`, `ma_number`, `effective_date`,
      `next_review_date`, `penalty_rates{}`, `casual_loading`, `minimum_engagement{}`,
      `rates[]` (each `{category, employment_type, classification, rate, title?}`),
      and a `status` field (mark `PREVIEW …` until human-signed-off).
- [ ] Verify against the existing three for structural parity.

### Step 2 — Client award registry & resolution (`js/app-main.js`)
- [ ] `AWARD_REGISTRY` (~line 1879): add the code with `status` (`'preview'` or
      `'supported'`), `calculatorType` (`'role'` | `'classification'`), `displayName`,
      `fullName`, `ratesUrl`, `aliases`, and `flag` if preview.
- [ ] `getAwardContext()` already exposes `code`/`calculatorType` — no change needed.

### Step 3 — Industry framing helpers (`js/app-main.js`)
- [ ] `_industryWord()` (~1946) + `_awardSector()` — add the new code → industry word.
- [ ] `_awardRoleExamples()` (~1960) + `_awardDeptExamples()` (~1968) — add role/dept
      examples for the new code.
- [ ] `_AWARD_EXAMPLES` table (~1996) consumed by `_awEx()` (~2018) — add a
      `manufacturing`-equivalent variant for the new award to EACH key (or confirm the
      neutral `default` is acceptable). These feed the long PIP/probation/onboarding
      placeholder hints.

### Step 4 — Pickers / business types (`js/app-main.js` + `app.html`)
- [ ] Business-type list: either add entries to `AWARD_VENUE_MAP` (~981) for a
      role-style award, or add a dedicated list like `MANUFACTURING_VENUE_OPTIONS`
      (~1000) for a distinct industry; wire it into the venue-type dropdown + label
      lookups (`getVenueTypeLabel`).
- [ ] **Onboarding award button** in `app.html` (pattern: `id="onboardingManufacturingBtn"`,
      class `hidden`) revealed by the `hasFeature(<flag>)` block in the onboarding
      step renderer (~`onboardingCurrentStep === 2`). Preview only.
- [ ] **Settings dropdown** option (`settingsPrimaryAward`, ~16984) — gate behind
      `hasFeature(<flag>)` for preview.

### Step 5 — Calculators (`js/app-main.js`)
- [ ] Stepped wizard: role awards reuse `calculateAwardClassification`; a
      classification award needs its own steps + resolver (see
      `_calcManufacturingSteps` ~13412 and `resolveManufacturingRate` ~13503).
- [ ] Award Rate Calculator (quick modal): `_renderAwardCalculatorOptions` (~13272)
      and `_awardCalcOvertimeMultiplier` (~13267) already read from `awardRates`
      (the loaded JSON) — they switch automatically once Steps 1–2 are done. Verify.

### Step 6 — Documents (`js/app-main.js`)
- [ ] `_fwDocClassificationOptions(awardCode)` (~23327) — add the new award's
      classification `<option>`s (fail closed for unknown codes).
- [ ] `_fwAnnualisedWageProfile(reconDate)` (~23372) — add a per-award clause profile
      (clause heading, agreement/outer-limit/record/recon clauses, eligibility note,
      base-rate note) sourced from the award text PDF.
- [ ] `_fwAbsorbedProvisions()` (~23402) — add the award's absorbed-provision list.
- [ ] `_fwPsychoHazards()` (~23881) — add industry-specific psychosocial hazards.
- [ ] `_fwDocAppliesToAward()` (~23350) + `hospitalityOnly` flags — confirm which
      framework tiles apply (the `data-doc-key` tiles in `app.html` are gated by this).
- [ ] Cash-out / leave-in-advance generators — confirm clause/schedule references resolve by code.

### Step 7 — Chat grounding (`netlify/functions/chat.js`)  ← compliance-critical
- [ ] Add `require('../../<code>-award-rates.json')` (~line 7).
- [ ] `SERVER_AWARDS` (~196): add the code with `fullName`, `sector`, `industryAdj`,
      `rates`, `aliases`. The fail-closed `resolveServerAward` then injects the right
      facts automatically.
- [ ] `buildPenaltyRateFacts` (~12) + `buildMinimumEngagementFacts` (~74): add any
      award-specific NOTE/clause branch (like the MA000119 late-night and MA000010
      clause 33.2 notes) so the figures carry the correct caveats.
- [ ] Persona/expertise prose already switches via `industryAdj` — no hardcoding.
- [ ] `recruitment-ai.js` is award-neutral; the award context arrives via the
      client prompt (`_awardSector()`/`_awEx()`) — no change.

### Step 8 — Preview gating (if not going straight to GA)
- [ ] `ALLOWLISTED_EMAILS` (`js/app-firebase.js` line 22): add the email → flag.
- [ ] Confirm the **server has no flag gate** (`resolveServerAward`) — this is a known
      defense-in-depth gap (a crafted API call could pull preview facts). Decide:
      fix now (pass entitlement to the function) or accept until GA. (Logged in the
      manufacturing GA-readiness doc.)

### Step 9 — Tests & verification
- [ ] Extend `tests/award-resolution.test.js`; keep Hospitality/Restaurant assertions intact.
- [ ] jsdom-verify each new path switches: penalty/engagement facts, calculator
      options, doc clauses, role/example placeholders, chat persona.
- [ ] `npm test` green; `node --check` clean on every changed JS file.

### Step 10 — GA promotion (when signed off — separate from preview build)
Follow `docs/manufacturing-ga-readiness.md` (generalised): data sign-off → flip
`status: 'preview' → 'supported'` + remove flag guards → SEO content (new
`<industry>-award-guide.html` + `sitemap.xml` + blog cluster + broaden `index.html`
title/meta/keywords/JSON-LD) → run the in-app test plan (incl. the non-flagged
negative test).

---

## SECTION 4 — Definition of done

- [ ] All figures/clauses traceable to the FWO Pay Guide + award text PDF (no guesses)
- [ ] Hospitality & Restaurant behaviour unchanged (tests assert it)
- [ ] New award fails closed when unresolved; neutral fallback everywhere
- [ ] `npm test` green, `node --check` clean
- [ ] Rates JSON `status` reflects reality (PREVIEW vs signed-off GA)
- [ ] Committed + pushed to the working branch (PR only if I ask)
- [ ] If preview: invisible to non-allowlisted users (verified) and no public SEO

---

## SECTION 5 — Quick reference: where things live

| Concern | File · anchor |
|---|---|
| Client award registry / resolution | `js/app-main.js` · `AWARD_REGISTRY` (~1879), `getAwardContext()` |
| Feature flag / allowlist | `js/app-main.js` · `hasFeature()` (~22028) · `js/app-firebase.js` · `ALLOWLISTED_EMAILS` (22) |
| Industry framing | `js/app-main.js` · `_industryWord`/`_awardSector` (~1946) |
| Role/dept/example placeholders | `js/app-main.js` · `_awardRoleExamples` (~1960), `_AWARD_EXAMPLES`/`_awEx` (~1996) |
| Business types | `js/app-main.js` · `AWARD_VENUE_MAP` (~981), `MANUFACTURING_VENUE_OPTIONS` (~1000) |
| Stepped + quick calculators | `js/app-main.js` · `_calcManufacturingSteps`/`resolveManufacturingRate` (~13412), `_renderAwardCalculatorOptions` (~13272) |
| Documents | `js/app-main.js` · `_fwDocClassificationOptions` (~23327), `_fwAnnualisedWageProfile` (~23372), `_fwAbsorbedProvisions` (~23402), `_fwPsychoHazards` (~23881), `_fwDocAppliesToAward` (~23350) |
| Chat grounding (facts) | `netlify/functions/chat.js` · `SERVER_AWARDS` (~196), `buildPenaltyRateFacts` (~12), `buildMinimumEngagementFacts` (~74) |
| Rates data | `<code>-award-rates.json` · `scripts/extract_manufacturing_rates.py` |
| Tests | `tests/award-resolution.test.js` · `npm test` |
| SEO (GA only) | `index.html`, `sitemap.xml`, `<industry>-award-guide.html`, `blog/` |
| Guardrails / GA / architecture | `docs/guardrails-award-resolution.md`, `docs/manufacturing-ga-readiness.md`, `docs/architecture-current.md` |
