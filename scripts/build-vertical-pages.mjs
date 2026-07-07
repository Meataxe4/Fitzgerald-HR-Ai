// Vertical landing page + SEO cluster generator (Milestone 7).
//
// For each new vertical it emits a purpose-built cluster that mirrors the proven
// hospitality page structure and design system WITHOUT touching the homepage or
// the existing hospitality/restaurant guides:
//
//   <slug>.html                                     landing page
//   <slug>-award-pay-rates.html                     [Award] Pay Rates (SEO)
//   <slug>-award-guide.html                         [Award] Guide (SEO)
//   compare/fitz-hr-vs-employment-hero-<slug>.html  vs Employment Hero (SEO)
//
// Content facts (rates, penalties, allowances, dates) are pulled live from the
// SME-verified *-award-rates.json grounding data, so the marketing pages cannot
// drift from what the product answers. Run with:
//   node scripts/build-vertical-pages.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SITE = 'https://fitzhr.com';

// --------------------------------------------------------------------------
// Per-vertical content. Facts come from the rates JSON; copy is curated here.
// --------------------------------------------------------------------------
const VERTICALS = {
  manufacturing: {
    code: 'MA000010', file: 'manufacturing-award-rates.json',
    awardShort: 'Manufacturing Award',
    awardFull: 'Manufacturing and Associated Industries and Occupations Award MA000010',
    audience: 'Australian manufacturers, workshops and production facilities',
    industry: 'manufacturing business',
    titleIndustry: 'Manufacturers',
    heroWord: 'grinder operator',
    heroHook: 'A {word} walks off mid-shift. Fitz tells you exactly what the Manufacturing Award requires.',
    coverage: 'general manufacturing, engineering, food and beverage processing, and associated production and maintenance work. It does not cover vehicle manufacturing (a separate award).',
    scenarios: [
      { q: 'What does an afternoon shift loading add for a C10 tradesperson?', a: 'The Manufacturing Award afternoon shift attracts a defined shift loading on top of the ordinary rate — Fitz applies the exact C-level rate and loading from the current Pay Guide.' },
      { q: 'Is my part-timer entitled to a minimum shift length?', a: 'Yes — the award sets a minimum engagement per shift. Fitz tells you the exact minimum and flags a roster that breaches it before you publish it.' },
      { q: 'How do I classify a new maintenance fitter?', a: 'The classification wizard walks the C14–C-level structure step by step so you land on the right rate instead of guessing.' },
    ],
    docs: ['Manufacturing employment contract', 'Shift-work agreement', 'Classification & pay-rate letter', 'Formal warning (production floor)', 'Redundancy / restructure letter'],
    crisis: 'A machine incident, a walk-off, or a stand-down question mid-shift — Crisis Mode gives you the immediate, Manufacturing-Award-grounded steps to take right now.',
    faqExtra: [
      { q: 'Which award covers a general manufacturing business?', a: 'Most general manufacturing, engineering and production work is covered by the Manufacturing and Associated Industries and Occupations Award MA000010. Vehicle manufacturing and a handful of specialised sectors sit under separate awards — Fitz confirms coverage before answering.' },
    ],
  },
  schads: {
    code: 'MA000100', file: 'schads-award-rates.json',
    awardShort: 'SCHADS Award',
    awardFull: 'Social, Community, Home Care and Disability Services Industry Award MA000100',
    audience: 'NDIS providers, community services, home care and disability support organisations',
    industry: 'community services provider',
    titleIndustry: 'Community Services & NDIS Providers',
    heroWord: 'support worker',
    heroHook: 'A {word} calls in for a sleepover shift. Fitz tells you exactly what SCHADS requires.',
    coverage: 'social and community services, home care, disability services (including NDIS), family day care and crisis accommodation.',
    scenarios: [
      { q: 'How much is the sleepover allowance?', a: 'Fitz returns the exact SCHADS sleepover allowance from the current Pay Guide, plus what happens if the worker is called to active duty during the sleepover.' },
      { q: 'What is the minimum engagement for a social & community services shift?', a: 'SCHADS sets different minimums by stream. Fitz applies the right minimum for the stream and flags any roster that breaches it.' },
      { q: 'Do broken shifts attract an allowance?', a: 'Yes — SCHADS pays a broken-shift allowance that depends on the number of unpaid breaks. Fitz applies the correct one automatically.' },
    ],
    docs: ['SCHADS employment contract', 'Casual engagement letter', 'Classification & pay-point letter', 'Broken-shift / sleepover agreement', 'Formal warning'],
    crisis: 'A client-safety incident or a lone-worker emergency — Crisis Mode gives you the immediate, SCHADS-grounded steps, and the right people to notify.',
    faqExtra: [
      { q: 'Does the SCHADS Award cover NDIS support workers?', a: 'Yes. The Social, Community, Home Care and Disability Services Industry Award MA000100 covers most disability support and NDIS-funded services, alongside home care, family day care and crisis accommodation streams — each with its own classification and minimum-engagement rules.' },
    ],
  },
  retail: {
    code: 'MA000004', file: 'retail-award-rates.json',
    awardShort: 'Retail Award',
    awardFull: 'General Retail Industry Award MA000004',
    audience: 'Australian retail stores, shops and retail chains',
    industry: 'retail business',
    titleIndustry: 'Retailers',
    heroWord: 'sales assistant',
    heroHook: 'A {word} no-shows on a Sunday trade day. Fitz tells you exactly what the Retail Award requires.',
    coverage: 'general retail trade. It does not cover hair and beauty, pharmacy, fast food, or businesses covered by a more specific award.',
    scenarios: [
      { q: 'What is the Sunday penalty for a casual Retail Level 1?', a: 'Fitz returns the exact Sunday casual rate from the current Pay Guide — all-inclusive, with the 25% casual loading already built in, not stacked.' },
      { q: 'When does the evening loading apply?', a: 'The Retail Award pays an evening loading on ordinary hours after a set time on weekdays. Fitz applies the exact loading and time band.' },
      { q: 'What is the minimum shift for a casual?', a: 'The award sets a minimum engagement per shift. Fitz flags any roster that breaches it before it goes out.' },
    ],
    docs: ['Retail employment contract', 'Casual engagement letter', 'Classification & pay-rate letter', 'Formal warning', 'Roster-change notice'],
    crisis: 'A theft accusation, an aggressive customer, or an on-the-spot termination question — Crisis Mode gives you the immediate, Retail-Award-grounded steps before you act.',
    faqExtra: [
      { q: 'Does the General Retail Award cover my shop?', a: 'The General Retail Industry Award MA000004 covers most retail trade. Hair and beauty, pharmacy, fast food and a few other sectors have their own awards. Fitz confirms coverage before it answers a pay question.' },
    ],
  },
  health: {
    code: 'MA000027', file: 'health-award-rates.json',
    awardShort: 'Health Professionals Award',
    awardFull: 'Health Professionals and Support Services Award MA000027',
    audience: 'private practices, allied health, dental, pathology and medical support employers',
    industry: 'health practice',
    titleIndustry: 'Health Practices',
    heroWord: 'dental assistant',
    heroHook: 'A {word} asks about weekend rates. Fitz tells you exactly what the Health Professionals Award requires.',
    coverage: 'private-sector health professionals and health support services — including allied health, dental assistants, pathology collectors and medical administration.',
    scenarios: [
      { q: 'How do the streams change the pay rate?', a: 'MA000027 splits into support services, dental assistants, pathology collectors and health professionals streams. Fitz picks the right stream and level so the rate is exact.' },
      { q: 'Can I use an annualised wage arrangement?', a: 'The award allows annualised wages under strict conditions with a mandatory reconciliation. Fitz explains the outer-limit and record-keeping rules before you rely on one.' },
      { q: 'What is the casual minimum engagement?', a: 'Fitz returns the exact minimum period of engagement for casuals and cleaners from the current award text.' },
    ],
    docs: ['Health practice employment contract', 'Annualised wage agreement', 'Classification & pay-rate letter', 'Casual engagement letter', 'Formal warning'],
    crisis: 'A patient-safety complaint or an urgent conduct issue — Crisis Mode gives you the immediate, award-grounded steps and the right documentation trail.',
    faqExtra: [
      { q: 'Who does the Health Professionals and Support Services Award cover?', a: 'MA000027 covers private-sector health professionals and support staff — allied health, dental assistants, pathology collectors and medical administration among them. Public-sector and nursing roles are typically covered by other awards.' },
    ],
  },
  childrens: {
    code: 'MA000120', file: 'childrens-award-rates.json',
    awardShort: "Children's Services Award",
    awardFull: "Children's Services Award MA000120",
    audience: 'long day care, preschools, kindergartens and outside-school-hours care providers',
    industry: 'childcare service',
    titleIndustry: 'Childcare & OSHC',
    heroWord: 'educator',
    heroHook: "An {word} calls in sick and ratios are tight. Fitz tells you exactly what the Children's Services Award requires.",
    coverage: 'long day care, preschools and kindergartens, outside-school-hours care, and other children’s services.',
    scenarios: [
      { q: 'What is the educational leader allowance?', a: "The Children's Services Award pays an educational leader allowance that scales with days per week. Fitz returns the exact figure from the current Pay Guide." },
      { q: 'Do broken shifts attract an allowance?', a: 'Yes — a broken-shift allowance applies per day a broken shift is worked. Fitz applies it automatically.' },
      { q: 'What is the minimum shift for a part-time educator?', a: 'The award sets a minimum engagement. Fitz flags any roster below it before you publish.' },
    ],
    docs: ['Childcare employment contract', 'Casual engagement letter', 'Classification & pay-rate letter', 'Educational leader appointment letter', 'Formal warning'],
    crisis: 'A child-safety incident or a mandatory-reporting question — Crisis Mode gives you the immediate, award-grounded steps and the escalation path.',
    faqExtra: [
      { q: "Which award covers long day care and OSHC?", a: "The Children's Services Award MA000120 covers long day care, preschools and kindergartens, and outside-school-hours care. Teachers in early childhood settings may instead be covered by the relevant education teachers award — Fitz confirms coverage first." },
    ],
  },
};

