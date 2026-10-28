#!/usr/bin/env node
// Submits CHANGED page URLs to IndexNow (Bing/Yandex — Bing powers ChatGPT and
// Copilot retrieval) after each production deploy, so content changes are
// re-crawled in hours instead of weeks. Runs at the end of `npm run build`.
//
// - Only pings on Netlify production builds (CONTEXT=production).
// - Submits only URLs whose HTML changed since the previous production build
//   (git diff CACHED_COMMIT_REF..COMMIT_REF), plus any sitemap entry whose
//   <lastmod> is within the last three days. IndexNow asks that unchanged
//   URLs are not resubmitted; blasting the full sitemap on every deploy can
//   get the key deprioritised.
// - Never fails the build: any error logs a warning and exits 0.
// - Key file f7d09d65a11ce175d6ec7f7d8162673b.txt is served from the site root.

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const KEY = 'f7d09d65a11ce175d6ec7f7d8162673b';
const HOST = 'fitzhr.com';
const RECENT_DAYS = 3;

if (process.env.CONTEXT !== 'production') {
  console.log(`indexnow: skipping (CONTEXT=${process.env.CONTEXT ?? 'local'})`);
  process.exit(0);
}

try {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
  const entries = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>\s*(?:<lastmod>([^<]+)<\/lastmod>)?/g)]
    .map((m) => ({ url: m[1].replace(/\/$/, ''), lastmod: m[2] ? new Date(m[2]) : null }));
  const known = new Map(entries.map((e) => [e.url, e]));

  // 1. pages whose HTML changed in this deploy
  const changed = new Set();
  const from = process.env.CACHED_COMMIT_REF;
  const to = process.env.COMMIT_REF || 'HEAD';
  if (from && from !== to) {
    try {
      const out = execSync(`git diff --name-only ${from} ${to}`, { cwd: root, encoding: 'utf8' });
      for (const f of out.split('\n').filter((l) => l.endsWith('.html'))) {
        const path = f === 'index.html' ? '' : f.replace(/\/index\.html$/, '').replace(/\.html$/, '');
        const url = `https://${HOST}/${path}`.replace(/\/$/, '');
        if (known.has(url)) changed.add(url);
      }
      console.log(`indexnow: ${changed.size} changed page(s) between ${from.slice(0, 7)} and ${to.slice(0, 7)}`);
    } catch (err) {
      console.warn(`indexnow: git diff unavailable (${err.message.split('\n')[0]}); falling back to recent lastmod only`);
    }
  }

  // 2. anything the sitemap says was modified in the last few days
  const cutoff = Date.now() - RECENT_DAYS * 86400000;
  for (const e of entries) if (e.lastmod && e.lastmod.getTime() >= cutoff) changed.add(e.url);

  const urlList = [...changed];
  if (urlList.length === 0) {
    console.log('indexnow: nothing changed; no submission');
    process.exit(0);
  }
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
  });
  console.log(`indexnow: submitted ${urlList.length} URL(s) — HTTP ${res.status}`);
} catch (err) {
  console.warn(`indexnow: ping failed (build continues): ${err.message}`);
}
process.exit(0);
