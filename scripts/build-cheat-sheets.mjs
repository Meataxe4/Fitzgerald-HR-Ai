#!/usr/bin/env node
// Generates one printable cheat-sheet page per award from the SME-verified
// *-award-rates.json files. Screen view is dark-theme; print CSS flips to a
// compact white A4 sheet. Never hand-edit the output — fix here and rerun:
//   node scripts/build-cheat-sheets.mjs [vertical ...]

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://fitzhr.com';

const AWARDS = {
  hospitality: { file: 'hospitality-award-rates.json', short: 'Hospitality Award', industry: 'pubs, hotels, bars & venues' },
  restaurant: { file: 'restaurant-award-rates.json', short: 'Restaurant Award', industry: 'restaurants, cafes & bistros' },
  retail: { file: 'retail-award-rates.json', short: 'Retail Award', industry: 'shops & retail chains' },
  manufacturing: { file: 'manufacturing-award-rates.json', short: 'Manufacturing Award', industry: 'manufacturers & workshops' },
  schads: { file: 'schads-award-rates.json', short: 'SCHADS Award', industry: 'community services & NDIS' },
  health: { file: 'health-award-rates.json', short: 'Health Professionals Award', industry: 'practices, clinics & allied health' },
  childrens: { file: 'childrens-award-rates.json', short: "Children's Services Award", industry: 'childcare, preschool & OSHC' },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pct = (v) => `${+(v * 100).toFixed(1)}%`.replace('.0%', '%');

const LABELS = {
  saturday_full_time_part_time: 'Saturday (FT/PT)', saturday_casual: 'Saturday (casual)',
  sunday_full_time_part_time: 'Sunday (FT/PT)', sunday_casual: 'Sunday (casual)',
  public_holiday_full_time_part_time: 'Public holiday (FT/PT)', public_holiday_casual: 'Public holiday (casual)',
  saturday: 'Saturday', sunday: 'Sunday', public_holiday: 'Public holiday',
};
function penaltyLabel(key) {
  if (LABELS[key]) return LABELS[key];
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bHrs\b/, 'hrs').replace(/Mon Fri/, 'Mon–Fri').replace(/Pm\b/, 'pm').replace(/Am\b/, 'am')
    .replace(/(\d)(pm|am)/gi, '$1$2');
}
function penaltyValue(key, v) {
  if (key.includes('loading')) return v < 1 ? `+${pct(v)}` : `+$${v.toFixed(2)}/hr`;
  return pct(v);
}

function condenseRates(data) {
  const ft = data.rates.filter((r) => r.category === 'adult' && r.employment_type === 'full_time' && typeof r.rate === 'number');
  const seen = new Map();
  for (const r of ft) {
    const label = r.level || r.classification || r.title;
    if (!seen.has(r.rate)) seen.set(r.rate, label);
  }
  const rows = [...seen.entries()].sort((a, b) => a[0] - b[0]).map(([rate, label]) => ({ rate, label }));
  return { rows: rows.slice(0, 12), shown: Math.min(rows.length, 12), total: ft.length };
}

function minEngagement(data) {
  const me = data.minimum_engagement;
  if (!me || typeof me !== 'object') return [];
  return Object.entries(me).filter(([, v]) => typeof v === 'number').map(([k, v]) =>
    [k.replace(/_hours_per_shift/, '').replace(/_/g, ' ').replace(/\b\w/, (c) => c.toUpperCase()), `${v} hrs min/shift`]);
}

