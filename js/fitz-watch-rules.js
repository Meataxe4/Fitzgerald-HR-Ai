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
        fixAction: 'generate_doc',
        fixPayloadDoc: { templateId: 'clause_20_annualised_wage_agreement' },
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
        fixAction: 'generate_doc',
        fixPayloadDoc: { templateId: 'clause_20_weekly_time_record' },
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
            { value: '225_all_inclusive_009',     label: '225% all-inclusive (MA000009 Hospitality)' },
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
            if (response === '225_all_inclusive_009') {
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
        question: 'When did you last review casual conversion eligibility for your casuals under FW Act s66B?',
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
    },

    // ========================================================================
    // PHASE 1a — Workers Compensation Readiness (Domain 3)
    // 4 rules per spec section 6. Severity escalation for NSW comes from the
    // regulatory countdown engine (nsw_wc_reform_2026 links WC-001/003/004
    // and commences 1 July 2026 — the activeReforms hook bumps severity for
    // venues with state=NSW during the 90-day pre-commencement window).
    // ========================================================================

    // WC-001 — Reasonable management action documentation -------------------
    {
        id: 'WC-001',
        domain: 'workers_comp',
        title: 'Reasonable management action documentation',
        question: 'For any performance management, disciplinary, or organisational change action taken in the last 12 months, do you have contemporaneous written documentation showing the basis for the action and the manner in which it was carried out?',
        options: [
            { value: 'yes',              label: 'Yes — all such actions are contemporaneously documented' },
            { value: 'partial',          label: 'Partial — some documented, some not' },
            { value: 'no',               label: 'No — no formal documentation' },
            { value: 'na',               label: 'Not applicable — no performance or disciplinary actions in the period' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'NSW Workers Compensation Act',
            section: '(post-1 July 2026 amendments); reasonable management action defence',
            jurisdiction: 'NSW (heightened); national (baseline)'
        },
        consequence: "The 'reasonable management action taken in a reasonable manner' defence collapses without contemporaneous documentation. Frequently challenged in psychological injury claims, particularly under the post-1 July 2026 NSW framework.",
        urgencyDriver: 'Documentation must be contemporaneous — retrospective documentation post-incident is treated as significantly weaker evidence.',
        affectedCount: function() { return null; },
        detect: function(response, profile) {
            const isNSW = String((profile || {}).state || (profile || {}).location || '').toUpperCase() === 'NSW';
            switch (response) {
                case 'yes':
                case 'na': return null;
                case 'partial': return { severity: isNSW ? 'high' : 'medium' };
                case 'no':
                case 'unsure_need_help': return { severity: isNSW ? 'critical' : 'high', severityLabel: isNSW ? 'Defence at risk' : 'Likely breach' };
                default: return { severity: 'high' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Help me build a reasonable management action documentation framework — what to capture before, during, and after any performance management or disciplinary conversation. Include the contemporaneous-documentation principle and the post-1 July 2026 NSW framework where applicable.'
    },

    // WC-002 — Insurance renewal awareness (NSW only) -----------------------
    {
        id: 'WC-002',
        domain: 'workers_comp',
        title: 'Workers compensation insurance renewal timing',
        question: 'When does your workers compensation insurance renew?',
        options: [
            { value: 'before_30_june_2026', label: 'Before 30 June 2026 (pre-reform excess arrangements apply)' },
            { value: 'on_or_after_30_june_2026', label: 'On or after 30 June 2026 (new excess arrangements apply)' },
            { value: 'unsure_need_help',      label: "I'm not sure" }
        ],
        conditional: function(profile) {
            const state = String((profile || {}).state || (profile || {}).location || '').toUpperCase();
            return state === 'NSW';
        },
        statutoryAnchor: {
            act: 'icare NSW',
            section: 'employer excess arrangements (1 July 2026 reform)',
            jurisdiction: 'NSW'
        },
        consequence: 'Renewal timing determines which employer excess framework applies — pre-reform vs. post-reform. Operational financial impact.',
        urgencyDriver: 'Confirm before next renewal cycle to budget accurately and ensure correct excess arrangements.',
        affectedCount: function() { return null; },
        detect: function(response) {
            switch (response) {
                case 'before_30_june_2026':
                case 'on_or_after_30_june_2026': return null;
                case 'unsure_need_help': return { severity: 'medium' };
                default: return { severity: 'medium' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Help me confirm my workers compensation renewal date and explain which employer excess framework will apply (pre-reform vs post-1 July 2026 NSW reform) and the operational financial impact.'
    },

    // WC-003 — Psychological injury claim management ------------------------
    {
        id: 'WC-003',
        domain: 'workers_comp',
        title: 'Psychological injury claim management process',
        question: 'Do you have a documented process for receiving, investigating, and responding to psychological injury claims and complaints?',
        options: [
            { value: 'yes',              label: 'Yes — documented process in place' },
            { value: 'partial',          label: 'Partial — informal process exists' },
            { value: 'no',               label: 'No — no documented process' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'NSW Workers Comp Act',
            section: 'psychological injury reforms (1 July 2026); SIRA guidance',
            jurisdiction: 'NSW (heightened); national (baseline)'
        },
        consequence: 'Frequently challenged in psychological injury claims — early documentation determines claim outcomes and premium impact. The post-1 July 2026 NSW framework adds a 31% WPI threshold and 130-week cap, raising the stakes.',
        urgencyDriver: 'Required to be in place before any claim is lodged. Reactive setup after a claim significantly weakens the response.',
        affectedCount: function() { return null; },
        // Phase 1b will swap this to generate_doc with template
        // 'psychological_injury_claim_procedure'.
        fixAction: 'ask_fitz',
        detect: function(response, profile) {
            const isNSW = String((profile || {}).state || (profile || {}).location || '').toUpperCase() === 'NSW';
            switch (response) {
                case 'yes': return null;
                case 'partial': return { severity: isNSW ? 'high' : 'medium' };
                case 'no':
                case 'unsure_need_help': return { severity: isNSW ? 'critical' : 'high' };
                default: return { severity: 'high' };
            }
        },
        defaultAction: 'Help me build a documented process for receiving, investigating, and responding to psychological injury claims and complaints. Include the post-1 July 2026 NSW framework (31% WPI threshold, 130-week cap, amended reasonable management action defence) and SIRA guidance.'
    },

    // WC-004 — Manager briefing on workers comp reforms (NSW only) ----------
    {
        id: 'WC-004',
        domain: 'workers_comp',
        title: 'Manager briefing on NSW workers comp reforms',
        question: 'Have you briefed your managers on the current NSW workers compensation framework — covering WPI thresholds, weekly-benefit caps, and the reasonable management action defence?',
        options: [
            { value: 'yes',              label: 'Yes — all managers briefed' },
            { value: 'partial',          label: 'Partial — some managers briefed' },
            { value: 'scheduled',        label: 'Scheduled — briefing planned but not delivered' },
            { value: 'no',               label: 'No — no briefing planned' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function(profile) {
            const state = String((profile || {}).state || (profile || {}).location || '').toUpperCase();
            return state === 'NSW';
        },
        statutoryAnchor: {
            act: 'NSW Workers Compensation Legislation Amendment Acts',
            section: '(Nov 2025 + Feb 2026)',
            jurisdiction: 'NSW'
        },
        consequence: 'Manager actions taken without awareness of the new framework risk undermining the reasonable management action defence — frequently challenged in psychological injury claims under the new framework.',
        urgencyDriver: 'Reform commences in less than 90 days. Manager training is the single highest-leverage preparation.',
        affectedCount: function() { return null; },
        detect: function(response) {
            switch (response) {
                case 'yes': return null;
                case 'partial':
                case 'scheduled': return { severity: 'medium' };
                case 'no':
                case 'unsure_need_help': return { severity: 'high' };
                default: return { severity: 'high' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Build me a manager briefing on the NSW workers comp reforms commencing 1 July 2026 — WPI thresholds, 130-week cap, amended reasonable management action defence ("significant cause" test). Include practical scenarios for hospitality managers.'
    },

    // ========================================================================
    // PHASE 1b — Payroll & Super (Domain 4)
    // 4 rules per spec section 7. Payday super commences 1 July 2026 (national);
    // PS-001 severity escalates as the date approaches and crosses commencement.
    // The reform record payday_super_2026 already links PS-001/002/003, so the
    // existing activeReforms hook adds a further bump during the 90-day window.
    // ========================================================================

    // PS-001 — Payday super configuration -----------------------------------
    {
        id: 'PS-001',
        domain: 'payroll_super',
        title: 'Payday super configuration',
        question: 'Is your payroll system configured to remit super at the same time as wages, as required under the payday super regime?',
        options: [
            { value: 'yes',              label: 'Yes — already configured and tested' },
            { value: 'scheduled',        label: 'Scheduled — work planned but not complete' },
            { value: 'not_yet',          label: 'Not yet — no work started' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Treasury Laws Amendment (Payday Super) Act',
            section: '(1 July 2026 commencement)',
            jurisdiction: 'national'
        },
        consequence: 'Triggers Super Guarantee Charge with ATO interest and admin components from the first missed payment. May also give rise to Fair Work Act exposure where super forms part of contractual or EA entitlements.',
        urgencyDriver: 'Commences in less than 90 days; configuration testing must happen before live cutover.',
        affectedCount: function(profile) { return profile && profile.staffCount ? profile.staffCount : null; },
        detect: function(response) {
            // Inline date check so severity stays correct even after the
            // activeReforms 30-day post-commencement window expires. Spec
            // section 7.1: not_yet escalates from medium (pre-window) to high
            // (<90 days pre-commencement) to critical (post-1 July 2026).
            const target = new Date('2026-07-01T00:00:00');
            const daysUntil = Math.floor((target.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            switch (response) {
                case 'yes': return null;
                case 'scheduled': return { severity: 'medium' };
                case 'not_yet':
                    if (daysUntil < 0) return { severity: 'critical', severityLabel: 'In force — not configured' };
                    if (daysUntil < 90) return { severity: 'high' };
                    return { severity: 'medium' };
                case 'unsure_need_help': return { severity: 'high' };
                default: return { severity: 'high' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Walk me through configuring payday super in my payroll software before 1 July 2026 commencement. Include the data points to test, the cutover plan, and what to do if my clearing house can\'t handle per-pay-cycle remittance.'
    },

    // PS-002 — Super clearing house capacity --------------------------------
    {
        id: 'PS-002',
        domain: 'payroll_super',
        title: 'Super clearing house capacity',
        question: 'Have you confirmed your super clearing house can handle weekly/fortnightly remittance frequency under the new payday super regime?',
        options: [
            { value: 'yes',              label: 'Yes — confirmed in writing with the clearing house' },
            { value: 'checking',         label: "Currently checking — haven't received confirmation yet" },
            { value: 'no',               label: 'No — clearing house can\'t handle the frequency' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'SuperStream compliance',
            section: 'employer obligations',
            jurisdiction: 'national'
        },
        consequence: 'Clearing house failures become ATO compliance events under payday super — the employer remains liable for the SGC regardless of clearing house failure.',
        urgencyDriver: 'Capacity confirmation required before 1 July 2026 cutover; smaller providers may struggle with the volume increase.',
        affectedCount: function() { return null; },
        detect: function(response) {
            switch (response) {
                case 'yes': return null;
                case 'checking': return { severity: 'medium' };
                case 'no': return { severity: 'high' };
                case 'unsure_need_help': return { severity: 'medium' };
                default: return { severity: 'medium' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'How do I confirm my super clearing house can handle per-pay-cycle remittance under payday super? Walk me through the questions to ask the provider and what to do if they can\'t.'
    },

    // PS-003 — Super on OTE compliance --------------------------------------
    {
        id: 'PS-003',
        domain: 'payroll_super',
        title: 'Super on Ordinary Time Earnings (OTE)',
        question: 'Are you paying Super Guarantee as per Australian Taxation Office guidance on all ordinary time earnings — including penalty rates on ordinary hours, casual loading, and leave loading?',
        options: [
            { value: 'yes',              label: 'Yes — super calculated on all OTE components' },
            { value: 'partial',          label: 'Partial — super on base but not all loadings/penalties' },
            { value: 'no',               label: 'No — super on base only' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Superannuation Guarantee (Administration) Act 1992',
            section: 'OTE definition; ATO ruling SGR 2009/2',
            jurisdiction: 'national'
        },
        consequence: 'ATO Super Guarantee Charge with admin components and interest payable. Back-pay super liability accumulates with every pay run — common audit finding under FWO/ATO joint operations.',
        urgencyDriver: 'Applies to every pay run; correction stops the accumulation immediately.',
        affectedCount: function(profile) { return profile && profile.staffCount ? profile.staffCount : null; },
        detect: function(response) {
            switch (response) {
                case 'yes': return null;
                case 'partial':
                case 'no':
                case 'unsure_need_help': return { severity: 'high' };
                default: return { severity: 'high' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Help me verify our super is calculated correctly on all Ordinary Time Earnings components per ATO ruling SGR 2009/2 — penalty rates on ordinary hours, casual loading, leave loading. Walk me through how to audit a recent pay run.'
    },

    // PS-004 — Record retention ---------------------------------------------
    {
        id: 'PS-004',
        domain: 'payroll_super',
        title: 'Time and wage record retention',
        question: 'Do you retain time and wage records for the period required under the Fair Work Regulations?',
        options: [
            { value: 'yes',              label: 'Yes — 7 years retained' },
            { value: 'partial',          label: 'Partial — some records retained, gaps exist' },
            { value: 'no',               label: "No — we don't retain records that long" },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Fair Work Act 2009',
            section: 's535; Fair Work Regulations reg 3.34, 3.42, 3.46',
            jurisdiction: 'national'
        },
        consequence: 'Without records, the employer cannot defend against an underpayment claim. Absence typically shifts evidentiary burden against employer for the entire affected period.',
        urgencyDriver: '7-year retention applies retrospectively; gaps in historical records compound exposure on any claim filed within the limitation period.',
        affectedCount: function() { return null; },
        detect: function(response) {
            switch (response) {
                case 'yes': return null;
                case 'partial':
                case 'unsure_need_help': return { severity: 'medium' };
                case 'no': return { severity: 'critical' };
                default: return { severity: 'medium' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Help me set up a 7-year retention framework for time and wage records under FW Act s535 and Fair Work Regulations. Cover storage, indexing, and what to do about gaps in historical records.'
    },

    // ========================================================================
    // PHASE 1e — Leave Management (Domain 6)
    // 4 rules per spec section 9. LM-002 wires up the existing Doc 3
    // (schedule_g_h_cash_out_agreement) that's been homeless since Sprint 4.
    // ========================================================================

    // LM-001 — Leave loading on termination payouts -------------------------
    {
        id: 'LM-001',
        domain: 'leave_management',
        title: 'Leave loading on termination payouts',
        question: 'Are leave loading payments correctly configured for accrued annual leave paid out on termination, including super on the loading?',
        options: [
            { value: 'yes',              label: 'Yes — leave loading + super on loading paid on termination' },
            { value: 'no',               label: 'No — base rate only, no loading paid' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Fair Work Act 2009',
            section: 's90 (termination payouts); MA000119/MA000009 leave loading clauses; ATO SGR 2009/2 (super on loading)',
            jurisdiction: 'national'
        },
        consequence: 'Common back-pay claim trigger when employees leave the business. Also creates super-on-leave-loading exposure under SGR 2009/2 — double exposure on top of the underpaid loading.',
        urgencyDriver: 'Triggered on every termination involving accrued leave; the next departure creates new exposure if unaddressed.',
        affectedCount: function(profile) { return profile && profile.staffCount ? profile.staffCount : null; },
        detect: function(response) {
            switch (response) {
                case 'yes': return null;
                case 'unsure_need_help': return { severity: 'medium' };
                case 'no': return { severity: 'critical' };
                default: return { severity: 'high' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Help me configure leave loading payments on termination correctly under MA000119/MA000009 — including the 17.5% standard Award rate (or shiftworker penalty if higher), and the super-on-loading obligation under SGR 2009/2. Cover both the going-forward fix and how to handle any historical underpayment.'
    },

    // LM-002 — Cashing out written agreements (wires Doc 3) -----------------
    {
        id: 'LM-002',
        domain: 'leave_management',
        title: 'Annual leave cash-out written agreements',
        question: 'For any annual leave cashed out, do you have a separate written agreement under Schedule G (MA000009) / Schedule H (MA000119) that leaves the employee with at least 4 weeks accrued?',
        options: [
            { value: 'yes',              label: 'Yes — written agreement for every cash-out, residual ≥ 4 weeks' },
            { value: 'no_cashing_out',   label: "Not applicable — we don't cash out leave" },
            { value: 'no',               label: 'No — we cash out without a written agreement' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Fair Work Act 2009',
            section: 's93 (4-week residual minimum); MA000119 Schedule H; MA000009 Schedule G',
            jurisdiction: 'national'
        },
        consequence: 'Unauthorised cash-out is a contravention of both NES and Award provisions — civil penalty exposure per contravention, plus any back-pay owed to restore the leave balance.',
        urgencyDriver: 'Triggered on every cash-out event; existing unauthorised cash-outs may require remediation.',
        affectedCount: function() { return null; },
        detect: function(response) {
            switch (response) {
                case 'yes':
                case 'no_cashing_out': return null;
                case 'unsure_need_help': return { severity: 'high' };
                case 'no': return { severity: 'critical' };
                default: return { severity: 'high' };
            }
        },
        // Wires up Doc 3 from Sprint 4 (built but previously homeless).
        fixAction: 'generate_doc',
        fixPayloadDoc: { templateId: 'schedule_g_h_cash_out_agreement' },
        defaultAction: 'Help me draft a Schedule G/H cash-out agreement for an employee. Must include the s93 4-week residual minimum check, the payment calculation (base rate + 17.5% loading or shiftworker penalty), and a clear single-use statement.'
    },

    // LM-003 — Excessive leave balance review -------------------------------
    {
        id: 'LM-003',
        domain: 'leave_management',
        title: 'Excessive leave balance review',
        question: 'Have you reviewed employees with excessive annual leave balances under the Award’s thresholds in the last 12 months?',
        options: [
            { value: 'yes',                  label: 'Yes — reviewed within the last 12 months' },
            { value: 'no_excess_balances',   label: 'Not applicable — no employees with excess balances' },
            { value: 'no',                   label: "No — haven't reviewed" },
            { value: 'unsure_need_help',     label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Modern Award',
            section: 'MA000119 / MA000009 excessive leave clauses',
            jurisdiction: 'national'
        },
        consequence: 'Accumulating leave liabilities create balance-sheet exposure and trigger formal consultation obligations once the threshold is exceeded.',
        urgencyDriver: 'Required every 12 months; the next review point is the trigger for any consultation process.',
        affectedCount: function() { return null; },
        detect: function(response) {
            switch (response) {
                case 'yes':
                case 'no_excess_balances': return null;
                case 'no':
                case 'unsure_need_help': return { severity: 'medium' };
                default: return { severity: 'medium' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Help me review employees with excessive annual leave balances under MA000119/MA000009 — the 8-week (non-shiftworker) / 10-week (shiftworker) thresholds — and walk me through the Award consultation process for directing employees to take leave.'
    },

    // LM-004 — Leave-in-advance written agreements --------------------------
    {
        id: 'LM-004',
        domain: 'leave_management',
        title: 'Leave-in-advance written agreements',
        question: 'For any annual leave taken in advance (before it has accrued), do you have a written agreement under Schedule G enabling deduction of the un-accrued leave on termination?',
        options: [
            { value: 'yes',                label: 'Yes — written agreement for every advance, with deduction authority' },
            { value: 'no_advance_leave',   label: "Not applicable — we don't grant leave in advance" },
            { value: 'no',                 label: 'No — we grant advance leave without a written agreement' },
            { value: 'unsure_need_help',   label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Fair Work Act 2009',
            section: 's324 (authorised deductions); MA000119 Schedule G',
            jurisdiction: 'national'
        },
        consequence: 'Without the written agreement, deducting un-accrued leave from final pay is an unauthorised deduction — exposes the employer to a back-pay claim for the deducted amount.',
        urgencyDriver: 'Required to be in place at the time leave-in-advance is granted; retrospective agreements are treated as weaker evidence.',
        affectedCount: function() { return null; },
        // Future Phase 2 doc: schedule_g_leave_in_advance_agreement. Until
        // that template ships, ask_fitz fallback.
        fixAction: 'ask_fitz',
        detect: function(response) {
            switch (response) {
                case 'yes':
                case 'no_advance_leave': return null;
                case 'no':
                case 'unsure_need_help': return { severity: 'high' };
                default: return { severity: 'high' };
            }
        },
        defaultAction: 'Help me draft a Schedule G leave-in-advance written agreement that satisfies FW Act s324 — must include the specific amount of leave, the recovery timeline, and the explicit deduction authority for any un-accrued balance on termination.'
    },

    // ========================================================================
    // PHASE 1d — Termination (Domain 5)
    // 4 rules per spec section 8. TM-001 / TM-002 are flagged generate_doc in
    // the spec but those templates (warning_procedure_policy,
    // employment_contract_probation_clause) aren't built yet. Shipping with
    // ask_fitz fallback; Phase 2 doc sprint will swap them.
    // ========================================================================

    // TM-001 — Warning procedure --------------------------------------------
    {
        id: 'TM-001',
        domain: 'termination',
        title: 'Warning procedure before termination',
        question: 'Do you have a documented procedure for issuing performance warnings before termination?',
        options: [
            { value: 'yes',              label: 'Yes — documented warning procedure in place' },
            { value: 'partial',          label: 'Partial — informal process, not documented' },
            { value: 'no',               label: 'No — no warning procedure' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Fair Work Act 2009',
            section: 'unfair dismissal jurisdiction; procedural fairness factors (Selvachandran)',
            jurisdiction: 'national'
        },
        consequence: 'Procedural fairness gaps significantly weaken unfair dismissal defence. Frequently challenged in unfair dismissal claims where documentation is missing.',
        urgencyDriver: 'Required to be in place before any performance conversation begins.',
        affectedCount: function() { return null; },
        detect: function(response) {
            switch (response) {
                case 'yes': return null;
                case 'partial':
                case 'unsure_need_help': return { severity: 'medium' };
                case 'no': return { severity: 'high' };
                default: return { severity: 'medium' };
            }
        },
        // Phase 2 doc: warning_procedure_policy + Warning Pack companion docs.
        fixAction: 'ask_fitz',
        defaultAction: 'Help me draft a warning procedure policy that meets the FWC unfair dismissal procedural fairness factors — including the stages (informal → first written warning → second → final → show-cause → termination), what each written warning must contain, and the procedural fairness requirements (right to representation, opportunity to respond, sufficient time to improve).'
    },

    // TM-002 — Probation period alignment with MEP --------------------------
    {
        id: 'TM-002',
        domain: 'termination',
        title: 'Probation period alignment with Minimum Employment Period',
        question: 'Does the probation period in your employment contracts align with the statutory Minimum Employment Period under FW Act s383 (which depends on your small-business status)?',
        options: [
            { value: 'yes',              label: 'Yes — probation matches the MEP' },
            { value: 'no',               label: 'No — mismatch between probation and MEP' },
            { value: 'na',               label: "Not applicable — we don't use probation periods" },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Fair Work Act 2009',
            section: 's383 (Minimum Employment Period); s23 (small business definition: <15 employees)',
            jurisdiction: 'national'
        },
        consequence: 'Mismatched probation creates operational confusion and weakens "decline to confirm" termination outcomes. Frequently litigated when probation periods extend beyond the MEP without legal review.',
        urgencyDriver: 'Applies to every new contract issued; the next hire creates new exposure if unaddressed.',
        affectedCount: function(profile) {
            const total = profile && (profile.staffCount || profile.employee_count_total);
            return total || null;
        },
        detect: function(response) {
            switch (response) {
                case 'yes':
                case 'na': return null;
                case 'no':
                case 'unsure_need_help': return { severity: 'medium' };
                default: return { severity: 'medium' };
            }
        },
        // Phase 2 doc: employment_contract_probation_clause.
        fixAction: 'ask_fitz',
        defaultAction: 'Help me draft a probation clause for our employment contracts that aligns with the statutory MEP under FW Act s383. Use my staff count to determine whether the 6-month (non-small business) or 12-month (small business, <15 employees) MEP applies, and walk me through how to handle the "decline to confirm" decision at the end of probation.'
    },

    // TM-003 — Notice period configuration -----------------------------------
    {
        id: 'TM-003',
        domain: 'termination',
        title: 'Notice period configuration (FW Act s117)',
        question: 'Are notice periods in your payroll and contracts configured correctly for the length-of-service tiers under FW Act s117, including the age-based uplift?',
        options: [
            { value: 'yes',              label: 'Yes — all tiers configured correctly' },
            { value: 'partial',          label: 'Partial — base tiers configured, age uplift missing' },
            { value: 'no',               label: 'No — incorrect or single-tier configuration' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Fair Work Act 2009',
            section: 's117 (notice of termination); MA000119 cl 35; MA000009 equivalent',
            jurisdiction: 'national'
        },
        consequence: 'Underpaid notice on termination creates per-employee back-pay claims. Common audit finding when employees leave the business.',
        urgencyDriver: 'Triggered on every termination; the next departure creates new exposure if unaddressed.',
        affectedCount: function(profile) { return profile && profile.staffCount ? profile.staffCount : null; },
        detect: function(response) {
            switch (response) {
                case 'yes': return null;
                case 'partial':
                case 'unsure_need_help': return { severity: 'medium' };
                case 'no': return { severity: 'high' };
                default: return { severity: 'medium' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Help me configure NES notice periods correctly across length-of-service tiers per FW Act s117 — including the over-45s + 2-years-of-service age uplift. Walk me through how to verify the current payroll configuration is right.'
    },

    // TM-004 — Termination documentation ------------------------------------
    {
        id: 'TM-004',
        domain: 'termination',
        title: 'Termination documentation retention',
        question: 'Do you keep complete termination files (warning records, performance documentation, written notice, final pay calculation) for the period required under the Fair Work Regulations?',
        options: [
            { value: 'yes',              label: 'Yes — complete files retained 7 years' },
            { value: 'partial',          label: 'Partial — some files retained' },
            { value: 'no',               label: 'No — minimal or no termination files retained' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Fair Work Act 2009',
            section: 's535 (record keeping); FWC unfair dismissal evidence requirements',
            jurisdiction: 'national'
        },
        consequence: 'Without complete termination files, employer cannot defend an unfair dismissal application. Frequently challenged in unfair dismissal claims where documentation is missing.',
        urgencyDriver: 'Required to be complete on the termination date; retrospective documentation is treated as significantly weaker evidence.',
        affectedCount: function() { return null; },
        detect: function(response) {
            switch (response) {
                case 'yes': return null;
                case 'partial': return { severity: 'medium' };
                case 'no':
                case 'unsure_need_help': return { severity: 'high' };
                default: return { severity: 'medium' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Help me set up a termination documentation framework that satisfies FW Act s535 and FWC unfair dismissal evidence requirements. Cover what to file (warning records, performance docs, written notice, final pay calc), how long to retain, and how to handle existing gaps in historical termination files.'
    },

    // ========================================================================
    // PHASE 1c — WHS & Psychosocial (Domain 2)
    // 6 rules per spec section 5. Vic has the Psychological Health
    // Regulations 2025 already in force (1 Dec 2025) — psychosocial rules
    // are heightened to critical for Vic venues regardless of reform date.
    // NSW's Codes-of-Practice enforceable benchmark (1 July 2026) lights
    // up via the existing nsw_codes_enforceable reform record which links
    // WHS-001..005 in recommended_actions — activeReforms hook bumps NSW
    // severity during the 90-day window.
    // ========================================================================

    // WHS-001 — Psychosocial hazard risk register ----------------------------
    {
        id: 'WHS-001',
        domain: 'whs_psychosocial',
        title: 'Psychosocial hazard risk register',
        question: 'Do you have a documented psychosocial hazard risk register for your venue, covering customer aggression, sexual harassment, high job demands, bullying, exposure to traumatic incidents, low support, fatigue, and isolation?',
        options: [
            { value: 'yes',              label: 'Yes — documented register in place' },
            { value: 'partial',          label: 'Partial — some hazards identified, no formal register' },
            { value: 'no',               label: 'No — no register' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'NSW Workplace Protections Act 2025; Vic OHS (Psychological Health) Regulations 2025; Model WHS framework',
            section: 'ISO 45003 reference; WorkSafe Vic Compliance Code for Psychological Health',
            jurisdiction: 'VIC (in force); NSW (Codes enforceable from 1 July 2026); national (Model WHS baseline)'
        },
        consequence: 'Required evidence in psychosocial hazard investigations — absence typically shifts evidentiary burden against the employer. WorkSafe Vic has actively prosecuted employers for psychosocial duty failures since November 2023.',
        urgencyDriver: 'Vic regulations already in force; NSW Codes of Practice become enforceable benchmark within the next quarter.',
        affectedCount: function() { return null; },
        detect: function(response, profile) {
            const state = String((profile || {}).state || (profile || {}).location || '').toUpperCase();
            const isVic = state === 'VIC';
            switch (response) {
                case 'yes': return null;
                case 'partial': return { severity: isVic ? 'high' : 'medium' };
                case 'no':
                case 'unsure_need_help': return { severity: isVic ? 'critical' : 'high' };
                default: return { severity: 'high' };
            }
        },
        // Phase 2 doc: psychosocial_risk_register.
        fixAction: 'ask_fitz',
        defaultAction: 'Help me draft a hospitality-specific psychosocial hazard risk register covering customer aggression, sexual harassment, high job demands, bullying, traumatic incidents, low support, fatigue, and isolation. Include the hierarchy of controls and a consultation record. Reference the Vic OHS (Psychological Health) Regulations 2025 and the Model WHS framework.'
    },

    // WHS-002 — Psychosocial risk control measures ---------------------------
    {
        id: 'WHS-002',
        domain: 'whs_psychosocial',
        title: 'Psychosocial risk control measures',
        question: 'Have you implemented controls following the hierarchy of controls (not relying on training or policies alone) for the psychosocial hazards in your register?',
        options: [
            { value: 'yes',              label: 'Yes — controls applied per hierarchy of controls' },
            { value: 'training_only',    label: 'Training and policies only — no engineering/admin controls' },
            { value: 'no',               label: 'No controls implemented' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        // Cross-rule conditional: only shows if WHS-001 was answered yes/partial.
        // If the user doesn't even have a register yet, asking about controls
        // for hazards-they-haven't-identified is premature.
        conditional: function(profile, responses) {
            const w1 = responses && responses['WHS-001'];
            return !!(w1 && (w1.response === 'yes' || w1.response === 'partial'));
        },
        statutoryAnchor: {
            act: 'Vic OHS (Psychological Health) Regulations 2025; Model WHS Act hierarchy of controls',
            section: 'reg 5 (control duty); elimination → substitution → engineering → admin → PPE/training',
            jurisdiction: 'VIC (in force); national (Model WHS baseline)'
        },
        consequence: "Training alone does not satisfy 'reasonably practicable' under the Vic regulations — WorkSafe Vic has prosecuted employers who relied predominantly on training as the psychosocial control.",
        urgencyDriver: 'Vic operators are already exposed; NSW operators move to enforceable benchmark within the next quarter.',
        affectedCount: function() { return null; },
        detect: function(response, profile) {
            const state = String((profile || {}).state || (profile || {}).location || '').toUpperCase();
            const isVic = state === 'VIC';
            switch (response) {
                case 'yes': return null;
                case 'training_only': return { severity: isVic ? 'critical' : 'high', severityLabel: 'Training-only is insufficient' };
                case 'no':
                case 'unsure_need_help': return { severity: 'critical' };
                default: return { severity: 'high' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Help me design hierarchy-of-controls measures for the psychosocial hazards in my venue beyond training — elimination, substitution, engineering, admin controls. Reference the Vic OHS (Psychological Health) Regulations 2025 requirement that training cannot be the predominant control.'
    },

    // WHS-003 — Bullying and harassment policy ------------------------------
    {
        id: 'WHS-003',
        domain: 'whs_psychosocial',
        title: 'Bullying, harassment, and sexual harassment policy',
        question: 'Do you have a current bullying, harassment, and sexual harassment policy with clear reporting pathways and consequences?',
        options: [
            { value: 'yes',              label: 'Yes — current policy in place' },
            { value: 'outdated',         label: 'Outdated — exists but hasn\'t been reviewed in years' },
            { value: 'no',               label: 'No — no policy' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Fair Work Act 2009 s789FC (anti-bullying jurisdiction); Sex Discrimination Act 1984; Respect@Work positive duty',
            section: 'positive duty under SDA s47C; AHRC guidance',
            jurisdiction: 'national'
        },
        consequence: 'Required for positive duty compliance and FWC anti-bullying defence — absence frequently cited as an aggravating factor in adverse findings.',
        urgencyDriver: 'Required to be current at the time of any complaint — outdated policies are treated as effectively absent.',
        affectedCount: function() { return null; },
        detect: function(response) {
            switch (response) {
                case 'yes': return null;
                case 'outdated': return { severity: 'medium' };
                case 'no':
                case 'unsure_need_help': return { severity: 'high' };
                default: return { severity: 'high' };
            }
        },
        // Phase 2 doc: bullying_harassment_policy.
        fixAction: 'ask_fitz',
        defaultAction: 'Help me draft a bullying, harassment, and sexual harassment policy that satisfies the positive duty under the Sex Discrimination Act and the FWC anti-bullying jurisdiction. Include reporting pathways (multiple, including external), the investigation procedure, confidentiality, victimisation protection, consequences for substantiated breaches, and training commitments.'
    },

    // WHS-004 — Customer aggression incident procedure ----------------------
    {
        id: 'WHS-004',
        domain: 'whs_psychosocial',
        title: 'Customer aggression incident procedure',
        question: 'Do you have written procedures for handling customer aggression incidents (verbal abuse, threats, physical violence) including reporting, escalation, and worker support?',
        options: [
            { value: 'yes',              label: 'Yes — documented procedures' },
            { value: 'partial',          label: 'Partial — informal practices, not documented' },
            { value: 'no',               label: 'No procedures' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        // Only applicable to licensed / late-night venues where customer
        // aggression is an identified psychosocial hazard.
        conditional: function(profile) {
            const venueType = String((profile || {}).venueType || '').toLowerCase();
            const aggressionExposedVenues = [
                'pub', 'bar', 'sports-bar', 'wine-bar', 'rooftop-bar',
                'distillery-bar', 'brewery', 'nightclub',
                'live-music-venue', 'entertainment-venue',
                'hotel-accommodation', 'boutique-hotel', 'motel', 'resort'
            ];
            return aggressionExposedVenues.indexOf(venueType) !== -1;
        },
        statutoryAnchor: {
            act: 'Model WHS Act s19 (primary duty)',
            section: 'psychosocial hazard regulations; State liquor licensing duties',
            jurisdiction: 'national'
        },
        consequence: 'Customer aggression is an identified psychosocial hazard in licensed venues — absence of procedures creates direct regulator exposure under WHS primary duty.',
        urgencyDriver: 'Applies every trading session; the next late-night shift creates new exposure.',
        affectedCount: function(profile) { return profile && profile.staffCount ? profile.staffCount : null; },
        detect: function(response) {
            switch (response) {
                case 'yes': return null;
                case 'partial': return { severity: 'medium' };
                case 'no':
                case 'unsure_need_help': return { severity: 'high' };
                default: return { severity: 'high' };
            }
        },
        // Phase 2 doc: customer_aggression_procedure.
        fixAction: 'ask_fitz',
        defaultAction: 'Help me draft customer aggression incident procedures for my licensed venue covering verbal aggression (de-escalation, withdrawal of service), threats of violence (000 protocol, evacuation), physical violence (police, scene security, worker support), post-incident worker support (immediate, 24-48h, ongoing), and the notifiable-incident assessment.'
    },

    // WHS-005 — Manager psychosocial training -------------------------------
    {
        id: 'WHS-005',
        domain: 'whs_psychosocial',
        title: 'Manager psychosocial training',
        question: "Have your managers been trained on psychosocial hazard identification, the 'reasonable management action taken reasonably' standard, and how to handle complaints?",
        options: [
            { value: 'yes',              label: 'Yes — all managers trained' },
            { value: 'partial',          label: 'Partial — some managers trained' },
            { value: 'no',               label: 'No — no manager training' },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Model WHS Act consultation duties',
            section: 'reasonable management action defence (NSW workers comp, post-1 July 2026)',
            jurisdiction: 'national (heightened in NSW)'
        },
        consequence: 'Untrained managers create vicarious liability for the venue and significantly weaken the reasonable management action defence — frequently challenged in psychological injury claims.',
        urgencyDriver: 'Each untrained manager performance conversation creates exposure on the conversation date.',
        affectedCount: function() { return null; },
        detect: function(response) {
            switch (response) {
                case 'yes': return null;
                case 'partial': return { severity: 'medium' };
                case 'no':
                case 'unsure_need_help': return { severity: 'high' };
                default: return { severity: 'medium' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Build me a psychosocial training brief for my venue managers — covering hazard identification, the "reasonable management action taken reasonably" standard, how to handle complaints, and how to document conversations contemporaneously for the workers comp defence.'
    },

    // WHS-006 — Notifiable incident reporting -------------------------------
    {
        id: 'WHS-006',
        domain: 'whs_psychosocial',
        title: 'Notifiable incident reporting',
        question: 'Do you know which incidents must be reported to the WHS regulator within the notification timeframes?',
        options: [
            { value: 'yes',              label: 'Yes — categories and timeframes are documented' },
            { value: 'partial',          label: 'Partial — some awareness, not formalised' },
            { value: 'no',               label: "No — we don't know the categories" },
            { value: 'unsure_need_help', label: "I'm not sure" }
        ],
        conditional: function() { return true; },
        statutoryAnchor: {
            act: 'Model WHS Act ss35-39 (notifiable incidents)',
            section: 'State WHS regulator notification timeframes',
            jurisdiction: 'national (varies by State)'
        },
        consequence: 'Failure to notify is a separate contravention — civil penalty exposure independent of the underlying incident.',
        urgencyDriver: 'Notification windows are tight (immediate for serious incidents); knowing the categories before an incident occurs is the only viable preparation.',
        affectedCount: function() { return null; },
        detect: function(response) {
            switch (response) {
                case 'yes': return null;
                case 'partial':
                case 'no':
                case 'unsure_need_help': return { severity: 'medium' };
                default: return { severity: 'medium' };
            }
        },
        fixAction: 'ask_fitz',
        defaultAction: 'Show me the notifiable incident categories and reporting timeframes for my state under the WHS Act ss35-39. Include practical hospitality examples (workplace injury, dangerous incident, fatality) and the immediate notification protocol.'
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
        fix_payload: buildFix(rule, response, profile),
        // For generate_doc rules — used by the Document Builder router
        fix_payload_doc: rule.fixPayloadDoc || null
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
        // Pass responses to conditional so cross-rule dependencies (e.g.
        // WHS-002 only shows if WHS-001 was answered yes/partial) can be
        // expressed cleanly. Existing rules ignore the second arg.
        if (typeof rule.conditional === 'function' && !rule.conditional(profile, responses)) continue;

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
