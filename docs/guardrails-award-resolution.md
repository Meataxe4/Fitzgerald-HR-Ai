# Guardrail Spec — Award Resolution & the "Never Default to Hospitality" Rule

> **Status:** Specification (no code yet). Locks the behaviour that Milestones 1
> and 5 will implement and that the Milestone 6 regression suite will test.
> **Date:** 2026-06-23
> **Origin:** Decision that selecting Manufacturing (or any non-Hospitality award)
> must never silently produce a Hospitality answer.

---

## 1. The principle: fail closed, never guess

> **No confidently-resolved, in-scope, supported award ⇒ no award-specific answer.
> The system must NEVER fall back to Hospitality (MA000009) — or any other award's
> specifics — as a default.**

A refusal or a "set your award" prompt is always safer than a confident
wrong-award answer. This is non-negotiable and overrides coverage/helpfulness.

### Why this is needed (current behaviour)

`netlify/functions/chat.js:172-174` resolves the award with a binary test and a
Hospitality default:

```js
const isRestaurantAward = primaryAward && primaryAward.toLowerCase().includes('restaurant');
const awardCode = isRestaurantAward ? 'MA000119' : 'MA000009';   // everything else => Hospitality
```

So **anything that is not "restaurant" resolves to Hospitality** — including
"Fast Food", "Not sure", a future "Manufacturing", a stale value, or an empty one.
That is the exact failure this spec eliminates.

---

## 2. Decisions locked

1. **Award selection is mandatory.** The user must pick one of our **supported,
   modelled** awards. (Onboarding already marks this step "required".)
2. **Remove "Not sure" as an option** (`app.html:1691`, and the settings dropdown
   option at `app-main.js:16596`). The ambiguous middle is eliminated rather than
   handled.
3. **Only supported awards are selectable.** An award appears in the picker only if
   we actually model it (data + grounding + verified). Preview awards
   (e.g. Manufacturing) appear only behind their feature flag.
4. **No silent default, anywhere.** Client and server both resolve award by an
   explicit registry lookup that returns a real `award_code` **or** an
   `UNRESOLVED` signal — never an implicit Hospitality fallback.
5. **Stale/unsupported stored award ⇒ re-prompt.** On load, if a user's stored
   award is not a currently-supported one, send them back to the award-selection
   step instead of resolving it to anything.

### RESOLVED — Fast Food Industry Award (MA000003): REMOVE

"Fast Food" was selectable but **not modelled** — it fell through to Hospitality
(MA000009), which violates the principle above. **Decision: remove the Fast Food
option** from onboarding (`app.html`) and the settings dropdown (`app-main.js`).
We offer only awards we actually model.

**Supported awards going forward:** Hospitality (MA000009), Restaurant (MA000119),
and Manufacturing (MA000010) — the latter behind the `manufacturing_preview` flag
until built and verified. No other award is selectable.

---

## 3. The two-layer answer model

Every answer has two layers. The floor is always safe; the award layer is gated.

| Layer | Contents | When it may be used |
| --- | --- | --- |
| **Universal floor** | NES entitlements (annual/personal leave, notice & redundancy, max weekly hours, unfair dismissal), Fair Work Act general protections, National Minimum Wage | Always — applies under every award |
| **Award-specific** | Ordinary/classification rates, penalty rates, casual loading, overtime, shift loadings, allowances, classification structures, award clauses | Only when a supported award is confidently resolved |

**Critical boundary:** penalty rates, loadings, allowances and classification
minimums are **NOT** in the NES — they are award creatures. A user without a
resolved award must **never** receive a penalty/loading/classification figure.

> Note: with "Not sure" removed, normal users always have a resolved award, so the
> floor-only path is now an **edge/safety** behaviour (used for preview-award
> refusals and stale-data re-prompts), not a primary UX path.

---

## 4. Resolution outcomes

| Situation | Behaviour |
| --- | --- |
| **Supported in-scope award** (MA000009 / MA000119 / MA000010 once built & verified) | Full answer — floor **+** award-specific layer for that award. |
| **Preview award, not yet verified** (e.g. Manufacturing before the accuracy gate) | Floor permitted; **award-specific questions refuse** ("… support is in preview and not yet verified"). **Never** Hospitality. |
| **Out-of-scope** (Schedule B vehicle manufacturing, adjacent manufacturing award, or any award we don't model) | **Refuse + point to the right resource / human.** Never default. |
| **Unresolved / stale / empty stored award** | **Re-prompt** the user to select a supported award. No answer is resolved against a default. |

---

## 5. Where the guard must live (all three, or it leaks)

1. **Award resolution** — replace the binary ternary (`chat.js:172-174`;
   client `app-main.js:1857`) with a registry lookup returning `award_code` or
   `UNRESOLVED`.
2. **System prompt** — change "always frame your answer in terms of \[award\]"
   (`chat.js:192`) to: frame in terms of the **resolved** award; if `UNRESOLVED`,
   give **floor-only** guidance, never quote award rates/penalties, and direct the
   user to set their award. For a preview award, refuse award-specifics.
3. **Document generation** — remove the `MA000119`/Hospitality defaults in the
   `_fwDoc*` renderers (`app-main.js:23214`, `23293`, `23400`,
   `_fwDocClassificationOptions:23140`) so an unresolved/unsupported user is never
   served a default award's classifications or templates.

---

## 6. Acceptance criteria (Milestone 5 tests)

- Selecting Manufacturing **never** returns a Hospitality rate/penalty/
  classification — it returns either a verified MA000010 answer (once built) or a
  preview refusal.
- A user with no supported award resolved is **re-prompted**; they never receive
  award-specific figures.
- A `UNRESOLVED` award **never** resolves to MA000009 anywhere (chat, documents,
  wizard, calculator).
- Out-of-scope requests (Schedule B, adjacent awards) **refuse**, not default.
- Floor questions (NES / FW Act / National Minimum Wage) are still answerable
  without an award; award-specific questions are not.
- **Regression:** existing Hospitality and Restaurant users get byte-for-byte the
  same answers as before this change.

---

## 7. Implementation notes (for Milestone 1)

- Introduce a canonical **`award_code`** as the source of truth (migrate off the
  overloaded `primaryAward` display string), with a registry:
  `award_code → { displayName, status: supported|preview|unsupported, ratesFile,
  factBuilders, classificationModel, documentTemplates }`.
- `status` drives the outcome table in §4 directly.
- The `manufacturing_preview` feature flag controls whether MA000010 appears in the
  picker and whether its server branch is honoured (admin-gated).
