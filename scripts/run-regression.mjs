#!/usr/bin/env node
// Regression suite runner + accuracy gate (Milestone 6).
//
// Loads the frozen regression questions (regression/questions/*.json), re-checks
// every assertion against the LIVE shipped grounding data (the *-award-rates.json
// Pay Guide extracts + the real resolveAward() from js/app-main.js), reports a
// pass rate overall and per-vertical, and ENFORCES the launch gate:
//
//   An award may only be `status: 'supported'` (GA / feature flag removed) in the
//   AWARD_REGISTRY if its regression pass rate is >= ACCURACY_THRESHOLD.
//
// This makes the gate enforced, not advisory: you cannot merge a change that
// launches a vertical (flips it out of preview) unless its suite clears the bar.
// Preview (flag-gated) verticals below the bar are reported but do not fail the
// build — they are correctly kept OFF. Preview verticals that clear the bar are
// reported as "eligible to launch".
//
// Exit code 0 = gate satisfied, non-zero = gate failed / suite error.
//
//   node scripts/run-regression.mjs
//   ACCURACY_THRESHOLD=0.98 node scripts/run-regression.mjs
//   node scripts/run-regression.mjs --json report.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
// Q_DIR is overridable (REGRESSION_Q_DIR) so the gate's fail-closed behaviour
// can be exercised by tests/regression-gate.test.js against fixture questions.
const Q_DIR = process.env.REGRESSION_Q_DIR
  ? path.resolve(process.env.REGRESSION_Q_DIR)
  : path.join(ROOT, 'regression', 'questions');

