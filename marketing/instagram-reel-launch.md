# Fitz HR — Instagram Reel Spec (Pebb-style launch ad)

Format adapted 1:1 from the Pebb "One app. Whole team. Zero chaos." reel.
Same beat structure, same visual hierarchy — Fitz HR's brand, product and stakes.

---

## Format

- **Aspect ratio:** 9:16 (1080 × 1920)
- **Duration:** 7–10 seconds (single static frame works; subtle motion preferred)
- **Sound:** Optional — soft pub ambience or a low cinematic whoosh on title pop-in
- **Placement:** Instagram Reels + Stories (single asset works for both)

## Visual stack (top → bottom)

1. **Status bar** — phone chrome, default
2. **Sponsor row:** circular Fitz HR logo (`assets/fitz-neon-transparent.png` cropped square) + handle text `fitzhr` + `…` + `×`
3. **Centered logo + wordmark:** Fitz HR neon mark + `FITZ HR` (orange/white split, matching the in-app header)
4. **Headline (3 lines, big bold sans-serif):**
   ```
   One AI.
   Every award.
   Zero fines.
   ```
   - Line 1 + 2: **white**
   - Line 3: **Fitz orange** (matches the send button + "HR" wordmark)
5. **Subtitle (one line, white, semibold):**
   `The #1 HR app for Australian hospitality`
6. **Feature pills (rounded, dark glass, two rows of 4 + 2):**
   - 📜 Awards
   - 💰 Pay Rates
   - 📝 Warnings
   - 🔥 Termination
   - 📄 Contracts
   - 🚨 Crisis Mode
7. **Phone mockup (centered, ~55% of frame height):**
   - Use the **dark-mode Fitz HR chat screenshot** (the one with the navy background, FITZ HR header, red URGENT siren, purple call button, and "G'day! I'm Fitz, your hospitality HR assistant" greeting card).
   - Why dark mode: contrast with the warm pub background mirrors Pebb's bright phone-on-dim-restaurant composition; the orange wordmark + red siren read instantly at thumbnail size.
8. **CTA chip (white pill, centered below phone):**
   - 🔗 icon + `Learn more` (black text)
9. **Sponsored banner (orange bar, bottom):**
   - Left: small Fitz logo
   - Center: `#1 AI HR app for hospitality: Awards, Pay, Compliance…`
   - Right: `fitzhr.com →`
   - Behind banner (faintly visible): `Get started free`
10. **Instagram action rail:** `Ad` label, heart, comment, share icons (default)

## Background

Moody, dimly-lit Australian pub or restaurant interior — empty tables, warm pendant lights, timber + dark accents. Same vibe as the Pebb reference. Bunnings/stock options:
- Pexels: `restaurant empty dim lights wooden chairs`
- Unsplash: `pub interior evening pendant lights`

Apply a 30–40% black gradient overlay so the white headline pops.

## Color tokens

| Use | Hex |
| --- | --- |
| Fitz orange (accent + line 3 + send button) | `#F39C12` (sample from `assets/fitz-neon-transparent.png` if exact brand orange differs) |
| Headline white | `#FFFFFF` |
| CTA pill background | `#FFFFFF` |
| Sponsored banner | Fitz orange |
| Pill chips | `rgba(255,255,255,0.12)` with 1px white-10% border |
| Background overlay | `linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35))` |

## Copy — primary (recommended)

> **One AI. Every award. Zero fines.**
> The #1 HR app for Australian hospitality
> 📜 Awards • 💰 Pay Rates • 📝 Warnings • 🔥 Termination • 📄 Contracts • 🚨 Crisis Mode
> **Learn more →** fitzhr.com

### Caption (Instagram post body)

> Built for pubs, restaurants, cafes, bars and hotels. Ask anything about the Hospitality Award, generate compliant warnings, contracts and PIPs in minutes, and get a real HR expert on the phone in 15 minutes when it actually matters. From $0/forever. fitzhr.com 🍺

### Hashtags

`#hospitality #australianhospitality #pubsofaustralia #restaurantowner #cafeowner #fairwork #hraustralia #smallbusinessaustralia #hospitalityaward #fitzhr`

## Headline alternates (A/B options)

Same 3-line cadence as Pebb. Pick the line-3 punch that lands hardest with venue owners:

1. `One AI. Every award. Zero fines.` ← **default**
2. `One chat. Every shift. Zero risk.`
3. `Ask Fitz. Stay compliant. Sleep easy.`
4. `One app. Every roster. Zero claims.`
5. `Built for pubs. Trained on awards. Ready at 10pm.`

## Subtitle alternates

- `The #1 HR app for Australian hospitality` (default)
- `AI + real HR experts, built only for hospitality`
- `Australia's first AI HR assistant for pubs, restaurants & cafes`

## Sponsored banner alternates

- `#1 AI HR app for hospitality: Awards, Pay, Compliance…` (default — mirrors Pebb)
- `From $0/forever. Less than 2% of one unfair dismissal payout.`
- `24/7 AI + 15-min callback in a crisis.`

## Asset checklist

- [ ] Background plate: dim pub/restaurant interior (1080×1920, ≥3000px source)
- [ ] Phone mockup PNG with dark-mode Fitz HR chat screenshot inside (iPhone 15 Pro frame, transparent background)
- [ ] Fitz HR neon logo PNG (already in `assets/fitz-neon-transparent.png`)
- [ ] Wordmark `FITZ HR` (orange/white split — matches the app header)
- [ ] Export: `marketing/exports/fitz-hr-reel-v1.mp4` (or `.png` if static)

## Production notes

- Headline weight: 900 (Inter Black or Sora Black). The Pebb reel uses an extra-condensed black for the orange "Zero chaos." line — do the same on `Zero fines.` so it screams.
- Pebb's third line is slightly **larger** than lines 1–2 — apply that to `Zero fines.` (~15% size bump).
- Phone mockup gets a soft drop shadow + 4° tilt-free vertical pose (matches Pebb).
- Keep the URGENT siren and purple call button visible inside the phone — those two icons sell the "AI + real human experts" story in one frame.
- The 🚨 Crisis Mode pill in the headline pills directly mirrors the in-app red URGENT button — visual continuity from ad → app.

## Why this works for Fitz HR specifically

- Pebb's structure is `one [thing]. [scope]. [zero pain].` — Fitz HR's product fits perfectly: one AI, every Award (MA000009 + MA000119), zero Fair Work fines.
- The feature pills match Fitz HR's actual highest-intent landing pages: Awards, Pay Rates, Warnings, Termination, Contracts, Crisis Mode.
- The phone mockup of the chat home screen sells the "ask anything" promise without requiring video of a chat conversation.
- Bottom banner echoes the homepage value prop: "less than 2% of a single unfair dismissal payout."
