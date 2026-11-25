#!/usr/bin/env node
// Cross-check every <vertical>-award-rates.json against the Fair Work
// Commission Modern Awards Pay Database (MAPD) API.
//
//   FWC_API_KEY=... node scripts/verify-rates-fwc.mjs [--strict] [--json out.json]
//   npm run verify:fwc            (cloud sessions: adds --use-env-proxy)
//
// The rates JSON files stay the single source of truth. This script never
// edits them. It is a second opinion that reports:
//
//   1. Base rates    every full-time/part-time hourly (and weekly) rate in the
//                    file must appear among the award's current FWC rates.
//   2. Penalties     Saturday / Sunday / public holiday multipliers must appear
//                    among the award's current FWC penalty percentages.
//   3. Allowances    every allowance amount must appear among the award's
//                    current FWC wage and expense allowance amounts.
//   4. Freshness     FWC figures scheduled to take effect later, and (for
//                    information) those in effect since the file's effective_date.
//
// Matching is by VALUE within the award, not by classification name: the FWC
// names do not line up with ours. A match therefore means "the FWC currently
// publishes this figure for this award", which catches stale or mistyped
// figures but not a correct figure filed against the wrong classification.
//
// The MAPD does not hold everything (the FWC says "most" penalties and "some"
// allowances). Figures confirmed against the Pay Guide but absent from the
// API are listed in scripts/fwc-known-gaps.json and reported as "not checked".
// The same file lists the dates of scheduled FWC changes already planned for.
//
// Exit codes: 0 clean, or issues found without --strict. 1 with --strict when
// there is an unexplained mismatch or an unacknowledged scheduled change. 2 on a
// usage or API error (fails closed: no data is never treated as a pass).
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api.fwc.gov.au/api/v1';
const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const TODAY = process.env.FWC_TODAY || new Date().toISOString().slice(0, 10);
const CACHE = process.env.FWC_CACHE_DIR || null; // dev only: reuse raw API pulls
const KEY = process.env.FWC_API_KEY;

if (!KEY && !CACHE) {
  console.error('FWC_API_KEY is not set. Get a key at https://developer.fwc.gov.au and export it.');
  process.exit(2);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const cents = (n) => Math.round(Number(n) * 100);

// ---- API access -------------------------------------------------------------

async function get(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': KEY, Accept: 'application/json' } });
    } catch (err) {
      if (attempt === 4) throw new Error(`${url}: ${err.cause?.code || err.message}`);
      await sleep(2000 * (attempt + 1));
      continue;
    }
    if (res.ok) return res.json();
    // 403 and 429 are how the gateway signals a burst limit; back off and retry.
    if ([403, 429, 500, 502, 503, 504].includes(res.status) && attempt < 4) {
      await sleep(3000 * (attempt + 1));
      continue;
    }
    throw new Error(`${url}: HTTP ${res.status}`);
  }
  throw new Error(`${url}: gave up after retries`);
}

// The API pages unsorted results unstably: without an explicit sort, rows are
// repeated on one page and silently dropped from another. Always pass a sort,
// and with `exact` verify that every row arrived exactly once (fail closed).
async function getAll(path, { sort, query = '', exact = false }) {
  const out = [];
  let expected = 0;
  for (let page = 1; ; page++) {
    const body = await get(`${API}/awards/${path}?limit=100&page=${page}&sort=${encodeURIComponent(sort)}${query}`);
    out.push(...(body.results || []));
    expected = body._meta?.result_count ?? expected;
    if (!body._meta?.has_more_results) break;
    await sleep(120);
  }
  if (exact) {
    const unique = new Set(out.map((row) => JSON.stringify(row))).size;
    if (out.length !== expected || unique !== expected) {
      throw new Error(`${path}: expected ${expected} rows, received ${out.length} (${unique} unique). Paging is unreliable; refusing to compare.`);
    }
  }
  return out;
}

// Start of the financial year two years back: wide enough to include penalty
// rows that were not reissued at the last wage review, without pulling the
// award's whole history (15,000 rows for some awards).
function penaltyWindowStart() {
  const [y, m] = TODAY.split('-').map(Number);
  return `${(m >= 7 ? y : y - 1) - 1}-07-01`;
}

