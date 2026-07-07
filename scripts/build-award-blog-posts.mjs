// Award blog-post generator (SEO + AEO).
//
// Produces award-specific blog posts for the new verticals, byte-for-byte in the
// same shell/structure as the existing hospitality/restaurant posts
// (blog/hospitality-award-rates-2026.html): full meta + OG/Twitter, three JSON-LD
// blocks (BreadcrumbList + Article + FAQPage), a direct-answer opening paragraph,
// quick-reference box, data tables pulled from the SME-verified *-award-rates.json,
// a "Common Mistakes" list, an FAQ accordion, an internal-link "Related Questions"
// cluster, a hidden FAQ block for AI answer engines, sticky CTA and footer.
//
// Content lives in scripts/blog-posts-content.mjs. Run:
//   node scripts/build-award-blog-posts.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { POSTS, AWARD_META } from './blog-posts-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BLOG = path.join(ROOT, 'blog');
const SITE = 'https://fitzhr.com';

const load = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const money = (n) => '$' + Number(n).toFixed(2);
const pct = (m) => Math.round(m * 100) + '%';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// For JSON-LD strings: strip tags, keep plain text, escape for JSON via JSON.stringify later.
const plain = (s) => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

// --- penalty schema normaliser (Manufacturing uses flat keys) ---------------
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

// --- data-driven table fragments (available to content via helpers) ---------
function payTable(data, limit = 12) {
  const ft = (data.rates || []).filter(r => r.employment_type === 'full_time' && typeof r.rate === 'number');
  const rows = ft.slice(0, limit).map(r =>
    `            <tr><td>${esc(r.classification || r.title)}${r.stream ? ` <span style="color:var(--w30)">(${esc(String(r.stream).replace(/_/g, ' '))})</span>` : ''}</td><td><span class="rate-highlight">${money(r.rate)}</span></td>${r.weekly_rate ? `<td>${money(r.weekly_rate)}</td>` : '<td>—</td>'}</tr>`).join('\n');
  const more = ft.length > limit ? `\n    <p style="font-size:0.82rem;color:var(--w30)">Showing ${limit} of ${ft.length} full-time classifications. Ask Fitz for any classification, stream or employment type.</p>` : '';
  return `    <table class="rate-table">\n        <thead><tr><th>Classification (full-time)</th><th>Hourly</th><th>Weekly (38h)</th></tr></thead>\n        <tbody>\n${rows}\n        </tbody>\n    </table>${more}`;
}
function penaltyTable(data) {
  const p = pen(data);
  const rows = [
    ['Saturday', p.sat_ftpt, p.sat_cas], ['Sunday', p.sun_ftpt, p.sun_cas], ['Public holiday', p.ph_ftpt, p.ph_cas],
  ].filter(r => typeof r[1] === 'number')
    .map(r => `            <tr><td>${r[0]}</td><td><span class="rate-highlight">${pct(r[1])}</span></td><td>${typeof r[2] === 'number' ? pct(r[2]) : '—'}</td></tr>`).join('\n');
  return `    <table class="rate-table">\n        <thead><tr><th>When worked</th><th>Full-time / part-time</th><th>Casual (all-inclusive)</th></tr></thead>\n        <tbody>\n${rows}\n        </tbody>\n    </table>`;
}
function allowanceTable(data, limit = 10) {
  const rows = (data.allowances || []).filter(a => typeof a.amount === 'number' && a.name).slice(0, limit)
    .map(a => `            <tr><td>${esc(a.name)}</td><td><span class="rate-highlight">${money(a.amount)}</span></td><td>${esc(a.unit || '')}</td></tr>`).join('\n');
  return `    <table class="rate-table">\n        <thead><tr><th>Allowance</th><th>Amount</th><th>Unit</th></tr></thead>\n        <tbody>\n${rows}\n        </tbody>\n    </table>`;
}
const helpers = { money, pct, pen, payTable, penaltyTable, allowanceTable, esc };

