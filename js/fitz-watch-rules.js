// ============================================================================
// FITZ WATCH — Gap detection rules engine
// ----------------------------------------------------------------------------
// Pure function. Deterministic. No Firestore reads, no AI calls, no DOM.
//
// detectGaps(profile, responses, activeReforms) returns { gaps, outstanding }.
// Sprint 3+ will wire this into the questionnaire UI, dashboard, home widget,
// and chat function. Sprint 2 ships the engine + a test harness only.
//
// Phase 0 scope: Award & Pay domain only (12 questions, AP-001 through AP-012).
// Severity escalation hook for time-based reform countdown is wired but a
// no-op until Step 10 supplies activeReforms.
// ============================================================================

// ---- Constants -------------------------------------------------------------

const FITZ_WATCH_SEVERITY_ORDER = ['low', 'medium', 'high', 'critical'];

const FITZ_WATCH_SEVERITY_LABELS = {
    critical: 'High risk if audited',
    high:     'Likely breach',
    medium:   'Process gap',
    low:      'Defensible'
};

const FITZ_WATCH_FIX_VISUAL_SIGNAL = {
    generate_doc: 'fix_now_in_fitz',
    ask_fitz:     'fix_now_in_fitz',
    fix_in_app:   'fix_now_in_fitz',
    review_now:   'needs_review',
    external:     'external'
};

// Re-attestation cadences (days) per spec section 11.2
const FITZ_WATCH_REATTESTATION_DAYS = {
    critical: 30,
    high:     60,
    medium:   90,
    low:      180
};

const FITZ_WATCH_SKIP_FOR_NOW_DAYS = 14;

// ---- Helpers ---------------------------------------------------------------

function bumpSeverity(current) {
    const idx = FITZ_WATCH_SEVERITY_ORDER.indexOf(current);
    if (idx === -1 || idx === FITZ_WATCH_SEVERITY_ORDER.length - 1) return current;
    return FITZ_WATCH_SEVERITY_ORDER[idx + 1];
}

function expandAwardCoverage(primaryAward) {
    if (!primaryAward) return [];
    const v = String(primaryAward).toUpperCase();
    const awards = [];
    if (v.indexOf('MA000119') !== -1 || v.indexOf('RESTAURANT') !== -1) awards.push('MA000119');
    if (v.indexOf('MA000009') !== -1 || v.indexOf('HOSPITALITY') !== -1) awards.push('MA000009');
    return awards;
}

function formatAwardCoverage(profile) {
    const awards = expandAwardCoverage(profile.primaryAward);
    if (awards.length === 0) return 'unspecified';
    if (awards.length === 1) {
        return awards[0] + (awards[0] === 'MA000119' ? ' (Restaurant Industry Award)' : ' (Hospitality Industry General Award)');
    }
    return awards.join(' & ');
}

function buildVenueContextBlock(profile) {
    const staffLine = profile.staffCount != null
        ? String(profile.staffCount) +
          (profile.casual_count != null
              ? ' (' + (profile.casual_count || 0) + ' casual, ' +
                       (profile.part_time_count || 0) + ' part-time, ' +
                       (profile.full_time_count || 0) + ' full-time)'
              : '')
        : 'unspecified';
    return [
        '[VENUE CONTEXT]',
        '- State: ' + (profile.state || profile.location || 'unspecified'),
        '- Award coverage: ' + formatAwardCoverage(profile),
        '- Venue type: ' + (profile.venueType || 'unspecified'),
        '- Total staff: ' + staffLine,
        '- Annualised wage in use: ' + (profile.annualised_wage_used || 'unspecified'),
        '- Payroll software: ' + (profile.payroll_software || 'unspecified'),
        '- Super clearing house: ' + (profile.super_clearing_house || 'unspecified'),
        '- Time records method: ' + (profile.time_records_method || 'unspecified')
    ].join('\n');
}

