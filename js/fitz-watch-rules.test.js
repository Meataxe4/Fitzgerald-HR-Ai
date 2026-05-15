// ============================================================================
// FITZ WATCH — Hand-runnable rule test harness
// ----------------------------------------------------------------------------
// Runnable from the browser devtools console:
//
//   runFitzWatchTests()        // runs all tests, prints summary
//   runFitzWatchTests(true)    // verbose — prints each gap
//
// Use during Phase A self-test (spec Step 12 A2) and any time you change
// rules in fitz-watch-rules.js. No test framework required — pure asserts
// against deterministic detectGaps() output.
// ============================================================================

function _fakeTimestamp(daysAgo) {
    daysAgo = daysAgo || 0;
    const ms = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);
    return { toMillis: function() { return ms; } };
}

function _resp(value, daysAgo) {
    return {
        response: value,
        lastAnsweredAt: _fakeTimestamp(daysAgo),
        skipUntil: null,
        confidence: 'attested'
    };
}

// ---- Test profiles ---------------------------------------------------------

const FW_TEST_PROFILE_KNOWN_BAD = {
    venueName: 'Test Diner NSW',
    venueType: 'restaurant',
    state: 'NSW',
    primaryAward: 'MA000119',
    staffCount: 24,
    casual_count: 12,
    part_time_count: 8,
    full_time_count: 4,
    annualised_wage_used: 'yes',
    payroll_software: 'xero',
    super_clearing_house: 'beam',
    time_records_method: 'paper_signed',
    insurance_renewal_month: 7
};

const FW_TEST_PROFILE_KNOWN_OK = Object.assign({}, FW_TEST_PROFILE_KNOWN_BAD);

const FW_TEST_PROFILE_CONDITIONAL = {
    venueName: 'Cafe With No Casuals',
    venueType: 'cafe',
    state: 'VIC',
    primaryAward: 'MA000119',
    staffCount: 5,
    casual_count: 0,
    part_time_count: 5,
    full_time_count: 0,
    annualised_wage_used: 'no',
    payroll_software: 'myob',
    super_clearing_house: 'ato_sbsch',
    time_records_method: 'digital_signed',
    insurance_renewal_month: 3
};

// All-worst-case responses for the known-bad NSW profile.
// Now includes Phase 1a Workers Comp responses.
const FW_TEST_RESPONSES_KNOWN_BAD = {
    'AP-001': _resp('over_12_months'),
    'AP-002': _resp('no'),
    'AP-003': _resp('no'),
    'AP-004': _resp('no'),
    'AP-005': _resp('25_loading_plus_penalty'),
    'AP-006': _resp('no'),
    'AP-007': _resp('no'),
    'AP-008': _resp('never'),
    'AP-009': _resp('no'),
    'AP-010': _resp('no'),
    'AP-011': _resp('yes'),
    'AP-012': _resp('yes'),
    'WC-001': _resp('no'),
    'WC-002': _resp('unsure_need_help'),
    'WC-003': _resp('no'),
    'WC-004': _resp('no'),
    'PS-001': _resp('not_yet'),
    'PS-002': _resp('no'),
    'PS-003': _resp('no'),
    'PS-004': _resp('no')
};

// All-best-case responses for the known-OK profile
const FW_TEST_RESPONSES_KNOWN_OK = {
    'AP-001': _resp('within_6_months'),
    'AP-002': _resp('yes'),
    'AP-003': _resp('yes'),
    'AP-004': _resp('yes'),
    'AP-005': _resp('250_all_inclusive_119'),
    'AP-006': _resp('yes'),
    'AP-007': _resp('no_split_shifts'),
    'AP-008': _resp('within_6_months'),
    'AP-009': _resp('yes'),
    'AP-010': _resp('yes'),
    'AP-011': _resp('no'),
    'AP-012': _resp('no'),
    'WC-001': _resp('na'),
    'WC-002': _resp('before_30_june_2026'),
    'WC-003': _resp('yes'),
    'WC-004': _resp('yes'),
    'PS-001': _resp('yes'),
    'PS-002': _resp('yes'),
    'PS-003': _resp('yes'),
    'PS-004': _resp('yes')
};