const load = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const money = (n) => '$' + Number(n).toFixed(2);
const pct = (m) => Math.round(m * 100) + '%';

// Penalty schemas differ across awards: most use `saturday_full_time_part_time`
// / `saturday_casual`, but the Manufacturing Award uses flat `saturday` /
// `sunday` / `public_holiday` (no separate casual key). Normalize both so a
// missing rate is `undefined` (and simply omitted) rather than NaN.
function pen(data) {
  const p = data.penalty_rates || {};
  return {
    sat_ftpt: p.saturday_full_time_part_time ?? p.saturday,
    sat_cas: p.saturday_casual,
    sun_ftpt: p.sunday_full_time_part_time ?? p.sunday,
    sun_cas: p.sunday_casual,
    ph_ftpt: p.public_holiday_full_time_part_time ?? p.public_holiday,
    ph_cas: p.public_holiday_casual,
  };
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// 'manufacturing business' -> 'manufacturing businesses'; 'health practice' -> 'health practices'.
const pluralIndustry = (x) => x.endsWith('business') ? x.slice(0, -8) + 'businesses' : x + 's';

// --------------------------------------------------------------------------
// Shared shell: design tokens copied verbatim from the existing guide pages,
// plus a small set of landing-only section styles built on the same tokens.
// --------------------------------------------------------------------------
const SHARED_CSS = `<style>
    :root{--navy:#0f172a;--navy2:#141f35;--amber:#f59e0b;--w60:rgba(255,255,255,0.6);--w30:rgba(255,255,255,0.3);--rule:rgba(245,158,11,0.18);--rw:rgba(255,255,255,0.08);--green:#22c55e;}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{background:var(--navy);color:#fff;font-family:'Outfit',sans-serif;line-height:1.7;}
    html{scroll-behavior:smooth;scroll-padding-top:80px;}
    .nav{background:rgba(15,23,42,0.95);backdrop-filter:blur(16px);border-bottom:1px solid var(--rule);padding:1rem 1.5rem;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;}
    .nav-logo{font-weight:800;font-size:1.1rem;letter-spacing:-1px;text-decoration:none;display:inline-flex;}
    .wm-f,.wm-hr{color:var(--amber);}.wm-itz{color:#fff;}
    .nav-back{font-family:'DM Mono',monospace;font-size:0.58rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--w60);text-decoration:none;}
    .nav-back:hover{color:var(--amber);}
    .hero{padding:4rem 1.5rem 2rem;max-width:900px;margin:0 auto;}
    .post-tag{font-family:'DM Mono',monospace;font-size:0.56rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--amber);margin-bottom:1rem;display:flex;align-items:center;gap:0.6rem;}
    .post-tag::before{content:'';width:24px;height:2px;background:var(--amber);display:inline-block;}
    h1{font-family:'Playfair Display',serif;font-weight:900;font-size:clamp(2rem,4.5vw,2.8rem);line-height:1.1;letter-spacing:-0.02em;margin-bottom:1.25rem;}
    h1 em{font-style:italic;color:var(--amber);}
    .intro{font-size:1.05rem;line-height:1.7;color:var(--w60);border-left:3px solid var(--amber);padding-left:1.25rem;margin-bottom:2rem;}
    .body{max-width:900px;margin:0 auto;padding:0 1.5rem 5rem;}
    .body h2{font-family:'Playfair Display',serif;font-weight:700;font-size:1.5rem;color:#fff;margin:2.5rem 0 1rem;border-top:1px solid var(--rw);padding-top:1.5rem;}
    .body h2 em{font-style:italic;color:var(--amber);}
    .body h3{font-family:'Outfit',sans-serif;font-weight:700;font-size:1.05rem;color:#fff;margin:1.5rem 0 0.5rem;}
    .body p{font-size:0.97rem;line-height:1.75;color:var(--w60);margin-bottom:1rem;}
    .body strong{color:#fff;}
    .body a{color:var(--amber);text-decoration:none;}
    .body a:hover{text-decoration:underline;}
    .body ul{margin:0 0 1rem 1.25rem;}
    .body li{font-size:0.95rem;color:var(--w60);line-height:1.65;margin-bottom:0.4rem;}
    .hero-ctas{display:flex;gap:0.75rem;flex-wrap:wrap;margin-top:1.5rem;}
    .btn-primary{display:inline-block;background:var(--amber);color:var(--navy);font-weight:800;font-size:0.85rem;letter-spacing:0.04em;padding:0.85rem 1.75rem;border-radius:8px;text-decoration:none;}
    .btn-primary:hover{background:#fbbf24;}
    .btn-ghost{display:inline-block;border:1px solid var(--rule);color:#fff;font-weight:700;font-size:0.85rem;padding:0.85rem 1.5rem;border-radius:8px;text-decoration:none;}
    .btn-ghost:hover{border-color:var(--amber);color:var(--amber);}
    .badge-strip{display:flex;flex-wrap:wrap;gap:1px;max-width:900px;margin:0 auto 1rem;}
    .badge{background:var(--navy2);border:1px solid var(--rw);padding:1rem 1.25rem;flex:1 1 200px;}
    .badge .k{font-family:'DM Mono',monospace;font-size:0.5rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--amber);margin-bottom:0.35rem;}
    .badge .v{font-size:0.95rem;font-weight:700;color:#fff;}
    .section-label{font-family:'DM Mono',monospace;font-size:0.56rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--amber);margin:2.5rem 0 1rem;display:flex;align-items:center;gap:0.6rem;}
    .section-label::before{content:'';width:24px;height:2px;background:var(--amber);display:inline-block;}
    .scn-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;margin:1rem 0;}
    @media(max-width:600px){.scn-grid{grid-template-columns:1fr;}}
    .scn-card{background:var(--navy2);border:1px solid var(--rw);padding:1.5rem;}
    .scn-q{font-weight:700;color:#fff;font-size:0.98rem;margin-bottom:0.5rem;}
    .scn-q::before{content:'\\201C';color:var(--amber);}
    .scn-q::after{content:'\\201D';color:var(--amber);}
    .scn-a{font-size:0.9rem;color:var(--w60);line-height:1.6;}
    .feature{background:var(--navy2);border:1px solid var(--rw);border-left:4px solid var(--amber);border-radius:0 12px 12px 0;padding:1.5rem;margin:1rem 0;}
    .feature h3{font-family:'Outfit',sans-serif;font-weight:700;font-size:1.05rem;color:#fff;margin-bottom:0.5rem;}
    .feature p{font-size:0.92rem;color:var(--w60);margin:0;}
    .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin:1rem 0;}
    @media(max-width:600px){.steps{grid-template-columns:1fr;}}
    .step{background:var(--navy2);border:1px solid var(--rw);padding:1.25rem;}
    .step .n{font-family:'DM Mono',monospace;font-size:0.6rem;color:var(--amber);letter-spacing:0.14em;}
    .step h4{font-size:0.95rem;color:#fff;margin:0.4rem 0;}
    .step p{font-size:0.85rem;color:var(--w60);margin:0;}
    .rate-table,.compare-table{width:100%;border-collapse:collapse;margin:1.5rem 0;font-size:0.86rem;}
    .rate-table th,.compare-table th{background:var(--navy2);color:var(--amber);padding:0.75rem 1rem;text-align:left;font-family:'DM Mono',monospace;font-size:0.54rem;letter-spacing:0.12em;text-transform:uppercase;border-bottom:1px solid var(--rule);}
    .rate-table td,.compare-table td{padding:0.8rem 1rem;border-bottom:1px solid var(--rw);color:var(--w60);vertical-align:middle;}
    .rate-table tr:last-child td,.compare-table tr:last-child td{border-bottom:none;}
    .rate-table td:first-child,.compare-table td:first-child{color:#fff;font-weight:600;}
    .rate-table tr:hover td{background:rgba(245,158,11,0.02);}
    .highlight{color:var(--amber);font-weight:700;}
    .verdict{background:var(--navy2);border:1px solid var(--rw);border-left:4px solid var(--amber);border-radius:0 12px 12px 0;padding:1.5rem;margin:2rem 0;}
    .verdict-label{font-family:'DM Mono',monospace;font-size:0.54rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--amber);margin-bottom:0.6rem;}
    .verdict p{margin:0;font-size:0.95rem;color:#fff;}
    .hub-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;margin:1.5rem 0;}
    @media(max-width:600px){.hub-grid{grid-template-columns:1fr;}}
    .hub-card{background:var(--navy2);padding:1.5rem;text-decoration:none;display:block;border:1px solid transparent;transition:background 0.2s,border-color 0.2s;}
    .hub-card:hover{background:#1a2847;border-color:var(--rule);}
    .hub-label{font-family:'DM Mono',monospace;font-size:0.5rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--amber);margin-bottom:0.5rem;}
    .hub-card h3{font-size:0.95rem;font-weight:700;color:#fff;line-height:1.4;margin-bottom:0.4rem;}
    .hub-card p{font-size:0.82rem;color:var(--w60);line-height:1.55;margin:0;}
    .faq-list{display:flex;flex-direction:column;gap:0.5rem;margin:1.5rem 0;}
    .faq-item{background:var(--navy2);border:1px solid var(--rw);border-radius:10px;overflow:hidden;}
    .faq-item summary{padding:1rem 1.25rem;cursor:pointer;font-weight:600;font-size:0.95rem;color:#fff;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:1rem;}
    .faq-item summary::-webkit-details-marker{display:none;}
    .faq-item summary::after{content:'+';color:var(--amber);font-size:1.2rem;flex-shrink:0;transition:transform 0.3s;}
    .faq-item[open] summary::after{transform:rotate(45deg);}
    .faq-item[open]{border-color:var(--rule);}
    .faq-answer{padding:0 1.25rem 1rem;font-size:0.88rem;color:var(--w60);line-height:1.65;}
    .faq-answer a{color:var(--amber);text-decoration:none;}
    .post-cta{background:var(--amber);padding:2.5rem 1.5rem;border-radius:12px;text-align:center;margin:2.5rem 0;}
    .post-cta h3{font-family:'Playfair Display',serif;font-weight:900;font-size:1.5rem;color:var(--navy);margin-bottom:0.5rem;}
    .post-cta p{font-size:0.9rem;color:rgba(15,23,42,0.7);margin-bottom:1.25rem;}
    .post-cta a{display:inline-block;background:var(--navy);color:var(--amber);font-weight:800;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;padding:0.85rem 2rem;text-decoration:none;}
    .post-cta a:hover{background:#1e293b;}
    .sticky-pill{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--amber);color:var(--navy);padding:0.75rem 1.75rem;border-radius:999px;font-weight:800;font-size:0.8rem;text-decoration:none;z-index:999;white-space:nowrap;box-shadow:0 4px 24px rgba(245,158,11,0.35);}
    .sticky-pill:hover{background:#fbbf24;}
    footer{background:var(--navy2);border-top:1px solid var(--rule);padding:2rem 1.5rem;text-align:center;}
    footer p{font-family:'DM Mono',monospace;font-size:0.54rem;letter-spacing:0.1em;color:var(--w30);}
    footer a{color:var(--amber);text-decoration:none;}
    @media(max-width:600px){.sticky-pill{font-size:0.74rem;padding:0.65rem 1.25rem;}.rate-table,.compare-table{font-size:0.78rem;}.rate-table th,.rate-table td,.compare-table th,.compare-table td{padding:0.6rem 0.6rem;}}
</style>`;

const GTAG = `    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-NT7FEHKWHV"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-NT7FEHKWHV');
    </script>`;

const FONTS = `    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">`;

function head({ title, description, canonical, jsonld, keywords }) {
  const ld = jsonld.map(o => `    <script type="application/ld+json">\n    ${JSON.stringify(o)}\n    </script>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
${GTAG}
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">${keywords ? `\n    <meta name="keywords" content="${esc(keywords)}">` : ''}
    <meta name="author" content="Fitz HR">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonical}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonical}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:image" content="${SITE}/assets/og-image.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:locale" content="en_AU">
    <meta property="og:site_name" content="Fitz HR">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@FitzHR">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${SITE}/assets/og-image.png">
    <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
    <meta name="theme-color" content="#f59e0b">
${FONTS}
${ld}
${SHARED_CSS}
</head>
<body>`;
}

const nav = () => `<nav class="nav">
    <a href="/" class="nav-logo" aria-label="Fitz HR home"><span class="wm-f">F</span><span class="wm-itz">ITZ</span><span class="wm-hr" style="margin-left:0.18em;">HR</span></a>
    <a href="/blog/" class="nav-back">&larr; All Guides</a>
</nav>`;

const footer = () => `<footer>
    <p>&copy; 2026 Fitz HR &middot; <a href="/">Home</a> &middot; <a href="/blog/">Blog</a> &middot; <a href="/hospitality-award-guide">Hospitality Award</a> &middot; <a href="/restaurant-award-guide">Restaurant Award</a> &middot; <a href="/app">Try Free</a></p>
</footer>
</body>
</html>`;

const breadcrumb = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })) });
const faqLd = (faqs) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') } })) });

