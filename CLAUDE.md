# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Fitz HR — Project Context for Claude

## Commands

Node 18 (`engines`, and what CI uses). There is no linter and no bundler for the front end.

- `npm run dev`: run the site plus Netlify Functions locally (`netlify dev`).
- `npm run build:css`: rebuild `tailwind.css` from `src/tailwind-input.css`. `tailwind.css` is gitignored and only built at deploy time.
- `npm run build`: the Netlify deploy build (CSS, then `stamp-assets.mjs`, RSS, IndexNow). **Don't run it locally just to check something.** `stamp-assets.mjs` rewrites the `?v=` asset query strings in every HTML file in place, which leaves a large diff. IndexNow skips itself unless `CONTEXT=production`.
- `npm run test:ci`: everything CI runs (`.github/workflows/regression.yml`). It covers:
  - `npm test`: `tests/award-resolution.test.js`, the guardrail tests for `resolveAward()`.
  - `npm run test:gate`: proves the accuracy gate fails closed.
  - `npm run validate:rates`: structural check of every `*-award-rates.json`.
  - `npm run test:regression`: the frozen question suite in `regression/questions/<vertical>.json`, with the launch gate (`ACCURACY_THRESHOLD`, default 0.95).
- Site quality checks run in a separate workflow, `.github/workflows/site-quality.yml`, not in `test:ci`. Config is in `tests/site-quality/`:
  - Vale (`vale.ini`, `vale-styles/FitzHR/`): fails on "Fitz HR Pty Ltd", the founder's name in visible text, and LinkedIn mentions. A separate step fails on any `linkedin.com` URL.
  - lychee: internal links, canonicals and sitemap entries, checked offline against the repo files. External links run weekly only.
  - pa11y-ci with axe over every sitemap page. `pa11y-gate.mjs` fails on any axe rule not listed in `known-a11y-debt.json` (currently `color-contrast` and `link-in-text-block`, which are reported only). Remove a rule from that list once its count reaches zero. The job blocks the Google Analytics and Meta pixel hosts first; any new tool that loads pages in a real browser must do the same, or every run shows up as fake US traffic.
- Run a single test file directly, e.g. `node tests/award-resolution.test.js`. These are plain Node scripts with hand-rolled asserts, not a test framework, so there's no per-test filter. `js/fitz-watch-rules.test.js` is not wired into npm or CI. It runs from the browser devtools console via `runFitzWatchTests()`.
- `npm run check:staleness`: warns when an award's `next_review_date` is near or past. Use `--strict` to make it fail, and `STALENESS_TODAY=YYYY-MM-DD` to pin the date.
- `npm run verify:fwc`: cross-checks every rates JSON against the FWC Modern Awards Pay Database API (`scripts/verify-rates-fwc.mjs`, needs `FWC_API_KEY`; in a cloud session the key is injected by the proxy, so set `FWC_API_KEY=proxy-injected`). It is read-only: the rates JSON stays the source of truth. Matching is by value within an award, not by classification name. `scripts/fwc-known-gaps.json` lists figures the database does not hold and the dates of scheduled changes already planned for. `--strict` fails on an unexplained mismatch or an unacknowledged scheduled change; `.github/workflows/fwc-rates-check.yml` runs that daily. The API pages unsorted results unreliably, so always pass `sort`.
- Page generators (rerun after any rates-JSON change):
  - `npm run build:vertical-pages`
  - `node scripts/build-cheat-sheets.mjs`
  - `node scripts/build-classification-pages.mjs`
  - `npm run build:blog`

  Never hand-edit their output.

## Architecture (big picture)

Static HTML + vanilla JS on Netlify, with no SPA framework. Netlify Functions in `netlify/functions/` are the backend, bundled with esbuild. Firebase Auth and Firestore hold identity and per-user data. Claude powers the chat.