function buildGapContextBlock(rule, response, severity) {
    const anchor = rule.statutoryAnchor || {};
    const anchorParts = [];
    if (anchor.act)            anchorParts.push(anchor.act);
    if (anchor.section)        anchorParts.push(anchor.section);
    if (anchor.awardClauses)   anchorParts.push(anchor.awardClauses.join(' / '));
    return [
        '[GAP CONTEXT]',
        '- Question: ' + rule.question,
        '- Answer: ' + response,
        '- Statutory anchor: ' + (anchorParts.length ? anchorParts.join('; ') : 'see Award'),
        '- Severity: ' + severity + ' (' + (FITZ_WATCH_SEVERITY_LABELS[severity] || severity) + ')',
        '- Why this matters: ' + (rule.consequence || ''),
        '- Why now: ' + (rule.urgencyDriver || '')
    ].join('\n');
}

// Default fix payload builder for ask_fitz. Rules can override by providing
// their own fixPayloadBuilder for a tighter, more specific [ACTION] line.
function defaultFixPayloadBuilder(rule, response, profile) {
    const severity = response && rule.detect
        ? (rule.detect(response, profile) || { severity: 'medium' }).severity
        : 'medium';
    return [
        buildVenueContextBlock(profile),
        '',
        buildGapContextBlock(rule, response, severity),
        '',
        '[ACTION]',
        rule.defaultAction || ('Help me close this gap. Walk me through what to verify, what evidence to collect, and what to fix first.')
    ].join('\n');
}

// ---- Question registry (12 Award & Pay rules per spec section 4.1) ---------

