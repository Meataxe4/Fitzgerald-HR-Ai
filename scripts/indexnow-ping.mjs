#!/usr/bin/env node
// Submits every sitemap URL to IndexNow (Bing/Yandex — Bing powers ChatGPT
// retrieval) after each production deploy, so content changes are re-crawled
// in hours instead of weeks. Runs at the end of `npm run build` on Netlify.
//
// - Only pings on Netlify production builds (CONTEXT=production); local and
//   preview builds skip.
// - Never fails the build: any error logs a warning and exits 0.
// - Key file f7d09d65a11ce175d6ec7f7d8162673b.txt is served from the site root.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const KEY = 'f7d09d65a11ce175d6ec7f7d8162673b';
const HOST = 'fitzhr.com';

if (process.env.CONTEXT !== 'production') {
  console.log(`indexnow: skipping (CONTEXT=${process.env.CONTEXT ?? 'local'})`);
  process.exit(0);
}

try {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
  const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList,
    }),
  });
  console.log(`indexnow: submitted ${urlList.length} URLs — HTTP ${res.status}`);
} catch (err) {
  console.warn(`indexnow: ping failed (build continues): ${err.message}`);
}
process.exit(0);