// ---------------------------------------------------------------------------
// Shared shell (verbatim structure from the hospitality posts)
// ---------------------------------------------------------------------------
const HEAD_STYLE = `    <style>
        :root { --navy:#0f172a; --navy2:#141f35; --amber:#f59e0b; --w60:rgba(255,255,255,0.6); --w30:rgba(255,255,255,0.3); --rule:rgba(245,158,11,0.18); --rw:rgba(255,255,255,0.08); }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{font-size:16px;scroll-behavior:smooth;}
        body{background:var(--navy);color:#fff;font-family:'Outfit',sans-serif;line-height:1.7;}
        .nav{background:rgba(15,23,42,0.95);backdrop-filter:blur(16px);border-bottom:1px solid var(--rule);padding:1rem 1.5rem;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;}
        .nav-logo{font-weight:800;font-size:1.1rem;letter-spacing:-1px;text-decoration:none;display:flex;align-items:center;gap:0.4rem;}
        .wm-f,.wm-hr{color:var(--amber);} .wm-itz{color:#fff;}
        .nav-back{font-family:'DM Mono',monospace;font-size:0.58rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--w60);text-decoration:none;transition:color 0.2s;}
        .nav-back:hover{color:var(--amber);}
        .post-hero{padding:3.5rem 1.5rem 2.5rem;max-width:780px;margin:0 auto;}
        .post-tag{font-family:'DM Mono',monospace;font-size:0.56rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--amber);margin-bottom:1rem;display:flex;align-items:center;gap:0.6rem;}
        .post-tag::before{content:'';width:24px;height:2px;background:var(--amber);display:inline-block;}
        .post-h1{font-family:'Playfair Display',serif;font-weight:900;font-size:clamp(2rem,5vw,2.8rem);line-height:1.1;letter-spacing:-0.02em;margin-bottom:1.25rem;}
        .post-h1 em{font-style:italic;color:var(--amber);}
        .post-meta{display:flex;align-items:center;gap:1rem;font-family:'DM Mono',monospace;font-size:0.56rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--w30);margin-bottom:2rem;flex-wrap:wrap;}
        .meta-dot{width:3px;height:3px;border-radius:50%;background:var(--w30);}
        .post-intro{font-size:1.1rem;line-height:1.7;color:var(--w60);border-left:3px solid var(--amber);padding-left:1.25rem;margin-bottom:2.5rem;}
        .post-body{max-width:780px;margin:0 auto;padding:0 1.5rem 5rem;}
        .post-body h2{font-family:'Playfair Display',serif;font-weight:700;font-size:1.6rem;line-height:1.2;color:#fff;margin:2.5rem 0 1rem;}
        .post-body h2 em{font-style:italic;color:var(--amber);}
        .post-body h3{font-size:1.05rem;font-weight:700;color:var(--amber);margin:1.75rem 0 0.6rem;}
        .post-body p{font-size:0.98rem;line-height:1.75;color:var(--w60);margin-bottom:1.1rem;}
        .post-body strong{color:#fff;}
        .post-body a{color:var(--amber);text-decoration:none;}
        .post-body a:hover{text-decoration:underline;}
        .post-body ul{margin:0 0 1.1rem 1.25rem;} .post-body li{font-size:0.95rem;color:var(--w60);line-height:1.65;margin-bottom:0.4rem;}
        .verdict{background:var(--navy2);border:1px solid var(--rw);border-left:4px solid var(--amber);border-radius:0 12px 12px 0;padding:1.5rem;margin:2rem 0;}
        .verdict-label{font-family:'DM Mono',monospace;font-size:0.54rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--amber);margin-bottom:0.6rem;}
        .verdict p{margin:0;font-size:0.95rem;color:#fff;}
        .verdict p br{display:block;margin-top:0.3rem;}
        .warning-box{background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-left:4px solid #ef4444;border-radius:0 12px 12px 0;padding:1.5rem;margin:2rem 0;}
        .warning-box p{margin:0;font-size:0.95rem;color:rgba(255,255,255,0.8);}
        .rate-table{width:100%;border-collapse:collapse;margin:1.5rem 0;font-size:0.88rem;}
        .rate-table th{background:var(--navy2);color:var(--amber);padding:0.75rem 1rem;text-align:left;font-family:'DM Mono',monospace;font-size:0.56rem;letter-spacing:0.12em;text-transform:uppercase;border-bottom:1px solid var(--rule);}
        .rate-table td{padding:0.85rem 1rem;border-bottom:1px solid var(--rw);color:var(--w60);vertical-align:middle;}
        .rate-table tr:last-child td{border-bottom:none;}
        .rate-table td:first-child{color:#fff;font-weight:600;}
        .rate-table tr:hover td{background:rgba(245,158,11,0.04);}
        .rate-highlight{color:var(--amber);font-weight:700;}
        .rate-green{color:#22c55e;font-weight:600;}
        .dont-list{display:flex;flex-direction:column;gap:1px;margin:1.5rem 0;}
        .dont-item{background:rgba(239,68,68,0.05);border-left:3px solid #ef4444;padding:0.9rem 1.25rem;display:flex;align-items:flex-start;gap:0.75rem;}
        .dont-item-x{color:#ef4444;font-size:1rem;flex-shrink:0;margin-top:0.1rem;}
        .dont-item-text{font-size:0.9rem;color:rgba(255,255,255,0.8);line-height:1.55;}
        .dont-item-text strong{color:#fff;}
        .faq-list{display:flex;flex-direction:column;gap:0.5rem;margin:1.5rem 0;}
        .faq-item{background:var(--navy2);border:1px solid var(--rw);border-radius:10px;overflow:hidden;}
        .faq-item summary{padding:1rem 1.25rem;cursor:pointer;font-weight:600;font-size:0.95rem;color:#fff;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:1rem;}
        .faq-item summary::-webkit-details-marker{display:none;}
        .faq-item summary::after{content:'+';color:var(--amber);font-size:1.2rem;flex-shrink:0;transition:transform 0.3s;}
        .faq-item[open] summary::after{transform:rotate(45deg);}
        .faq-item[open]{border-color:var(--rule);}
        .faq-answer{padding:0 1.25rem 1rem;font-size:0.88rem;color:var(--w60);line-height:1.65;}
        .faq-answer a{color:var(--amber);text-decoration:none;}
        .sticky-cta{position:fixed;bottom:0;left:0;right:0;background:var(--amber);color:var(--navy);padding:0.75rem 1.5rem;display:flex;align-items:center;justify-content:space-between;z-index:500;font-family:'Outfit',sans-serif;font-weight:700;font-size:0.85rem;text-decoration:none;transition:opacity 0.3s;box-shadow:0 -4px 24px rgba(0,0,0,0.3);}
        .sticky-cta:hover{background:#fbbf24;}
        .sticky-cta span{font-family:'DM Mono',monospace;font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;opacity:0.65;}
        .post-cta{background:var(--amber);padding:2.5rem 1.5rem;border-radius:12px;text-align:center;margin:2.5rem 0;}
        .post-cta h3{font-family:'Playfair Display',serif;font-weight:900;font-size:1.5rem;color:var(--navy);margin-bottom:0.5rem;}
        .post-cta p{font-size:0.9rem;color:rgba(15,23,42,0.7);margin-bottom:1.25rem;}
        .post-cta a{display:inline-block;background:var(--navy);color:var(--amber);font-weight:800;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;padding:0.85rem 2rem;text-decoration:none;transition:background 0.3s;}
        .post-cta a:hover{background:#1e293b;}
        footer{background:var(--navy2);border-top:1px solid var(--rule);padding:2rem 1.5rem;text-align:center;}
        footer p{font-family:'DM Mono',monospace;font-size:0.54rem;letter-spacing:0.1em;color:var(--w30);}
        footer a{color:var(--amber);text-decoration:none;}
        @media(max-width:600px){.rate-table{font-size:0.78rem;} .rate-table th,.rate-table td{padding:0.6rem 0.6rem;} .sticky-cta{font-size:0.78rem;padding:0.65rem 1rem;}}
    </style>`;

