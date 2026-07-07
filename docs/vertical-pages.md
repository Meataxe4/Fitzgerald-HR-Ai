# Vertical landing pages + SEO cluster (Milestone 7)

Purpose-built marketing surfaces for each new award vertical that mirror the
proven hospitality page structure and design system **without touching the
homepage or the existing hospitality/restaurant guides**. The homepage stays
hospitality-led — it is deliberately not converted into a hub.

## What ships per vertical

For each of `manufacturing`, `schads`, `retail`, `health`, `childrens`, the
generator emits a four-page cluster:

| Page | File | Route |
| --- | --- | --- |
| Landing | `<slug>.html` | `/<slug>` |
| Pay Rates (SEO) | `<slug>-award-pay-rates.html` | `/<slug>-award-pay-rates` |
| Guide (SEO) | `<slug>-award-guide.html` | `/<slug>-award-guide` |
| vs Employment Hero (SEO) | `compare/fitz-hr-vs-employment-hero-<slug>.html` | `/compare/fitz-hr-vs-employment-hero-<slug>` |

The **landing page** mirrors the hospitality homepage sections: vertical crisis
hook, award badge strip, live scenarios, classification-wizard demo, document-
builder demo, Crisis Mode, testimonials slots, cluster links, and a vertical FAQ.
The four pages interlink (the "Explore" block) to form the SEO cluster.

## Design system & SEO

- Self-contained pages using the **same design tokens, fonts (Outfit / Playfair
  Display / DM Mono), nav and footer** as the existing guide pages — no new
  dependencies, no changes to `app.css`.
- Responsive (grids collapse to one column ≤600px; hero and tables scale).
- Each page carries `<title>`, meta description, canonical, Open Graph / Twitter
  cards, and JSON-LD structured data: `BreadcrumbList`, `FAQPage`, and a
  `WebPage`/`Article` node.

## Data-driven content

All rates, penalties, allowances and dates are pulled **live from the
SME-verified `*-award-rates.json` grounding data** at generation time, so the
marketing pages cannot drift from what the product answers. (Note: the
Manufacturing Award uses a flat penalty schema — `saturday`/`sunday`/
`public_holiday` — which the generator normalizes.)

## Regenerating / adding a vertical

1. Edit the `VERTICALS` config in `scripts/build-vertical-pages.mjs` (curated
   copy: crisis hook, scenarios, docs, FAQ). Facts come from the rates JSON.
2. Run `node scripts/build-vertical-pages.mjs` (or `npm run build:vertical-pages`).
3. Add the four clean-URL rewrites to `netlify.toml` and the four `<url>` entries
   to `sitemap.xml` (follow the "Milestone 7" blocks already there).

## Guardrails

- The generator writes only new files; it never edits `index.html`,
  `hospitality-award-guide.html`, or `restaurant-award-guide.html`.
- Routing rewrites are inserted **before** the catch-all in `netlify.toml`.
