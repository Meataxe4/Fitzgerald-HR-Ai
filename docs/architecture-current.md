# Fitz HR — Current Architecture Map (Milestone 0)

> **Status:** Discovery only. No code was changed to produce this document.
> **Date:** 2026-06-23
> **Purpose:** Understand the existing single-vertical (Hospitality) system before
> adding a second vertical (Manufacturing, MA000010). This is the baseline the
> multi-award generalisation (Milestones 1–8) builds on.

---

## 1. System shape at a glance

Fitz HR is a **static HTML + vanilla-JS front end** deployed on Netlify, with a
handful of **Netlify Functions** as the backend, **Firebase** (Auth + Firestore)
for identity and per-user data, and **Anthropic Claude** powering the chatbot.
There is **no SPA framework** — pages are hand-authored HTML, behaviour is in
large global `.js` files loaded by each page.

| Concern | Where it lives |
| --- | --- |
| Marketing / landing | `index.html` (hospitality-led), `*-guide.html`, `blog/`, `compare/` |
| The product app | `app.html` (~8.2k lines) + `js/app-main.js` (~24k lines), `js/app-firebase.js`, `js/app-tools.js` |
| AI chatbot backend | `netlify/functions/chat.js` (Claude via `@anthropic-ai/sdk`) |
| Award rate data | `hospitality-award-rates.json`, `restaurant-award-rates.json` (bundled into `chat.js` via esbuild) |
| Document generation | client builds HTML (`_fwDoc*` in `app-main.js`) → `netlify/functions/generate-word.js` converts HTML → `.docx` |
| Auth & per-user data | Firebase Auth + Firestore (`js/app-firebase.js`), rules in `firestore.rules` |
| Compliance gap rules | `js/fitz-watch-rules.js` (+ the only real test file, `js/fitz-watch-rules.test.js`) |
| Feature flags / admin | `featureFlags` array on the Firestore user doc, read via `hasFeature()` |

**Awards live today:** Hospitality (MA000009) and Restaurant (MA000119), plus a
"Fast Food" onboarding option that is not separately modelled. These are all
hospitality-family awards with similar structure, which is *why* the current
multi-award handling is a lightweight binary switch rather than a real registry.

---

## 2. The award data model

### 2.1 Rate data — already externalised and dated (good)

Rates are **not** hardcoded in prompts. They live in versioned JSON:

- `hospitality-award-rates.json` — `ma_number: "MA000009"`
- `restaurant-award-rates.json` — `ma_number: "MA000119"`

Both already carry the fields the dated-rates requirement needs:

```json
{
  "award_name": "Hospitality Industry (General) Award MA000009",
  "ma_number": "MA000009",
  "effective_date": "2025-07-01",
  "next_review_date": "2026-07-01",
  "version": "2025-2026",
  "penalty_rates": { "saturday_full_time_part_time": 1.25, ... },
  "casual_loading": 0.25,
  "superannuation_rate": 0.12,
  "minimum_engagement": { ... },
  "notes": [ ... ]
}
```

**Implication for Manufacturing:** the *shape* for dated rates already exists.
A `manufacturing-award-rates.json` (MA000010) can mirror it — **but the schema is
hospitality-shaped** (penalty multipliers + minimum engagement). MA000010 needs
fields this schema does not have: shift loadings, RDOs, all-purpose allowances,
apprentice/junior percentage rates, and a C14–C1 classification table. So the rate
JSON schema must be **extended**, not just copied.

### 2.2 Award *identity* — a display-name string, resolved by substring (the core problem)

The user's award is stored as **`venueProfile.primaryAward`**, a human-readable
**string** (e.g. `"Hospitality Industry (General) Award"`,
`"Restaurant Industry Award"`, `"Fast Food Industry Award"`, `"Not sure"`).

It is **never** stored as an `award_code`. Everywhere the system needs to know
"which award," it does a substring test and falls back to Hospitality:

- `chat.js:172` — `const isRestaurantAward = primaryAward && primaryAward.toLowerCase().includes('restaurant');`
- `chat.js:174` — `const awardCode = isRestaurantAward ? 'MA000119' : 'MA000009';`
- `app-main.js:1857` — `const isRestaurant = ... primaryAward.toLowerCase().includes('restaurant');`
- `app-main.js:23140` — `(award && String(award).indexOf('009') !== -1) ? ma009 : ma119`

This **binary, Hospitality-default** model is the single biggest obstacle to a
third award. "Not restaurant" currently means "Hospitality," so a Manufacturing
selection would silently resolve to Hospitality answers.

---

## 3. How an award answer flows (storage → engine → AI → UI)

