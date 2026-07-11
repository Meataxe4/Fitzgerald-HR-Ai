#!/usr/bin/env node
// Generates /feed.xml (RSS 2.0) from blog/*.html.
// Pulls title, meta description, canonical URL and JSON-LD datePublished/dateModified
// from each post. Runs as part of `npm run build` so the feed stays current.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const blogDir = join(root, 'blog');

// sitemap lastmod as the date fallback for posts missing JSON-LD dates
const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
const lastmods = new Map(
  [...sitemap.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)]
    .map((m) => [m[1].replace(/\/$/, ''), m[2]])
);

// decode common HTML entities from meta descriptions, then re-escape for XML
const decode = (s) => s
  .replaceAll('&ldquo;', '“').replaceAll('&rdquo;', '”')
  .replaceAll('&lsquo;', '‘').replaceAll('&rsquo;', '’')
  .replaceAll('&hellip;', '…').replaceAll('&ndash;', '–')
  .replaceAll('&mdash;', '—').replaceAll('&nbsp;', ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&amp;', '&');

const esc = (s) =>
  decode(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
   .replaceAll('"', '&quot;').replaceAll("'", '&apos;');

const posts = [];
for (const file of readdirSync(blogDir)) {
  if (!file.endsWith('.html') || file === 'index.html') continue;
  const html = readFileSync(join(blogDir, file), 'utf8');

  const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1];
  const desc = (html.match(/<meta name="description" content="([^"]+)"/) || [])[1];
  const canonical = (html.match(/rel="canonical" href="([^"]+)"/) || [])[1];
  const published = (html.match(/"datePublished"\s*:\s*"([^"]+)"/) || [])[1];
  const modified = (html.match(/"dateModified"\s*:\s*"([^"]+)"/) || [])[1];

  if (!title || !canonical) {
    console.warn(`feed: skipping ${file} (missing title or canonical)`);
    continue;
  }
  const fallback = lastmods.get(canonical.replace(/\/$/, ''));
  const pub = published || modified || fallback;
  if (!pub) {
    console.warn(`feed: no date found for ${file}; using lastBuildDate`);
  }
  posts.push({
    title: title.replace(/\s*\|\s*Fitz HR\s*$/i, '').trim(),
    desc: desc || '',
    url: canonical,
    published: new Date(pub || Date.now()),
  });
}

posts.sort((a, b) => b.published - a.published);

const now = new Date().toUTCString();
const items = posts.map((p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(p.url)}</link>
      <guid isPermaLink="true">${esc(p.url)}</guid>
      <pubDate>${p.published.toUTCString()}</pubDate>
      <description>${esc(p.desc)}</description>
    </item>`).join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Fitz HR — HR &amp; Award Blog</title>
    <link>https://fitzhr.com/blog/</link>
    <atom:link href="https://fitzhr.com/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Award rates, Fair Work compliance and practical HR guidance for Australian employers — grounded in your modern award, not a generic template.</description>
    <language>en-AU</language>
    <lastBuildDate>${now}</lastBuildDate>
    <ttl>1440</ttl>
${items}
  </channel>
</rss>
`;

writeFileSync(join(root, 'feed.xml'), rss);
console.log(`feed.xml written with ${posts.length} posts (newest: ${posts[0]?.title})`);