async function fetchAward(code) {
  const cacheFile = CACHE && join(CACHE, `${code}.json`);
  if (cacheFile && existsSync(cacheFile)) return JSON.parse(readFileSync(cacheFile, 'utf8'));
  const award = await get(`${API}/awards/${code}`);
  const data = {
    award: award.results?.[0] || award,
    pay: await getAll(`${code}/pay-rates`, { sort: 'classification_fixed_id asc, operative_from asc, calculated_rate asc, base_rate asc', exact: true }),
    // Penalties have no unique sortable key, so a few rows may still repeat.
    // That is acceptable: only the distinct (description, rate) pairs are used,
    // and each pair occurs on many rows.
    penalties: await getAll(`${code}/penalties`, { sort: 'clause_fixed_id asc, classification_level asc, penalty_description asc, employee_rate_type_code asc, operative_from asc', query: `&operative_from=${penaltyWindowStart()}` }),
    wageAllowances: await getAll(`${code}/wage-allowances`, { sort: 'wage_allowance_fixed_id asc, operative_from asc', exact: true }),
    expenseAllowances: await getAll(`${code}/expense-allowances`, { sort: 'expense_allowance_fixed_id asc, operative_from asc', exact: true }),
  };
  if (cacheFile) {
    mkdirSync(CACHE, { recursive: true });
    writeFileSync(cacheFile, JSON.stringify(data));
  }
  return data;
}

// ---- Helpers ----------------------------------------------------------------

const isCurrent = (r) => r.operative_from <= TODAY && (!r.operative_to || r.operative_to >= TODAY);
const isUpcoming = (r) => r.operative_from > TODAY;
const label = (r) => [r.parent_classification_name, r.classification].filter(Boolean).join(' / ');

// Every hourly and weekly figure a pay-rate row supports. The MAPD gives some
// classifications only a weekly or annual figure, so derive the hourly rate
// the way the Pay Guides do (38-hour week, 52 weeks).
function rowValues(row) {
  const hourly = new Set();
  const weekly = new Set();
  for (const [type, value] of [[row.base_rate_type, row.base_rate], [row.calculated_rate_type, row.calculated_rate]]) {
    if (value == null || !type) continue;
    if (type.startsWith('Hourly')) hourly.add(cents(value));
    if (type.startsWith('Weekly')) { weekly.add(cents(value)); hourly.add(cents(value / 38)); }
    if (type.startsWith('Annual')) { weekly.add(cents(value / 52)); hourly.add(cents(value / 52 / 38)); }
  }
  return { hourly, weekly };
}

function loadGaps() {
  const file = join(ROOT, 'scripts', 'fwc-known-gaps.json');
  if (!existsSync(file)) return {};
  return JSON.parse(readFileSync(file, 'utf8')).awards || {};
}

// ---- Checks -----------------------------------------------------------------