```
ONBOARDING  (app.html:1671 "Which award covers most of your staff?")
   buttons → saveOnboardingAnswer('primaryAward', '<award display name>')
        │
        ▼
venueProfile.primaryAward  (string; persisted to Firestore + localStorage)
        │
        ├── CLIENT branching (app-main.js): wizard labels (applyWizardAwardLabels:13154),
        │     venue-type dropdown (AWARD_VENUE_MAP:981), document classification
        │     options (_fwDocClassificationOptions:23135) — all by string match
        │
        ▼  (primaryAward sent in the chat request body — chat.js:148)
CHATBOT  (netlify/functions/chat.js)
   isRestaurantAward = primaryAward.includes('restaurant')      (line 172)
   awardCode  = MA000119 | MA000009                              (line 174)
   ratesData  = restaurantRates | hospitalityRates               (require'd lines 7-8)
   buildPenaltyRateFacts(ratesData, awardFullName)               (line 186)
   buildMinimumEngagementFacts(ratesData, awardFullName)         (line 187)
   → injected into an "award-aware" system prompt (lines 190+)   sent to Claude
        │
        ▼
DOCUMENTS  (app-main.js _fwDoc* → netlify/functions/generate-word.js)
   classification dropdowns chosen by award; HTML built client-side,
   converted to .docx server-side (generate-word.js is award-agnostic)
```

---

## 4. The AI chatbot & grounding layer

- **Engine:** Anthropic Claude via `@anthropic-ai/sdk` in `netlify/functions/chat.js`.
- **Grounding = structured fact injection, NOT retrieval.** There is **no vector
  store / embeddings / RAG**. The function reads the relevant rates JSON and
  builds plain-text "fact blocks" (`buildPenaltyRateFacts`,
  `buildMinimumEngagementFacts`) that are concatenated into the system prompt.
  Citations today are award/clause references written into the prompt text and the
  Fitz Watch rules, not retrieved documents.
- **Award is scoped per request:** the prompt instructs Claude to answer only in
  terms of the user's award (`chat.js:192`) and not to reference a different award
  unless explicitly comparing. This is the existing "no cross-award leakage"
  mechanism — but it is **prompt-enforced and binary**, anchored to the
  Restaurant/Hospitality fork.
- **Base-rate suppression policy:** the prompt forbids quoting specific dollar
  **base rates** in chat (`chat.js:227+`), allowing only multipliers, flat
  loadings, and educational ranges. This is a deliberate accuracy guardrail and is
  hospitality-tuned.
- **Prompt caching:** the award-aware system prompt is structured for cache hits
  across multi-turn conversations on the same award (`chat.js:440+`).

**Implication for Manufacturing:** grounding for MA000010 means (a) adding
manufacturing fact-builders shaped to *its* mechanics (shift loadings, RDOs,
all-purpose allowances, C14–C1), and (b) deciding whether to keep fact-injection
or introduce real retrieval for award text / FWC decisions (Milestone 4). The
"answer only in your award" rule must become award-keyed rather than
restaurant-vs-hospitality.

---

## 5. The rate engine, calculator & Award Wizard

- **Award Rate Calculator (`calculateAward`, `app-main.js:18370`) is award-agnostic
  and naive.** It takes a base rate the user types in, multiplies by a single
  day-multiplier dropdown value, and computes overtime at a **hardcoded `1.5×`**
  (`app-main.js:18387`). There is no award-specific rate table, no stacking of
  loadings, no all-purpose allowance handling. This will not satisfy MA000010's
  shift-loading + overtime stacking and all-purpose-allowance-before-penalty
  ordering — Milestone 3 is a real build here, not a tweak.
- **Award Wizard (`openAwardWizard:13100`, `calculateAwardClassification:18742`,
  `showWizardResults:18518`)** walks the user through classification questions.
  `applyWizardAwardLabels` (`13154`) rewrites labels for Restaurant (MA000119),
  e.g. the "10pm–midnight / midnight–6am" wording (see `app.html:2545`). It is
  built around hospitality-style, title-based classification.
- **`AWARD_VENUE_MAP` (`app-main.js:981`)** maps an award to the venue types
  commonly covered by it (used to filter the venue-type dropdown). Keyed by award
  display name.

---

## 6. Document generation

- **Server function `generate-word.js` is award-agnostic** — it is a generic
  HTML → `.docx` converter (`parseHTMLToDocx`) using the `docx` library. It knows
  nothing about awards.
