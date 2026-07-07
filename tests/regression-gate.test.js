// Proves the accuracy gate is ENFORCED, not advisory (Milestone 6).
//
// Runs scripts/run-regression.mjs against fixture question sets via the
// REGRESSION_Q_DIR override and asserts the process exit code:
//   - a LIVE (GA) award below the threshold  -> non-zero (launch blocked)
//   - a PREVIEW award below the threshold     -> zero (correctly kept off, not fatal)
//   - everything passing                      -> zero
// Run with: node tests/regression-gate.test.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const RUNNER = path.join(ROOT, 'scripts', 'run-regression.mjs');

let pass = 0, fail = 0;
function ok(label, cond) {
  console.log((cond ? 'PASS ' : 'FAIL ') + label);
  cond ? pass++ : fail++;
}

function runGate(questions) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'regr-gate-'));
  fs.writeFileSync(path.join(dir, 'fixture.json'), JSON.stringify(questions));
  const res = spawnSync('node', [RUNNER], {
    env: { ...process.env, REGRESSION_Q_DIR: dir, ACCURACY_THRESHOLD: '0.95' },
    encoding: 'utf8',
  });
  fs.rmSync(dir, { recursive: true, force: true });
  return res;
}

// A correct fact for a GA award and a deliberately-wrong one.
const goodGA = {
  id: 'MA000009-good', vertical: 'hospitality', award: 'MA000009', category: 'casual_loading',
  question: 'q', expected_answer: 'a',
  assert: { kind: 'scalar', award: 'MA000009', path: 'casual_loading', equals: 0.25 },
};
const badGA = {
  id: 'MA000009-bad', vertical: 'hospitality', award: 'MA000009', category: 'penalty_rate',
  question: 'q', expected_answer: 'a',
  assert: { kind: 'penalty', award: 'MA000009', key: 'saturday_casual', equals: 9.99 },
};
const badPreview = {
  id: 'MA000010-bad', vertical: 'manufacturing', award: 'MA000010', category: 'penalty_rate',
  question: 'q', expected_answer: 'a',
  assert: { kind: 'penalty', award: 'MA000010', key: 'saturday', equals: 9.99 },
};

// 1) GA award below threshold => gate FAILS (non-zero exit).
{
  // 20 good + enough bad to drop hospitality below 95%.
  const qs = [];
  for (let i = 0; i < 18; i++) qs.push({ ...goodGA, id: 'good' + i });
  for (let i = 0; i < 5; i++) qs.push({ ...badGA, id: 'bad' + i });
  const res = runGate(qs);
  ok('GA award below threshold -> non-zero exit (launch blocked)', res.status !== 0);
  ok('GA failure message names the launch gate', /LAUNCH GATE FAILED/.test(res.stdout + res.stderr));
}

// 2) PREVIEW award below threshold => gate PASSES (kept off, not fatal).
{
  const qs = [goodGA];
  for (let i = 0; i < 10; i++) qs.push({ ...badPreview, id: 'bp' + i });
  const res = runGate(qs);
  ok('PREVIEW award below threshold -> zero exit (correctly kept off)', res.status === 0);
  ok('PREVIEW failure does NOT trip the launch gate', !/LAUNCH GATE FAILED/.test(res.stdout + res.stderr));
}

// 3) All passing => gate PASSES.
{
  const res = runGate([goodGA, { ...goodGA, id: 'good2' }]);
  ok('all passing -> zero exit', res.status === 0);
  ok('reports gate passed', /LAUNCH GATE PASSED/.test(res.stdout));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