function faqBlock(faqs) {
  return `    <h2>Frequently Asked Questions</h2>
    <div class="faq-list">
${faqs.map((f, i) => `        <details class="faq-item"${i === 0 ? ' open' : ''}>
            <summary>${esc(f.q)}</summary>
            <div class="faq-answer">${f.a}</div>
        </details>`).join('\n')}
    </div>`;
}

function clusterLinks(v, current) {
  const links = [
    { key: 'landing', href: `/${v}`, label: 'Overview', title: `${VERTICALS[v].awardShort} for your business`, blurb: 'The live scenarios, wizard, document builder and Crisis Mode, built for your vertical.' },
    { key: 'pay', href: `/${v}-award-pay-rates`, label: 'Pay Rates', title: `${VERTICALS[v].awardShort} Pay Rates 2026`, blurb: 'Current classification rates, penalties and allowances from the FWO Pay Guide.' },
    { key: 'guide', href: `/${v}-award-guide`, label: 'Guide', title: `${VERTICALS[v].awardShort} Guide (${VERTICALS[v].code})`, blurb: 'The complete reference — coverage, classifications, penalties, allowances and compliance.' },
    { key: 'vs', href: `/compare/fitz-hr-vs-employment-hero-${v}`, label: 'Compare', title: `Fitz HR vs Employment Hero`, blurb: `How Fitz compares for ${pluralIndustry(VERTICALS[v].industry)} on the ${VERTICALS[v].awardShort}.` },
    { key: 'best', href: `/compare/best-hr-software-${v}-australia`, label: 'Best software', title: `Best HR Software for ${VERTICALS[v].titleIndustry}`, blurb: `What to look for in HR & compliance software for ${pluralIndustry(VERTICALS[v].industry)} — and how Fitz compares.` },
  ].filter(l => l.key !== current);
  return `    <div class="hub-grid">
${links.map(l => `        <a href="${l.href}" class="hub-card"><div class="hub-label">${l.label}</div><h3>${esc(l.title)}</h3><p>${esc(l.blurb)}</p></a>`).join('\n')}
    </div>`;
}