function checkAward(file, rates, fwc, gaps) {
  const result = { file, award: rates.ma_number, name: fwc.award?.name, effective_date: rates.effective_date,
    fwc_last_modified: fwc.award?.last_modified_datetime, base: {}, penalties: {}, allowances: {}, newer: [], upcoming: [] };
  // A gap entry matches on a name substring (`match`) and/or a `category`.
  const knownGap = (kind, text, category) => (gaps[kind] || []).find((g) =>
    (g.match == null || text.includes(g.match)) && (g.category == null || g.category === category) && (g.match != null || g.category != null));

  // 1. Base rates
  const currentPay = fwc.pay.filter((r) => isCurrent(r) && (r.base_rate != null || r.calculated_rate != null));
  const hourly = new Set();
  const weekly = new Set();
  for (const row of currentPay) {
    const v = rowValues(row);
    v.hourly.forEach((x) => hourly.add(x));
    v.weekly.forEach((x) => weekly.add(x));
  }
  const ours = (Array.isArray(rates.rates) ? rates.rates : []).filter((r) => r.employment_type !== 'casual');
  const base = { checked: 0, matched: 0, mismatches: [], knownGaps: [], fwcRows: currentPay.length };
  for (const r of ours) {
    const name = r.title || r.classification || r.level || '(unnamed)';
    const problems = [];
    if (r.rate != null && !hourly.has(cents(r.rate))) problems.push(`hourly $${r.rate}`);
    if (r.weekly_rate != null && !weekly.has(cents(r.weekly_rate))) problems.push(`weekly $${r.weekly_rate}`);
    base.checked++;
    if (!problems.length) { base.matched++; continue; }
    const entry = { name: `${name} [${r.category}]`, detail: problems.join(', ') };
    const gap = knownGap('base', name, r.category);
    if (gap) base.knownGaps.push({ ...entry, reason: gap.reason }); else base.mismatches.push(entry);
  }
  result.base = base;

  // 2. Penalties: day-type multipliers only (overtime and shift loadings are
  // described too inconsistently in the MAPD to match reliably).
  const currentPen = fwc.penalties.filter(isCurrent);
  const pen = { checked: 0, matched: 0, mismatches: [], covered: currentPen.length > 0 };
  if (pen.covered) {
    // Descriptions vary by award ("Saturday", "Saturday or Sunday", "Between
    // midnight Friday and midnight Sunday"), so match the day anywhere and
    // leave out overtime rows, which reuse the day names.
    const days = { saturday: /saturday|midnight friday/i, sunday: /sunday/i, public_holiday: /public holiday/i };
    const ordinary = currentPen.filter((p) => !/overtime/i.test(p.clause_description || '') && !/overtime|monday to|first \d|after \d/i.test(p.penalty_description || ''));
    for (const [key, value] of Object.entries(rates.penalty_rates || {})) {
      if (typeof value !== 'number' || /overtime|loading/.test(key)) continue;
      const day = Object.keys(days).find((d) => key.startsWith(d));
      if (!day) continue;
      let fwcRates = new Set(ordinary.filter((p) => days[day].test(p.penalty_description || '')).map((p) => cents(p.rate)));
      // Some awards describe penalties only as a percentage ("150%"), with no
      // day name. Fall back to the award's full set of penalty percentages.
      if (!fwcRates.size) fwcRates = new Set(ordinary.map((p) => cents(p.rate)));
      pen.checked++;
      if (fwcRates.has(cents(value * 100))) pen.matched++;
      else pen.mismatches.push({ name: key, detail: `${value * 100}% not among FWC ${day.replace('_', ' ')} rates (${[...fwcRates].map((c) => c / 100 + '%').sort().join(', ') || 'none'})` });
    }
  }
  result.penalties = pen;

  // 3. Allowances
  const fwcAllowances = [...fwc.wageAllowances, ...fwc.expenseAllowances].filter(isCurrent);
  const amounts = new Set();
  for (const a of fwcAllowances) {
    if (a.allowance_amount == null) continue;
    amounts.add(cents(a.allowance_amount));
    // Our files quote some weekly allowances per hour (weekly / 38).
    if (/per week/i.test(a.payment_frequency || '')) amounts.add(cents(a.allowance_amount / 38));
  }
  const allow = { checked: 0, matched: 0, mismatches: [], knownGaps: [], fwcRows: fwcAllowances.length };
  for (const a of Array.isArray(rates.allowances) ? rates.allowances : []) {
    if (typeof a.amount !== 'number') continue;
    allow.checked++;
    if (amounts.has(cents(a.amount))) { allow.matched++; continue; }
    const entry = { name: a.name, detail: `$${a.amount} ${a.unit || ''}`.trim() };
    const gap = knownGap('allowances', a.name);
    if (gap) allow.knownGaps.push({ ...entry, reason: gap.reason }); else allow.mismatches.push(entry);
  }
  result.allowances = allow;

  // 4. Freshness
  const describe = (r) => ({ from: r.operative_from, name: label(r) || r.allowance || r.penalty_description || '(unnamed)',
    value: r.calculated_rate ?? r.base_rate ?? r.allowance_amount ?? r.rate });
  const dated = [...fwc.pay.filter((r) => r.base_rate != null || r.calculated_rate != null), ...fwc.wageAllowances, ...fwc.expenseAllowances];
  result.newer = dated.filter((r) => isCurrent(r) && r.operative_from > rates.effective_date).map(describe);
  // A scheduled change stops failing --strict once its date is listed under
  // acknowledged_upcoming, i.e. once someone has planned the rates update.
  const acknowledged = new Set(gaps.acknowledged_upcoming || []);
  result.upcoming = dated.filter(isUpcoming).map((r) => ({ ...describe(r), acknowledged: acknowledged.has(r.operative_from) }));
  return result;
}

// ---- Report -----------------------------------------------------------------

