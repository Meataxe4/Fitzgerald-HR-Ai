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

// ---- Newly-launched awards (GA): resolve WITHOUT any feature flag ----------
// These five were preview-gated; on GA the flag requirement is removed and they
// must resolve unconditionally, exactly like Hospitality/Restaurant. No flags set.
eq('Manufacturing -> MA000010', resolveAward('Manufacturing and Associated Industries Award').code, 'MA000010');
eq('Manufacturing calculatorType classification', resolveAward('MA000010').calculatorType, 'classification');

eq('SCHADS -> MA000100', resolveAward('Social, Community, Home Care and Disability Services Industry Award MA000100').code, 'MA000100');
eq('SCHADS alias schads -> MA000100', resolveAward('schads').code, 'MA000100');
eq('SCHADS code MA000100 -> MA000100', resolveAward('MA000100').code, 'MA000100');
eq('SCHADS calculatorType classification', resolveAward('MA000100').calculatorType, 'classification');

eq('Retail -> MA000004', resolveAward('General Retail Industry Award MA000004').code, 'MA000004');
eq('Retail alias general retail -> MA000004', resolveAward('general retail').code, 'MA000004');
eq('Retail code MA000004 -> MA000004', resolveAward('MA000004').code, 'MA000004');
eq('Retail calculatorType classification', resolveAward('MA000004').calculatorType, 'classification');
eq('Retail fullName', resolveAward('MA000004').fullName, 'General Retail Industry Award MA000004');

eq('Health -> MA000027', resolveAward('Health Professionals and Support Services Award MA000027').code, 'MA000027');
eq('Health alias health professionals -> MA000027', resolveAward('health professionals award').code, 'MA000027');
eq('Health code MA000027 -> MA000027', resolveAward('MA000027').code, 'MA000027');
eq('Health calculatorType classification', resolveAward('MA000027').calculatorType, 'classification');
eq('Health fullName', resolveAward('MA000027').fullName, 'Health Professionals and Support Services Award MA000027');

eq('Childrens -> MA000120', resolveAward("Children's Services Award MA000120").code, 'MA000120');
eq('Childrens alias early childhood -> MA000120', resolveAward('early childhood service').code, 'MA000120');
eq('Childrens code MA000120 -> MA000120', resolveAward('MA000120').code, 'MA000120');
eq('Childrens calculatorType classification', resolveAward('MA000120').calculatorType, 'classification');
eq('Childrens fullName', resolveAward('MA000120').fullName, "Children's Services Award MA000120");

// Cross-award guardrails still hold: newly-live awards must NOT shadow the
// role-based awards, and genuinely unknown awards still fail closed.
eq('Restaurant still -> MA000119 (not shadowed by Retail)', resolveAward('Restaurant Industry Award').code, 'MA000119');
eq('Hospitality still -> MA000009', resolveAward('Hospitality Industry (General) Award').code, 'MA000009');
eq('Fast Food still -> null', resolveAward('Fast Food Industry Award').code, null);
eq('garbage still -> null', resolveAward('Some Random Award').code, null);

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
const schadsOpts = _fwDocClassificationOptions('MA000100');
eq('SCHADS classifications include SACS Level 8', /Social & community services - Level 8/.test(schadsOpts), true);
eq('SCHADS classifications include Home care Team leader', /Home care - Level 6 \(Team leader\)/.test(schadsOpts), true);
eq('SCHADS classifications NOT Cook grades', /Cook grade/.test(schadsOpts), false);
const retailOpts = _fwDocClassificationOptions('MA000004');
eq('Retail classifications include Retail Employee Level 8', /Retail Employee Level 8/.test(retailOpts), true);
eq('Retail classifications NOT Cook grades', /Cook grade/.test(retailOpts), false);
eq('Retail classifications NOT C-levels', /C10/.test(retailOpts), false);
const healthOpts = _fwDocClassificationOptions('MA000027');
eq('Health classifications include Support Services - Level 9', /Support Services - Level 9/.test(healthOpts), true);
eq('Health classifications include Health Professional - Level 4', /Health Professional - Level 4/.test(healthOpts), true);
eq('Health classifications include Pathology collector', /Pathology collector - Level 5/.test(healthOpts), true);
eq('Health classifications NOT Cook grades', /Cook grade/.test(healthOpts), false);
const childrensOpts = _fwDocClassificationOptions('MA000120');
eq('Childrens classifications include Level 8 - Director', /Level 8 - Director/.test(childrensOpts), true);
eq('Childrens classifications include Support worker level 3.1', /Support worker level 3\.1/.test(childrensOpts), true);
eq('Childrens classifications NOT Cook grades', /Cook grade/.test(childrensOpts), false);

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