// --------------------------------------------------------------------------
// Data-derived table fragments
// --------------------------------------------------------------------------
function payTable(data, limit = 24) {
  const ft = (data.rates || []).filter(r => r.employment_type === 'full_time' && typeof r.rate === 'number');
  const rows = ft.slice(0, limit).map(r => `            <tr><td>${esc(r.classification)}${r.stream ? ` <span style="color:var(--w30)">(${esc(String(r.stream).replace(/_/g, ' '))})</span>` : ''}</td><td class="highlight">${money(r.rate)}</td>${r.weekly_rate ? `<td>${money(r.weekly_rate)}</td>` : '<td>—</td>'}</tr>`).join('\n');
  const more = ft.length > limit ? `\n    <p style="font-size:0.82rem;color:var(--w30)">Showing ${limit} of ${ft.length} full-time classifications. Ask Fitz for any classification, employment type or stream.</p>` : '';
  return `    <table class="rate-table">
        <thead><tr><th>Classification (full-time)</th><th>Hourly</th><th>Weekly</th></tr></thead>
        <tbody>
${rows}
        </tbody>
    </table>${more}`;
}

function penaltyTable(data) {
  const p = pen(data);
  const entries = [
    ['Saturday (FT/PT)', p.sat_ftpt], ['Saturday (casual)', p.sat_cas],
    ['Sunday (FT/PT)', p.sun_ftpt], ['Sunday (casual)', p.sun_cas],
    ['Public holiday (FT/PT)', p.ph_ftpt], ['Public holiday (casual)', p.ph_cas],
  ];
  const rows = entries.filter(([, m]) => typeof m === 'number')
    .map(([name, m]) => `            <tr><td>${name}</td><td class="highlight">${pct(m)}</td></tr>`).join('\n');
  return `    <table class="rate-table">
        <thead><tr><th>When worked</th><th>% of ordinary rate</th></tr></thead>
        <tbody>
${rows}
        </tbody>
    </table>`;
}

