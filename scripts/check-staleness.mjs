#!/usr/bin/env node
// Award rate-data staleness check (Milestone 8).
//
// Every *-award-rates.json carries an `effective_date` and a `next_review_date`
// (the Fair Work annual review is 1 July each year). This script warns when an
// award's rate data is at/after its review date — i.e. the shipped rates may be
// out of date and need the annual (or an ad-hoc) update.
//
//   node scripts/check-staleness.mjs                # report + warn (exit 0)
//   node scripts/check-staleness.mjs --strict       # exit 1 if any award is overdue
//   node scripts/check-staleness.mjs --warn-days 45 # "due soon" window (default 30)
//   STALENESS_TODAY=2027-07-02 node scripts/check-staleness.mjs   # pin "today" (tests/CI)
//
// In GitHub Actions it also emits ::warning:: / ::error:: annotations.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const argv = process.argv.slice(2);
const strict = argv.includes('--strict');
const warnDaysIdx = argv.indexOf('--warn-days');
const WARN_DAYS = warnDaysIdx !== -1 ? Number(argv[warnDaysIdx + 1]) : 30;
const inCI = !!process.env.GITHUB_ACTIONS;

const today = process.env.STALENESS_TODAY ? new Date(process.env.STALENESS_TODAY) : new Date();
if (isNaN(today)) { console.error(`Invalid STALENESS_TODAY: ${process.env.STALENESS_TODAY}`); process.exit(2); }
// Normalise to midnight UTC so day math is stable.
const day0 = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
const DAY = 86400000;
const daysBetween = (isoDate) => {
  const d = new Date(isoDate);
  if (isNaN(d)) return null;
  return Math.round((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - day0) / DAY);
};

const files = fs.readdirSync(ROOT).filter(f => /-award-rates\.json$/.test(f)).sort();
if (files.length === 0) { console.error('No *-award-rates.json files found'); process.exit(2); }

const rows = [];
let overdue = 0, dueSoon = 0, bad = 0;
for (const f of files) {
  let data;
  try { data = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')); }
  catch (e) { rows.push({ f, err: 'unreadable: ' + e.message }); bad++; continue; }
  const code = data.ma_number || '?';
  const review = data.next_review_date;
  const days = review ? daysBetween(review) : null;
  if (days === null) { rows.push({ f, code, err: 'missing/invalid next_review_date' }); bad++; continue; }
  let status;
  if (days < 0) { status = 'OVERDUE'; overdue++; }
  else if (days <= WARN_DAYS) { status = 'DUE SOON'; dueSoon++; }
  else status = 'OK';
  rows.push({ f, code, effective: data.effective_date, review, days, status });
}

// ---- Report ---------------------------------------------------------------
const pad = (s, n) => String(s).padEnd(n);
console.log('='.repeat(78));
console.log(`  AWARD RATE-DATA STALENESS  —  as at ${new Date(day0).toISOString().slice(0, 10)}  (due-soon window: ${WARN_DAYS}d)`);
console.log('='.repeat(78));
for (const r of rows) {
  if (r.err) { console.log(`  ${pad(r.code, 10)} ${pad(r.f, 34)} ⚠ ${r.err}`); continue; }
  const when = r.days < 0 ? `${-r.days}d overdue` : `in ${r.days}d`;
  const mark = r.status === 'OVERDUE' ? '✗' : r.status === 'DUE SOON' ? '!' : '✓';
  console.log(`  ${pad(r.code, 10)} ${pad(r.status, 9)} ${mark}  review ${r.review} (${when})  eff ${r.effective}`);
}
console.log('-'.repeat(78));
console.log(`  ${files.length} awards · ${overdue} overdue · ${dueSoon} due soon · ${bad} unreadable`);

// ---- CI annotations -------------------------------------------------------
if (inCI) {
  for (const r of rows) {
    if (r.err) console.log(`::error file=${r.f}::${r.code} ${r.err}`);
    else if (r.status === 'OVERDUE') console.log(`::error file=${r.f}::${r.code} rate data is ${-r.days} days past its review date (${r.review}). Apply the wage-review update — see docs/maintenance-pipeline.md.`);
    else if (r.status === 'DUE SOON') console.log(`::warning file=${r.f}::${r.code} rate data is due for review in ${r.days} days (${r.review}).`);
  }
}

// ---- Exit -----------------------------------------------------------------
if (bad > 0 && strict) { console.error('\n  ✗ Some rate files are unreadable or missing a review date.'); process.exit(1); }
if (overdue > 0) {
  console.log(`\n  ${strict ? '✗' : '⚠'}  ${overdue} award(s) past review date — apply the wage-review update (docs/maintenance-pipeline.md).`);
  process.exit(strict ? 1 : 0);
}
console.log('\n  ✓ All award rate data is current.');
process.exit(0);