const FONTS = `    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">`;

const GTAG = `    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-NT7FEHKWHV"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-NT7FEHKWHV');
    </script>`;

function jsonld(obj) { return `    <script type="application/ld+json">\n    ${JSON.stringify(obj)}\n    </script>`; }

function buildPost(post, award) {
  const url = `${SITE}/blog/${post.slug}`;
  const data = load(award.file);
  const h = { ...helpers, data };
  const intro = typeof post.intro === 'function' ? post.intro(h) : post.intro;
  const summary = typeof post.summary === 'function' ? post.summary(h) : post.summary;
  const sections = (typeof post.sections === 'function' ? post.sections(h) : post.sections) || [];
  const faqs = (typeof post.faqs === 'function' ? post.faqs(h) : post.faqs) || [];
  const quickRef = (typeof post.quickRef === 'function' ? post.quickRef(h) : post.quickRef) || [];
  const mistakes = post.mistakes || [];
  const related = post.related || [];
  const hiddenFaqs = post.hiddenFaqs || faqs.slice(0, 6);

  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog/` },
    { '@type': 'ListItem', position: 3, name: plain(post.h1), item: url },
  ]};
  const article = { '@context': 'https://schema.org', '@type': 'Article', headline: plain(post.h1), image: `${SITE}/assets/og-image.png`,
    author: { '@type': 'Organization', name: 'Fitz HR', url: `${SITE}` },
    publisher: { '@type': 'Organization', name: 'Fitz HR', url: `${SITE}`, logo: { '@type': 'ImageObject', url: `${SITE}/assets/favicon.svg` } },
    datePublished: post.datePublished, dateModified: post.dateModified,
    description: post.metaDesc, mainEntityOfPage: url, inLanguage: 'en-AU' };
  const faqPage = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: plain(f.q), acceptedAnswer: { '@type': 'Answer', text: plain(f.a) } })) };

  const metaTitle = post.title;
  const quickRefHtml = quickRef.length ? `    <div class="verdict">
        <div class="verdict-label">${esc(post.quickRefLabel || 'Quick Reference')}</div>
        <p>
${quickRef.map(l => '            ' + l).join('<br>\n')}
        </p>
    </div>\n` : '';
  const sectionsHtml = sections.map(s => `    <h2>${s.h2}</h2>\n${s.html}`).join('\n\n');
  const mistakesHtml = mistakes.length ? `    <h2>Common Mistakes That <em>Trigger Audits</em></h2>
    <div class="dont-list">
${mistakes.map(m => `        <div class="dont-item"><div class="dont-item-x">✗</div><div class="dont-item-text">${m}</div></div>`).join('\n')}
    </div>\n` : '';
  const faqHtml = `    <h2>Frequently Asked Questions</h2>
    <div class="faq-list">
${faqs.map((f, i) => `        <details class="faq-item"${i < 2 ? ' open' : ''}>
            <summary>${esc(f.q)}</summary>
            <div class="faq-answer">${f.a}</div>
        </details>`).join('\n')}
    </div>`;
  const relatedHtml = related.map(r => `        <li style="background:var(--navy2);border:1px solid var(--rw);border-radius:8px;padding:0.85rem 1.25rem;"><a href="${r.href}" style="color:#fff;text-decoration:none;font-size:0.95rem;font-weight:600;">${esc(r.label)} →</a></li>`).join('\n');
  const hiddenHtml = hiddenFaqs.map(f => `<p>${esc(plain(f.q))} ${esc(plain(f.a))}</p>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
${GTAG}
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(metaTitle)}</title>
    <meta name="description" content="${esc(post.metaDesc)}">
    <meta name="keywords" content="${esc(post.keywords)}">
    <meta name="author" content="Fitz HR">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${url}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${esc(metaTitle)}">
    <meta property="og:description" content="${esc(post.ogDesc || post.metaDesc)}">
    <meta property="og:image" content="${SITE}/assets/og-image.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${esc(plain(post.h1))} — Fitz HR">
    <meta property="og:locale" content="en_AU">
    <meta property="og:site_name" content="Fitz HR">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@FitzHR">
    <meta name="twitter:url" content="${url}">
    <meta name="twitter:title" content="${esc(metaTitle)}">
    <meta name="twitter:description" content="${esc(post.ogDesc || post.metaDesc)}">
    <meta name="twitter:image" content="${SITE}/assets/og-image.png">
    <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
    <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
    <meta name="theme-color" content="#f59e0b">
