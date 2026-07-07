// Regression question generator (Milestone 6).
//
// Derives the new-vertical regression suite from the SHIPPED, SME-verified
// grounding data (the *-award-rates.json Pay Guide extracts). Each generated
// question freezes the correct answer as an `assert.equals` value at generation
// time; the CI runner (scripts/run-regression.mjs) later re-loads the live data
// and re-checks every assertion, so any drift in the rates data or resolution
// logic breaks the gate.
//
// Regenerating the suite is a documented, data-only step — see
// docs/regression-suite.md. Run with:  node scripts/build-regression-questions.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'regression', 'questions');

// vertical -> { code, file, label, flag|null (null == GA/supported) }
const VERTICALS = {
  hospitality:   { code: 'MA000009', file: 'hospitality-award-rates.json',  label: 'Hospitality Industry (General) Award',                       flag: null },
  restaurant:    { code: 'MA000119', file: 'restaurant-award-rates.json',   label: 'Restaurant Industry Award',                                  flag: null },
  manufacturing: { code: 'MA000010', file: 'manufacturing-award-rates.json', label: 'Manufacturing and Associated Industries and Occupations Award', flag: 'manufacturing_preview' },
  schads:        { code: 'MA000100', file: 'schads-award-rates.json',       label: 'Social, Community, Home Care and Disability Services Industry Award', flag: 'schads_preview' },
  retail:        { code: 'MA000004', file: 'retail-award-rates.json',       label: 'General Retail Industry Award',                              flag: 'retail_preview' },
  health:        { code: 'MA000027', file: 'health-award-rates.json',       label: 'Health Professionals and Support Services Award',            flag: 'health_preview' },
  childrens:     { code: 'MA000120', file: 'childrens-award-rates.json',    label: "Children's Services Award",                                  flag: 'childrens_preview' },
};

// Natural-language phrasing for the penalty-rate keys that appear in the data.
const PENALTY_PHRASING = {
  saturday_full_time_part_time: 'Saturday (full-time / part-time)',
  saturday_casual: 'Saturday (casual)',
  sunday_full_time_part_time: 'Sunday (full-time / part-time)',
  sunday_casual: 'Sunday (casual)',
  public_holiday_full_time_part_time: 'a public holiday (full-time / part-time)',
  public_holiday_casual: 'a public holiday (casual)',
  overtime_first_2hrs: 'the first 2 hours of overtime',
  overtime_first_3hrs: 'the first 3 hours of overtime',
  overtime_after_2hrs: 'overtime after the first 2 hours',
  overtime_after_3hrs: 'overtime after the first 3 hours',
  sunday_overtime: 'overtime worked on a Sunday',
  public_holiday_overtime: 'overtime worked on a public holiday',
  evening_after_7pm_loading: 'ordinary hours after 7pm (evening loading)',
  evening_after_10pm_loading: 'ordinary hours after 10pm (evening loading)',
  evening_mon_fri_loading: 'ordinary evening hours Monday–Friday (evening loading)',
  afternoon_shift_loading: 'an afternoon shift (shift loading)',
  night_shift_loading: 'a night shift (shift loading)',
  night_midnight_to_7am_loading: 'a night shift between midnight and 7am (loading)',
  night_midnight_to_6am_loading: 'a night shift between midnight and 6am (loading)',
  early_morning_shift_loading: 'an early-morning shift (shift loading)',
  rotating_night_shift_loading: 'a rotating night shift (shift loading)',
  permanent_night_shift_loading: 'a permanent night shift (shift loading)',
  shift_loading_mon_fri: 'a shift attracting the Monday–Friday shift loading',
};

const MIN_ENG_PHRASING = {
  full_time_hours_per_shift: 'a full-time employee',
  part_time_hours_per_shift: 'a part-time employee',
  casual_hours_per_shift: 'a casual employee',
  social_community_services_hours_per_shift: 'a social & community services employee',
  other_streams_hours_per_shift: 'an employee in the other streams',
  public_holiday_full_time_part_time: 'a full-time / part-time employee on a public holiday',
  public_holiday_casual: 'a casual employee on a public holiday',
};

function pctFromMultiplier(m) {
  // 1.5 -> "150%", 0.25 -> "25% loading"
  return `${Math.round(m * 100)}%`;
}

// Evenly sample up to n items from an array (stable, deterministic).
function sample(arr, n) {
  if (arr.length <= n) return arr.slice();
  const out = [];
  const step = (arr.length - 1) / (n - 1);
  for (let i = 0; i < n; i++) out.push(arr[Math.round(i * step)]);
  // de-dup while preserving order
  return out.filter((v, i) => out.indexOf(v) === i);
}

