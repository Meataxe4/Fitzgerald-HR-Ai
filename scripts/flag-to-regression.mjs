#!/usr/bin/env node
// Flagged-answer → regression-case intake (Milestone 8).
//
// Turns a production-reported wrong answer into a permanent regression case.
// Drop one JSON report per miss into regression/flagged/ (see TEMPLATE.json),
// then run this script: it validates each report, appends it as a question to
// the correct regression/questions/<vertical>.json, and moves the report to
// regression/flagged/processed/.
//
// The new case will FAIL the suite until the underlying data/logic is fixed —
// that is the point: it closes the loop back into the Milestone 6 accuracy gate.
//
//   node scripts/flag-to-regression.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const INBOX = path.join(ROOT, 'regression', 'flagged');
const PROCESSED = path.join(INBOX, 'processed');
const Q_DIR = path.join(ROOT, 'regression', 'questions');

const CODE_TO_VERTICAL = {
  MA000009: 'hospitality', MA000119: 'restaurant', MA000010: 'manufacturing',
  MA000100: 'schads', MA000004: 'retail', MA000027: 'health', MA000120: 'childrens',
};
const VALID_KINDS = ['resolves', 'resolves_unresolved', 'scalar', 'penalty', 'pay_rate', 'allowance'];
const REQUIRED = ['award', 'category', 'question', 'expected_answer', 'assert', 'source', 'reported_by', 'reported_date'];

if (!fs.existsSync(INBOX)) { console.error(`No inbox at ${INBOX}`); process.exit(2); }
const reports = fs.readdirSync(INBOX)
  .filter(f => f.endsWith('.json') && f !== 'TEMPLATE.json')
  .sort();
if (reports.length === 0) { console.log('No flagged reports to process (regression/flagged/*.json).'); process.exit(0); }

const problems = [];
const staged = [];   // { file, vertical, question }
for (const f of reports) {
  const p = path.join(INBOX, f);
  let r;
  try { r = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { problems.push(`${f}: invalid JSON — ${e.message}`); continue; }
  const miss = REQUIRED.filter(k => r[k] === undefined || r[k] === '');
  if (miss.length) { problems.push(`${f}: missing field(s): ${miss.join(', ')}`); continue; }
  const vertical = CODE_TO_VERTICAL[r.award];
  if (!vertical) { problems.push(`${f}: unknown award code "${r.award}"`); continue; }
  if (!r.assert || !VALID_KINDS.includes(r.assert.kind)) { problems.push(`${f}: assert.kind must be one of ${VALID_KINDS.join('/')}`); continue; }
  staged.push({ file: f, vertical, report: r });
}

if (problems.length) {
  console.error(`✗ ${problems.length} report(s) could not be processed:`);
  for (const p of problems) console.error('   - ' + p);
  console.error('\nFix the reports and re-run. No changes were written.');
  process.exit(1);
}

fs.mkdirSync(PROCESSED, { recursive: true });
let added = 0;
for (const { file, vertical, report } of staged) {
  const qFile = path.join(Q_DIR, `${vertical}.json`);
  const questions = JSON.parse(fs.readFileSync(qFile, 'utf8'));
  const seq = questions.filter(q => typeof q.id === 'string' && q.id.startsWith(`${report.award}-flagged-`)).length + 1;
  const q = {
    id: `${report.award}-flagged-${String(seq).padStart(3, '0')}`,
    vertical, award: report.award, category: report.category,
    question: report.question, expected_answer: report.expected_answer,
    assert: report.assert, source: report.source,
    verified_by: report.reported_by, verified_date: report.reported_date,
    origin: 'production-flag', notes: report.notes || undefined,
  };
  questions.push(q);
  fs.writeFileSync(qFile, JSON.stringify(questions, null, 2) + '\n');
  fs.renameSync(path.join(INBOX, file), path.join(PROCESSED, file));
  console.log(`  + ${q.id} → regression/questions/${vertical}.json   (from ${file})`);
  added++;
}

console.log(`\n✓ Added ${added} regression case(s). Now run:  npm run test:regression`);
console.log('  The new case(s) should FAIL until you fix the underlying rate data or grounding logic.');