const THRESHOLD = Number(process.env.ACCURACY_THRESHOLD ?? '0.95');
if (!(THRESHOLD > 0 && THRESHOLD <= 1)) {
  console.error(`ACCURACY_THRESHOLD must be in (0, 1]; got ${process.env.ACCURACY_THRESHOLD}`);
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Grounding data: MA code -> rates JSON (the same data the app/chat is grounded on)
// ---------------------------------------------------------------------------
const RATES_FILES = {
  MA000009: 'hospitality-award-rates.json',
  MA000119: 'restaurant-award-rates.json',
  MA000010: 'manufacturing-award-rates.json',
  MA000100: 'schads-award-rates.json',
  MA000004: 'retail-award-rates.json',
  MA000027: 'health-award-rates.json',
  MA000120: 'childrens-award-rates.json',
};
const DATA = {};
for (const [code, file] of Object.entries(RATES_FILES)) {
  DATA[code] = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
}

// ---------------------------------------------------------------------------
// Real resolveAward() + AWARD_REGISTRY, extracted from the shipped source so the
// gate reads launch status (supported vs preview) from the single source of truth.
// (Same extraction the guardrail test uses — see tests/award-resolution.test.js.)
// ---------------------------------------------------------------------------
const appSrc = fs.readFileSync(path.join(ROOT, 'js', 'app-main.js'), 'utf8');
const rStart = appSrc.indexOf('const AWARD_REGISTRY = {');
const rEnd = appSrc.indexOf('// Returns the resolved award context');
if (rStart === -1 || rEnd === -1) throw new Error('AWARD_REGISTRY markers not found in js/app-main.js');
const registryBlock = appSrc.slice(rStart, rEnd);
const CONFIG = { API: { HOSPITALITY_RATES_URL: '/hospitality-award-rates.json', RESTAURANT_RATES_URL: '/restaurant-award-rates.json' } };
let _flags = new Set();
const hasFeature = (f) => _flags.has(f);
const factory = new Function('CONFIG', 'hasFeature', registryBlock + '\nreturn { resolveAward, AWARD_REGISTRY };');
const { resolveAward, AWARD_REGISTRY } = factory(CONFIG, hasFeature);
function resolveWithFlags(input, flags) {
  _flags = new Set(flags || []);
  const r = resolveAward(input);
  _flags = new Set();
  return r;
}

// ---------------------------------------------------------------------------
// Assertion evaluator
// ---------------------------------------------------------------------------
function getPath(obj, dotted) {
  return dotted.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}
function num(x) { return typeof x === 'number' ? x : NaN; }

function evaluate(a) {
  switch (a.kind) {
    case 'resolves': {
      const got = resolveWithFlags(a.input, a.flag ? [a.flag] : []).code;
      return got === a.code ? { ok: true } : { ok: false, reason: `resolved to ${got}, expected ${a.code}` };
    }
    case 'resolves_unresolved': {
      const got = resolveWithFlags(a.input, []).code;
      return got === null ? { ok: true } : { ok: false, reason: `expected UNRESOLVED but got ${got}` };
    }
    case 'scalar': {
      const got = getPath(DATA[a.award], a.path);
      return got === a.equals ? { ok: true } : { ok: false, reason: `${a.path} = ${JSON.stringify(got)}, expected ${JSON.stringify(a.equals)}` };
    }
    case 'penalty': {
      const got = (DATA[a.award].penalty_rates || {})[a.key];
      return got === a.equals ? { ok: true } : { ok: false, reason: `penalty ${a.key} = ${JSON.stringify(got)}, expected ${a.equals}` };
    }
    case 'pay_rate': {
      const matches = (DATA[a.award].rates || []).filter(r =>
        Object.entries(a.where).every(([k, v]) => r[k] === v));
      if (matches.length === 0) return { ok: false, reason: `no rate matched ${JSON.stringify(a.where)}` };
      if (matches.length > 1) return { ok: false, reason: `ambiguous: ${matches.length} rates matched ${JSON.stringify(a.where)}` };
      const got = matches[0][a.field];
      return got === a.equals ? { ok: true } : { ok: false, reason: `${a.field} = ${JSON.stringify(got)}, expected ${a.equals}` };
    }
    case 'allowance': {
      const matches = (DATA[a.award].allowances || []).filter(x => x.name && x.name.indexOf(a.name_includes) !== -1);
      if (matches.length === 0) return { ok: false, reason: `no allowance name includes "${a.name_includes}"` };
      if (matches.length > 1) return { ok: false, reason: `ambiguous: ${matches.length} allowances include "${a.name_includes}"` };
      const got = matches[0][a.field];
      return num(got) === num(a.equals) ? { ok: true } : { ok: false, reason: `${a.field} = ${JSON.stringify(got)}, expected ${a.equals}` };
    }
    default:
      return { ok: false, reason: `unknown assert.kind "${a.kind}"` };
  }
}

// ---------------------------------------------------------------------------
// Run the suite
// ---------------------------------------------------------------------------
const files = fs.existsSync(Q_DIR) ? fs.readdirSync(Q_DIR).filter(f => f.endsWith('.json')).sort() : [];
if (files.length === 0) { console.error(`No question files found in ${Q_DIR}`); process.exit(2); }

const questions = [];
for (const f of files) {
  const arr = JSON.parse(fs.readFileSync(path.join(Q_DIR, f), 'utf8'));
  for (const q of arr) questions.push(q);
}

const byVertical = {};   // vertical -> { code, pass, total, fails: [] }
const failures = [];
for (const q of questions) {
  const v = q.vertical;
  byVertical[v] = byVertical[v] || { code: q.award, pass: 0, total: 0, fails: [] };
  byVertical[v].total += 1;
  let res;
  try { res = evaluate(q.assert); } catch (e) { res = { ok: false, reason: 'evaluator error: ' + e.message }; }
  if (res.ok) { byVertical[v].pass += 1; }
  else { byVertical[v].fails.push({ id: q.id, question: q.question, reason: res.reason }); failures.push({ id: q.id, vertical: v, reason: res.reason }); }
}

const totalPass = Object.values(byVertical).reduce((s, x) => s + x.pass, 0);
const totalCount = questions.length;
const overall = totalPass / totalCount;

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const pct = (x) => (x * 100).toFixed(1) + '%';
console.log('='.repeat(72));
console.log('  REGRESSION SUITE — new-vertical accuracy gate');
console.log(`  threshold ACCURACY_THRESHOLD = ${pct(THRESHOLD)}   |   ${totalCount} questions`);
console.log('='.repeat(72));

const gateFailures = [];
const eligible = [];
for (const [v, s] of Object.entries(byVertical).sort()) {
  const rate = s.pass / s.total;
  const entry = AWARD_REGISTRY[s.code] || {};
  const launched = entry.status === 'supported';        // GA / flag removed
  const clears = rate >= THRESHOLD;
  const stateTag = launched ? 'LIVE (GA)' : 'preview';
  const bar = clears ? 'PASS' : 'BELOW';
  console.log(`  ${v.padEnd(14)} ${String(s.pass).padStart(3)}/${String(s.total).padEnd(3)}  ${pct(rate).padStart(6)}  [${bar}]  ${stateTag}`);
  if (launched && !clears) gateFailures.push({ vertical: v, code: s.code, rate });
  if (launched && s.total === 0) gateFailures.push({ vertical: v, code: s.code, rate: 0, reason: 'no coverage' });
  if (!launched && clears) eligible.push(v);
}
console.log('-'.repeat(72));
console.log(`  OVERALL  ${String(totalPass).padStart(3)}/${String(totalCount).padEnd(3)}  ${pct(overall)}`);
console.log('='.repeat(72));

if (failures.length) {
  console.log(`\n  ${failures.length} failing question(s):`);
  for (const [v, s] of Object.entries(byVertical).sort()) {
    for (const f of s.fails) console.log(`    ✗ [${v}] ${f.id}: ${f.reason}`);
  }
}

if (eligible.length) {
  console.log(`\n  Preview verticals clearing ${pct(THRESHOLD)} and eligible to launch (flip status to 'supported'): ${eligible.join(', ')}`);
}

// Optional machine-readable report
const jsonIdx = process.argv.indexOf('--json');
if (jsonIdx !== -1 && process.argv[jsonIdx + 1]) {
  const report = {
    threshold: THRESHOLD, overall, total: totalCount, pass: totalPass,
    generated_at: null,
    verticals: Object.fromEntries(Object.entries(byVertical).map(([v, s]) => [v, {
      code: s.code, pass: s.pass, total: s.total, rate: s.pass / s.total,
      status: (AWARD_REGISTRY[s.code] || {}).status || 'unknown',
    }])),
    failures,
  };
  fs.writeFileSync(process.argv[jsonIdx + 1], JSON.stringify(report, null, 2) + '\n');
  console.log(`\n  Wrote machine-readable report to ${process.argv[jsonIdx + 1]}`);
}

// ---------------------------------------------------------------------------
// Enforce the gate
// ---------------------------------------------------------------------------
console.log('');
if (gateFailures.length) {
  console.error('  ✗ LAUNCH GATE FAILED — a LIVE (GA) award is below the accuracy threshold:');
  for (const g of gateFailures) {
    console.error(`      ${g.vertical} (${g.code}): ${pct(g.rate)} < ${pct(THRESHOLD)}${g.reason ? ' — ' + g.reason : ''}`);
  }
  console.error('  A vertical must not be launched (status: supported / feature flag removed) below the bar.');
  process.exit(1);
}
console.log(`  ✓ LAUNCH GATE PASSED — every LIVE (GA) award clears ${pct(THRESHOLD)}.`);
process.exit(0);