- **Award-specificity lives client-side** in the `_fwDoc*` builders in
  `app-main.js`. They pre-fill from `venueProfile`, and pick classification
  options via `_fwDocClassificationOptions(award)` (`23135`), which is a binary:
  `indexOf('009')` → hospitality "Level 1–6" list, else the Restaurant cook/F&B
  grade list. Several document renderers default to `'MA000119'` when award is
  unset (e.g. `app-main.js:23214`, `23293`, `23400`).

**Implication for Manufacturing:** new classification arrays (C14–C1) and document
templates are needed, and the default-to-MA000119 fallbacks must not catch a
manufacturing user.

---

## 7. Tests

- **`npm test` is a no-op:** `package.json` → `"test": "echo \"No tests yet\""`.
- The only real test file is **`js/fitz-watch-rules.test.js`** — it exercises the
  Fitz Watch compliance-gap detection rules (`js/fitz-watch-rules.js`) against
  fixture venue profiles (e.g. a known-bad NSW restaurant on MA000119). It is not
  wired into a runner/CI.
- There is **no regression/accuracy harness** for chatbot answers today. That is
  what Milestone 6 must build, and it is also the safety net for "do not break
  Hospitality."

---

## 8. Auth, feature flags & admin gating (the gate for Manufacturing)

This infrastructure **already exists and is already pointed at the admin email** —
no new mechanism is required, only an extension.

- **Identity:** Firebase Auth. `auth.onAuthStateChanged` (`app-firebase.js:237`)
  sets the global `currentUser`; `user.email` is available throughout.
- **Per-user feature flags:** `userProfile.featureFlags` (array, on the Firestore
  user doc), read via **`hasFeature(flagName)`** (`app-main.js:21852`), exposed as
  `window.hasFeature` (`app-main.js:24238`). One preview flag already ships this
  way: `fitz_watch_preview`.
- **Server-protected:** per the comment at `app-firebase.js:17-21`, `firestore.rules`
  **blocks client writes** to `featureFlags`. Flags are granted manually in the
  Firestore console. A user **cannot** self-grant a flag. There is an
  `ALLOWLISTED_EMAILS` reference map (`app-firebase.js:22`) currently listing
  `blakefitzgerald4@gmail.com → ['fitz_watch_preview']`.
- **Admin surface:** an admin button + full admin dashboard (conversations, users,
  high-risk, documents, subscriptions, reviews, charts, devtools) is gated to
  `blakefitzgerald4@gmail.com` (`app-firebase.js:268`, dashboard in `app-main.js:16863+`).
- **Onboarding reset for testing already exists** (`app.html:1948`): "Clears your
  venue profile … onboarding will run again. Use to test different award selections."

### Recommended gating model for Manufacturing (agreed direction)

1. **Entry point = the onboarding award selector** (`app.html:1671`) and the
   settings award dropdown (`app-main.js:16593`). Render a fourth option —
   *Manufacturing and Associated Industries Award (MA000010)* — **only when
   `hasFeature('manufacturing_preview')`**. Because the flag is server-protected
   and granted only to the admin uid, no other user can see or select it.
2. **Selecting it sets `primaryAward` (or, better, an `award_code`) → drives the
   manufacturing view**, exactly as Restaurant vs Hospitality does today.
