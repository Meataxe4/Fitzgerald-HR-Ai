# Fitz HR — Project Context for Claude

## Hard constraints (do not suggest otherwise)

- **No LinkedIn.** Blake (founder) has a conflict of interest with his current employer and CANNOT create a LinkedIn personal profile or company page for Fitz HR. Do not recommend LinkedIn in any plan, playbook, or schema. Work around it with other entity signals (Instagram @fitz.hr, X @FitzHR, Crunchbase, Google Business Profile, Bing Places, software directories, the /about page).
- **Founder name stays out of visible page text.** Blake's name must not appear in rendered/visible HTML content (it would surface when someone Googles his name). JSON-LD schema (`founder`/`creator`) is explicitly OK. llms.txt currently names him — flagged as a judgement call, Blake's to make. Press pitches naming him are his per-send decision.
- **Never invent statistics, testimonials, or award rates.** All figures must come from the site's own published pages (sourced from FWO Pay Guides) or from Blake directly. The one testimonial is "Business Owner · Inner West Sydney" (kitchen-hand walkout story).
- **One primary CTA** across the marketing site: "Start Free — No Card Required" → /app.

## Legal entity

- The legal company is **Fitzgerald HR Pty Ltd** (ABN 87 693 882 709), **trading as Fitz HR**. "Fitz HR" is the brand/business name only — never write "Fitz HR Pty Ltd". Footer/legal format: "© Fitzgerald HR Pty Ltd (ABN 87 693 882 709), trading as Fitz HR". Schema: `name: "Fitz HR"`, `legalName: "Fitzgerald HR Pty Ltd"`. The Terms/Privacy pages (app.html, privacy.html, terms.html) are the reference — they've always used the correct entity.

## Positioning (agreed July 2026)

- Core axis: **"Your Award, not generic HR."** Supporting: "We know your award cold."
- Primary keyword (homepage): **HR software for small business Australia**.
- Audience: owner-operators in award-heavy, shift-based frontline industries without in-house HR.
- Seven awards, presented as equals (no "flagship" badges on the awards grid): Hospitality MA000009, Restaurant MA000119, Retail MA000004, Manufacturing MA000010, SCHADS MA000100, Health MA000027, Children's Services MA000120.
- Four pillars: award depth, documents that hold up, human escalation, any hour.
- Moat framing: vs generic HR platforms ("a mile wide, an inch deep"), vs generic AI ("confident, wrong, costly"), vs HR consultants ("great advice, terrible hours").

## Design system

- Dark slate (#0b1220/#0f172a) + amber (#f59e0b), Outfit font, FITZHR wordmark (amber F + HR, white ITZ).
- The Fitz robot mascot is `assets/fitz-neon-transparent.png` (compressed: `assets/fitz-bot.webp`). **Never redraw or restyle the robot artwork** — animate placement/glow only.
- Titles ≤60 chars; meta descriptions ≤160 chars.

## Infrastructure notes

- Netlify hosting behind Cloudflare. Clean URLs need explicit redirects in netlify.toml (no catch-all). New pages: add redirect + sitemap entry.
- `npm run build` regenerates feed.xml (scripts/generate-rss.mjs) — new blog posts are picked up automatically.
- fairwork.gov.au / fwc.gov.au return 403 to ALL crawlers — external-link flags for those domains in audits are noise.
- Award guide + pay-rates pages have "Quick answer / Rates at a glance" boxes generated from their own tables — update them whenever rates tables change (each Annual Wage Review).
- llms.txt: bump the "Last updated" date whenever rates or pricing change.

## SEO watchpoints

- Bing data shows a click cliff below position 5 for award queries — prioritise position lift (links, freshness) over CTR tweaks.
- Backlink profile is almost entirely AI-tool directories — the active priority is relevant Australian links (see marketing/link-building-playbook.md). No paid links, no more AI directories.
