#!/usr/bin/env node
// Award rate-data validator (Milestone 8).
//
// Guards the "data-only" wage-review update: run this after editing any
// *-award-rates.json to confirm the file is still structurally valid before the
// regression suite re-checks the numbers. Fails (exit 1) on any structural error.
//
//   node scripts/validate-rates.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// filename -> expected MA code (the file/award mapping is fixed).
const EXPECTED = {
  'hospitality-award-rates.json': 'MA000009',
  'restaurant-award-rates.json': 'MA000119',
  'manufacturing-award-rates.json': 'MA000010',
  'schads-award-rates.json': 'MA000100',
  'retail-award-rates.json': 'MA000004',
  'health-award-rates.json': 'MA000027',
  'childrens-award-rates.json': 'MA000120',
};

const isISODate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s));
const errors = [];

for (const [file, code] of Object.entries(EXPECTED)) {
  const p = path.join(ROOT, file);
  const err = (m) => errors.push(`${file}: ${m}`);
  if (!fs.existsSync(p)) { err('missing file'); continue; }
  let d;
  try { d = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { err('invalid JSON — ' + e.message); continue; }

  if (d.ma_number !== code) err(`ma_number "${d.ma_number}" != expected ${code}`);
  if (!d.award_name) err('missing award_name');
  if (!d.source) err('missing source (provenance)');

  if (!isISODate(d.effective_date)) err(`effective_date not YYYY-MM-DD: ${d.effective_date}`);
  if (!isISODate(d.next_review_date)) err(`next_review_date not YYYY-MM-DD: ${d.next_review_date}`);
  if (isISODate(d.effective_date) && isISODate(d.next_review_date) && new Date(d.effective_date) >= new Date(d.next_review_date))
    err(`effective_date (${d.effective_date}) must be before next_review_date (${d.next_review_date})`);

  if (typeof d.casual_loading !== 'number' || d.casual_loading <= 0 || d.casual_loading > 1) err(`casual_loading out of range: ${d.casual_loading}`);
  if (typeof d.superannuation_rate !== 'number' || d.superannuation_rate <= 0 || d.superannuation_rate > 1) err(`superannuation_rate out of range: ${d.superannuation_rate}`);

  if (!d.penalty_rates || typeof d.penalty_rates !== 'object') err('missing penalty_rates object');
  else for (const [k, v] of Object.entries(d.penalty_rates)) if (typeof v !== 'number') err(`penalty_rates.${k} is not a number (${v})`);

  if (!Array.isArray(d.rates) || d.rates.length === 0) err('rates must be a non-empty array');
  else d.rates.forEach((r, i) => {
    if (typeof r.rate !== 'number' || r.rate <= 0) err(`rates[${i}] rate not a positive number (${r.rate})`);
    if (!r.classification && !r.title) err(`rates[${i}] missing classification/title`);
    if (!r.employment_type) err(`rates[${i}] missing employment_type`);
  });

  if (!Array.isArray(d.allowances)) err('allowances must be an array');
  else d.allowances.forEach((a, i) => {
    if (!a.name) err(`allowances[${i}] missing name`);
    if (typeof a.amount !== 'number' && typeof a.text !== 'string') err(`allowances[${i}] needs a numeric amount or text description`);
  });
}

console.log(`Validated ${Object.keys(EXPECTED).length} award rate files.`);
if (errors.length) {
  console.error(`\n✗ ${errors.length} problem(s):`);
  for (const e of errors) console.error('   - ' + e);
  process.exit(1);
}
console.log('✓ All award rate files are structurally valid.');
process.exit(0);