// ---- SCHADS rates data integrity (Milestone: MA000100 wiring) ----------------
const schads = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'schads-award-rates.json'), 'utf8'));
eq('SCHADS ma_number', schads.ma_number, 'MA000100');
eq('SCHADS 152 rate rows', schads.rates.length, 152);
eq('SCHADS Saturday FT/PT 1.5', schads.penalty_rates.saturday_full_time_part_time, 1.5);
eq('SCHADS Saturday casual 1.75', schads.penalty_rates.saturday_casual, 1.75);
eq('SCHADS Sunday FT/PT 2.0', schads.penalty_rates.sunday_full_time_part_time, 2.0);
eq('SCHADS public holiday FT/PT 2.5', schads.penalty_rates.public_holiday_full_time_part_time, 2.5);
eq('SCHADS casual loading 0.25', schads.casual_loading, 0.25);
eq('SCHADS afternoon +12.5%', schads.penalty_rates.afternoon_shift_loading, 0.125);
eq('SCHADS night +15%', schads.penalty_rates.night_shift_loading, 0.15);
eq('SCHADS all rows have positive rate', schads.rates.every(r => typeof r.rate === 'number' && r.rate > 0), true);
eq('SCHADS streams present', [...new Set(schads.rates.map(r => r.stream))].sort().join(','),
   'crisis_accommodation,family_day_care,home_care,social_community_services');

// Known PDF figures: SACS Level 1 pay point 1, full-time = $27.55 (weekly $1,046.90).
const sacs1 = schads.rates.find(r => r.stream === 'social_community_services' && r.employment_type === 'full_time' && /Level 1 - pay point 1$/.test(r.classification));
eq('SCHADS SACS L1pp1 rate $27.55', sacs1 && sacs1.rate, 27.55);
eq('SCHADS SACS L1pp1 weekly $1046.90', sacs1 && sacs1.weekly_rate, 1046.90);
// rate x multiplier must reproduce the PDF's own published penalty-dollar columns
eq('SACS L1pp1 Saturday = $41.33 (PDF)', r2(sacs1.rate * schads.penalty_rates.saturday_full_time_part_time), 41.33);
eq('SACS L1pp1 Sunday = $55.10 (PDF)', r2(sacs1.rate * schads.penalty_rates.sunday_full_time_part_time), 55.10);
eq('SACS L1pp1 Public holiday = $68.88 (PDF)', r2(sacs1.rate * schads.penalty_rates.public_holiday_full_time_part_time), 68.88);
// Casual rate already includes the 25% loading; base x casual multiplier reproduces the PDF.
const sacs1c = schads.rates.find(r => r.stream === 'social_community_services' && r.employment_type === 'casual' && /Level 1 - pay point 1$/.test(r.classification));
eq('SCHADS SACS L1pp1 casual rate $34.44', sacs1c && sacs1c.rate, 34.44);
// Casual penalties derive from the FT base rate (per the Pay Guide), not the
// rounded casual rate: 27.55 x 1.75 = 48.21.
eq('SACS casual Saturday = base x1.75 = $48.21 (PDF)', r2(sacs1.rate * schads.penalty_rates.saturday_casual), 48.21);
// Minimum engagement sourced from award text (clause 10.5)
eq('SCHADS SACS min 3 hrs', schads.minimum_engagement.social_community_services_hours_per_shift, 3);
eq('SCHADS other streams min 2 hrs', schads.minimum_engagement.other_streams_hours_per_shift, 2);
// SCHADS, General Retail and Children's Services have NO annualised wage clause —
// those doc templates must exclude all three codes (2 templates: agreement + time record).
eq('SCHADS + Retail + Childrens annualised wage templates excluded (source)',
   (src.match(/excludeAwards: \['MA000100', 'MA000004', 'MA000120'\]/g) || []).length >= 2, true);