// ---- Assertions ------------------------------------------------------------

function _assert(name, condition, detail) {
    if (condition) {
        console.log('%c✓ ' + name, 'color: #22c55e');
        return true;
    }
    console.error('✗ ' + name + (detail ? ': ' + detail : ''));
    return false;
}

function _gapById(gaps, id) {
    for (let i = 0; i < gaps.length; i++) if (gaps[i].gap_id === id) return gaps[i];
    return null;
}

// ---- Test runner -----------------------------------------------------------

function runFitzWatchTests(verbose) {
    if (typeof detectGaps !== 'function') {
        console.error('Fitz Watch rules engine not loaded. Make sure fit-watch-rules.js is loaded before this test file.');
        return false;
    }

    let passed = 0;
    let failed = 0;
    function check(name, cond, detail) {
        if (_assert(name, cond, detail)) passed++; else failed++;
    }

    console.log('%c--- Fitz Watch rules engine — test suite ---', 'font-weight: bold; color: #f59e0b');

    // ============================================================
    // Test profile 1 — Known-bad (worst-case responses)
    // ============================================================
    console.log('%cProfile 1: Known-bad NSW restaurant, MA000119, annualised wages, all-worst responses', 'color: #94a3b8');
    const r1 = detectGaps(FW_TEST_PROFILE_KNOWN_BAD, FW_TEST_RESPONSES_KNOWN_BAD);
    if (verbose) console.table(r1.gaps.map(function(g) {
        return { id: g.gap_id, severity: g.severity, label: g.severity_label, action: g.fix_action };
    }));

    check('Known-bad: produces 20 gaps (12 AP + 4 WC + 4 PS, all rules trigger)', r1.gaps.length === 20, 'got ' + r1.gaps.length);
    check('Known-bad: outstanding is empty', r1.outstanding.length === 0);
    check('Known-bad: AP-001 critical (over 12 months)',
        _gapById(r1.gaps, 'AP-001') && _gapById(r1.gaps, 'AP-001').severity === 'critical');
    check('Known-bad: AP-002 critical with "Defence at risk" label',
        _gapById(r1.gaps, 'AP-002') && _gapById(r1.gaps, 'AP-002').severity === 'critical'
            && _gapById(r1.gaps, 'AP-002').severity_label === 'Defence at risk');
    check('Known-bad: AP-005 critical (stacking detected)',
        _gapById(r1.gaps, 'AP-005') && _gapById(r1.gaps, 'AP-005').severity === 'critical'
            && _gapById(r1.gaps, 'AP-005').severity_label === 'Stacking detected');
    check('Known-bad: AP-008 high (never reviewed)',
        _gapById(r1.gaps, 'AP-008') && _gapById(r1.gaps, 'AP-008').severity === 'high');
    check('Known-bad: AP-011 critical (yes — misclassified contractor)',
        _gapById(r1.gaps, 'AP-011') && _gapById(r1.gaps, 'AP-011').severity === 'critical');
    check('Known-bad: AP-012 high (yes — managers edit freely)',
        _gapById(r1.gaps, 'AP-012') && _gapById(r1.gaps, 'AP-012').severity === 'high');
    check('Known-bad: domain rollup = critical',
        rollupDomainSeverity(r1.gaps, 'award_pay') === 'critical');
    check('Known-bad: AP-001 fix_payload contains [VENUE CONTEXT]',
        _gapById(r1.gaps, 'AP-001').fix_payload.indexOf('[VENUE CONTEXT]') !== -1);
    check('Known-bad: AP-001 fix_payload contains [GAP CONTEXT]',
        _gapById(r1.gaps, 'AP-001').fix_payload.indexOf('[GAP CONTEXT]') !== -1);
    check('Known-bad: AP-001 fix_payload contains [ACTION]',
        _gapById(r1.gaps, 'AP-001').fix_payload.indexOf('[ACTION]') !== -1);
    check('Known-bad: AP-001 fix_payload contains venue staff details (24)',
        _gapById(r1.gaps, 'AP-001').fix_payload.indexOf('24') !== -1);
    check('Known-bad: every gap has a fix_payload',
        r1.gaps.every(function(g) { return typeof g.fix_payload === 'string' && g.fix_payload.length > 100; }));
    check('Known-bad: every gap has visual signal',
        r1.gaps.every(function(g) { return ['fix_now_in_fitz', 'needs_review', 'external'].indexOf(g.fix_action_visual_signal) !== -1; }));
    check('Known-bad: AP-002 routes to generate_doc with template ID',
        _gapById(r1.gaps, 'AP-002') && _gapById(r1.gaps, 'AP-002').fix_action === 'generate_doc'
            && _gapById(r1.gaps, 'AP-002').fix_payload_doc
            && _gapById(r1.gaps, 'AP-002').fix_payload_doc.templateId === 'clause_20_annualised_wage_agreement');
    check('Known-bad: AP-003 routes to generate_doc with template ID',
        _gapById(r1.gaps, 'AP-003') && _gapById(r1.gaps, 'AP-003').fix_action === 'generate_doc'
            && _gapById(r1.gaps, 'AP-003').fix_payload_doc
            && _gapById(r1.gaps, 'AP-003').fix_payload_doc.templateId === 'clause_20_weekly_time_record');

    // ============================================================
    // Test profile 2 — Known-OK (all-best responses)
    // ============================================================
    console.log('%cProfile 2: Known-OK — same venue, all-best responses', 'color: #94a3b8');
    const r2 = detectGaps(FW_TEST_PROFILE_KNOWN_OK, FW_TEST_RESPONSES_KNOWN_OK);
    if (verbose) console.log('Gaps:', r2.gaps.length, 'Outstanding:', r2.outstanding.length);

    check('Known-OK: produces 0 gaps', r2.gaps.length === 0, 'got ' + r2.gaps.length);
    check('Known-OK: outstanding is empty', r2.outstanding.length === 0);
    check('Known-OK: domain rollup = low',
        rollupDomainSeverity(r2.gaps, 'award_pay') === 'low');

    // ============================================================
    // Test profile 3 — Conditional filtering
    // ============================================================
    console.log('%cProfile 3: Conditional filtering (no annualised wage, no casuals)', 'color: #94a3b8');
    const r3 = detectGaps(FW_TEST_PROFILE_CONDITIONAL, {});
    if (verbose) console.log('Outstanding:', r3.outstanding.map(function(o) { return o.questionId; }));

    const outstandingIds = r3.outstanding.map(function(o) { return o.questionId; });
    check('Conditional: AP-002 NOT in outstanding (annualised_wage_used=no)',
        outstandingIds.indexOf('AP-002') === -1);
    check('Conditional: AP-003 NOT in outstanding', outstandingIds.indexOf('AP-003') === -1);
    check('Conditional: AP-004 NOT in outstanding', outstandingIds.indexOf('AP-004') === -1);
    check('Conditional: AP-008 NOT in outstanding (casual_count=0)',
        outstandingIds.indexOf('AP-008') === -1);
    check('Conditional: AP-006 IS in outstanding (part_time_count>0)',
        outstandingIds.indexOf('AP-006') !== -1);
    check('Conditional: AP-001 IS in outstanding (always applies)',
        outstandingIds.indexOf('AP-001') !== -1);
    check('Conditional: total applicable rules = 14 (8 AP + WC-001 + WC-003 + 4 PS; WC-002/004 NSW-only filtered out)',
        outstandingIds.length === 14, 'got ' + outstandingIds.length);
    check('Conditional: WC-002 NOT applicable to VIC venue',
        outstandingIds.indexOf('WC-002') === -1);
    check('Conditional: WC-004 NOT applicable to VIC venue',
        outstandingIds.indexOf('WC-004') === -1);
    check('Conditional: WC-001 IS applicable to all venues',
        outstandingIds.indexOf('WC-001') !== -1);

    // ============================================================
    // Test profile 4 — Severity escalation hook
    // ============================================================
    console.log('%cProfile 4: Severity escalation via activeReforms', 'color: #94a3b8');
    const fakeReform = {
        change_id: 'fake_test_reform',
        name: 'Test Reform 2026',
        recommended_actions: ['AP-001']
    };
    const r4 = detectGaps(FW_TEST_PROFILE_KNOWN_BAD, {
        'AP-001': _resp('6_to_12_months')  // would normally be medium
    }, [fakeReform]);
    check('Escalation: AP-001 bumped from medium to high when linked reform active',
        _gapById(r4.gaps, 'AP-001') && _gapById(r4.gaps, 'AP-001').severity === 'high');
    check('Escalation: urgency_driver updated to mention reform',
        _gapById(r4.gaps, 'AP-001').urgency_driver.indexOf('Reform') !== -1);

    const r5 = detectGaps(FW_TEST_PROFILE_KNOWN_BAD, {
        'AP-001': _resp('over_12_months')  // already critical
    }, [fakeReform]);
    check('Escalation: critical stays critical (capped)',
        _gapById(r5.gaps, 'AP-001').severity === 'critical');

    // ============================================================
    // Defensive — unknown response value
    // ============================================================
    console.log('%cDefensive: unknown response value', 'color: #94a3b8');
    const r6 = detectGaps(FW_TEST_PROFILE_KNOWN_BAD, {
        'AP-001': _resp('this_value_does_not_exist')
    });
    check('Defensive: unknown response produces gap at high severity (fallback)',
        _gapById(r6.gaps, 'AP-001') && _gapById(r6.gaps, 'AP-001').severity === 'high');

    // ============================================================
    // Staleness check
    // ============================================================
    console.log('%cStaleness check', 'color: #94a3b8');
    check('Stale: 31-day-old response with critical severity is stale (30d cadence)',
        isResponseStale(_resp('over_12_months', 31), 'critical') === true);
    check('Stale: 29-day-old response with critical severity is NOT stale',
        isResponseStale(_resp('over_12_months', 29), 'critical') === false);
    check('Stale: 70-day-old response with high severity is stale (60d cadence)',
        isResponseStale(_resp('partial', 70), 'high') === true);
    check('Stale: 50-day-old response with high severity is NOT stale',
        isResponseStale(_resp('partial', 50), 'high') === false);

    // ============================================================
    // Wrong-award detection on AP-005
    // ============================================================
    console.log('%cAP-005 wrong-award detection', 'color: #94a3b8');
    const r7 = detectGaps(FW_TEST_PROFILE_KNOWN_BAD, {  // MA000119
        'AP-005': _resp('225_all_inclusive_009')  // wrong rate for MA000119
    });
    check('AP-005: wrong-award rate produces critical gap',
        _gapById(r7.gaps, 'AP-005') && _gapById(r7.gaps, 'AP-005').severity === 'critical'
            && _gapById(r7.gaps, 'AP-005').severity_label === 'Wrong Award rate');

    const r8 = detectGaps(FW_TEST_PROFILE_KNOWN_BAD, {  // MA000119
        'AP-005': _resp('250_all_inclusive_119')  // correct rate
    });
    check('AP-005: correct rate produces no gap', _gapById(r8.gaps, 'AP-005') === null);

    // ============================================================
    // Phase 1a — Workers Comp domain
    // ============================================================
    console.log('%cPhase 1a: Workers Comp rules', 'color: #94a3b8');

    // Non-NSW venue — WC-002 and WC-004 should be filtered out
    const VIC_PROFILE = Object.assign({}, FW_TEST_PROFILE_KNOWN_BAD, { state: 'VIC' });
    const wcResultVic = detectGaps(VIC_PROFILE, {
        'WC-001': _resp('no'),
        'WC-003': _resp('no')
    }, []);
    const vicOutstandingIds = wcResultVic.outstanding.map(function(o) { return o.questionId; });
    check('VIC: WC-002 NOT in outstanding (NSW-only rule)',
        vicOutstandingIds.indexOf('WC-002') === -1);
    check('VIC: WC-004 NOT in outstanding (NSW-only rule)',
        vicOutstandingIds.indexOf('WC-004') === -1);
    check('VIC: WC-001 IS in gaps (universal rule)',
        wcResultVic.gaps.find(function(g) { return g.gap_id === 'WC-001'; }) != null);
    check('VIC: WC-001 "no" produces HIGH (not critical — non-NSW baseline)',
        wcResultVic.gaps.find(function(g) { return g.gap_id === 'WC-001'; }).severity === 'high');
    check('VIC: WC-003 "no" produces HIGH (not critical — non-NSW baseline)',
        wcResultVic.gaps.find(function(g) { return g.gap_id === 'WC-003'; }).severity === 'high');

    // NSW venue — WC-001 should escalate to critical for "no" response
    const NSW_PROFILE = Object.assign({}, FW_TEST_PROFILE_KNOWN_BAD, { state: 'NSW' });
    const wcResultNsw = detectGaps(NSW_PROFILE, {
        'WC-001': _resp('no'),
        'WC-002': _resp('unsure_need_help'),
        'WC-003': _resp('no'),
        'WC-004': _resp('no')
    }, []);
    const nswOutstandingIds = wcResultNsw.outstanding.map(function(o) { return o.questionId; });
    check('NSW: WC-002 NOT in outstanding (answered)',
        nswOutstandingIds.indexOf('WC-002') === -1);
    check('NSW: WC-004 IS available (NSW-specific rule)',
        wcResultNsw.gaps.find(function(g) { return g.gap_id === 'WC-004'; }) != null);
    check('NSW: WC-001 "no" produces CRITICAL (NSW heightened)',
        wcResultNsw.gaps.find(function(g) { return g.gap_id === 'WC-001'; }).severity === 'critical');
    check('NSW: WC-001 critical has "Defence at risk" label',
        wcResultNsw.gaps.find(function(g) { return g.gap_id === 'WC-001'; }).severity_label === 'Defence at risk');
    check('NSW: WC-003 "no" produces CRITICAL (NSW heightened)',
        wcResultNsw.gaps.find(function(g) { return g.gap_id === 'WC-003'; }).severity === 'critical');
    check('NSW: WC-004 "no" produces HIGH',
        wcResultNsw.gaps.find(function(g) { return g.gap_id === 'WC-004'; }).severity === 'high');
    check('NSW: WC-002 unsure produces MEDIUM',
        wcResultNsw.gaps.find(function(g) { return g.gap_id === 'WC-002'; }).severity === 'medium');

    // WC-001 "na" / "yes" produces no gap regardless of state
    const wcResultNa = detectGaps(NSW_PROFILE, {
        'WC-001': _resp('na'),
        'WC-003': _resp('yes')
    }, []);
    check('NSW: WC-001 "na" produces no gap',
        wcResultNa.gaps.find(function(g) { return g.gap_id === 'WC-001'; }) == null);
    check('NSW: WC-003 "yes" produces no gap',
        wcResultNa.gaps.find(function(g) { return g.gap_id === 'WC-003'; }) == null);

    // Workers Comp domain rollup
    check('NSW: workers_comp domain rollup = critical',
        rollupDomainSeverity(wcResultNsw.gaps, 'workers_comp') === 'critical');

    // ============================================================
    // Phase 1b — Payroll & Super domain
    // ============================================================
    console.log('%cPhase 1b: Payroll & Super rules', 'color: #94a3b8');

    const psResult = detectGaps(FW_TEST_PROFILE_KNOWN_BAD, {
        'PS-001': _resp('not_yet'),
        'PS-002': _resp('no'),
        'PS-003': _resp('partial'),
        'PS-004': _resp('no')
    }, []);

    // PS-001 — date-aware severity. Today is < 90 days from 2026-07-01 so
    // not_yet should be 'high' (or 'critical' if test runs post-commencement).
    const ps001 = psResult.gaps.find(function(g) { return g.gap_id === 'PS-001'; });
    const target = new Date('2026-07-01T00:00:00');
    const daysToCommencement = Math.floor((target.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    const expectedPs001 = daysToCommencement < 0 ? 'critical' : (daysToCommencement < 90 ? 'high' : 'medium');
    check('PS-001 not_yet severity matches days-to-commencement window',
        ps001 && ps001.severity === expectedPs001,
        'got ' + (ps001 && ps001.severity) + ' for ' + daysToCommencement + ' days until commencement');

    check('PS-002 "no" produces HIGH',
        psResult.gaps.find(function(g) { return g.gap_id === 'PS-002'; }).severity === 'high');
    check('PS-003 "partial" produces HIGH (super on OTE)',
        psResult.gaps.find(function(g) { return g.gap_id === 'PS-003'; }).severity === 'high');
    check('PS-004 "no" produces CRITICAL (7-year record retention)',
        psResult.gaps.find(function(g) { return g.gap_id === 'PS-004'; }).severity === 'critical');

    // All-good responses produce no gaps
    const psResultOk = detectGaps(FW_TEST_PROFILE_KNOWN_BAD, {
        'PS-001': _resp('yes'),
        'PS-002': _resp('yes'),
        'PS-003': _resp('yes'),
        'PS-004': _resp('yes')
    }, []);
    check('PS all-yes produces no gaps',
        psResultOk.gaps.filter(function(g) { return g.domain === 'payroll_super'; }).length === 0);

    // Payroll & Super applies universally — not state-gated
    check('payroll_super applies to all states (PS-001 in outstanding for VIC venue)',
        detectGaps(VIC_PROFILE, {}, []).outstanding.find(function(o) { return o.questionId === 'PS-001'; }) != null);

    // ============================================================
    // Registry sanity
    // ============================================================
    console.log('%cRegistry sanity', 'color: #94a3b8');
    const registry = getQuestionRegistry();
    check('Registry: 20 questions (12 AP + 4 WC + 4 PS)', registry.length === 20);
    check('Registry: every rule has id, domain, question, options, conditional, detect, statutoryAnchor, fixAction',
        registry.every(function(r) {
            return r.id && r.domain && r.question && Array.isArray(r.options)
                && typeof r.conditional === 'function' && typeof r.detect === 'function'
                && r.statutoryAnchor && r.fixAction;
        }));
    check('Registry: every rule has at least 3 options',
        registry.every(function(r) { return r.options.length >= 3; }));
    check('Registry: ids are unique',
        new Set(registry.map(function(r) { return r.id; })).size === 20);

    // ---- Summary -----------------------------------------------------------
    const total = passed + failed;
    const color = failed === 0 ? '#22c55e' : '#ef4444';
    console.log('%c' + passed + '/' + total + ' passed' + (failed > 0 ? '  (' + failed + ' failed)' : ''),
        'font-weight: bold; color: ' + color);
    return failed === 0;
}

if (typeof window !== 'undefined') {
    window.runFitzWatchTests = runFitzWatchTests;
    window.FW_TEST_PROFILE_KNOWN_BAD = FW_TEST_PROFILE_KNOWN_BAD;
    window.FW_TEST_PROFILE_KNOWN_OK = FW_TEST_PROFILE_KNOWN_OK;
    window.FW_TEST_PROFILE_CONDITIONAL = FW_TEST_PROFILE_CONDITIONAL;
    window.FW_TEST_RESPONSES_KNOWN_BAD = FW_TEST_RESPONSES_KNOWN_BAD;
    window.FW_TEST_RESPONSES_KNOWN_OK = FW_TEST_RESPONSES_KNOWN_OK;
}