- **The product app** is `app.html` plus global scripts:
  - `js/app-main.js` (~26k lines): almost all app logic.
  - `js/app-firebase.js`: auth, Firestore, the admin gate.
  - `js/app-tools.js`
- **Marketing site:** every other root `*.html`, plus `blog/` and `compare/`. Many pages are generated (see Commands).
- **The rates JSON files are the single source of truth.** Each award has a `<vertical>-award-rates.json` at the repo root, with FWO Pay Guide figures, `effective_date` and `next_review_date`. They feed:
  - the browser, which fetches them;
  - `chat.js`, which `require()`s them and esbuild bundles them in;
  - the regression suite and the page generators.

  The annual 1 July wage review is a data-only change. The procedure is in `docs/maintenance-pipeline.md`: edit the JSON, run `validate:rates`, run `build:regression`, regenerate the pages, run `test:ci`, then commit the JSON and `regression/questions/*.json` together.
- **Award resolution fails closed.** `AWARD_REGISTRY` and `resolveAward()` in `js/app-main.js` map a stored `venueProfile.primaryAward` string to an MA code by code or alias.
  - Anything unrecognised resolves to `UNRESOLVED_AWARD`. Never add a default or fallback award.
  - `status: 'preview'` awards resolve only when `hasFeature(flag)` is true. Flags live in the Firestore user doc and clients can't write them (`firestore.rules`).
  - `netlify/functions/chat.js` keeps its own mirror, `SERVER_AWARDS`, which must be kept in sync. When no award resolves, chat answers only at the NES / Fair Work Act level.
  - The tests and the regression runner pull the registry out of `app-main.js` by text markers: the start marker `const AWARD_REGISTRY = {` and the end comment `// Returns the resolved award context`. Don't rename or move those lines.
  - Spec: `docs/guardrails-award-resolution.md`.
- **Chat grounding is fact injection, not RAG.** `chat.js` builds fact blocks from the rates JSON (e.g. `buildPenaltyRateFacts`) and puts them into an award-scoped system prompt. The prompt deliberately bans quoting specific dollar base rates in chat. Per-award branches are keyed on `rates.ma_number` so that existing awards' output stays unchanged.
- **Documents:**
  - Client-side `_fwDoc*` builders in `app-main.js` produce HTML.
  - `netlify/functions/generate-word.js` converts that HTML to `.docx` and knows nothing about awards.
- **Other functions:** Stripe (checkout, portal, webhook), Deputy (OAuth, roster sync), Twilio/Telegram crisis notifications.
- **Adding a new award:** follow `docs/add-new-award-blueprint.md`, which has the full update map across the rates file, registry, pickers, calculators, docs, chat grounding, gating, tests and pages. A vertical moves from `preview` to `supported` only once the regression suite clears the gate (`docs/regression-suite.md`).
- `docs/architecture-current.md` is a June 2026 snapshot taken before the award registry existed. Its line numbers and "binary award" findings are out of date.

## Hard constraints (do not suggest otherwise)

- **No LinkedIn.** Blake (founder) has a conflict of interest with his current employer and CANNOT create a LinkedIn personal profile or company page for Fitz HR. Do not recommend LinkedIn in any plan, playbook, or schema. Work around it with other entity signals (Instagram @fitz.hr, X @FitzHR, Crunchbase, Google Business Profile, Bing Places, software directories, the /about page).
- **Founder name stays out of visible page text.** Blake's name must not appear in rendered/visible HTML content (it would surface when someone Googles his name). JSON-LD schema (`founder`/`creator`) is explicitly OK. llms.txt currently names him — flagged as a judgement call, Blake's to make. Press pitches naming him are his per-send decision.
- **Never invent statistics, testimonials, or award rates.** All figures must come from the site's own published pages (sourced from FWO Pay Guides) or from Blake directly. The real testimonials are: "Phil · Pub Owner and Operator, Alexandria NSW" and "Jack · Workhorse Staffing" (both on the homepage), and "Business Owner · Inner West Sydney" (kitchen-hand walkout story, not currently shown on the site). Use only these.
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

