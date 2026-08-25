#!/usr/bin/env node
// Generates one "classifications explained" page per award from the verified
// *-award-rates.json files, targeting the level-comparison query family the
// keyword reports surfaced ("level 2 vs level 3", "what are the C levels").
// Rerun after each Annual Wage Review:  node scripts/build-classification-pages.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://fitzhr.com';

const AWARDS = {
  hospitality: { file: 'hospitality-award-rates.json', short: 'Hospitality Award', levelWord: 'Levels', example: 'a food & beverage attendant, cook or kitchen hand' },
  restaurant: { file: 'restaurant-award-rates.json', short: 'Restaurant Award', levelWord: 'Levels', example: 'a waiter, cook or barista' },
  retail: { file: 'retail-award-rates.json', short: 'Retail Award', levelWord: 'Levels', example: 'a shop assistant, keyholder or department manager' },
  manufacturing: { file: 'manufacturing-award-rates.json', short: 'Manufacturing Award', levelWord: 'C Levels', example: 'a process worker, tradesperson or leading hand' },
  schads: { file: 'schads-award-rates.json', short: 'SCHADS Award', levelWord: 'Levels & Pay Points', example: 'a support worker or coordinator' },
  health: { file: 'health-award-rates.json', short: 'Health Professionals Award', levelWord: 'Levels', example: 'a receptionist, dental assistant or allied health professional' },
  childrens: { file: 'childrens-award-rates.json', short: "Children's Services Award", levelWord: 'Levels', example: 'an educator, cook or director' },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (v) => `$${v.toFixed(2)}`;

function buildRows(data) {
  const ft = data.rates.filter((r) => r.category === 'adult' && r.employment_type === 'full_time' && typeof r.rate === 'number');
  const cas = data.rates.filter((r) => r.category === 'adult' && r.employment_type === 'casual' && typeof r.rate === 'number');
  const casMap = new Map(cas.map((r) => [`${r.stream || ''}|${r.classification}`, r.rate]));
  const groups = new Map();
  for (const r of ft) {
    const g = r.section || r.stream || 'Classifications';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push({
      name: r.classification, title: r.title && r.title !== r.classification ? r.title : null,
      ft: r.rate, casual: casMap.get(`${r.stream || ''}|${r.classification}`) ?? null,
    });
  }
  return groups;
}

function prettyGroup(g) {
  return String(g).replace(/ - Full-time & part-time/i, '').replace(/_/g, ' ').replace(/\b\w/, (c) => c.toUpperCase());
}

function page(v) {
  const c = AWARDS[v];
  const data = JSON.parse(readFileSync(join(root, c.file), 'utf8'));
  const code = data.ma_number;
  const url = `${SITE}/${v}-award-classifications`;
  let title = `${c.short} Classifications: ${c.levelWord} & Pay | Fitz HR`;
  if (title.length > 60) title = `${c.short} Classifications & Pay | Fitz HR`;
  const description = `${c.short} (${code}) classification levels explained with 2026 full-time and casual pay rates for every level — sourced from the FWO Pay Guide.`;
  const groups = buildRows(data);
  const allRows = [...groups.values()].flat();
  const lo = Math.min(...allRows.map((r) => r.ft));
  const hi = Math.max(...allRows.map((r) => r.ft));
  const first = allRows[0];
  const second = allRows.find((r) => r.ft > first.ft) || first;
  const step = (second.ft - first.ft).toFixed(2);

  const faqs = [
    { q: `What are the classification levels under the ${c.short}?`,
      a: `The ${c.short} (${code}) classifies adult employees across the levels listed above, with 2026 full-time rates running from ${money(lo)} to ${money(hi)} per hour. Each classification's duties are defined in the award itself — the tables here show the current minimum pay for each level.` },
    { q: `What's the difference between ${esc(first.name)} and ${esc(second.name)}?`,
      a: `In pay, $${step} per hour full-time (${money(first.ft)} vs ${money(second.ft)}). In duties, the award defines what work belongs at each level — broadly, higher levels reflect more skill, qualifications or responsibility. If you're not sure which level ${c.example} sits at, Fitz's classification wizard walks the award structure with you.` },
    { q: `What do casuals get paid at each level?`,
      a: `Casual rates include the 25% casual loading. For example, ${esc(first.name)} pays ${money(first.ft)} full-time and ${first.casual ? money(first.casual) : 'the loaded casual rate'} casual. The tables above show both rates for every classification.` },
    { q: `How do I work out which classification applies to a role?`,
      a: `Match the role's actual duties — not the job title — to the award's classification definitions. Getting it wrong in either direction creates underpayment risk or overspend. Describe the role to Fitz and the classification wizard maps it to the right level with the current rate, free to start.` },
  ];

  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: `${c.short} Classifications`, item: url }] },
    { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url, inLanguage: 'en-AU',
      isPartOf: { '@type': 'WebSite', name: 'Fitz HR', url: `${SITE}/` },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.quick-answer'] } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q.replace(/<[^>]+>/g, ''), acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') } })) },
  ];

  const tables = [...groups.entries()].map(([g, rows]) => `${groups.size > 1 ? `    <h3>${esc(prettyGroup(g))}</h3>\n` : ''}    <table class="rate-table">
        <thead><tr><th>Classification</th><th>Full-time /hr</th><th>Casual /hr*</th></tr></thead>
        <tbody>
${rows.map((r) => `            <tr><td>${esc(r.name)}${r.title ? ` <span style="color:var(--w30);font-size:0.8em">— ${esc(r.title)}</span>` : ''}</td><td class="highlight">${money(r.ft)}</td><td>${r.casual ? money(r.casual) : '—'}</td></tr>`).join('\n')}
        </tbody>
    </table>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-NT7FEHKWHV"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-NT7FEHKWHV');
    </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${url}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:image" content="${SITE}/assets/og-image.png">
    <meta property="og:locale" content="en_AU">
    <meta property="og:site_name" content="Fitz HR">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@FitzHR">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${SITE}/assets/og-image.png">
    <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
    <meta name="theme-color" content="#f59e0b">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
${jsonld.map((j) => `    <script type="application/ld+json">\n    ${JSON.stringify(j)}\n    </script>`).join('\n')}
<style>
    :root{--navy:#0f172a;--navy2:#141f35;--amber:#f59e0b;--w60:rgba(255,255,255,0.6);--w30:rgba(255,255,255,0.3);--rule:rgba(245,158,11,0.18);--rw:rgba(255,255,255,0.08);}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{background:var(--navy);color:#fff;font-family:'Outfit',sans-serif;line-height:1.7;}
    .nav{background:rgba(15,23,42,0.95);border-bottom:1px solid var(--rule);padding:1rem 1.5rem;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;}
    .nav-logo{font-weight:800;font-size:1.1rem;letter-spacing:-1px;text-decoration:none;}
    .wm-f,.wm-hr{color:var(--amber);}.wm-itz{color:#fff;}
    .nav-back{font-family:'DM Mono',monospace;font-size:0.58rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--w60);text-decoration:none;}
    .hero{padding:4rem 1.5rem 1.5rem;max-width:900px;margin:0 auto;}
    .post-tag{font-family:'DM Mono',monospace;font-size:0.56rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--amber);margin-bottom:1rem;display:flex;align-items:center;gap:0.6rem;}
    .post-tag::before{content:'';width:24px;height:2px;background:var(--amber);display:inline-block;}
    h1{font-family:'Playfair Display',serif;font-weight:900;font-size:clamp(2rem,4.5vw,2.7rem);line-height:1.1;letter-spacing:-0.02em;margin-bottom:1.25rem;}
    h1 em{font-style:italic;color:var(--amber);}
    .intro{font-size:1.05rem;line-height:1.7;color:var(--w60);border-left:3px solid var(--amber);padding-left:1.25rem;margin-bottom:1.5rem;}
    .body{max-width:900px;margin:0 auto;padding:0 1.5rem 5rem;}
    .body h2{font-family:'Playfair Display',serif;font-weight:700;font-size:1.5rem;color:#fff;margin:2.5rem 0 1rem;border-top:1px solid var(--rw);padding-top:1.5rem;}
    .body h2 em{font-style:italic;color:var(--amber);}
    .body h3{font-weight:700;font-size:1rem;color:#fff;margin:1.5rem 0 0.5rem;}
    .body p{font-size:0.97rem;line-height:1.75;color:var(--w60);margin-bottom:1rem;}
    .body strong{color:#fff;}
    .body a{color:var(--amber);text-decoration:none;}
    .body a:hover{text-decoration:underline;}
    .quick-answer{background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.35);border-left:4px solid #f59e0b;border-radius:12px;padding:20px 22px;margin:24px 0;}
    .quick-answer strong.label{display:block;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;color:#f59e0b;margin-bottom:8px;}
    .rate-table{width:100%;border-collapse:collapse;margin:1rem 0 1.5rem;font-size:0.86rem;}
    .rate-table th{background:var(--navy2);color:var(--amber);padding:0.7rem 0.9rem;text-align:left;font-family:'DM Mono',monospace;font-size:0.54rem;letter-spacing:0.12em;text-transform:uppercase;border-bottom:1px solid var(--rule);}
    .rate-table td{padding:0.7rem 0.9rem;border-bottom:1px solid var(--rw);color:var(--w60);vertical-align:top;}
    .rate-table tr:last-child td{border-bottom:none;}
    .rate-table td:first-child{color:#fff;font-weight:600;}
    .highlight{color:var(--amber);font-weight:700;}
    .faq-list{display:flex;flex-direction:column;gap:0.5rem;margin:1.5rem 0;}
    .faq-item{background:var(--navy2);border:1px solid var(--rw);border-radius:10px;overflow:hidden;}
    .faq-item summary{padding:1rem 1.25rem;cursor:pointer;font-weight:600;font-size:0.95rem;color:#fff;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:1rem;}
    .faq-item summary::-webkit-details-marker{display:none;}
    .faq-item summary::after{content:'+';color:var(--amber);font-size:1.2rem;flex-shrink:0;}
    .faq-answer{padding:0 1.25rem 1rem;font-size:0.88rem;color:var(--w60);line-height:1.65;}
    .post-cta{background:var(--amber);padding:2.5rem 1.5rem;border-radius:12px;text-align:center;margin:2.5rem 0;}
    .post-cta h3{font-family:'Playfair Display',serif;font-weight:900;font-size:1.5rem;color:var(--navy);margin-bottom:0.5rem;}
    .post-cta p{font-size:0.9rem;color:rgba(15,23,42,0.7);margin-bottom:1.25rem;}
    .post-cta a{display:inline-block;background:var(--navy);color:var(--amber);font-weight:800;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;padding:0.85rem 2rem;text-decoration:none;}
    footer{background:var(--navy2);border-top:1px solid var(--rule);padding:2rem 1.5rem;text-align:center;}
    footer p{font-family:'DM Mono',monospace;font-size:0.54rem;letter-spacing:0.1em;color:var(--w30);}
    footer a{color:var(--amber);text-decoration:none;}
    @media(max-width:600px){.rate-table{font-size:0.75rem;}.rate-table th,.rate-table td{padding:0.55rem 0.5rem;}}
</style>
</head>
<body>
<nav class="nav">
    <a href="/" class="nav-logo"><span class="wm-f">F</span><span class="wm-itz">ITZ</span><span class="wm-hr" style="margin-left:0.18em;">HR</span></a>
    <a href="/${v}" class="nav-back">&larr; ${esc(c.short)} hub</a>
</nav>

<header class="hero">
    <div class="post-tag">${esc(code)} &middot; Classifications 2026</div>
    <h1>${esc(c.short)} <em>${esc(c.levelWord)} Explained</em></h1>
    <p class="intro">Every adult classification under the ${esc(c.short)} (${esc(code)}) with current full-time and casual rates — and how to tell which level a role belongs at. Rates current as at ${esc(data.effective_date)}, sourced from the FWO Pay Guide.</p>
</header>

<div class="body">

    <div class="quick-answer">
        <strong class="label">Quick answer</strong>
        <p style="margin:0;line-height:1.65;">The ${esc(c.short)} (${esc(code)}) classifies adult employees across the levels below, with 2026 full-time rates from <strong>${money(lo)}</strong> to <strong>${money(hi)}</strong> per hour; casual rates include the 25% loading. A role's level is set by its <strong>actual duties as defined in the award</strong> — not its job title. The step from ${esc(first.name)} to ${esc(second.name)} is $${step}/hour full-time. Full tables below, or ask Fitz to classify a specific role.</p>
    </div>

    <h2>Every Classification &amp; <em>2026 Rate</em></h2>
${tables}
    <p style="font-size:0.8rem;color:var(--w30);">*Casual rates include the 25% casual loading, as published in the FWO Pay Guide ${esc(code)}. Junior, apprentice and trainee rates differ — ask Fitz for those.</p>

    <h2>How to Read the <em>Levels</em></h2>
    <p><strong>The award classifies the work, not the title.</strong> Whether ${esc(c.example)} sits at one level or the next depends on the duties actually performed, the skills and qualifications the role requires, and the responsibility it carries — each defined in the award's classification schedule. Misclassifying downward creates an underpayment that compounds every pay run; misclassifying upward is money you didn't need to spend.</p>
    <p>If you're unsure, describe the role to <a href="/app">Fitz</a> — the classification wizard walks the ${esc(c.short)} structure with you and returns the level and current rate. Or start from the <a href="/${v}-award-pay-rates">full pay-rates tables</a> and the <a href="/${v}-award-guide">complete award guide</a>.</p>

    <h2>Frequently Asked Questions</h2>
    <div class="faq-list">
${faqs.map((f, i) => `        <details class="faq-item"${i === 0 ? ' open' : ''}>
            <summary>${esc(f.q)}</summary>
            <div class="faq-answer">${f.a}</div>
        </details>`).join('\n')}
    </div>

    <div class="post-cta">
        <h3>Classify Any Role in Minutes</h3>
        <p>Describe the job — Fitz maps it to the right ${esc(c.short)} level with the current rate. Free to start, no card required.</p>
        <a href="/app">Try the Classification Wizard &rarr;</a>
    </div>

</div>

<footer>
    <p>&copy; 2026 Fitz HR &middot; <a href="/${v}">${esc(c.short)} hub</a> &middot; <a href="/${v}-award-cheat-sheet">Cheat sheet</a> &middot; <a href="/blog/">Blog</a> &middot; <a href="/app">Try Free</a></p>
</footer>
</body>
</html>
`;
}

const only = process.argv.slice(2);
for (const v of Object.keys(AWARDS)) {
  if (only.length && !only.includes(v)) continue;
  writeFileSync(join(root, `${v}-award-classifications.html`), page(v));
  console.log('wrote', `${v}-award-classifications.html`);
}
