// ============================================================================
// FITZ WATCH — Regulatory countdown engine + public holiday data
// ----------------------------------------------------------------------------
// Sprint 5 (Step 10). Provides:
//   - loadRegulatoryChanges() — fetches regulatory-changes.json (cached)
//   - getApplicableReforms(profile) — filters by venue jurisdiction / award /
//     size, sorts by soonest commencement, returns array
//   - getActiveReformsForEscalation(profile) — subset where commencement is
//     <= 90 days away (passed into detectGaps for severity escalation per
//     spec section 11.4)
//   - getPublicHolidaysForState(state) — returns 2026 public holidays for
//     the given AU state, migrated from the (now-deleted) Compliance Calendar
// ============================================================================

let _fwRegulatoryChangesCache = null;
let _fwRegulatoryChangesPromise = null;

async function loadRegulatoryChanges() {
    if (_fwRegulatoryChangesCache) return _fwRegulatoryChangesCache;
    if (_fwRegulatoryChangesPromise) return _fwRegulatoryChangesPromise;
    _fwRegulatoryChangesPromise = fetch('/regulatory-changes.json', { cache: 'no-cache' })
        .then(function(r) { return r.ok ? r.json() : { changes: [] }; })
        .then(function(data) {
            _fwRegulatoryChangesCache = data && Array.isArray(data.changes) ? data : { changes: [] };
            return _fwRegulatoryChangesCache;
        })
        .catch(function(err) {
            console.warn('Fitz Watch: failed to load regulatory-changes.json', err);
            _fwRegulatoryChangesCache = { changes: [] };
            return _fwRegulatoryChangesCache;
        });
    return _fwRegulatoryChangesPromise;
}