const FITZ_WATCH_QUESTION_REGISTRY = [

    // AP-001 — Pay rate verification ----------------------------------------
    {
        id: 'AP-001',
        domain: 'award_pay',
        title: 'Award rate verification',
        question: 'When did you last verify your pay rates against the current Award?',
        options: [
            { value: 'within_6_months',   label: 'Within the last 6 months' },
            { value: '6_to_12_months',    label: '6 to 12 months ago' },
            { value: 'over_12_months',    label: 'Over 12 months ago' },
            { value: 'never',             label: 'Never' },
            { value: 'unsure_need_help',  label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Fair Work Act 2009',
            section: 's45 (Award contravention); s325 (deductions)',
            jurisdiction: 'national',
            awardClauses: ['MA000119 minimum rates', 'MA000009 minimum rates']
        },
        consequence: 'Most common trigger for FWO investigations in hospitality — outdated rates create per-pay-period contraventions across every affected employee.',
        urgencyDriver: 'Applies retrospectively to every pay cycle since the last rate update.',
        affectedCount: function(profile) { return profile.staffCount || null; },
        detect: function(response) {
            switch (response) {
                case 'within_6_months': return null;
                case '6_to_12_months':  return { severity: 'medium' };
                case 'over_12_months':
                case 'never':
                case 'unsure_need_help': return { severity: 'critical' };
                default: return { severity: 'high' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Walk me through verifying my current pay rates against the relevant Award minimum rates step-by-step. Identify any likely underpayment exposure based on my employee count and the time since my last verification. Tell me what I should check first.'
    },

    // AP-002 — Annualised wage written agreement ----------------------------
    {
        id: 'AP-002',
        domain: 'award_pay',
        title: 'Annualised wage written agreement',
        question: 'Do you have a written annualised wage agreement for each full-time employee on an annualised wage, specifying the wage amount, the absorbed Award provisions, and the outer-limit hours?',
        options: [
            { value: 'yes',              label: 'Yes — all three specifications in writing' },
            { value: 'partial',          label: 'Partial — some specifications missing' },
            { value: 'no',               label: 'No' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function(profile) { return profile.annualised_wage_used === 'yes'; },
        statutoryAnchor: {
            act: 'Fair Work Act 2009',
            section: 'MA000119 Clause 20.1(d) / MA000009 equivalent',
            jurisdiction: 'national',
            awardClauses: ['MA000119 cl 20.1(d)']
        },
        consequence: 'Annualised wage arrangement is not Award-compliant on its face without the three required specifications — burden shifts to employer to demonstrate compliance.',
        urgencyDriver: 'Applies to every annualised wage employee from day one of their engagement.',
        affectedCount: function(profile) { return profile.full_time_count || null; },
        detect: function(response) {
            switch (response) {
                case 'yes': return null;
                case 'partial':
                case 'unsure_need_help': return { severity: 'high', severityLabel: 'Documentation gap' };
                case 'no': return { severity: 'critical', severityLabel: 'Defence at risk' };
                default: return { severity: 'high' };
            }
        },
        // Phase 0 = ask_fitz. Step 9 (Sprint 4) will swap this to generate_doc
        // with templateId 'clause_20_annualised_wage_agreement'.
        fixAction: 'ask_fitz',
        defaultAction: 'Help me draft a Clause 20-compliant annualised wage agreement that lists the absorbed Award provisions, sets outer-limit hours, and meets MA000119 cl 20.1(d) requirements. Use my venue and full-time staff details from above.'
    },

    // AP-003 — Annualised wage signed weekly time records -------------------
    {
        id: 'AP-003',
        domain: 'award_pay',
        title: 'Annualised wage signed weekly time records',
        question: 'Do you keep signed weekly time records (start times, finish times, unpaid breaks) for each annualised wage employee, signed each pay period or roster cycle?',
        options: [
            { value: 'yes',              label: 'Yes — signed weekly' },
            { value: 'monthly_only',     label: 'Signed monthly only' },
            { value: 'no',               label: 'No signed time records' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function(profile) { return profile.annualised_wage_used === 'yes'; },
        statutoryAnchor: {
            act: 'Fair Work Act 2009',
            section: 's535; Fair Work Regulations reg 3.42',
            jurisdiction: 'national',
            awardClauses: ['MA000119 cl 20.2(c)']
        },
        consequence: 'Required evidence in any FWO audit — absence typically shifts evidentiary burden against employer. The annualised wage arrangement is non-compliant on its face without these records.',
        urgencyDriver: 'Required to be signed each pay period or roster cycle — overdue from the next pay run.',
        affectedCount: function(profile) { return profile.full_time_count || null; },
        detect: function(response) {
            switch (response) {
                case 'yes': return null;
                case 'monthly_only':
                case 'unsure_need_help':
                case 'no': return { severity: 'critical' };
                default: return { severity: 'high' };
            }
        },
        // Phase 0 = ask_fitz. Step 9 (Sprint 4) will swap this to generate_doc
        // with templateId 'clause_20_weekly_time_record'.
        fixAction: 'ask_fitz',
        defaultAction: 'Help me set up a Schedule G-compliant weekly time record template for our annualised wage staff. The template must capture start/finish times and unpaid breaks daily, total weekly hours, and have employee + employer signature lines. Reference MA000119 cl 20.2(c) and FW Act s535.'
    },

    // AP-004 — Annualised wage 12-month reconciliation ----------------------
    {
        id: 'AP-004',
        domain: 'award_pay',
        title: 'Annualised wage 12-month reconciliation',
        question: 'Have you performed a 12-month reconciliation of each annualised wage against actual hours worked × Award rates in the last 12 months?',
        options: [
            { value: 'yes',              label: 'Yes — completed within the last 12 months' },
            { value: 'overdue',          label: 'Overdue — past the 12-month mark' },
            { value: 'partial',          label: 'Partial — some employees reconciled, not all' },
            { value: 'no',               label: 'No reconciliation performed' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function(profile) { return profile.annualised_wage_used === 'yes'; },
        statutoryAnchor: {
            act: 'Fair Work Act 2009',
            section: 'MA000119 Clause 20.2(b)',
            jurisdiction: 'national',
            awardClauses: ['MA000119 cl 20.2(b)']
        },
        consequence: '14-day shortfall payment obligation triggers from the reconciliation date — overdue reconciliations create compounding back-pay liability.',
        urgencyDriver: 'Mandatory every 12 months from arrangement commencement; overdue creates immediate exposure.',
        affectedCount: function(profile) { return profile.full_time_count || null; },
        detect: function(response) {
            switch (response) {
                case 'yes': return null;
                case 'overdue':
                case 'unsure_need_help': return { severity: 'high' };
                case 'no':
                case 'partial': return { severity: 'critical' };
                default: return { severity: 'high' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Walk me through performing the 12-month annualised wage reconciliation for our full-time staff under MA000119 clause 20.2(b). I need the methodology, the data points to compare, and what to do if I find a shortfall (including the 14-day pay obligation).'
    },

    // AP-005 — Public holiday rate configuration ----------------------------
    {
        id: 'AP-005',
        domain: 'award_pay',
        title: 'Public holiday rate configuration',
        question: 'How is the casual public holiday rate configured in your payroll?',
        options: [
            { value: '250_all_inclusive_119',     label: '250% all-inclusive (MA000119 Restaurant)' },
            { value: '275_all_inclusive_009',     label: '275% all-inclusive (MA000009 Hospitality)' },
            { value: '25_loading_plus_penalty',   label: '25% casual loading + PH penalty stacked' },
            { value: 'unsure_need_help',          label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Modern Award',
            section: 'MA000119 cl 24.2(c) / MA000009 cl 29.2',
            jurisdiction: 'national',
            awardClauses: ['MA000119 cl 24.2(c)', 'MA000009 cl 29.2']
        },
        consequence: 'Either underpayment exposure (back-pay claims per public holiday per affected casual) or overpayment cost (silently bleeding cash). Both are operational risks.',
        urgencyDriver: 'Applies to every public holiday shift; impact compounds across the calendar year.',
        affectedCount: function(profile) { return profile.casual_count || null; },
        detect: function(response, profile) {
            if (response === '25_loading_plus_penalty') return { severity: 'critical', severityLabel: 'Stacking detected' };
            if (response === 'unsure_need_help') return { severity: 'high' };
            const awards = expandAwardCoverage(profile.primaryAward);
            if (response === '250_all_inclusive_119') {
                return awards.indexOf('MA000119') !== -1 ? null : { severity: 'critical', severityLabel: 'Wrong Award rate' };
            }
            if (response === '275_all_inclusive_009') {
                return awards.indexOf('MA000009') !== -1 ? null : { severity: 'critical', severityLabel: 'Wrong Award rate' };
            }
            return { severity: 'high' };
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Show me how to correctly configure the all-inclusive casual public holiday rate for my Award and remediate any over or under-payment from the existing configuration.'
    },

    // AP-006 — 4-hour minimum engagement on public holidays (FT/PT) ---------
    {
        id: 'AP-006',
        domain: 'award_pay',
        title: '4-hour minimum engagement on public holidays (FT/PT)',
        question: 'For full-time and part-time employees rostered to work on public holidays, is your payroll configured to pay a minimum of 4 hours regardless of actual hours worked?',
        options: [
            { value: 'yes',              label: 'Yes — 4-hour minimum enforced' },
            { value: 'no',               label: 'No — we pay actual hours only' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function(profile) {
            return (profile.full_time_count || 0) > 0 || (profile.part_time_count || 0) > 0;
        },
        statutoryAnchor: {
            act: 'Modern Award',
            section: 'MA000119 Clause 24.4',
            jurisdiction: 'national',
            awardClauses: ['MA000119 cl 24.4']
        },
        consequence: 'Per-public-holiday underpayment for every permanent rostered less than 4 hours — common back-pay claim trigger.',
        urgencyDriver: 'Triggers on every public holiday — next 7 national PHs alone could compound the gap.',
        affectedCount: function(profile) { return (profile.full_time_count || 0) + (profile.part_time_count || 0); },
        detect: function(response) {
            switch (response) {
                case 'yes': return null;
                case 'unsure_need_help': return { severity: 'medium' };
                case 'no': return { severity: 'critical' };
                default: return { severity: 'high' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Help me configure 4-hour minimum engagement for full-time and part-time staff on public holidays under MA000119 clause 24.4. Tell me how to back-pay any historical under-engagement.'
    },

    // AP-007 — Split shift allowance ----------------------------------------
    {
        id: 'AP-007',
        domain: 'award_pay',
        title: 'Split shift allowance',
        question: 'For employees working split shifts (a break of more than 1 hour mid-shift), are you paying the split shift allowance?',
        options: [
            { value: 'yes',              label: 'Yes — split shift allowance paid' },
            { value: 'no',               label: 'No — not currently paid' },
            { value: 'no_split_shifts',  label: "We don't use split shifts" },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Modern Award',
            section: 'MA000119 Clause 21.3 / MA000009 equivalent',
            jurisdiction: 'national',
            awardClauses: ['MA000119 cl 21.3']
        },
        consequence: 'Per-shift underpayment compounds across rosters — common back-pay claim trigger when employees leave the business.',
        urgencyDriver: 'Applies to every split shift rostered going forward.',
        affectedCount: function() { return null; },
        detect: function(response) {
            switch (response) {
                case 'yes':
                case 'no_split_shifts': return null;
                case 'unsure_need_help': return { severity: 'medium' };
                case 'no': return { severity: 'critical' };
                default: return { severity: 'high' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Help me configure the split shift allowance correctly under MA000119 clause 21.3 and remediate any historical underpayment from past rosters.'
    },

    // AP-008 — Casual conversion eligibility review -------------------------
    {
        id: 'AP-008',
        domain: 'award_pay',
        title: 'Casual conversion eligibility review',
        question: 'When did you last review casual conversion eligibility for your casuals under the post-February 2025 framework (FW Act s66B)?',
        options: [
            { value: 'within_6_months',  label: 'Within the last 6 months' },
            { value: '6_to_12_months',   label: '6 to 12 months ago' },
            { value: 'over_12_months',   label: 'Over 12 months ago' },
            { value: 'never',            label: 'Never' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function(profile) { return (profile.casual_count || 0) > 0; },
        statutoryAnchor: {
            act: 'Fair Work Act 2009',
            section: 's66B (post-26 Feb 2025)',
            jurisdiction: 'national',
            awardClauses: ['MA000119 cl 11.6']
        },
        consequence: 'Casual Employment Information Statement (CEIS) obligation may be overdue; missed conversion notifications can found general protections claims.',
        urgencyDriver: 'Required every 6 months for each eligible casual — backlog grows with every passing pay period.',
        affectedCount: function(profile) { return profile.casual_count || null; },
        detect: function(response) {
            switch (response) {
                case 'within_6_months': return null;
                case '6_to_12_months': return { severity: 'medium' };
                case 'over_12_months':
                case 'never':
                case 'unsure_need_help': return { severity: 'high' };
                default: return { severity: 'high' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Run a casual conversion eligibility review for my casuals under the post-February 2025 framework (FW Act s66B). Walk me through the eligibility criteria, the notification process, and a CEIS distribution check.'
    },

    // AP-009 — Pay slip compliance ------------------------------------------
    {
        id: 'AP-009',
        domain: 'award_pay',
        title: 'Pay slip compliance',
        question: 'Are pay slips provided to every employee within 1 working day of payment, showing all required elements (gross pay, hours, rate, allowances, leave loading, super contribution)?',
        options: [
            { value: 'yes',              label: 'Yes — fully compliant pay slips' },
            { value: 'partial',          label: 'Partial — some elements missing' },
            { value: 'no',               label: 'No — pay slips not provided / missing elements' },
            { value: 'unsure_need_help', label: "I'm not sure — help me work this out" },
            { value: 'skip_for_now',     label: "Skip for now (we'll ask again in 2 weeks)" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Fair Work Act 2009',
            section: 's536; Fair Work Regulations reg 3.46',
            jurisdiction: 'national'
        },
        consequence: 'Per-payslip contravention — civil penalty exposure scales with every employee and every pay run.',
        urgencyDriver: 'Applies to every pay run; the next pay cycle triggers the next contravention.',
        affectedCount: function(profile) { return profile.staffCount || null; },
        detect: function(response) {
            switch (response) {
                case 'yes': return null;
                case 'partial':
                case 'unsure_need_help': return { severity: 'medium' };
                case 'no': return { severity: 'critical' };
                case 'skip_for_now': return { severity: 'medium' };
                default: return { severity: 'high' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Help me set up FW Act s536-compliant pay slips for my venue, covering every required element (gross pay, hours, rate, allowances, leave loading, super contribution) and a 1-working-day delivery process.'
    },

    // AP-010 — Underpayment back-testing (killer trigger) -------------------
    {
        id: 'AP-010',
        domain: 'award_pay',
        title: 'Underpayment back-testing',
        question: 'Have you ever back-tested actual hours worked against what was actually paid over the last 12 months?',
        options: [
            { value: 'yes',              label: 'Yes — completed in the last 12 months' },
            { value: 'partial',          label: 'Partial — sampled some staff or some periods' },
            { value: 'no',               label: 'No back-test performed' },
            { value: 'unsure_need_help', label: "I'm not sure — help me work this out" },
            { value: 'skip_for_now',     label: "Skip for now (we'll ask again in 2 weeks)" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Fair Work Act 2009',
            section: 's535 (record keeping); s544 (6-year limitation)',
            jurisdiction: 'national'
        },
        consequence: 'Without back-testing, latent underpayment exposure accumulates silently. Most hospitality underpayment scandals emerge from undetected systematic errors over 12+ month periods.',
        urgencyDriver: '6-year limitation period under s544 means every month without a back-test increases the back-pay calculation if a contravention is later identified.',
        affectedCount: function(profile) { return profile.staffCount || null; },
        detect: function(response) {
            switch (response) {
                case 'yes': return null;
                case 'partial': return { severity: 'high' };
                case 'no':
                case 'unsure_need_help': return { severity: 'critical' };
                case 'skip_for_now': return { severity: 'high' };
                default: return { severity: 'high' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Walk me through a 12-month back-test of actual hours worked vs paid for my staff under MA000119/MA000009 — the methodology, the data I need to extract from my payroll software, what I should check first, and how to record the audit trail.'
    },

    // AP-011 — Contractor misclassification (killer trigger) ----------------
    {
        id: 'AP-011',
        domain: 'award_pay',
        title: 'Contractor misclassification',
        question: 'Do you engage any contractors who work regular shifts under your direction (e.g., regular weekly hours, you set the roster, they use your equipment, they don\'t operate an independent business with their own ABN and other clients)?',
        options: [
            { value: 'no',               label: "No contractors / contractors are clearly independent businesses" },
            { value: 'na',               label: 'Not applicable to my venue' },
            { value: 'yes',              label: 'Yes — at least one looks like an employee in practice' },
            { value: 'unsure_need_help', label: "I'm not sure — help me work this out" },
            { value: 'skip_for_now',     label: "Skip for now (we'll ask again in 2 weeks)" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Fair Work Act 2009',
            section: 's357 (sham contracting); ATO PSI framework',
            jurisdiction: 'national'
        },
        consequence: 'Sham contracting under s357 carries individual civil penalties up to $99K and per-contractor back-pay exposure (Award rates, super, leave entitlements). The FWO and ATO actively investigate hospitality misclassification.',
        urgencyDriver: 'Each pay period of misclassification adds to back-pay exposure; remediation pathway exists but requires action.',
        affectedCount: function() { return null; },
        detect: function(response) {
            switch (response) {
                case 'no':
                case 'na': return null;
                case 'yes': return { severity: 'critical' };
                case 'unsure_need_help':
                case 'skip_for_now': return { severity: 'high' };
                default: return { severity: 'high' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Help me assess whether any of my contractors should be classified as employees under the multi-factor test. Walk me through each factor with my venue context, identify red flags, and outline the remediation pathway if any are misclassified.'
    },

    // AP-012 — Timesheet alteration audit trail (killer trigger) ------------
    {
        id: 'AP-012',
        domain: 'award_pay',
        title: 'Timesheet alteration audit trail',
        question: 'Can managers edit employee time records after submission without an audit trail of who changed what and when?',
        options: [
            { value: 'no',               label: 'No — all edits are audit-trailed' },
            { value: 'sometimes',        label: 'Sometimes — limited audit trail' },
            { value: 'yes',              label: 'Yes — managers can edit freely with no log' },
            { value: 'unsure_need_help', label: "I'm not sure — help me work this out" },
            { value: 'skip_for_now',     label: "Skip for now (we'll ask again in 2 weeks)" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Fair Work Act 2009',
            section: 's535 (record keeping)',
            jurisdiction: 'national'
        },
        consequence: 'Unaudited timesheet alteration is a common FWO investigation finding. Once detected, it shifts the evidentiary burden against the employer for the entire affected period and can trigger formal investigation.',
        urgencyDriver: 'Affects record integrity from the next pay cycle forward; historical alterations may need to be reviewed for any active claim.',
        affectedCount: function(profile) { return profile.staffCount || null; },
        detect: function(response) {
            switch (response) {
                case 'no': return null;
                case 'sometimes':
                case 'yes': return { severity: 'high' };
                case 'unsure_need_help':
                case 'skip_for_now': return { severity: 'medium' };
                default: return { severity: 'medium' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Help me set up an audit-trail system for time record edits so managers can correct genuine errors without compromising record integrity under FW Act s535. Cover the controls, the log format, and the review cadence.'
    }
];

function getQuestionRegistry() {
    return FITZ_WATCH_QUESTION_REGISTRY;
}

function getQuestionById(questionId) {
    for (let i = 0; i < FITZ_WATCH_QUESTION_REGISTRY.length; i++) {
        if (FITZ_WATCH_QUESTION_REGISTRY[i].id === questionId) {
            return FITZ_WATCH_QUESTION_REGISTRY[i];
        }
    }
    return null;
}

// ---- Gap object builder ----------------------------------------------------

function buildGapObject(rule, gapFields, response, profile, activeReforms) {
    let severity = gapFields.severity || 'medium';
    let severityLabel = gapFields.severityLabel || FITZ_WATCH_SEVERITY_LABELS[severity];
    let urgencyDriver = rule.urgencyDriver || '';

    // Severity escalation hook (spec section 11.4) — bump if a reform with
    // commencement < 90 days links to this gap_id via recommended_actions.
    const linkedReforms = (activeReforms || []).filter(function(r) {
        return Array.isArray(r.recommended_actions) && r.recommended_actions.indexOf(rule.id) !== -1;
    });
    if (linkedReforms.length > 0) {
        severity = bumpSeverity(severity);
        severityLabel = FITZ_WATCH_SEVERITY_LABELS[severity];
        const soonest = linkedReforms[0];
        urgencyDriver = 'Reform commences soon (' + soonest.name + ') — severity escalated';
    }

    const fixAction = rule.fixAction || 'ask_fitz';
    const visualSignal = FITZ_WATCH_FIX_VISUAL_SIGNAL[fixAction] || 'fix_now_in_fitz';
    const affectedCount = typeof rule.affectedCount === 'function'
        ? rule.affectedCount(profile)
        : (rule.affectedCount != null ? rule.affectedCount : null);

    // Fix payload — rules may provide a custom builder, otherwise use default.
    const buildFix = typeof rule.fixPayloadBuilder === 'function'
        ? rule.fixPayloadBuilder
        : defaultFixPayloadBuilder;

    return {
        gap_id: rule.id,
        domain: rule.domain,
        severity: severity,
        severity_label: severityLabel,
        title: rule.title,
        statutory_anchor: rule.statutoryAnchor || {},
        consequence: rule.consequence || '',
        urgency_driver: urgencyDriver,
        affected_count: affectedCount,
        fixable_in_app: fixAction !== 'external',
        fix_action: fixAction,
        fix_action_visual_signal: visualSignal,
        fix_payload: buildFix(rule, response, profile)
    };
}

// ---- Main detection function ----------------------------------------------

function detectGaps(profile, responses, activeReforms) {
    profile = profile || {};
    responses = responses || {};
    activeReforms = activeReforms || [];

    const gaps = [];
    const outstanding = [];

    for (let i = 0; i < FITZ_WATCH_QUESTION_REGISTRY.length; i++) {
        const rule = FITZ_WATCH_QUESTION_REGISTRY[i];
        if (typeof rule.conditional === 'function' && !rule.conditional(profile)) continue;

        const responseDoc = responses[rule.id];
        if (!responseDoc) {
            outstanding.push({ questionId: rule.id, domain: rule.domain, title: rule.title });
            continue;
        }

        const responseValue = responseDoc.response;
        const gapFields = rule.detect ? rule.detect(responseValue, profile) : null;
        if (!gapFields) continue;

        gaps.push(buildGapObject(rule, gapFields, responseValue, profile, activeReforms));
    }

    return { gaps: gaps, outstanding: outstanding };
}

// ---- Domain severity rollup (spec section 4.2) ----------------------------

function rollupDomainSeverity(gaps, domain) {
    const domainGaps = (gaps || []).filter(function(g) { return g.domain === domain; });
    if (domainGaps.length === 0) return 'low';
    if (domainGaps.some(function(g) { return g.severity === 'critical'; })) return 'critical';
    if (domainGaps.some(function(g) { return g.severity === 'high'; }))     return 'high';
    if (domainGaps.some(function(g) { return g.severity === 'medium'; }))   return 'medium';
    return 'low';
}

// ---- Staleness check (spec section 11.2) -----------------------------------

function isResponseStale(responseDoc, gapSeverity) {
    if (!responseDoc || !responseDoc.lastAnsweredAt) return false;
    // Convert Firestore Timestamp to ms if needed
    const lastMs = typeof responseDoc.lastAnsweredAt.toMillis === 'function'
        ? responseDoc.lastAnsweredAt.toMillis()
        : (responseDoc.lastAnsweredAt instanceof Date
            ? responseDoc.lastAnsweredAt.getTime()
            : Number(responseDoc.lastAnsweredAt));
    if (!lastMs || isNaN(lastMs)) return false;

    if (responseDoc.response === 'skip_for_now' && responseDoc.skipUntil) {
        const skipMs = typeof responseDoc.skipUntil.toMillis === 'function'
            ? responseDoc.skipUntil.toMillis()
            : Number(responseDoc.skipUntil);
        return skipMs < Date.now();
    }

    const cadenceDays = FITZ_WATCH_REATTESTATION_DAYS[gapSeverity || 'medium'] || 90;
    const ageMs = Date.now() - lastMs;
    return ageMs > cadenceDays * 24 * 60 * 60 * 1000;
}

// ---- Expose to window for Sprint 3+ wiring and devtools testing -----------

if (typeof window !== 'undefined') {
    window.detectGaps = detectGaps;
    window.getQuestionRegistry = getQuestionRegistry;
    window.getQuestionById = getQuestionById;
    window.rollupDomainSeverity = rollupDomainSeverity;
    window.isResponseStale = isResponseStale;
    window.bumpSeverity = bumpSeverity;
    window.expandAwardCoverage = expandAwardCoverage;
    window.buildVenueContextBlock = buildVenueContextBlock;
    window.FITZ_WATCH_SEVERITY_LABELS = FITZ_WATCH_SEVERITY_LABELS;
    window.FITZ_WATCH_FIX_VISUAL_SIGNAL = FITZ_WATCH_FIX_VISUAL_SIGNAL;
}