function allowanceTable(data, limit = 10) {
  const rows = (data.allowances || []).filter(a => typeof a.amount === 'number' && a.name).slice(0, limit)
    .map(a => `            <tr><td>${esc(a.name)}</td><td class="highlight">${money(a.amount)}</td><td>${esc(a.unit || '')}</td></tr>`).join('\n');
  return `    <table class="rate-table">
        <thead><tr><th>Allowance</th><th>Amount</th><th>Unit</th></tr></thead>
        <tbody>
${rows}
        </tbody>
    </table>`;
}

// --------------------------------------------------------------------------
// Page builders
// --------------------------------------------------------------------------
function landingPage(v) {
  const c = VERTICALS[v]; const data = load(c.file);
  const url = `${SITE}/${v}`;
  const heroWordHtml = c.heroHook.replace('{word}', `<em>${esc(c.heroWord)}</em>`);
  const title = `HR & Compliance Software for ${c.titleIndustry} — ${c.awardShort} | Fitz HR`;
  const description = `Award-aware HR & compliance software for ${c.audience}. Instant answers grounded in the ${c.awardShort} (${c.code}) — pay rates, penalties, allowances — plus a document builder and Crisis Mode. Free to start.`;
  const keywords = `HR software for ${c.industry}, HR compliance software ${c.titleIndustry.toLowerCase()}, ${c.awardShort} software, ${c.awardShort} compliance, ${c.code} pay rates, HR software Australia ${c.industry}`;
  const faqs = [
    { q: `What does Fitz HR do for a ${c.industry}?`, a: `Fitz answers ${c.awardShort} (${c.code}) questions instantly — pay rates, penalties, allowances, minimum engagement, classifications and compliance — grounded in the current Fair Work Ombudsman Pay Guide. It also builds documents and runs a Crisis Mode for urgent situations.` },
    { q: `Are the ${c.awardShort} rates current?`, a: `Yes. Rates are sourced from the FWO Pay Guide ${c.code} and are current as at ${data.effective_date}, with the next review due ${data.next_review_date}.` },
    ...c.faqExtra,
    { q: `Is this a separate product from the hospitality tool?`, a: `No — it is the same Fitz HR assistant, tuned for the ${c.awardShort}. You get the same wizard, document builder and Crisis Mode, grounded in your award.` },
  ];
  const jsonld = [
    breadcrumb([{ name: 'Home', url: `${SITE}/` }, { name: `${c.awardShort} HR`, url }]),
    { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url, inLanguage: 'en-AU', isPartOf: { '@type': 'WebSite', name: 'Fitz HR', url: `${SITE}/` } },
    faqLd(faqs),
  ];
  return `${head({ title, description, canonical: url, jsonld, keywords })}
${nav()}
<header class="hero">
    <div class="post-tag">${c.awardFull.split(' ').slice(-1)[0]} &middot; ${esc(c.awardShort)}</div>
    <h1>${heroWordHtml}</h1>
    <p class="intro">The HR desk for ${esc(c.audience)}. Instant answers grounded in the ${esc(c.awardShort)} — not generic templates.</p>
    <div class="hero-ctas">
        <a href="/app" class="btn-primary">Start Free — No Card Required &rarr;</a>
        <a href="/${v}-award-pay-rates" class="btn-ghost">View ${esc(c.awardShort)} pay rates &darr;</a>
    </div>
</header>
<div class="badge-strip">
    <div class="badge"><div class="k">Award</div><div class="v">${esc(c.code)}</div></div>
    <div class="badge"><div class="k">Rates current</div><div class="v">${data.effective_date}</div></div>
    <div class="badge"><div class="k">Casual loading</div><div class="v">${pct(data.casual_loading)}</div></div>
    <div class="badge"><div class="k">Super</div><div class="v">${pct(data.superannuation_rate)}</div></div>
</div>
<div class="body">
    <p style="font-size:0.9rem;">Covers ${esc(c.coverage)}</p>

    <div class="section-label">Live scenarios</div>
    <div class="scn-grid">
${c.scenarios.map(s => `        <div class="scn-card"><div class="scn-q">${esc(s.q)}</div><div class="scn-a">${esc(s.a)}</div></div>`).join('\n')}
    </div>

    <div class="section-label">Classification wizard</div>
    <div class="steps">
        <div class="step"><div class="n">01</div><h4>Describe the role</h4><p>Answer a few plain-English questions about what the employee actually does.</p></div>
        <div class="step"><div class="n">02</div><h4>Fitz maps the award</h4><p>The wizard walks the ${esc(c.awardShort)} classification structure so you land on the right level.</p></div>
        <div class="step"><div class="n">03</div><h4>Get the exact rate</h4><p>The current hourly, weekly, penalty and allowance figures — straight from the Pay Guide ${esc(c.code)}.</p></div>
    </div>

    <div class="section-label">Document builder</div>
    <div class="feature">
        <h3>Award-correct documents in minutes</h3>
        <p>Generate ${esc(c.industry)} paperwork that already reflects ${esc(c.awardShort)} rules: ${c.docs.map(esc).join(' &middot; ')}.</p>
    </div>

    <div class="section-label">Crisis Mode</div>
    <div class="feature">
        <h3>When something goes wrong right now</h3>
        <p>${esc(c.crisis)}</p>
    </div>

    <div class="section-label">Explore</div>
${clusterLinks(v, 'landing')}

${faqBlock(faqs)}

    <div class="post-cta">
        <h3>Any ${esc(c.awardShort)} question — answered in seconds</h3>
        <p>Grounded in the current Fair Work Pay Guide ${esc(c.code)}. Ask anything about pay, penalties, allowances or compliance.</p>
        <a href="/app">Ask Fitz Free &rarr;</a>
    </div>
</div>
<a href="/app" class="sticky-pill">${esc(c.awardShort)} question? Ask Fitz &rarr;</a>
${footer()}`;
}