function _fwDaysUntilDate(dateStr) {
    const target = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const ms = target.getTime() - now.getTime();
    return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function _fwReformApplies(reform, profile) {
    const state = profile.state || profile.location || null;
    const awards = (typeof expandAwardCoverage === 'function')
        ? expandAwardCoverage(profile.primaryAward)
        : [];
    const sizeClass = (profile.staffCount && Number(profile.staffCount) < 15) ? 'small_business' : 'non_small';

    // Jurisdiction
    if (reform.jurisdiction !== 'national' && reform.jurisdiction !== state) return false;
    // Award filter
    const reformAwards = Array.isArray(reform.affected_awards) ? reform.affected_awards : ['all'];
    if (reformAwards.indexOf('all') === -1) {
        const anyMatch = awards.some(function(a) { return reformAwards.indexOf(a) !== -1; });
        if (!anyMatch) return false;
    }
    // Employer size filter
    if (reform.affected_employer_size && reform.affected_employer_size !== 'all'
            && reform.affected_employer_size !== sizeClass) {
        return false;
    }
    // Time window — future or up to 30 days post-commencement
    const days = _fwDaysUntilDate(reform.commencement_date);
    if (days < -30) return false;
    return true;
}

async function getApplicableReforms(profile) {
    profile = profile || {};
    const data = await loadRegulatoryChanges();
    return data.changes
        .filter(function(r) { return _fwReformApplies(r, profile); })
        .sort(function(a, b) { return new Date(a.commencement_date) - new Date(b.commencement_date); });
}

async function getActiveReformsForEscalation(profile) {
    const list = await getApplicableReforms(profile);
    return list.filter(function(r) { return _fwDaysUntilDate(r.commencement_date) <= 90; });
}

// ----------------------------------------------------------------------------
// Public holidays 2026 — migrated from the deleted Compliance Calendar modal.
// Source: Australian Government Fair Work Ombudsman public holiday list.
// Add 2027 here when next quarterly review lands.
// ----------------------------------------------------------------------------
const FW_PUBLIC_HOLIDAYS_2026 = {
    NSW: [
        { date: '2026-01-01', name: "New Year's Day" },
        { date: '2026-01-26', name: 'Australia Day' },
        { date: '2026-04-03', name: 'Good Friday' },
        { date: '2026-04-04', name: 'Easter Saturday' },
        { date: '2026-04-05', name: 'Easter Sunday' },
        { date: '2026-04-06', name: 'Easter Monday' },
        { date: '2026-04-25', name: 'ANZAC Day' },
        { date: '2026-06-08', name: "King's Birthday" },
        { date: '2026-10-05', name: 'Labour Day' },
        { date: '2026-12-25', name: 'Christmas Day' },
        { date: '2026-12-26', name: 'Boxing Day' },
        { date: '2026-12-28', name: 'Additional Public Holiday (Boxing Day)' }
    ],
    VIC: [
        { date: '2026-01-01', name: "New Year's Day" },
        { date: '2026-01-26', name: 'Australia Day' },
        { date: '2026-03-09', name: 'Labour Day' },
        { date: '2026-04-03', name: 'Good Friday' },
        { date: '2026-04-04', name: 'Easter Saturday' },
        { date: '2026-04-05', name: 'Easter Sunday' },
        { date: '2026-04-06', name: 'Easter Monday' },
        { date: '2026-04-25', name: 'ANZAC Day' },
        { date: '2026-06-08', name: "King's Birthday" },
        { date: '2026-11-03', name: 'Melbourne Cup Day' },
        { date: '2026-12-25', name: 'Christmas Day' },
        { date: '2026-12-26', name: 'Boxing Day' },
        { date: '2026-12-28', name: 'Additional Public Holiday (Boxing Day)' }
    ],
    QLD: [
        { date: '2026-01-01', name: "New Year's Day" },
        { date: '2026-01-26', name: 'Australia Day' },
        { date: '2026-04-03', name: 'Good Friday' },
        { date: '2026-04-04', name: 'Easter Saturday' },
        { date: '2026-04-05', name: 'Easter Sunday' },
        { date: '2026-04-06', name: 'Easter Monday' },
        { date: '2026-04-25', name: 'ANZAC Day' },
        { date: '2026-05-04', name: 'Labour Day' },
        { date: '2026-08-12', name: 'Royal Queensland Show (Brisbane)' },
        { date: '2026-10-05', name: "King's Birthday" },
        { date: '2026-12-25', name: 'Christmas Day' },
        { date: '2026-12-26', name: 'Boxing Day' },
        { date: '2026-12-28', name: 'Additional Public Holiday (Boxing Day)' }
    ],
    WA: [
        { date: '2026-01-01', name: "New Year's Day" },
        { date: '2026-01-26', name: 'Australia Day' },
        { date: '2026-03-02', name: 'Labour Day' },
        { date: '2026-04-03', name: 'Good Friday' },
        { date: '2026-04-06', name: 'Easter Monday' },
        { date: '2026-04-25', name: 'ANZAC Day' },
        { date: '2026-06-01', name: 'Western Australia Day' },
        { date: '2026-09-28', name: "King's Birthday" },
        { date: '2026-12-25', name: 'Christmas Day' },
        { date: '2026-12-26', name: 'Boxing Day' },
        { date: '2026-12-28', name: 'Additional Public Holiday (Boxing Day)' }
    ],
    SA: [
        { date: '2026-01-01', name: "New Year's Day" },
        { date: '2026-01-26', name: 'Australia Day' },
        { date: '2026-03-09', name: 'Adelaide Cup Day' },
        { date: '2026-04-03', name: 'Good Friday' },
        { date: '2026-04-04', name: 'Easter Saturday' },
        { date: '2026-04-06', name: 'Easter Monday' },
        { date: '2026-04-25', name: 'ANZAC Day' },
        { date: '2026-06-08', name: "King's Birthday" },
        { date: '2026-10-05', name: 'Labour Day' },
        { date: '2026-12-24', name: 'Christmas Eve (part-day)' },
        { date: '2026-12-25', name: 'Christmas Day' },
        { date: '2026-12-26', name: 'Proclamation Day' },
        { date: '2026-12-28', name: 'Additional Public Holiday (Proclamation Day)' }
    ],
    TAS: [
        { date: '2026-01-01', name: "New Year's Day" },
        { date: '2026-01-26', name: 'Australia Day' },
        { date: '2026-02-09', name: 'Royal Hobart Regatta (Southern Tas)' },
        { date: '2026-03-09', name: 'Eight Hours Day' },
        { date: '2026-04-03', name: 'Good Friday' },
        { date: '2026-04-06', name: 'Easter Monday' },
        { date: '2026-04-07', name: 'Easter Tuesday (state-wide)' },
        { date: '2026-04-25', name: 'ANZAC Day' },
        { date: '2026-06-08', name: "King's Birthday" },
        { date: '2026-12-25', name: 'Christmas Day' },
        { date: '2026-12-26', name: 'Boxing Day' },
        { date: '2026-12-28', name: 'Additional Public Holiday (Boxing Day)' }
    ],
    NT: [
        { date: '2026-01-01', name: "New Year's Day" },
        { date: '2026-01-26', name: 'Australia Day' },
        { date: '2026-04-03', name: 'Good Friday' },
        { date: '2026-04-04', name: 'Easter Saturday' },
        { date: '2026-04-06', name: 'Easter Monday' },
        { date: '2026-04-25', name: 'ANZAC Day' },
        { date: '2026-05-04', name: 'May Day' },
        { date: '2026-06-08', name: "King's Birthday" },
        { date: '2026-08-03', name: 'Picnic Day' },
        { date: '2026-12-24', name: 'Christmas Eve (part-day)' },
        { date: '2026-12-25', name: 'Christmas Day' },
        { date: '2026-12-26', name: 'Boxing Day' },
        { date: '2026-12-28', name: 'Additional Public Holiday (Boxing Day)' },
        { date: '2026-12-31', name: "New Year's Eve (part-day)" }
    ],
    ACT: [
        { date: '2026-01-01', name: "New Year's Day" },
        { date: '2026-01-26', name: 'Australia Day' },
        { date: '2026-03-09', name: 'Canberra Day' },
        { date: '2026-04-03', name: 'Good Friday' },
        { date: '2026-04-04', name: 'Easter Saturday' },
        { date: '2026-04-05', name: 'Easter Sunday' },
        { date: '2026-04-06', name: 'Easter Monday' },
        { date: '2026-04-25', name: 'ANZAC Day' },
        { date: '2026-05-25', name: 'Reconciliation Day' },
        { date: '2026-06-08', name: "King's Birthday" },
        { date: '2026-09-28', name: "Labour Day (ACT calls it Family & Community Day from 2018; reverted to Labour Day)" },
        { date: '2026-10-05', name: 'Labour Day' },
        { date: '2026-12-25', name: 'Christmas Day' },
        { date: '2026-12-26', name: 'Boxing Day' },
        { date: '2026-12-28', name: 'Additional Public Holiday (Boxing Day)' }
    ]
};

function getPublicHolidaysForState(state) {
    if (!state) return [];
    const upper = String(state).toUpperCase();
    return FW_PUBLIC_HOLIDAYS_2026[upper] || [];
}

// Expose to window for use from app-main.js and devtools testing
if (typeof window !== 'undefined') {
    window.loadRegulatoryChanges = loadRegulatoryChanges;
    window.getApplicableReforms = getApplicableReforms;
    window.getActiveReformsForEscalation = getActiveReformsForEscalation;
    window.getPublicHolidaysForState = getPublicHolidaysForState;
    window._fwDaysUntilDate = _fwDaysUntilDate;
}
