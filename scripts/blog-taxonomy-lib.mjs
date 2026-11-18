// Shared blog taxonomy helpers (Nov 2026 restructure).
// Source of truth: scripts/blog-taxonomy.json. Used by build-blog-hubs.mjs
// (blog front page, topic hubs, post breadcrumbs) and build-vertical-pages.mjs
// (the "All <Award> Articles" block on each award guide).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TAX = JSON.parse(fs.readFileSync(path.join(__dirname, 'blog-taxonomy.json'), 'utf8'));
export const TOPIC_ORDER = Object.keys(TAX.topics);
export const AWARD_ORDER = Object.keys(TAX.awards);

const ENT = { '&amp;': '&', '&mdash;': '—', '&ndash;': '–', '&rsquo;': '’', '&lsquo;': '‘', '&ldquo;': '“', '&rdquo;': '”', '&middot;': '·', '&nbsp;': ' ', '&hellip;': '…', '&#39;': "'", '&quot;': '"' };
// Plain text from the HTML titles/blurbs stored in the taxonomy (for JSON-LD).
export const plain = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/g, (m) => ENT[m] ?? m).replace(/\s+/g, ' ').trim();
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const postsFor = (pred) => Object.entries(TAX.posts).filter(([slug, p]) => pred(p, slug)).map(([slug, p]) => ({ slug, ...p }));
export const awardLabel = (a) => `${TAX.awards[a].name} (${TAX.awards[a].code})`;

// "All <Award> Articles" block for an award guide: that award's posts grouped
// by topic, each topic linking to its hub. Wrapped in markers so the hand-built
// hospitality and restaurant guides can be re-injected idempotently.
export function awardArticlesBlock(award) {
  const a = TAX.awards[award];
  const groups = TOPIC_ORDER.map((t) => [t, postsFor((p) => p.topic === t && p.awards.includes(award))]).filter(([, list]) => list.length);
  const total = groups.reduce((n, [, l]) => n + l.length, 0);
  const body = groups.map(([t, list]) => `    <h3><a href="/blog/topics/${t}">${esc(TAX.topics[t].name)}</a></h3>
    <ul>
${list.map((p) => `        <li><a href="/blog/${p.slug}">${p.title}</a></li>`).join('\n')}
    </ul>`).join('\n');
  return `<!-- blog-articles:start (generated from scripts/blog-taxonomy.json; do not edit by hand) -->
    <h2 id="articles">All ${esc(a.name)} <em>Articles</em></h2>
    <p>Every Fitz HR article written for the ${esc(a.name)} (${a.code}), ${total} in total, grouped by topic. For questions that apply under any award, such as warnings, dismissal and probation, see the <a href="/blog/">full blog</a>.</p>
${body}
<!-- blog-articles:end -->`;
}