3. **Server half of the gate (required, not optional):** `chat.js` and
   `generate-word.js` currently *trust* `primaryAward` from the request body.
   Today that is harmless (a forged "Manufacturing" value just falls through to
   the Hospitality default). The moment a real manufacturing branch is added, it
   **must be guarded server-side** (verify the caller's email/flag) — otherwise
   the flag only hides UI, not behaviour. The client flag and the server check
   together are the single gate.

---

## 9. Single-award (really *binary-award*) assumptions to generalise

These are the concrete things that assume "Restaurant or Hospitality" and must be
generalised before MA000010 can be added safely. Ordered roughly by risk.

| # | Assumption | Location(s) | Why it blocks a 3rd award |
| --- | --- | --- | --- |
| 1 | Award identity is a **display-name string**, resolved by `includes('restaurant')` / `indexOf('009')` | `chat.js:172`, `app-main.js:1857`, `app-main.js:23140` | No `award_code` key; "not restaurant" ⇒ Hospitality. Manufacturing cannot be represented. |
| 2 | **Binary award-code ternary** | `chat.js:174` (`isRestaurantAward ? 'MA000119' : 'MA000009'`) | Only ever yields two codes. Needs a registry lookup. |
| 3 | **Rates loaded as two hardcoded `require()`s** | `chat.js:7-8` | No registry; a third rates file cannot be selected by code. |
| 4 | **Hospitality / MA000119 is the silent default** | `app-main.js:1843`, `chat.js:173`, `_fwDoc*` defaults `app-main.js:23214/23293/23400` | A Manufacturing user falling through any default gets a *wrong-award* answer — the exact failure guardrails must prevent. Unknown award should **refuse**, not default. |
| 5 | **Fact-builders assume hospitality structures** (penalty multipliers, minimum engagement) | `chat.js:11`, `chat.js:58`, rates JSON schema | MA000010 mechanics (shift loadings, RDOs, all-purpose allowances, C14–C1) have no slot. Schema + builders must extend. |
| 6 | **Classification = hardcoded title arrays, binary select** | `_fwDocClassificationOptions` `app-main.js:23135`; wizard `calculateAwardClassification:18742`, `applyWizardAwardLabels:13154` | MA000010 is competency-based (C14–C1) and must support a *confirm step* (Milestone 5), not a picklist. |
| 7 | **Rate Calculator is award-agnostic & naive** (manual base rate, single multiplier, overtime hardcoded `1.5×`) | `app-main.js:18370-18399` | Cannot express shift-loading/overtime stacking or all-purpose-allowance ordering required by MA000010. |
| 8 | **Award-scoping in the prompt is restaurant-vs-hospitality** | `chat.js:192+` | "Answer only in your award" must become award-keyed to prevent cross-award leakage for N awards. |
| 9 | **No `hasFeature` gate on the award selector** | `app.html:1671`, `app-main.js:16593` | New award would be visible to all users; must be flag-gated to admin. |
| 10 | **Branding assumes hospitality** ("your hospitality HR assistant", venue language) | `app.html` welcome bubble, app copy | Award-aware Fitz must read the active award for greeting/context. |

---

## 10. What this means for the milestones (orientation, not new work)

- **Milestone 1 (generalise):** introduce an `award_code` as the canonical key and
  an award **registry** mapping `award_code → { display name, rates file, fact
  builders, classification model, document templates }`. Migrate the existing
  Restaurant/Hospitality string logic onto it. Add the `manufacturing_preview`
  flag, off by default. *All existing hospitality behaviour must be byte-for-byte
  unchanged for non-flagged users.*
- **Milestone 2 (model MA000010):** extend the rates JSON schema for shift
  loadings / RDOs / all-purpose allowances / C14–C1, with clause refs +
  `effective_date`. Fence off Schedule B (vehicle manufacturing).
- **Milestone 3 (rate engine):** the calculator needs real award logic — this is a
  build, because today's calculator has none.
- **Milestone 4 (grounding):** decide fact-injection vs retrieval for MA000010
  award text / FWC decisions; make award-scoping award-keyed.
- **Milestone 5 (guardrails):** EBA-floor detection, classification confirm step,
  coverage judgement, shift/RDO confirmation, out-of-scope + Schedule B refusal.
- **Milestone 6 (regression suite):** there is no answer-accuracy harness today —
  this is greenfield and is the launch gate.
- **Milestone 7 (landing):** keep `index.html` hospitality-led; add `/manufacturing`
  spoke; factor per-vertical strings into config so a future hub is a data change.
- **Milestone 8 (maintenance):** the dated rates JSON already supports a data-only
  1 July update; add a staleness check against `next_review_date` and a feedback
  loop into the Milestone 6 suite.

---

## Appendix — key files & line references

| Area | File:line |
| --- | --- |
| Onboarding award selector | `app.html:1671-1691` |
| Settings award dropdown | `app-main.js:16593-16596` |
| `primaryAward` default | `app-main.js:1843`, `app-main.js:930` |
| Chat: award resolution | `chat.js:148`, `chat.js:171-187` |
| Chat: rates require | `chat.js:7-8` |
| Chat: fact builders | `chat.js:11`, `chat.js:58` |
| Chat: award-scoped prompt | `chat.js:190-256` |
| Chat: base-rate suppression | `chat.js:227+` |
| Rate calculator | `app-main.js:18370` |
| Award Wizard | `app-main.js:13100`, `18464-19101` |
| Doc classification options | `app-main.js:23135` |
| Doc renderers (MA000119 default) | `app-main.js:23214`, `23293`, `23400` |
| Word generation (award-agnostic) | `netlify/functions/generate-word.js` |
| Rates data | `hospitality-award-rates.json`, `restaurant-award-rates.json` |
| Feature flags | `app-firebase.js:14-24`, `app-main.js:21843-21853`, `21852` |
| Admin email gate | `app-firebase.js:268`, `app-firebase.js:22` |
| Firestore rules (flag write-block) | `firestore.rules` |
| Fitz Watch rules + only test | `js/fitz-watch-rules.js`, `js/fitz-watch-rules.test.js` |