function buildForVertical(vertical, meta) {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, meta.file), 'utf8'));
  const source = data.source || `FWO Pay Guide ${meta.code}`;
  const verified = { verified_by: 'FWO Pay Guide (SME-verified extract)', verified_date: data.effective_date };
  const questions = [];
  let seq = 0;
  const add = (category, question, expected_answer, assert) => {
    seq += 1;
    questions.push({
      id: `${meta.code}-${category}-${String(seq).padStart(3, '0')}`,
      vertical, award: meta.code, category, question, expected_answer,
      assert, source, ...verified,
    });
  };

  // ---- Award resolution -----------------------------------------------------
  add('resolution',
    `Which modern award and code covers the ${meta.label}?`,
    `${meta.label} (${meta.code})`,
    { kind: 'resolves', input: `${meta.label} ${meta.code}`, flag: meta.flag, code: meta.code });
  // Fail-closed guard: an unrelated award must never resolve to this one.
  add('resolution',
    `If a user says their award is the "Fast Food Industry Award", should the ${meta.label} answer their pay questions?`,
    'No — that is a different award; the assistant must not answer from this award’s data.',
    { kind: 'resolves_unresolved', input: 'Fast Food Industry Award MA000003' });

  // ---- Core scalars ---------------------------------------------------------
  add('casual_loading',
    `What is the casual loading under the ${meta.label}?`,
    `${pctFromMultiplier(data.casual_loading)} (a casual is paid ${pctFromMultiplier(data.casual_loading)} on top of the minimum hourly rate).`,
    { kind: 'scalar', award: meta.code, path: 'casual_loading', equals: data.casual_loading });
  add('superannuation',
    `What superannuation guarantee rate applies under the ${meta.label} for this period?`,
    `${pctFromMultiplier(data.superannuation_rate)}.`,
    { kind: 'scalar', award: meta.code, path: 'superannuation_rate', equals: data.superannuation_rate });

  // ---- Minimum engagement ---------------------------------------------------
  for (const [key, hours] of Object.entries(data.minimum_engagement || {})) {
    if (typeof hours !== 'number') continue;
    const who = MIN_ENG_PHRASING[key] || key.replace(/_/g, ' ');
    add('minimum_engagement',
      `Under the ${meta.label}, what is the minimum shift length (minimum engagement) for ${who}?`,
      `${hours} hours.`,
      { kind: 'scalar', award: meta.code, path: `minimum_engagement.${key}`, equals: hours });
  }

  // ---- Penalty rates --------------------------------------------------------
  for (const [key, mult] of Object.entries(data.penalty_rates || {})) {
    if (typeof mult !== 'number') continue;
    const phrase = PENALTY_PHRASING[key] || key.replace(/_/g, ' ');
    const isLoading = mult < 1;
    add('penalty_rate',
      `Under the ${meta.label}, what penalty/loading applies for ${phrase}?`,
      isLoading
        ? `A loading of ${pctFromMultiplier(mult)} on the ordinary hourly rate.`
        : `${pctFromMultiplier(mult)} of the ordinary hourly rate.`,
      { kind: 'penalty', award: meta.code, key, equals: mult });
  }

  // ---- Pay rates (sample real classifications from the data) -----------------
  // Build a selector from every identifying field on the row so it matches
  // exactly one rate (classification alone is not unique in multi-stream awards).
  const ID_FIELDS = ['employment_type', 'stream', 'section', 'level', 'classification', 'title'];
  const selectorFor = (r) => {
    const where = {};
    for (const k of ID_FIELDS) if (r[k] !== undefined && r[k] !== null) where[k] = r[k];
    return where;
  };
  const isUnique = (where) => (data.rates || []).filter(x =>
    Object.entries(where).every(([k, v]) => x[k] === v)).length === 1;
  const uniqueRates = (r) => typeof r.rate === 'number' && isUnique(selectorFor(r));
  const streamLabel = (r) => r.stream ? ` (${String(r.stream).replace(/_/g, ' ')} stream)` : '';

  const ftRates = (data.rates || []).filter(r => r.employment_type === 'full_time' && uniqueRates(r));
  const casualRates = (data.rates || []).filter(r => r.employment_type === 'casual' && uniqueRates(r));
  for (const r of sample(ftRates, 6)) {
    add('pay_rate',
      `Under the ${meta.label}, what is the minimum full-time hourly rate for "${r.classification}"${streamLabel(r)}?`,
      `$${r.rate.toFixed(2)} per hour.`,
      { kind: 'pay_rate', award: meta.code, where: selectorFor(r), field: 'rate', equals: r.rate });
  }
  for (const r of sample(casualRates, 2)) {
    add('pay_rate',
      `Under the ${meta.label}, what is the minimum casual hourly rate (including casual loading) for "${r.classification}"${streamLabel(r)}?`,
      `$${r.rate.toFixed(2)} per hour.`,
      { kind: 'pay_rate', award: meta.code, where: selectorFor(r), field: 'rate', equals: r.rate });
  }

  // ---- Allowances -----------------------------------------------------------
  const numAllow = (data.allowances || []).filter(a => typeof a.amount === 'number' && a.name);
  for (const a of sample(numAllow, 4)) {
    add('allowance',
      `Under the ${meta.label}, what is the "${a.name}"?`,
      `$${a.amount.toFixed(2)}${a.unit ? ' ' + a.unit : ''}.`,
      { kind: 'allowance', award: meta.code, name_includes: a.name, field: 'amount', equals: a.amount });
  }

  // ---- Currency / review metadata -------------------------------------------
  add('currency',
    `What effective date is the ${meta.label} rate data current as at?`,
    `${data.effective_date}.`,
    { kind: 'scalar', award: meta.code, path: 'effective_date', equals: data.effective_date });
  add('currency',
    `When is the ${meta.label} rate data next due for review?`,
    `${data.next_review_date}.`,
    { kind: 'scalar', award: meta.code, path: 'next_review_date', equals: data.next_review_date });

  return questions;
}

let total = 0;
const summary = [];
for (const [vertical, meta] of Object.entries(VERTICALS)) {
  const qs = buildForVertical(vertical, meta);
  fs.writeFileSync(path.join(OUT_DIR, `${vertical}.json`), JSON.stringify(qs, null, 2) + '\n');
  total += qs.length;
  summary.push(`  ${vertical.padEnd(14)} ${String(qs.length).padStart(3)} questions  (${meta.code}, ${meta.flag ? 'preview' : 'GA'})`);
}
console.log(`Generated regression suite: ${total} questions`);
console.log(summary.join('\n'));