// ---- General Retail rates data integrity (Milestone: MA000004 wiring) --------
const retail = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'retail-award-rates.json'), 'utf8'));
eq('Retail ma_number', retail.ma_number, 'MA000004');
eq('Retail 16 rate rows (8 FT + 8 casual, adult)', retail.rates.length, 16);
eq('Retail Saturday FT/PT 1.25', retail.penalty_rates.saturday_full_time_part_time, 1.25);
eq('Retail Saturday casual 1.5', retail.penalty_rates.saturday_casual, 1.5);
eq('Retail Sunday FT/PT 1.5', retail.penalty_rates.sunday_full_time_part_time, 1.5);
eq('Retail public holiday FT/PT 2.25', retail.penalty_rates.public_holiday_full_time_part_time, 2.25);
eq('Retail public holiday casual 2.5', retail.penalty_rates.public_holiday_casual, 2.5);
eq('Retail evening loading +25%', retail.penalty_rates.evening_mon_fri_loading, 0.25);
eq('Retail overtime first 3h 1.5', retail.penalty_rates.overtime_first_3hrs, 1.5);
eq('Retail overtime after 3h 2.0', retail.penalty_rates.overtime_after_3hrs, 2.0);
eq('Retail casual loading 0.25', retail.casual_loading, 0.25);
eq('Retail all rows have positive rate', retail.rates.every(r => typeof r.rate === 'number' && r.rate > 0), true);
// Known PDF figures: Retail Employee Level 1 full-time = $27.81 (weekly $1,056.80).
const rl1 = retail.rates.find(r => r.employment_type === 'full_time' && r.classification === 'Retail Employee Level 1');
const rl8 = retail.rates.find(r => r.employment_type === 'full_time' && r.classification === 'Retail Employee Level 8');
eq('Retail L1 rate $27.81', rl1 && rl1.rate, 27.81);
eq('Retail L1 weekly $1056.80', rl1 && rl1.weekly_rate, 1056.80);
eq('Retail L8 rate $33.99', rl8 && rl8.rate, 33.99);
// L1 Saturday/evening = 125% of $27.81 = $34.76 — the one FT penalty column that
// lands on an exact cent in double precision (others sit on half-mil boundaries
// and are validated rigorously with Decimal in scripts/extract_retail_rates.py).
eq('Retail L1 Saturday = $34.76 (PDF)', r2(rl1.rate * retail.penalty_rates.saturday_full_time_part_time), 34.76);
// Casual rate already includes the 25% loading; the stored casual column equals
// base x1.25 rounded, reproducing the Pay Guide's casual hourly figure exactly.
const rl1c = retail.rates.find(r => r.employment_type === 'casual' && r.classification === 'Retail Employee Level 1');
eq('Retail L1 casual rate $34.76', rl1c && rl1c.rate, 34.76);
eq('Retail L8 casual rate $42.49', (retail.rates.find(r => r.employment_type === 'casual' && r.classification === 'Retail Employee Level 8') || {}).rate, 42.49);
// Minimum engagement sourced from award text (clauses 10.9 / 11.2)
eq('Retail part-time min 3 hrs', retail.minimum_engagement.part_time_hours_per_shift, 3);
eq('Retail casual min 3 hrs', retail.minimum_engagement.casual_hours_per_shift, 3);