${FONTS}
${jsonld(breadcrumb)}
${jsonld(article)}
${jsonld(faqPage)}
${HEAD_STYLE}
</head>
<body>
<nav class="nav">
    <a href="/" class="nav-logo"><span style="display:inline-flex;gap:0;letter-spacing:-1px;"><span class="wm-f">F</span><span class="wm-itz">ITZ</span></span><span class="wm-hr" style="margin-left:0.18em;">HR</span></a>
    <a href="/blog/" class="nav-back">← Back to Blog</a>
</nav>

<header class="post-hero">
    <div class="post-tag">${esc(post.tag)}</div>
    <h1 class="post-h1">${post.h1}</h1>
    <div class="post-meta">
        <span>${post.datePublishedLabel}</span><span class="meta-dot"></span>
        <span>Updated ${post.dateModifiedLabel}</span><span class="meta-dot"></span>
        <span>By Fitz HR</span><span class="meta-dot"></span>
        <span>${post.readMin} min read</span><span class="meta-dot"></span>
        <span>Reviewed against FWO Pay Guide ${award.code}</span>
    </div>
    <p class="post-intro">${intro}</p>
</header>

<div class="post-body">

    <p><strong>${summary}</strong></p>

    <p style="font-size:0.82rem;color:rgba(255,255,255,0.4);margin-top:-0.5rem;margin-bottom:1.5rem;">Rates current as at ${data.effective_date} (Annual Wage Review), sourced from the Fair Work Ombudsman Pay Guide ${award.code}. Next review ${data.next_review_date}.</p>

