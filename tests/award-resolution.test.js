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

// ---- Manufacturing rates data integrity (Milestone: MA000010 wiring) --------
const manuf = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manufacturing-award-rates.json'), 'utf8'));
eq('Manufacturing ma_number', manuf.ma_number, 'MA000010');
eq('Manufacturing 145 rate rows (2026-07 published set)', manuf.rates.length, 145);
eq('Manufacturing Saturday 1.5', manuf.penalty_rates.saturday, 1.5);
eq('Manufacturing Sunday 2.0', manuf.penalty_rates.sunday, 2.0);
eq('Manufacturing public holiday 2.5', manuf.penalty_rates.public_holiday, 2.5);
eq('Manufacturing casual loading 0.25', manuf.casual_loading, 0.25);
const c10 = manuf.rates.find(r => /^C10\b/.test(r.classification) && r.employment_type === 'full_time');
const c14 = manuf.rates.find(r => /^C14\b/.test(r.classification) && r.employment_type === 'full_time');
eq('Manufacturing C10 rate $29.45', c10 && c10.rate, 29.45);
eq('Manufacturing C14 rate $25.74', c14 && c14.rate, 25.74);
// every rate row: penalties derive cleanly (hourly>0) — sanity guard against corruption
eq('Manufacturing all rows have positive rate', manuf.rates.every(r => typeof r.rate === 'number' && r.rate > 0), true);

// Calculator math: rate x multiplier must reproduce the PDF's OWN published
// penalty-dollar columns (end-to-end correctness of the pay calculator).
const r2 = n => Math.round(n * 100) / 100;
const pr = manuf.penalty_rates;
eq('C14 Saturday = $38.61 (PDF)', r2(c14.rate * pr.saturday), 38.61);
eq('C14 Sunday = $51.48 (PDF)', r2(c14.rate * pr.sunday), 51.48);
eq('C14 Public holiday = $64.35 (PDF)', r2(c14.rate * pr.public_holiday), 64.35);
eq('C10 Saturday = $44.18 (PDF)', r2(c10.rate * pr.saturday), 44.18);

// Minimum engagement sourced from the award text (clauses 10.2 / 11.2)
eq('Manufacturing part-time min 4 hrs', manuf.minimum_engagement.part_time_hours_per_shift, 4);
eq('Manufacturing casual min 4 hrs', manuf.minimum_engagement.casual_hours_per_shift, 4);
// Shift loadings confirmed against award clause 33.2
eq('Manufacturing afternoon/night +15%', manuf.penalty_rates.afternoon_shift_loading, 0.15);
eq('Manufacturing permanent night +30%', manuf.penalty_rates.permanent_night_shift_loading, 0.30);
// Supervisor formula captured from clause 20.1(g)
eq('Supervisor formula present', !!(manuf.formula_classifications && manuf.formula_classifications.supervisor_trainer_coordinator), true);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