function page(v) {
  const c = AWARDS[v];
  const data = JSON.parse(readFileSync(join(root, c.file), 'utf8'));
  const code = data.ma_number;
  const url = `${SITE}/${v}-award-cheat-sheet`;
  let title = `${c.short} Cheat Sheet 2026 (${code}) | Fitz HR`;
  if (title.length > 60) title = `${c.short} Cheat Sheet 2026 | Fitz HR`;
  const description = `${c.short} cheat sheet: 2026 pay rates, penalties, loadings & allowances on one printable page. Sourced from FWO Pay Guide ${code}.`;
  const { rows, shown, total } = condenseRates(data);
  const pens = Object.entries(data.penalty_rates);
  const allow = (data.allowances || []).filter((a) => typeof a.amount === 'number').slice(0, 6);
  const meRows = minEngagement(data);

  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: `${c.short} Cheat Sheet`, item: url }] },
    { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url, inLanguage: 'en-AU',
      isPartOf: { '@type': 'WebSite', name: 'Fitz HR', url: `${SITE}/` } },
  ];

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
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
${jsonld.map((j) => `    <script type="application/ld+json">\n    ${JSON.stringify(j)}\n    </script>`).join('\n')}
<style>
    :root{--navy:#0f172a;--navy2:#141f35;--amber:#f59e0b;--w60:rgba(255,255,255,0.6);--w30:rgba(255,255,255,0.3);--rule:rgba(245,158,11,0.18);--rw:rgba(255,255,255,0.08);}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{background:var(--navy);color:#fff;font-family:'Outfit',sans-serif;line-height:1.5;}
    .nav{background:rgba(15,23,42,0.95);border-bottom:1px solid var(--rule);padding:1rem 1.5rem;display:flex;align-items:center;justify-content:space-between;}
    .nav-logo{font-weight:800;font-size:1.1rem;letter-spacing:-1px;text-decoration:none;}
    .wm-f,.wm-hr{color:var(--amber);}.wm-itz{color:#fff;}
    .nav-actions{display:flex;gap:0.6rem;align-items:center;}
    .btn-print{background:transparent;border:1px solid var(--rule);color:#fff;font-family:inherit;font-weight:700;font-size:0.8rem;padding:0.55rem 1.1rem;border-radius:8px;cursor:pointer;}
    .btn-print:hover{border-color:var(--amber);color:var(--amber);}
    .btn-app{background:var(--amber);color:var(--navy);font-weight:800;font-size:0.8rem;padding:0.6rem 1.1rem;border-radius:8px;text-decoration:none;}
    .sheet{max-width:860px;margin:2rem auto;background:var(--navy2);border:1px solid var(--rw);border-radius:14px;padding:2rem;}
    .sheet-head{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;border-bottom:2px solid var(--amber);padding-bottom:0.9rem;margin-bottom:1rem;flex-wrap:wrap;}
    .sheet-title{font-size:1.35rem;font-weight:800;letter-spacing:-0.01em;}
    .sheet-sub{font-family:'DM Mono',monospace;font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--amber);margin-top:0.25rem;}
    .sheet-brand{font-weight:800;font-size:1rem;letter-spacing:-0.5px;}
    .badges{display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1.2rem;}
    .badge{border:1px solid var(--rw);border-radius:8px;padding:0.45rem 0.7rem;font-size:0.72rem;color:var(--w60);}
    .badge b{color:#fff;display:block;font-size:0.85rem;}
    .cols{display:grid;grid-template-columns:1fr 1fr;gap:1.4rem;}
    @media(max-width:700px){.cols{grid-template-columns:1fr;}}
    h2{font-family:'DM Mono',monospace;font-size:0.62rem;letter-spacing:0.16em;text-transform:uppercase;color:var(--amber);margin:0 0 0.5rem;}
    table{width:100%;border-collapse:collapse;font-size:0.8rem;margin-bottom:1.2rem;}
    td{padding:0.34rem 0.4rem;border-bottom:1px solid var(--rw);color:var(--w60);vertical-align:top;}
    td:last-child{text-align:right;color:#fff;font-weight:700;white-space:nowrap;}
    tr:last-child td{border-bottom:none;}
    .note{font-size:0.68rem;color:var(--w30);margin:-0.8rem 0 1.2rem;}
    .sheet-foot{border-top:1px solid var(--rw);margin-top:0.4rem;padding-top:0.8rem;font-size:0.68rem;color:var(--w30);display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;}
    .sheet-foot a{color:var(--amber);text-decoration:none;}
    .below{max-width:860px;margin:0 auto 3rem;padding:0 0.5rem;}
    .below a{color:var(--amber);text-decoration:none;}
    .below p{color:var(--w60);font-size:0.9rem;}
    @media print{
        body{background:#fff;color:#111;}
        .nav,.no-print{display:none !important;}
        .sheet{max-width:none;margin:0;border:none;border-radius:0;background:#fff;padding:0;}
        .sheet-head{border-bottom:2px solid #b45309;}
        .sheet-title,.badge b,td:last-child{color:#111;}
        .sheet-sub,h2,.sheet-foot a{color:#b45309;}
        .badge{border-color:#ddd;color:#444;}
        td{border-bottom:1px solid #e5e5e5;color:#333;}
        .note,.sheet-foot{color:#777;}
        .cols{grid-template-columns:1fr 1fr;}
    }
</style>
</head>
<body>
<nav class="nav">
    <a href="/" class="nav-logo"><span class="wm-f">F</span><span class="wm-itz">ITZ</span><span class="wm-hr" style="margin-left:0.18em;">HR</span></a>
    <div class="nav-actions">
        <button class="btn-print" onclick="window.print()">Print / save PDF</button>
        <a class="btn-app" href="/app">Ask Fitz Free</a>
    </div>
</nav>

<div class="sheet">
    <div class="sheet-head">
        <div>
            <div class="sheet-title">${esc(c.short)} Cheat Sheet 2026&ndash;27</div>
            <div class="sheet-sub">${esc(code)} &middot; For ${esc(c.industry)} &middot; Minimum rates</div>
        </div>
        <div class="sheet-brand"><span style="color:#f59e0b">F</span>ITZ<span style="color:#f59e0b">HR</span> <span style="font-weight:400;font-size:0.7rem;color:var(--w30)">fitzhr.com</span></div>
    </div>
    <div class="badges">
        <div class="badge">Rates effective<b>${esc(data.effective_date)}</b></div>
        <div class="badge">Next review<b>${esc(data.next_review_date)}</b></div>
        <div class="badge">Casual loading<b>${pct(data.casual_loading)}</b></div>
        <div class="badge">Super<b>${pct(data.superannuation_rate)}</b></div>
    </div>
    <div class="cols">
        <div>
            <h2>Base hourly rates (adult, full-time)</h2>
            <table>
${rows.map((r) => `                <tr><td>${esc(r.label)}</td><td>$${r.rate.toFixed(2)}</td></tr>`).join('\n')}
            </table>
            <p class="note">${shown} rate levels shown from ${total} adult full-time classifications. Casuals: add ${pct(data.casual_loading)} loading to the base rate.</p>
${meRows.length ? `            <h2>Minimum engagement</h2>
            <table>
${meRows.map(([k, val]) => `                <tr><td>${esc(k)}</td><td>${esc(val)}</td></tr>`).join('\n')}
            </table>` : ''}
        </div>
        <div>
            <h2>Penalties, loadings &amp; overtime</h2>
            <table>
${pens.map(([k, val]) => `                <tr><td>${esc(penaltyLabel(k))}</td><td>${penaltyValue(k, val)}</td></tr>`).join('\n')}
            </table>
            <p class="note">Casual penalty percentages already include the ${pct(data.casual_loading)} casual loading — never stack them.</p>
${allow.length ? `            <h2>Common allowances</h2>
            <table>
${allow.map((a) => `                <tr><td>${esc(a.name)}</td><td>$${a.amount.toFixed(2)} ${esc(a.unit || '')}</td></tr>`).join('\n')}
            </table>` : ''}
        </div>
    </div>
    <div class="sheet-foot">
        <span>Sourced from the Fair Work Ombudsman Pay Guide ${esc(code)}. Minimum entitlements only — check the award for conditions.</span>
        <span>Full tables &amp; instant answers: <a href="${SITE}/${v}">fitzhr.com/${v}</a></span>
    </div>
</div>

<div class="below no-print">
    <p>This is the condensed reference — the full classification tables live at <a href="/${v}-award-pay-rates">${esc(c.short)} pay rates</a> and the complete rules at the <a href="/${v}-award-guide">${esc(c.short)} guide</a>. For the exact rate for any classification, employment type or shift, <a href="/app">ask Fitz</a> — free, no card required.</p>
</div>

</body>
</html>
`;
}

const only = process.argv.slice(2);
for (const v of Object.keys(AWARDS)) {
  if (only.length && !only.includes(v)) continue;
  const out = `${v}-award-cheat-sheet.html`;
  writeFileSync(join(root, out), page(v));
  console.log('wrote', out);
}