function payRatesPage(v) {
  const c = VERTICALS[v]; const data = load(c.file);
  const url = `${SITE}/${v}-award-pay-rates`;
  const title = `${c.awardShort} Pay Rates 2026 — ${c.code} Hourly & Penalty Rates | Fitz HR`;
  const description = `${c.awardShort} (${c.code}) pay rates current as at ${data.effective_date} — classification hourly and weekly rates, Saturday/Sunday/public holiday penalties, casual loading and allowances from the FWO Pay Guide.`;
  const faqs = [
    { q: `What are the ${c.awardShort} pay rates in 2026?`, a: `The ${c.awardFull} minimum rates are current as at ${data.effective_date} (next review ${data.next_review_date}). Full-time classification rates, penalty rates and allowances are listed above; casual employees receive a ${pct(data.casual_loading)} loading.` },
    { q: `What penalty rates apply under ${c.code}?`, a: `Weekend and public holiday penalties are shown in the penalties table above, expressed as a percentage of the ordinary hourly rate. Casual penalty percentages are all-inclusive of the ${pct(data.casual_loading)} casual loading.` },
    { q: `How current is this data?`, a: `These figures are extracted from the Fair Work Ombudsman Pay Guide ${c.code} and are current as at ${data.effective_date}. Fitz HR re-checks them against the Pay Guide and flags when an award is past its review date of ${data.next_review_date}.` },
  ];
  const jsonld = [
    breadcrumb([{ name: 'Home', url: `${SITE}/` }, { name: `${c.awardShort} Pay Rates`, url }]),
    { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url, inLanguage: 'en-AU' },
    faqLd(faqs),
  ];
  return `${head({ title, description, canonical: url, jsonld })}
${nav()}
<header class="hero">
    <div class="post-tag">${esc(c.code)} &middot; Pay Rates 2026</div>
    <h1>${esc(c.awardShort)} <em>Pay Rates</em></h1>
    <p class="intro">Minimum rates under the ${esc(c.awardFull)}, current as at <strong style="color:#fff">${data.effective_date}</strong>. Sourced from the Fair Work Ombudsman Pay Guide ${esc(c.code)}.</p>
    <div class="hero-ctas"><a href="/app" class="btn-primary">Ask Fitz for any rate &rarr;</a><a href="/${v}" class="btn-ghost">${esc(c.awardShort)} overview</a></div>
</header>
<div class="badge-strip">
    <div class="badge"><div class="k">Casual loading</div><div class="v">${pct(data.casual_loading)}</div></div>
    <div class="badge"><div class="k">Super</div><div class="v">${pct(data.superannuation_rate)}</div></div>
    <div class="badge"><div class="k">Effective</div><div class="v">${data.effective_date}</div></div>
    <div class="badge"><div class="k">Next review</div><div class="v">${data.next_review_date}</div></div>
</div>
<div class="body">
    <h2>Classification <em>Hourly Rates</em></h2>
    <p>Full-time minimum rates by classification. Casual employees receive these rates plus the ${pct(data.casual_loading)} casual loading (or the all-inclusive casual rate where the award specifies one).</p>
${payTable(data)}

    <h2>Penalty <em>Rates</em></h2>
    <p>Weekend and public holiday penalties as a percentage of the ordinary hourly rate. Casual percentages are all-inclusive of the casual loading.</p>
${penaltyTable(data)}

    <h2>Common <em>Allowances</em></h2>
    <p>Frequently-applied allowances from the Pay Guide ${esc(c.code)}. Ask Fitz for the full list and the exact conditions.</p>
${allowanceTable(data)}

    <div class="section-label">Explore</div>
${clusterLinks(v, 'pay')}

${faqBlock(faqs)}

    <div class="post-cta">
        <h3>Need a rate we didn’t list?</h3>
        <p>Ask Fitz for any classification, stream, penalty or allowance under ${esc(c.code)} — answered in seconds, grounded in the Pay Guide.</p>
        <a href="/app">Ask Fitz Free &rarr;</a>
    </div>
</div>
<a href="/app" class="sticky-pill">Any ${esc(c.awardShort)} rate? Ask Fitz &rarr;</a>
${footer()}`;
}

function guidePage(v) {
  const c = VERTICALS[v]; const data = load(c.file);
  const url = `${SITE}/${v}-award-guide`;
  const title = `${c.awardShort} Guide — ${c.code} Complete Reference (2026) | Fitz HR`;
  const description = `${c.code} ${c.awardShort} guide — coverage, classifications, penalty rates, allowances, minimum engagement and Fair Work compliance for ${c.audience}.`;
  const me = Object.entries(data.minimum_engagement || {}).filter(([, x]) => typeof x === 'number')
    .map(([k, x]) => `<li><strong>${esc(k.replace(/_/g, ' '))}:</strong> ${x} hours minimum per shift</li>`).join('');
  const faqs = [
    { q: `What is the ${c.awardFull}?`, a: `<strong>It is a modern award under the Fair Work Act 2009 (Cth) that sets minimum pay rates, penalty rates, allowances and conditions.</strong> It covers ${c.coverage}` },
    { q: `What are the penalty rates under ${c.code} in 2026?`, a: `Saturday ${pct(pen(data).sat_ftpt)} and Sunday ${pct(pen(data).sun_ftpt)} for full-time and part-time employees, with a public holiday rate of ${pct(pen(data).ph_ftpt)}. Casual rates are all-inclusive of the ${pct(data.casual_loading)} loading. See the <a href="/${v}-award-pay-rates">full pay rates page</a>.` },
    ...c.faqExtra,
    { q: `How current are these ${c.awardShort} figures?`, a: `They are extracted from the Fair Work Ombudsman Pay Guide ${c.code}, current as at ${data.effective_date}, with the next review due ${data.next_review_date}.` },
  ];
  const jsonld = [
    breadcrumb([{ name: 'Home', url: `${SITE}/` }, { name: `${c.awardShort} Guide`, url }]),
    { '@context': 'https://schema.org', '@type': 'Article', headline: `${c.awardShort} Guide — ${c.code} Complete Reference (2026)`, description, author: { '@type': 'Organization', name: 'Fitz HR', url: `${SITE}/` }, publisher: { '@type': 'Organization', name: 'Fitz HR', logo: { '@type': 'ImageObject', url: `${SITE}/assets/og-image.png` } }, mainEntityOfPage: { '@type': 'WebPage', '@id': url }, datePublished: '2026-07-01', dateModified: data.effective_date, inLanguage: 'en-AU' },
    faqLd(faqs),
  ];
  return `${head({ title, description, canonical: url, jsonld })}
${nav()}
<header class="hero">
    <div class="post-tag">${esc(c.code)} &middot; Award Guide</div>
    <h1>${esc(c.awardShort)} <em>Guide</em></h1>
    <p class="intro">The complete reference to the ${esc(c.awardFull)} for ${esc(c.audience)} — coverage, classifications, penalty rates, allowances, minimum engagement and Fair Work compliance.</p>
</header>
<div class="body">
    <h2>What the ${esc(c.awardShort)} <em>Covers</em></h2>
    <p>The ${esc(c.awardFull)} covers ${esc(c.coverage)} Getting coverage right matters — it drives the classification structure, penalty rates, and allowances that apply to every shift. Applying the wrong award creates systematic underpayment exposure.</p>

${clusterLinks(v, 'guide')}

    <h2>Penalty <em>Rates</em></h2>
    <p>Penalty rates under ${esc(c.code)} for weekend and public holiday work, as a percentage of the ordinary hourly rate:</p>
${penaltyTable(data)}
    <p>${typeof pen(data).sat_cas === 'number'
      ? `Casual employees receive a ${pct(data.casual_loading)} loading; the casual penalty percentages above are all-inclusive of that loading, not stacked on top.`
      : `Casual employees receive a ${pct(data.casual_loading)} loading in addition to the ordinary rate. Ask Fitz for the exact casual and overtime rates under ${esc(c.code)}.`}</p>

    <h2>Classification <em>Rates</em></h2>
    <p>A sample of the full-time minimum rates. See the <a href="/${v}-award-pay-rates">${esc(c.awardShort)} pay rates page</a> for the full table, streams and casual rates.</p>
${payTable(data, 12)}

    <h2>Minimum <em>Engagement</em></h2>
    <p>The ${esc(c.awardShort)} sets a minimum period an employee must be paid for each time they are engaged:</p>
    <ul>${me}</ul>

    <h2>Common <em>Allowances</em></h2>
${allowanceTable(data, 8)}

    <h2>Fair Work <em>Compliance</em></h2>
    <p>Operating under ${esc(c.code)} creates obligations beyond paying the correct rate:</p>
    <ul>
        <li><strong>Record keeping:</strong> keep employee records for 7 years, including actual (not rostered) start and finish times, classification, rates, allowances and superannuation.</li>
        <li><strong>Payslips:</strong> issue within one working day of pay day with all required information.</li>
        <li><strong>Casual Employment Information Statement:</strong> provide at commencement and at the relevant conversion milestone.</li>
        <li><strong>Superannuation:</strong> currently ${pct(data.superannuation_rate)} on ordinary time earnings.</li>
    </ul>
    <p>See the <a href="/fair-work-compliance-hospitality">Fair Work compliance pillar guide</a> and <a href="/compare/fitz-hr-vs-employment-hero-${v}">how Fitz HR compares for ${esc(c.industry)}s</a>.</p>

${faqBlock(faqs)}

    <div class="post-cta">
        <h3>Any ${esc(c.awardShort)} question — answered in seconds</h3>
        <p>Fitz HR is grounded in the current Pay Guide ${esc(c.code)}. Ask any question and get an instant, specific answer.</p>
        <a href="/app">Ask Fitz Free &rarr;</a>
    </div>
</div>
<a href="/app" class="sticky-pill">${esc(c.awardShort)} question? Ask Fitz &rarr;</a>
${footer()}`;
}

