// Registers the generated award blog posts into routing, sitemap and the blog
// index, driven by scripts/blog-posts-manifest.json. Idempotent: it will not add
// a redirect/sitemap entry that already exists, and it replaces the blog index's
// award-blog sections wholesale between stable markers.
//
//   node scripts/build-award-blog-posts.mjs && node scripts/register-blog-posts.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'blog-posts-manifest.json'), 'utf8'));

const AWARD_ORDER = ['retail', 'manufacturing', 'schads', 'health', 'childrens'];
const AWARD_TITLE = {
  retail: 'General Retail Award (MA000004)',
  manufacturing: 'Manufacturing Award (MA000010)',
  schads: 'SCHADS Award (MA000100)',
  health: 'Health Professionals Award (MA000027)',
  childrens: "Children's Services Award (MA000120)",
};
const AWARD_ANCHOR = { retail: 'retail-award', manufacturing: 'manufacturing-award', schads: 'schads-award', health: 'health-award', childrens: 'childrens-award' };
const AWARD_HUB = {
  retail: '/retail-award-guide', manufacturing: '/manufacturing-award-guide', schads: '/schads-award-guide',
  health: '/health-award-guide', childrens: '/childrens-award-guide',
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const byAward = (k) => manifest.filter(m => m.awardKey === k);

// ---------------------------------------------------------------------------
// 1. netlify.toml redirects
// ---------------------------------------------------------------------------
{
  const p = path.join(ROOT, 'netlify.toml');
  let toml = fs.readFileSync(p, 'utf8');
  const anchor = '# Blog pages - MUST come before the catch-all\n# ============================================\n';
  const blocks = manifest
    .filter(m => !toml.includes(`from = "/blog/${m.slug}"`))
    .map(m => `\n[[redirects]]\n  from = "/blog/${m.slug}"\n  to = "/blog/${m.slug}.html"\n  status = 200\n`).join('');
  if (blocks) {
    toml = toml.replace(anchor, anchor + blocks);
    fs.writeFileSync(p, toml);
  }
  console.log(`netlify.toml: +${blocks ? manifest.length : 0} redirects (existing left untouched)`);
}

// ---------------------------------------------------------------------------
// 2. sitemap.xml entries
// ---------------------------------------------------------------------------
{
  const p = path.join(ROOT, 'sitemap.xml');
  let xml = fs.readFileSync(p, 'utf8');
  const anchor = '    <!-- Award rates: updated annually — set to weekly for FY2026 -->\n';
  const entries = manifest
    .filter(m => !xml.includes(`<loc>https://fitzhr.com/blog/${m.slug}</loc>`))
    .map(m => `    <url>\n        <loc>https://fitzhr.com/blog/${m.slug}</loc>\n        <lastmod>${m.datePublished}</lastmod>\n        <changefreq>monthly</changefreq>\n        <priority>0.7</priority>\n    </url>\n`).join('');
  if (entries) {
    xml = xml.replace(anchor, anchor + entries);
    fs.writeFileSync(p, xml);
  }
  console.log(`sitemap.xml: +${entries ? manifest.length : 0} URLs`);
}

// ---------------------------------------------------------------------------
// 3. blog/index.html — replace the "More Awards" landing-card block with proper
//    per-award blog sections, and repoint the jump-nav to in-page anchors.
// ---------------------------------------------------------------------------
{
  const p = path.join(ROOT, 'blog', 'index.html');
  let html = fs.readFileSync(p, 'utf8');

  const sections = AWARD_ORDER.map(key => {
    const posts = byAward(key);
    const cards = posts.map(m => `        <a href="/blog/${m.slug}" class="post-card">
            <div class="post-card-tag">${esc(m.tag)}</div>
            <h2>${esc(m.cardTitle)}</h2>
            <p>${esc(m.blurb)}</p>
            <div class="post-card-meta">${esc(m.dateLabel || 'Jul 2026')}${m.readMin ? ' &middot; ' + m.readMin + ' min' : ''}</div>
        </a>`).join('\n');
    return `    <div class="section-label" id="${AWARD_ANCHOR[key]}">${esc(AWARD_TITLE[key])}</div>
    <p style="font-size:0.82rem;color:rgba(255,255,255,0.5);margin:-0.5rem 0 1rem;line-height:1.6;max-width:640px;">Now live. See also the <a href="${AWARD_HUB[key]}" style="color:var(--amber);text-decoration:none;">full ${esc(AWARD_TITLE[key].split(' (')[0])} guide &rarr;</a></p>
    <div class="post-grid">
${cards}
    </div>`;
  }).join('\n\n');

  // Stable marker survives re-runs; fall back to the original one-time marker.
  const STABLE = '    <!-- AWARD BLOG SECTIONS (generated — build-award-blog-posts + register-blog-posts) -->';
  const ONCE = '    <!-- MORE AWARDS — new verticals (now live) -->';
  const start = html.indexOf(STABLE) !== -1 ? html.indexOf(STABLE) : html.indexOf(ONCE);
  const footIdx = html.indexOf('<footer>', start);
  if (start === -1 || footIdx === -1) throw new Error('blog index markers not found');
  const before = html.slice(0, start);
  const after = html.slice(footIdx);
  const block = `    <!-- AWARD BLOG SECTIONS (generated — build-award-blog-posts + register-blog-posts) -->\n${sections}\n\n`;
  html = before + block + after;

  // Repoint jump-nav: /retail etc. -> in-page blog anchors.
  for (const key of AWARD_ORDER) {
    html = html.replace(`<a href="/${AWARD_META_SLUG(key)}">`, `<a href="#${AWARD_ANCHOR[key]}">`);
  }
  fs.writeFileSync(p, html);
  console.log(`blog/index.html: replaced More Awards block with ${AWARD_ORDER.length} award blog sections (${manifest.length} posts)`);
}

function AWARD_META_SLUG(key) {
  return { retail: 'retail', manufacturing: 'manufacturing', schads: 'schads', health: 'health', childrens: 'childrens' }[key];
}
