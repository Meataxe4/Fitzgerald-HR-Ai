// Award-resolution guardrail tests. Exercises the REAL resolveAward() from
// js/app-main.js (extracted and evaluated with stubbed browser globals) to prove
// the fail-closed contract: supported awards resolve exactly, everything else is
// UNRESOLVED, and preview awards are gated behind their feature flag.
// See docs/guardrails-award-resolution.md. Run with: npm test
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'app-main.js'), 'utf8');

// Extract the real registry + resolver block from the shipped source.
const start = src.indexOf('const AWARD_REGISTRY = {');
const end = src.indexOf('// Returns the resolved award context');
if (start === -1 || end === -1) throw new Error('markers not found');
const block = src.slice(start, end);

// Stubs for the browser globals the block depends on.
const CONFIG = { API: { HOSPITALITY_RATES_URL: '/hospitality-award-rates.json', RESTAURANT_RATES_URL: '/restaurant-award-rates.json' } };
let _flags = new Set();
function hasFeature(f) { return _flags.has(f); }

const factory = new Function('CONFIG', 'hasFeature', block + '\nreturn { resolveAward, AWARD_REGISTRY };');
let { resolveAward } = factory(CONFIG, hasFeature);

let pass = 0, fail = 0;
function eq(label, got, want) {
  const ok = got === want;
  console.log((ok ? 'PASS ' : 'FAIL ') + label + '  => ' + JSON.stringify(got));
  ok ? pass++ : fail++;
}

// Behaviour preservation for the two live awards
eq('Hospitality -> MA000009', resolveAward('Hospitality Industry (General) Award').code, 'MA000009');
eq('Restaurant  -> MA000119', resolveAward('Restaurant Industry Award').code, 'MA000119');
eq('Hospitality displayName', resolveAward('Hospitality Industry (General) Award').displayName, 'Hospitality Industry (General) Award');
eq('Restaurant fullName', resolveAward('Restaurant Industry Award').fullName, 'Restaurant Industry Award MA000119');
eq('Hospitality ratesUrl', resolveAward('Hospitality Industry (General) Award').ratesUrl, '/hospitality-award-rates.json');

// Fail closed: everything else is UNRESOLVED, never Hospitality
eq('Not sure   -> null', resolveAward('Not sure').code, null);
eq('Fast Food  -> null', resolveAward('Fast Food Industry Award').code, null);
eq('empty      -> null', resolveAward('').code, null);
eq('null       -> null', resolveAward(null).code, null);
eq('garbage    -> null', resolveAward('Some Random Award').code, null);

// Manufacturing preview: gated by flag
eq('Manufacturing (flag OFF) -> null', resolveAward('Manufacturing and Associated Industries Award').code, null);
_flags = new Set(['manufacturing_preview']);
({ resolveAward } = factory(CONFIG, hasFeature));
eq('Manufacturing (flag ON)  -> MA000010', resolveAward('Manufacturing and Associated Industries Award').code, 'MA000010');

// Code-based resolution (future award_code field)
eq('Code MA000119 -> MA000119', resolveAward('MA000119').code, 'MA000119');

// ---- Document layer: classification options resolve by CODE (Milestone 2) ----
// Extract the real _fwDocClassificationOptions and exercise it with a stub for
// _fwEscapeHtml. Locks the bug fix: Hospitality must NOT get Restaurant options.
const optStart = src.indexOf('function _fwDocClassificationOptions(');
const optEnd = src.indexOf('\n}', optStart) + 2;
const optBlock = src.slice(optStart, optEnd);
const optFactory = new Function('_fwEscapeHtml',
    optBlock + '\nreturn _fwDocClassificationOptions;');
const _fwDocClassificationOptions = optFactory(function (s) { return s; });

const hospOpts = _fwDocClassificationOptions('MA000009');
const restOpts = _fwDocClassificationOptions('MA000119');
const noneOpts = _fwDocClassificationOptions(null);

eq('Hospitality classifications use Levels', /Level 1/.test(hospOpts), true);
eq('Hospitality classifications NOT Cook grades', /Cook grade/.test(hospOpts), false);
eq('Restaurant classifications use Cook grades', /Cook grade 5/.test(restOpts), true);
eq('Restaurant classifications NOT Levels', /Level 6/.test(restOpts), false);
eq('Unresolved classifications -> placeholder', /Set your Award/.test(noneOpts), true);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