function vsEmploymentHeroPage(v) {
  const c = VERTICALS[v]; const data = load(c.file);
  const url = `${SITE}/compare/fitz-hr-vs-employment-hero-${v}`;
  const title = `Fitz HR vs Employment Hero for ${c.awardShort} (2026) | Fitz HR`;
  const description = `Fitz HR vs Employment Hero for ${c.audience}. How the two compare on ${c.awardShort} (${c.code}) accuracy, award-grounded answers, document building and price.`;
  const rows = [
    ['Built for the ' + c.awardShort, `Purpose-built cluster + ${c.code}-grounded answers`, 'General HR platform; award content is generic'],
    ['Instant award answers', 'Yes — grounded in the current FWO Pay Guide', 'Limited; often points to external resources'],
    ['Rate accuracy gate', 'Regression-tested before a vertical goes live', 'Not published'],
    ['Document builder', `${c.industry} documents reflecting ${c.awardShort} rules`, 'Template library, not award-reasoned'],
    ['Crisis Mode', 'Immediate, award-grounded steps for urgent situations', 'No equivalent'],
    ['Setup', 'Ask a question — no implementation project', 'Onboarding / implementation typical'],
  ];
  const faqs = [
    { q: `Is Fitz HR a full replacement for Employment Hero?`, a: `Fitz HR focuses on award interpretation, compliance answers, document building and crisis response for ${c.audience}. Employment Hero is a broad HRIS/payroll suite. Many operators use Fitz for fast, ${c.awardShort}-accurate answers alongside their payroll system.` },
    { q: `How does Fitz stay accurate on the ${c.awardShort}?`, a: `Every vertical is gated by a regression suite that must clear an accuracy threshold before it launches, and rates are sourced from the FWO Pay Guide ${c.code} (current as at ${data.effective_date}).` },
    { q: `Which is better value for a small ${c.industry}?`, a: `For award questions and compliance documents, Fitz is designed to be answer-first with no implementation project. Compare the current <a href="/pricing">Fitz HR pricing</a> against an Employment Hero quote for your headcount.` },
  ];
  const jsonld = [
    breadcrumb([{ name: 'Home', url: `${SITE}/` }, { name: 'Compare', url: `${SITE}/compare/best-hr-software-hospitality-australia` }, { name: `Fitz HR vs Employment Hero — ${c.awardShort}`, url }]),
    { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url, inLanguage: 'en-AU' },
    faqLd(faqs),
  ];
  return `${head({ title, description, canonical: url, jsonld })}
${nav()}
<header class="hero">
    <div class="post-tag">Comparison &middot; ${esc(c.awardShort)}</div>
    <h1>Fitz HR vs <em>Employment Hero</em></h1>
    <p class="intro">For ${esc(c.audience)} on the ${esc(c.awardShort)} (${esc(c.code)}). A focused look at how the two compare where it matters for award compliance.</p>
    <div class="hero-ctas"><a href="/app" class="btn-primary">Try Fitz Free &rarr;</a><a href="/${v}-award-pay-rates" class="btn-ghost">See ${esc(c.awardShort)} rates</a></div>
</header>
<div class="body">
    <table class="compare-table">
        <thead><tr><th>Capability</th><th>Fitz HR</th><th>Employment Hero</th></tr></thead>
        <tbody>
${rows.map(r => `            <tr><td>${esc(r[0])}</td><td class="highlight">${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('\n')}
        </tbody>
    </table>

    <div class="verdict">
        <div class="verdict-label">The verdict</div>
        <p>If your priority is fast, accurate ${esc(c.awardShort)} answers and award-correct documents for a ${esc(c.industry)}, Fitz HR is purpose-built for it. If you need a full HRIS and payroll platform, Employment Hero is broader — and many operators run Fitz alongside it for the award reasoning.</p>
    </div>

    <div class="section-label">Explore</div>
${clusterLinks(v, 'vs')}

${faqBlock(faqs)}

    <div class="post-cta">
        <h3>See it on your own ${esc(c.awardShort)} question</h3>
        <p>Ask Fitz anything about ${esc(c.code)} — pay, penalties, allowances or compliance — and judge the answer yourself.</p>
        <a href="/app">Ask Fitz Free &rarr;</a>
    </div>
</div>
<a href="/app" class="sticky-pill">Compare on your award &rarr;</a>
${footer()}`;
}

function bestHrSoftwarePage(v) {
  const c = VERTICALS[v]; const data = load(c.file);
  const url = `${SITE}/compare/best-hr-software-${v}-australia`;
  const title = `Best HR & Compliance Software for ${c.titleIndustry} in Australia (2026) | Fitz HR`;
  const description = `Choosing HR & compliance software for ${c.audience}? What to look for, why award-aware matters under the ${c.awardShort} (${c.code}), and how Fitz HR compares to generic HR platforms.`;
  const keywords = `best HR software for ${c.industry}, HR compliance software ${c.titleIndustry.toLowerCase()}, HR software Australia ${c.industry}, ${c.awardShort} software, ${c.awardShort} compliance software, payroll compliance ${c.industry}`;
  const rows = [
    ['Grounded in the ' + c.awardShort, `Yes — every answer cites ${c.code} from the current FWO Pay Guide`, 'Generic HR content; award detail is shallow or absent'],
    ['Correct pay, penalties & allowances', `Exact ${c.awardShort} figures, updated at the annual wage review`, 'Often generic or manual; easy to misapply'],
    ['Accuracy checked before launch', 'Regression-tested against the Pay Guide', 'Not published'],
    ['Award-correct documents', `${c.industry} contracts, warnings & letters reflecting ${c.awardShort} rules`, 'Template library, not award-reasoned'],
    ['Crisis Mode', 'Immediate, award-grounded steps for urgent situations', 'No equivalent'],
    ['Setup & price', 'Ask a question — no implementation project; free to start', 'Implementation typical; per-seat pricing'],
  ];
  const faqs = [
    { q: `What is the best HR software for ${pluralIndustry(c.industry)} in Australia?`, a: `For award compliance, the best HR software is one that grounds every answer in your specific award. Fitz HR is award-aware for the ${c.awardShort} (${c.code}) — it returns exact pay rates, penalties and allowances and builds ${c.industry} documents that reflect the award, rather than a generic template.` },
    { q: `Why does award-aware HR software matter for ${pluralIndustry(c.industry)}?`, a: `Because ${pluralIndustry(c.industry)} are covered by the ${c.awardFull}, and getting classifications, penalties or allowances wrong is the fastest route to a Fair Work underpayment claim. Generic HR platforms rarely reason about a specific award; Fitz answers from ${c.code} directly.` },
    { q: `Does Fitz HR replace payroll for a ${c.industry}?`, a: `Fitz focuses on award interpretation, compliance answers, document building and crisis response. Many operators run it alongside their payroll system for fast, ${c.awardShort}-accurate answers. Compare the current <a href="/pricing">Fitz HR pricing</a> to a per-seat HR platform quote.` },
    { q: `How much does HR compliance software cost for a ${c.industry}?`, a: `Fitz HR is free to start, with paid plans published transparently at <a href="/pricing">fitzhr.com/pricing</a> — no sales call, no lock-in. That is typically a fraction of the cost of a single unfair dismissal claim.` },
  ];
  const jsonld = [
    breadcrumb([{ name: 'Home', url: `${SITE}/` }, { name: 'Compare', url: `${SITE}/compare/best-hr-software-hospitality-australia` }, { name: `Best HR Software for ${c.titleIndustry}`, url }]),
    { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url, inLanguage: 'en-AU' },
    faqLd(faqs),
  ];
  return `${head({ title, description, canonical: url, jsonld, keywords })}
${nav()}
<header class="hero">
    <div class="post-tag">Buyer's Guide &middot; ${esc(c.awardShort)}</div>
    <h1>Best HR &amp; Compliance Software for <em>${esc(c.titleIndustry)}</em> in Australia</h1>
    <p class="intro">Choosing HR and compliance software for ${esc(c.audience)}? The single most important factor is whether it actually understands your award — the <strong style="color:#fff">${esc(c.awardShort)} (${esc(c.code)})</strong>. Here is what to look for, and how Fitz HR compares.</p>
    <div class="hero-ctas"><a href="/app" class="btn-primary">Try Fitz Free &rarr;</a><a href="/${v}-award-pay-rates" class="btn-ghost">See ${esc(c.awardShort)} rates</a></div>
</header>
<div class="body">
    <div class="section-label">What to look for</div>
    <p>For a ${esc(c.industry)}, generic HR software is the wrong tool for the most expensive risk you carry: getting the award wrong. When you compare options, weigh these first:</p>
    <ul>
        <li><strong>Award-grounded answers</strong> — does it cite the ${esc(c.awardShort)} (${esc(c.code)}), or give generic guidance?</li>
        <li><strong>Correct rates</strong> — exact pay, penalties and allowances, kept current at the annual wage review.</li>
        <li><strong>Award-correct documents</strong> — contracts and warnings that reflect ${esc(c.awardShort)} rules, not a generic template.</li>
        <li><strong>Speed in a crisis</strong> — immediate, grounded steps when something goes wrong on shift.</li>
        <li><strong>Transparent price</strong> — no implementation project or per-seat surprises.</li>
    </ul>

    <div class="section-label">How Fitz HR compares</div>
    <table class="compare-table">
        <thead><tr><th>What matters</th><th>Fitz HR</th><th>Generic HR platforms</th></tr></thead>
        <tbody>
${rows.map(r => `            <tr><td>${esc(r[0])}</td><td class="highlight">${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('\n')}
        </tbody>
    </table>

    <div class="verdict">
        <div class="verdict-label">The verdict</div>
        <p>If your priority is staying compliant under the ${esc(c.awardShort)}, the best HR software for a ${esc(c.industry)} is one built to answer from that award. Fitz HR is award-aware, accuracy-gated and free to start — purpose-built for exactly this, not adapted from a generic platform.</p>
    </div>

    <div class="section-label">Explore</div>
${clusterLinks(v, 'best')}

${faqBlock(faqs)}

    <div class="post-cta">
        <h3>Try it on your own ${esc(c.awardShort)} question</h3>
        <p>Ask Fitz anything about ${esc(c.code)} — pay, penalties, allowances or compliance — and judge the software yourself.</p>
        <a href="/app">Ask Fitz Free &rarr;</a>
    </div>
</div>
<a href="/app" class="sticky-pill">Best HR software for ${esc(c.titleIndustry)}? &rarr;</a>
${footer()}`;
}

// --------------------------------------------------------------------------
// Emit
// --------------------------------------------------------------------------
fs.mkdirSync(path.join(ROOT, 'compare'), { recursive: true });
const written = [];
function write(rel, html) { fs.writeFileSync(path.join(ROOT, rel), html); written.push(rel); }

for (const v of Object.keys(VERTICALS)) {
  write(`${v}.html`, landingPage(v));
  write(`${v}-award-pay-rates.html`, payRatesPage(v));
  write(`${v}-award-guide.html`, guidePage(v));
  write(`compare/fitz-hr-vs-employment-hero-${v}.html`, vsEmploymentHeroPage(v));
  write(`compare/best-hr-software-${v}-australia.html`, bestHrSoftwarePage(v));
}
console.log(`Generated ${written.length} vertical pages:`);
for (const w of written) console.log('  ' + w);