- Netlify hosting (no Cloudflare in front of it). Clean URLs need explicit redirects in netlify.toml (no catch-all). New pages: add redirect + sitemap entry.
- Netlify publishes the repo root (`publish = "."`), so every committed file is web-reachable unless blocked. netlify.toml returns 404 for internal paths (CLAUDE.md, marketing/, scripts/, regression/, tests/, docs/, templates/, src/, netlify/, reports/, package files, config). Any new non-website folder or root file must be added to that block. The *-award-rates.json files and regulatory-changes.json stay public: the app fetches them.
- `scripts/indexnow-ping.mjs` submits only pages changed in the deploy (git diff CACHED_COMMIT_REF..COMMIT_REF) plus sitemap entries with a lastmod in the last 3 days — keep sitemap lastmod honest, it drives Bing recrawl.
- Blog structure (Nov 2026): one taxonomy in scripts/blog-taxonomy.json gives every post exactly one topic (10 topics), its award(s) ("all" = any award) and a type. `npm run build:blog` (scripts/build-blog-hubs.mjs) generates blog/index.html, the ten hubs at /blog/topics/<topic>, each post's breadcrumb trail (visible + JSON-LD, between `blog-crumb` markers) and `articleSection`, and the "All <Award> Articles" block on the seven award guides (also emitted by build-vertical-pages.mjs for the five generated guides). Never hand-edit blog/index.html or blog/topics/*. New post: write blog/<slug>.html, add it to the taxonomy JSON, add its netlify.toml rewrite and sitemap entry, run `npm run build:blog`. Post URLs do not change. scripts/register-blog-posts.mjs is obsolete (it edited the old index); do not run it.
- `npm run build` regenerates feed.xml (scripts/generate-rss.mjs) — new blog posts are picked up automatically.
- fairwork.gov.au / fwc.gov.au return 403 to ALL crawlers — external-link flags for those domains in audits are noise.
- Award guide + pay-rates pages have "Quick answer" boxes and speakable schema. For the seven generated pay-rates pages and five generated guides they come from `quickAnswer()` in scripts/build-vertical-pages.mjs (per-vertical wording in each vertical's `qa` config), so regenerate after every rates-JSON change. hospitality-award-guide.html and restaurant-award-guide.html are hand-built — update their boxes by hand at each Annual Wage Review.
- llms.txt: bump the "Last updated" date whenever rates or pricing change.
- /schads-award-pay-rates is the single target page for "SCHADS award 2026", "SCHADS pay guide" and "SCHADS level N" queries (Nov 2026): per-level sections come from `levelSections()` via the `pay` override in the schads config of scripts/build-vertical-pages.mjs. Other SCHADS pages link to it with the anchor "SCHADS Award 2026 pay rates by level". The award blog posts (scripts/build-award-blog-posts.mjs) have been hand-edited since generation; do not re-run that generator, edit the post HTML by hand.

## SEO watchpoints

- Bing data shows a click cliff below position 5 for award queries — prioritise position lift (links, freshness) over CTR tweaks.
- Backlink profile is almost entirely AI-tool directories — the active priority is relevant Australian links (see marketing/link-building-playbook.md). No paid links, no more AI directories.
- Weekly search data: `npm run seo:report` (scripts/seo-report.mjs) pulls Search Console, GA4 and Bing via API using the `GOOGLE_SERVICE_ACCOUNT_JSON` and `BING_WEBMASTER_API_KEY` environment variables (optional `GA4_PROPERTY_ID`, `GSC_SITE_URL`, `BING_SITE_URL`); `npm run seo:check` tests access only. Run via npm (it passes `--use-env-proxy`, without which Node cannot reach ssl.bing.com through the cloud proxy). Output goes to reports/ (gitignored, never commit it). Bing AI citations are not in the API and stay a manual export.