${quickRefHtml}
${sectionsHtml}

${mistakesHtml}
${faqHtml}

    <div class="post-cta">
        <h3>${esc(post.ctaH3 || 'Get it right — instantly')}</h3>
        <p>${esc(post.ctaP || `Stop guessing. Fitz HR answers any ${award.short} question — pay rates, penalties, allowances, compliance — grounded in the current Pay Guide ${award.code}.`)}</p>
        <a href="/app">Ask Fitz Free — No Card Required →</a>
    </div>

</div>

<div class="post-body" style="padding-bottom:2rem;">
    <h2>Related <em>Questions</em></h2>
    <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.6rem;">
${relatedHtml}
    </ul>
</div>

<a href="/app" class="sticky-cta"><span>${esc(award.short)} question?</span> Ask Fitz — get an instant accurate answer →</a>

<!-- Hidden FAQ for AI and search engine indexing -->
<div style="display:none;">
<h2>${esc(plain(post.h1))} — FAQ</h2>
${hiddenHtml}
</div>

<footer>
    <p>© 2026 Fitz HR · <a href="/">Home</a> · <a href="/blog/">Blog</a> · <a href="/app">Try Free</a></p>
</footer>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Emit + manifest
// ---------------------------------------------------------------------------
const manifest = [];
let count = 0;
for (const [awardKey, posts] of Object.entries(POSTS)) {
  const award = AWARD_META[awardKey];
  for (const post of posts) {
    const html = buildPost(post, award);
    fs.writeFileSync(path.join(BLOG, `${post.slug}.html`), html);
    manifest.push({ slug: post.slug, award: award.code, awardKey, title: post.title, cardTitle: post.cardTitle || plain(post.h1), blurb: post.blurb, tag: post.cardTag || post.tag, datePublished: post.datePublished, readMin: post.readMin, dateLabel: post.datePublishedLabel });
    count++;
  }
}
fs.writeFileSync(path.join(__dirname, 'blog-posts-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Generated ${count} award blog posts across ${Object.keys(POSTS).length} awards.`);
for (const m of manifest) console.log(`  ${m.awardKey.padEnd(13)} ${m.slug}`);
console.log(`\nManifest: scripts/blog-posts-manifest.json`);