// ---- Health Professionals & Support Services data integrity (MA000027) ------
const health = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'health-award-rates.json'), 'utf8'));
eq('Health ma_number', health.ma_number, 'MA000027');
eq('Health 80 rate rows (40 adult classifications x2)', health.rates.length, 80);
eq('Health four streams present', [...new Set(health.rates.map(r => r.stream))].sort().join(','),
   'dental_assistants,health_professionals,pathology_collectors,support_services');
eq('Health Saturday FT/PT 1.5', health.penalty_rates.saturday_full_time_part_time, 1.5);
eq('Health Saturday casual 1.75', health.penalty_rates.saturday_casual, 1.75);
eq('Health Sunday FT/PT 1.5', health.penalty_rates.sunday_full_time_part_time, 1.5);
eq('Health public holiday FT/PT 2.5', health.penalty_rates.public_holiday_full_time_part_time, 2.5);
eq('Health public holiday casual 2.75', health.penalty_rates.public_holiday_casual, 2.75);
eq('Health Mon-Fri shift loading +15%', health.penalty_rates.shift_loading_mon_fri, 0.15);
eq('Health overtime first 2h 1.5', health.penalty_rates.overtime_first_2hrs, 1.5);
eq('Health overtime after 2h 2.0', health.penalty_rates.overtime_after_2hrs, 2.0);
eq('Health casual loading 0.25', health.casual_loading, 0.25);
eq('Health all rows have positive rate', health.rates.every(r => typeof r.rate === 'number' && r.rate > 0), true);
// Known PDF figures: Support Services Level 1 full-time = $26.97 (weekly $1,024.70).
const hss1 = health.rates.find(r => r.stream === 'support_services' && r.employment_type === 'full_time' && r.classification === 'Level 1');
eq('Health Support L1 rate $26.97', hss1 && hss1.rate, 26.97);
eq('Health Support L1 weekly $1024.70', hss1 && hss1.weekly_rate, 1024.70);
// rate x multiplier reproduces the published penalty-dollar columns (Sat 150%, PH 250%).
eq('Health Support L1 Saturday = $40.46 (PDF)', r2(hss1.rate * health.penalty_rates.saturday_full_time_part_time), 40.46);
eq('Health Support L1 Public holiday = $67.43 (PDF)', r2(hss1.rate * health.penalty_rates.public_holiday_full_time_part_time), 67.43);
// Health Professional top rate = $71.19 (weekly $2,705.10).
const hp44 = health.rates.find(r => r.stream === 'health_professionals' && r.employment_type === 'full_time' && r.classification === 'Level 4 - pay point 4');
eq('Health Professional L4pp4 rate $71.19', hp44 && hp44.rate, 71.19);
eq('Health Professional L4pp4 casual rate $88.99',
   (health.rates.find(r => r.stream === 'health_professionals' && r.employment_type === 'casual' && r.classification === 'Level 4 - pay point 4') || {}).rate, 88.99);
// Minimum engagement + annualised wage sourced from award text.
eq('Health casual min 3 hrs (clause 11.2)', health.minimum_engagement.casual_hours_per_shift, 3);
eq('Health has NO fixed part-time per-shift minimum', health.minimum_engagement.part_time_hours_per_shift, undefined);
eq('Health annualised wage clause 22', health.annualised_wage.clause, '22');
// MA000027 HAS an annualised wage clause, so it must NOT be in the excluded set.
eq('Health NOT excluded from annualised wage templates',
   /excludeAwards: \[[^\]]*MA000027/.test(src), false);
// The annualised-wage profile + absorbed-provisions must switch for MA000027.
eq('app-main has MA000027 annualised wage profile (clause 22)', /clauseHeading: 'Clause 22-Annualised wage arrangements'/.test(src), true);
eq('app-main has MA000027 absorbed provisions (cl 26)', /Penalty rates and shiftwork \(cl 26\)/.test(src), true);
eq('app-main cash-out uses MA000027 Schedule I', /MA000027 Schedule I/.test(src), true);
eq('app-main leave-in-advance uses MA000027 Schedule H', /MA000027 Schedule H/.test(src), true);

