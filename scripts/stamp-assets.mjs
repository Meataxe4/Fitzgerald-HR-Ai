#!/usr/bin/env node
/**
 * stamp-assets.mjs
 *
 * Cache-busting for local CSS/JS at deploy time.
 *
 * Netlify serves /*.css and /*.js as `public, max-age=604800, immutable`
 * (see netlify.toml), which is the fastest option for repeat mobile visits
 * but means a browser will NOT re-fetch an asset unless its URL changes.
 * This script rewrites the `?v=` query string on every *local* .css/.js
 * reference in our HTML to the current deploy's version, so each deploy
 * produces unique URLs and browsers always load the latest assets — while
 * unchanged assets stay cached.
 *
 * Version source (first that is set):
 *   COMMIT_REF  -> set by Netlify to the git SHA of the deploy
 *   DEPLOY_ID   -> set by Netlify
 *   <timestamp> -> fallback for local builds
 *
 * Idempotent: any existing query string on the asset is replaced, so running
 * it multiple times is safe.
 *
 * Runs in-place on the publish directory (the repo root). On Netlify each
 * build is a fresh clone, so these edits are never committed.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.git', 'netlify/functions', 'src']);

const VERSION = (
  process.env.COMMIT_REF ||
  process.env.DEPLOY_ID ||
  String(Date.now())
)
  .replace(/[^a-zA-Z0-9_-]/g, '')
  .slice(0, 12);

// Match href="/foo.css" or src="/js/bar.js?v=old", but NOT protocol-relative
// (//cdn) or absolute (https://) URLs. Only root-relative local assets.
const ASSET_RE = /\b(href|src)=(["'])(\/(?!\/)[^"'?#]+\.(?:css|js))(?:\?[^"'#]*)?(#[^"']*)?\2/g;

function listHtmlFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = full.slice(ROOT.length + 1);
    if (SKIP_DIRS.has(entry) || SKIP_DIRS.has(rel)) continue;
    const st = statSync(full);
    if (st.isDirectory()) listHtmlFiles(full, acc);
    else if (extname(full) === '.html') acc.push(full);
  }
  return acc;
}

let filesChanged = 0;
let refsStamped = 0;

for (const file of listHtmlFiles(ROOT)) {
  const original = readFileSync(file, 'utf8');
  let count = 0;
  const updated = original.replace(
    ASSET_RE,
    (_m, attr, quote, path, hash = '') => {
      count++;
      return `${attr}=${quote}${path}?v=${VERSION}${hash}${quote}`;
    }
  );
  if (updated !== original) {
    writeFileSync(file, updated);
    filesChanged++;
    refsStamped += count;
    console.log(`  stamped ${count} ref(s) in ${file.slice(ROOT.length + 1)}`);
  }
}

console.log(
  `stamp-assets: version=${VERSION} — ${refsStamped} reference(s) across ${filesChanged} file(s)`
);