function groupByDate(rows) {
  const by = new Map();
  for (const r of rows) by.set(r.from, [...(by.get(r.from) || []), r]);
  return [...by.entries()].sort();
}

function render(results) {
  const out = [];
  out.push(`# FWC Modern Awards Pay Database check (${TODAY})`, '');
  out.push('| Award | File effective | Base rates | Penalties | Allowances | Newer at FWC | Upcoming |');
  out.push('|---|---|---|---|---|---|---|');
  for (const r of results) {
    const cell = (c) => `${c.matched}/${c.checked}${c.knownGaps?.length ? ` (+${c.knownGaps.length} known gap)` : ''}`;
    out.push(`| ${r.award} | ${r.effective_date} | ${cell(r.base)} | ${r.penalties.covered ? cell(r.penalties) : 'not in MAPD'} | ${cell(r.allowances)} | ${r.newer.length} | ${r.upcoming.length} |`);
  }
  for (const r of results) {
    const sections = [];
    const list = (title, rows, fmt) => { if (rows.length) sections.push(`**${title}**`, ...rows.map(fmt), ''); };
    list('Base rates not found at the FWC', r.base.mismatches, (m) => `- ${m.name}: ${m.detail}`);
    list('Penalties not found at the FWC', r.penalties.mismatches, (m) => `- ${m.name}: ${m.detail}`);
    list('Allowances not found at the FWC', r.allowances.mismatches, (m) => `- ${m.name}: ${m.detail}`);
    for (const [date, rows] of groupByDate(r.newer)) {
      list(`FWC figures in effect since ${date}, after this file's effective date (${rows.length})`, rows.slice(0, 30), (x) => `- ${x.name}: ${x.value}`);
    }
    for (const [date, rows] of groupByDate(r.upcoming)) {
      list(`FWC figures scheduled for ${date} (${rows.length}${rows[0].acknowledged ? ', acknowledged' : ', NOT yet acknowledged'})`, rows.slice(0, 30), (x) => `- ${x.name}: ${x.value}`);
    }
    // Grouped by reason: one award can have dozens of unchecked junior rates.
    const byReason = new Map();
    for (const g of [...r.base.knownGaps, ...r.allowances.knownGaps]) byReason.set(g.reason, [...(byReason.get(g.reason) || []), g]);
    list('Not checked against the FWC (check these against the Pay Guide)', [...byReason.entries()],
      ([reason, rows]) => `- ${rows.length === 1 ? `${rows[0].name}: ${rows[0].detail}` : `${rows.length} figures`} (${reason})`);
    if (sections.length) out.push('', `## ${r.award} ${r.name || ''} (${r.file})`, '', ...sections);
  }
  return out.join('\n');
}

// ---- Main -------------------------------------------------------------------

const files = readdirSync(ROOT).filter((f) => f.endsWith('-award-rates.json')).sort();
if (!files.length) { console.error('No *-award-rates.json files found.'); process.exit(2); }
const gaps = loadGaps();
const results = [];
try {
  for (const file of files) {
    const rates = JSON.parse(readFileSync(join(ROOT, file), 'utf8'));
    if (!/^MA\d{6}$/.test(rates.ma_number || '')) throw new Error(`${file}: missing or invalid ma_number`);
    const fwc = await fetchAward(rates.ma_number);
    if (!fwc.pay.length) throw new Error(`${rates.ma_number}: the FWC returned no pay rates. Failing closed.`);
    results.push(checkAward(file, rates, fwc, gaps[rates.ma_number] || {}));
  }
} catch (err) {
  console.error(`FWC check could not complete: ${err.message}`);
  process.exit(2);
}

const report = render(results);
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + '\n');
if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ date: TODAY, results }, null, 2));

const mismatches = results.reduce((n, r) => n + r.base.mismatches.length + r.penalties.mismatches.length + r.allowances.mismatches.length, 0);
const unacknowledged = results.reduce((n, r) => n + r.upcoming.filter((u) => !u.acknowledged).length, 0);
const upcoming = results.reduce((n, r) => n + r.upcoming.length, 0);
console.log(`\n${mismatches} unexplained mismatch(es); ${upcoming} upcoming FWC figure(s), ${unacknowledged} not acknowledged.`);
if (STRICT && (mismatches || unacknowledged)) process.exit(1);