// ---- Children's Services data integrity (MA000120) --------------------------
const childrens = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'childrens-award-rates.json'), 'utf8'));
eq('Childrens ma_number', childrens.ma_number, 'MA000120');
eq('Childrens 24 rate rows (12 adult classifications x2)', childrens.rates.length, 24);
eq('Childrens two streams present', [...new Set(childrens.rates.map(r => r.stream))].sort().join(','),
   'childrens_services_employee,support_worker');
eq('Childrens Sunday FT/PT 2.0', childrens.penalty_rates.sunday_full_time_part_time, 2.0);
eq('Childrens Sunday casual 2.25', childrens.penalty_rates.sunday_casual, 2.25);
eq('Childrens public holiday FT/PT 2.5', childrens.penalty_rates.public_holiday_full_time_part_time, 2.5);
eq('Childrens public holiday casual 2.75', childrens.penalty_rates.public_holiday_casual, 2.75);
eq('Childrens permanent night shift +30%', childrens.penalty_rates.permanent_night_shift_loading, 0.30);
eq('Childrens rotating night shift +17.5%', childrens.penalty_rates.rotating_night_shift_loading, 0.175);
eq('Childrens overtime first 2h 1.5', childrens.penalty_rates.overtime_first_2hrs, 1.5);
eq('Childrens casual loading 0.25', childrens.casual_loading, 0.25);
eq('Childrens all rows have positive rate', childrens.rates.every(r => typeof r.rate === 'number' && r.rate > 0), true);
// Known PDF figures: Support worker level 1.1 = $26.44 (weekly $1,004.90).
const csw1 = childrens.rates.find(r => r.stream === 'support_worker' && r.employment_type === 'full_time' && r.classification === 'Support worker level 1.1 on commencement');
eq('Childrens Support worker L1.1 rate $26.44', csw1 && csw1.rate, 26.44);
eq('Childrens Support worker L1.1 weekly $1004.90', csw1 && csw1.weekly_rate, 1004.90);
eq('Childrens Support L1.1 Sunday = $52.88 (PDF)', r2(csw1.rate * childrens.penalty_rates.sunday_full_time_part_time), 52.88);
eq('Childrens Support L1.1 Public holiday = $66.10 (PDF)', r2(csw1.rate * childrens.penalty_rates.public_holiday_full_time_part_time), 66.10);
// Director top rate = $46.12 (weekly $1,752.70), casual $57.65.
const cdir = childrens.rates.find(r => r.stream === 'childrens_services_employee' && r.employment_type === 'full_time' && r.classification === 'Level 8 - Director');
eq('Childrens Director rate $46.12', cdir && cdir.rate, 46.12);
eq('Childrens Director casual rate $57.65',
   (childrens.rates.find(r => r.stream === 'childrens_services_employee' && r.employment_type === 'casual' && r.classification === 'Level 8 - Director') || {}).rate, 57.65);
// Minimum engagement sourced from award text (clauses 10.4(e) / 10.5(c)).
eq('Childrens part-time min 2 hrs', childrens.minimum_engagement.part_time_hours_per_shift, 2);
eq('Childrens casual min 2 hrs', childrens.minimum_engagement.casual_hours_per_shift, 2);
// MA000120 has NO annualised wage clause, so it must be in the excluded set.
eq('Childrens excluded from annualised wage templates',
   (src.match(/excludeAwards: \[[^\]]*MA000120/g) || []).length >= 2, true);
eq('app-main cash-out uses MA000120 Schedule G', /MA000120 Schedule G/.test(src), true);
eq('app-main leave-in-advance uses MA000120 Schedule F', /MA000120 Schedule F/.test(src), true);

// ---- Allowance grounding: every award ships an allowances block ------------
// (fed to the chat prompt so the AI answers allowance questions with exact
// figures instead of guessing / declining). Figures sourced from the FWO Pay
// Guide allowances tables.
const AWARD_FILES = {
  MA000009: 'hospitality-award-rates.json',
  MA000119: 'restaurant-award-rates.json',
  MA000010: 'manufacturing-award-rates.json',
  MA000100: 'schads-award-rates.json',
  MA000004: 'retail-award-rates.json',
  MA000027: 'health-award-rates.json',
  MA000120: 'childrens-award-rates.json',
};
function loadAward(code) { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', AWARD_FILES[code]), 'utf8')); }
function allowanceAmount(rates, nameFragment) {
  const a = (rates.allowances || []).find(x => x.name && x.name.indexOf(nameFragment) !== -1);
  return a ? a.amount : undefined;
}
Object.keys(AWARD_FILES).forEach(code => {
  const r = loadAward(code);
  eq(code + ' has a non-empty allowances array', Array.isArray(r.allowances) && r.allowances.length > 0, true);
  eq(code + ' every allowance entry has a name', (r.allowances || []).every(a => typeof a.name === 'string' && a.name), true);
  eq(code + ' every allowance is a dollar amount OR a text description',
     (r.allowances || []).every(a => typeof a.amount === 'number' || typeof a.text === 'string'), true);
});
// Spot-check known published figures from each Pay Guide.
eq('Retail cold work 0°C and above = $0.38/hr', allowanceAmount(retail, 'Cold work allowance (0°C and above)'), 0.38);
eq('Retail first aid = $14.55/wk', allowanceAmount(retail, 'First aid allowance'), 14.55);
eq('Hospitality first aid (FT) = $13.43/wk', allowanceAmount(loadAward('MA000009'), 'First aid allowance (full-time employees)'), 13.43);
eq('Restaurant meal-overtime = $17.42', allowanceAmount(loadAward('MA000119'), 'Meal allowance - overtime'), 17.42);
eq('Manufacturing meal = $19.14/meal', allowanceAmount(loadAward('MA000010'), 'Meal allowance'), 19.14);
eq('SCHADS sleepover = $62.87', allowanceAmount(loadAward('MA000100'), 'Sleepover allowance'), 62.87);
eq('Health tool allowance (chefs/cooks) = $13.41/wk', allowanceAmount(health, 'Tool allowance (chefs and cooks)'), 13.41);
eq('Health uniform allowance = $1.26/shift', allowanceAmount(health, 'Uniform allowance'), 1.26);
eq('Childrens broken shift allowance = $21.38/day', allowanceAmount(childrens, 'Broken shift allowance'), 21.38);
eq('Childrens educational leader (5 days) = $4784.28/yr', allowanceAmount(childrens, 'Educational leader allowance (5 days or more per week)'), 4784.28);

// ---- buildAllowanceFacts (chat.js) renders exact figures / fails closed ----
const chatSrc = fs.readFileSync(path.join(__dirname, '..', 'netlify', 'functions', 'chat.js'), 'utf8');
const bafStart = chatSrc.indexOf('function buildAllowanceFacts(');
let d = 0, bi = chatSrc.indexOf('{', bafStart), bafEnd = bafStart;
for (; bi < chatSrc.length; bi++) { if (chatSrc[bi] === '{') d++; else if (chatSrc[bi] === '}') { d--; if (d === 0) { bafEnd = bi + 1; break; } } }
const buildAllowanceFacts = new Function(chatSrc.slice(bafStart, bafEnd) + '\nreturn buildAllowanceFacts;')();
const retailFacts = buildAllowanceFacts(retail, retail.award_name);
eq('Chat grounds retail cold-work allowance as $0.38 per hour',
   /Cold work allowance \(0°C and above\): \$0\.38 per hour \(while so employed\)/.test(retailFacts), true);
eq('Chat allowance facts include a header for the award', /ALLOWANCES — General Retail Industry Award MA000004/.test(retailFacts), true);
eq('buildAllowanceFacts fails closed with no allowances block', buildAllowanceFacts({ award_name: 'X' }, 'X'), '');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
