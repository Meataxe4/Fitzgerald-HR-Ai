/* ============================================================================
 * Fitz HR — Interactive Onboarding (React)
 * ----------------------------------------------------------------------------
 * A precompiled React flow (no Babel at runtime — authored directly with
 * React.createElement) that replaces the legacy 6-step vanilla modal with the
 * "Interactive Onboarding" prototype flow: welcome → award → setting →
 * team & location → AI "grounding" animation → ready (sample answer).
 *
 * It is wired to the live app, NOT a standalone demo:
 *   - Award tiles store the exact primaryAward string the app resolves
 *     downstream (registry fullName incl. MA code).
 *   - The "setting" step reuses window._orderedVenueOptionsForAward so the
 *     stored venueType is a real slug getVenueTypeLabel() understands.
 *   - Staff-count / state values match the legacy buckets exactly.
 *   - Completion routes through window.fitzOnboardingComplete /
 *     window.fitzOnboardingAwardReselect, which set venueProfile and call the
 *     existing completeOnboarding() pipeline (localStorage + Firebase sync +
 *     rate loading + welcome message).
 *
 * If React/ReactDOM fail to load (e.g. CDN unavailable), window.mountFitzOnboarding
 * is never defined and showOnboarding() falls back to the legacy modal — so
 * onboarding never breaks.
 * ========================================================================== */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!window.React || !window.ReactDOM || !window.ReactDOM.createRoot) {
    // React unavailable — leave window.mountFitzOnboarding undefined so the
    // caller falls back to the legacy vanilla onboarding modal.
    return;
  }

  var React = window.React;
  var ReactDOM = window.ReactDOM;
  var h = React.createElement;
  var useState = React.useState;
  var useEffect = React.useEffect;

  var M = (window.__resources && window.__resources.mascot) || '/assets/fitz-neon-transparent.png';

  // ── Award catalogue ────────────────────────────────────────────────────────
  // `award` is the value stored on venueProfile.primaryAward. These strings are
  // IDENTICAL to what the legacy modal stored, so every downstream consumer
  // (resolveAward, AWARD_VENUE_MAP / AWARD_COMMON_VENUES venue lists, rate
  // loading) behaves exactly as before. Hospitality/Restaurant intentionally
  // omit the MA code because AWARD_VENUE_MAP is keyed by the no-code string.
  var AWARDS = [
    { id: 'hospitality',   ind: 'Hospitality',     code: 'MA000009', award: 'Hospitality Industry (General) Award' },
    { id: 'restaurant',    ind: 'Restaurant',      code: 'MA000119', award: 'Restaurant Industry Award' },
    { id: 'retail',        ind: 'Retail',          code: 'MA000004', award: 'General Retail Industry Award MA000004' },
    { id: 'manufacturing', ind: 'Manufacturing',   code: 'MA000010', award: 'Manufacturing and Associated Industries Award' },
    { id: 'schads',        ind: 'SCHADS',          code: 'MA000100', award: 'Social, Community, Home Care and Disability Services Industry Award MA000100' },
    { id: 'health',        ind: 'Health Prof.',    code: 'MA000027', award: 'Health Professionals and Support Services Award MA000027' },
    { id: 'childrens',     ind: "Children's Svc.", code: 'MA000120', award: "Children's Services Award MA000120" }
  ];

  // What each award covers — shown when the operator taps "I'm not sure".
  var AWARD_HELP = [
    ['Hospitality', 'hotels, pubs, bars, clubs, resorts'],
    ['Restaurant', 'restaurants, cafés, bistros'],
    ['Retail', 'supermarkets, department & specialty stores'],
    ['Manufacturing', 'general manufacturing & associated industries'],
    ['SCHADS', 'community services, NDIS, aged & home care, disability'],
    ['Health Prof.', 'private hospitals, medical/dental & allied health'],
    ["Children's Svc.", 'long day care, preschools & OSHC']
  ];

  // Staff buckets — values match the legacy onboarding exactly so
  // showQuickActionPrompts() keeps working.
  var STAFF = [
    { v: '1-5',   l: '1–5 staff' },
    { v: '6-15',  l: '6–15 staff' },
    { v: '16-30', l: '16–30 staff' },
    { v: '30+',   l: '30+ staff' }
  ];
  var STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

  // Sample first-question answers for the "Ready" screen (illustrative preview).
  var SAMPLE = {
    hospitality:   { q: "What's the Saturday rate for a casual?", fig: '150%', note: 'of ordinary rate · incl. 25% casual loading', cl: 'cl. 29.2(b)' },
    restaurant:    { q: "What's the Sunday rate for a casual?", fig: '175%', note: 'of ordinary rate · incl. 25% casual loading', cl: 'cl. 24' },
    retail:        { q: "What's the public holiday rate?", fig: '225%', note: 'full-time / part-time', cl: 'cl. 22' },
    manufacturing: { q: "What's the afternoon shift loading?", fig: '+15%', note: 'afternoon shift · ordinary hours', cl: 'cl. 35' },
    schads:        { q: "What's the sleepover allowance?", fig: 'Loaded', note: 'per-night sleepover allowance grounded', cl: 'cl. 25.7' },
    health:        { q: 'How do annualised wages work?', fig: 'cl. 22', note: 'annualised wage arrangements grounded', cl: 'cl. 22' },
    childrens:     { q: "What's the educational leader allowance?", fig: 'Loaded', note: 'educational leader allowance grounded', cl: 'cl. 21' }
  };

  // ── Scoped styles (CSS vars + keyframes) ────────────────────────────────────
  var CSS =
    '#fitzOnboardingRoot{' +
    '--amber:#f59e0b;--amber-light:#fbbf24;--navy:#0f172a;--navy-2:#1e293b;--navy-4:#334155;' +
    '--white-08:rgba(255,255,255,.08);--white-30:rgba(255,255,255,.30);--white-60:rgba(255,255,255,.60);' +
    '--amber-12:rgba(245,158,11,.12);--amber-06:rgba(245,158,11,.06);--amber-rule:rgba(245,158,11,.35);' +
    '--success:#34d399;--bg-inset:#111827;' +
    'position:fixed;inset:0;z-index:2147483000;background:var(--navy);color:#e2e8f0;' +
    "font-family:'Outfit',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow-y:auto;overflow-x:hidden;" +
    '-webkit-font-smoothing:antialiased;}' +
    '#fitzOnboardingRoot *{box-sizing:border-box;}' +
    '#fitzOnboardingRoot button{font-family:inherit;}' +
    '@keyframes fitzFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}' +
    '@keyframes fitzBreathe{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}' +
    '@keyframes fitzRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}';

  function ensureStyles() {
    if (document.getElementById('fitz-onboarding-css')) return;
    var el = document.createElement('style');
    el.id = 'fitz-onboarding-css';
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  // ── Presentational pieces ───────────────────────────────────────────────────
  function Mascot(props) {
    var size = props.size || 72;
    var mode = props.mode || 'glow';
    var anim = mode === 'breathe' ? 'fitzBreathe 3s ease-in-out infinite'
      : mode === 'float' ? 'fitzFloat 3.5s ease-in-out infinite' : 'none';
    return h('span', {
      style: {
        display: 'inline-block', width: size, height: size,
        background: 'url("' + M + '") center/contain no-repeat',
        filter: mode === 'glow' ? 'drop-shadow(0 0 14px rgba(245,158,11,0.45))' : undefined,
        animation: anim, flexShrink: 0
      }
    });
  }

  function Progress(props) {
    return h('div', { style: { height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' } },
      h('div', {
        style: {
          height: '100%', width: props.pct + '%',
          background: 'linear-gradient(90deg,var(--amber),var(--amber-light))',
          boxShadow: '0 0 8px rgba(245,158,11,0.5)', transition: 'width .5s cubic-bezier(0.16,1,0.3,1)'
        }
      })
    );
  }

  function Eyebrow(props) {
    return h('div', {
      style: {
        fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', letterSpacing: '0.18em',
        textTransform: 'uppercase', color: 'var(--amber)', marginBottom: 12
      }
    }, props.children);
  }
  function Title(props) {
    return h('h1', {
      style: {
        fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: '1.85rem',
        lineHeight: 1.12, letterSpacing: '-0.01em', margin: '0 0 8px', color: '#fff'
      }
    }, props.children);
  }
  function Sub(props) {
    return h('p', { style: { color: 'var(--white-60)', fontSize: '0.98rem', lineHeight: 1.5, margin: '0 0 22px' } }, props.children);
  }

  function PrimaryBtn(props) {
    var hov = useState(false);
    var hovering = hov[0], setHov = hov[1];
    var disabled = !!props.disabled;
    return h('button', {
      onClick: disabled ? undefined : props.onClick,
      onMouseEnter: function () { setHov(true); },
      onMouseLeave: function () { setHov(false); },
      disabled: disabled,
      style: {
        position: 'relative', overflow: 'hidden', border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
        fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '0.9rem',
        letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.9rem 1.5rem',
        background: 'var(--amber)', color: (hovering && !disabled) ? 'var(--amber)' : 'var(--navy)',
        display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 2
      }
    },
      h('span', {
        style: {
          position: 'absolute', inset: 0, background: 'var(--navy)',
          transform: (hovering && !disabled) ? 'translateX(0)' : 'translateX(-101%)',
          transition: 'transform .45s cubic-bezier(0.16,1,0.3,1)'
        }
      }),
      h('span', { style: { position: 'relative', zIndex: 1 } }, props.children),
      h('span', {
        style: {
          position: 'relative', zIndex: 1, transition: 'transform .3s',
          transform: (hovering && !disabled) ? 'translateX(4px)' : 'none'
        }
      }, '→')
    );
  }

  function BackBtn(props) {
    return h('button', {
      onClick: props.onClick,
      style: {
        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--white-30)',
        fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', letterSpacing: '0.14em',
        textTransform: 'uppercase', padding: '0.9rem 0.4rem'
      }
    }, '← Back');
  }

  function Tile(props) {
    var hov = useState(false);
    var hovering = hov[0], setHov = hov[1];
    var sel = props.sel;
    var lit = sel || hovering;
    return h('button', {
      onClick: props.onClick,
      onMouseEnter: function () { setHov(true); },
      onMouseLeave: function () { setHov(false); },
      style: {
        textAlign: 'left', cursor: 'pointer',
        background: sel ? 'var(--amber-12)' : 'var(--navy-2)',
        border: '1px solid ' + (sel ? 'var(--amber)' : 'var(--white-08)'),
        boxShadow: sel ? '0 0 0 1px var(--amber)' : 'none',
        borderRadius: 12, padding: props.big ? '14px' : '12px 14px',
        transition: 'all .18s', transform: (hovering && !sel) ? 'translateY(-2px)' : 'none', position: 'relative'
      }
    },
      sel ? h('span', { style: { position: 'absolute', top: 12, right: 12, color: 'var(--amber)', fontWeight: 800, fontSize: '0.8rem' } }, '✓') : null,
      h('div', { style: { fontWeight: 700, fontSize: props.big ? '0.98rem' : '0.9rem', color: lit ? '#fff' : '#e2e8f0' } }, props.title),
      props.sub ? h('div', {
        style: {
          fontFamily: "'DM Mono',monospace", fontSize: '0.58rem', letterSpacing: '0.08em',
          color: sel ? 'var(--amber)' : 'var(--white-60)', marginTop: 3
        }
      }, props.sub) : null
    );
  }

  var box = { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' };

  // ── "AI thinking" grounding animation ──────────────────────────────────────
  function Building(props) {
    var award = props.award;
    var lines = ['Loading classification levels', 'Applying penalty & shift rates', 'Indexing allowances & loadings', 'Grounding document templates'];
    var st = useState(0);
    var i = st[0], setI = st[1];
    useEffect(function () {
      if (i < lines.length) {
        var t = setTimeout(function () { setI(i + 1); }, 620);
        return function () { clearTimeout(t); };
      }
      var t2 = setTimeout(props.onDone, 700);
      return function () { clearTimeout(t2); };
    }, [i]);
    return h('div', { style: { textAlign: 'center', maxWidth: 420 } },
      h(Mascot, { size: 96, mode: 'breathe' }),
      h('h1', { style: { fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: '1.6rem', margin: '20px 0 6px', color: '#fff' } },
        'Grounding Fitz in ', h('span', { style: { color: 'var(--amber)', fontStyle: 'italic' } }, award.ind), '…'),
      h('div', { style: { fontFamily: "'DM Mono',monospace", fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--white-30)', marginBottom: 24 } }, award.code),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', maxWidth: 300, margin: '0 auto' } },
        lines.map(function (l, idx) {
          return h('div', { key: l, style: { display: 'flex', alignItems: 'center', gap: 10, opacity: idx <= i ? 1 : 0.3, transition: 'opacity .3s' } },
            h('span', { style: { width: 16, textAlign: 'center', color: idx < i ? 'var(--success)' : 'var(--amber)', fontWeight: 700, fontSize: '0.8rem' } },
              idx < i ? '✓' : idx === i ? '•' : '·'),
            h('span', { style: { fontSize: '0.85rem', color: idx <= i ? '#e2e8f0' : 'var(--white-30)' } }, l)
          );
        })
      )
    );
  }

  // ── "Ready" — confirmation + sample answer ─────────────────────────────────
  function Ready(props) {
    var award = props.award;
    var asked = useState(false);
    var isAsked = asked[0], setAsked = asked[1];
    var s = SAMPLE[award.id] || SAMPLE.hospitality;
    var meta = [props.setting, props.team, props.state].filter(Boolean).join(' · ');
    return h('div', { style: { maxWidth: 520, width: '100%', animation: 'fitzRise .5s ease both' } },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 } },
        h(Mascot, { size: 56, mode: 'glow' }),
        h('div', null, h(Eyebrow, null, "You're all set"), h(Title, null, 'Fitz is grounded in your world.'))
      ),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 10, background: 'var(--amber-12)', border: '1px solid var(--amber)', borderRadius: 10, padding: '10px 12px', marginBottom: 16, flexWrap: 'wrap' } },
        h('span', { style: { width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)' } }),
        h('span', { style: { fontWeight: 700, fontSize: '0.95rem' } }, award.ind),
        h('span', { style: { fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', color: 'var(--white-60)', letterSpacing: '0.08em' } }, award.code),
        meta ? h('span', { style: { marginLeft: 'auto', fontFamily: "'DM Mono',monospace", fontSize: '0.55rem', color: 'var(--white-30)', letterSpacing: '0.08em', textTransform: 'uppercase' } }, meta) : null
      ),
      h('div', { style: { fontFamily: "'DM Mono',monospace", fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--white-30)', marginBottom: 10 } }, 'Try your first question'),
      !isAsked
        ? h('button', {
          onClick: function () { setAsked(true); },
          style: { width: '100%', textAlign: 'left', cursor: 'pointer', background: 'var(--navy-4)', border: '1px solid #334155', color: '#e2e8f0', borderRadius: 999, padding: '11px 16px', fontSize: '0.9rem', fontFamily: "'Outfit',sans-serif" }
        }, s.q)
        : h('div', { style: { background: 'var(--bg-inset)', borderRadius: '4px 16px 16px 16px', padding: '14px 16px', animation: 'fitzRise .4s ease both' } },
          h('div', { style: { color: 'var(--amber)', fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 } }, 'Fitz'),
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 14 } },
            h('span', { style: { fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: '2.4rem', color: 'var(--amber)', lineHeight: 1 } }, s.fig),
            h('span', { style: { fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.4 } }, s.note)
          ),
          h('div', { style: { display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12, background: 'var(--amber-06)', border: '1px solid var(--amber-rule)', borderRadius: 8, padding: '6px 10px' } },
            h('span', { style: { width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)' } }),
            h('span', { style: { fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', color: 'var(--amber)' } }, award.code + ' · ' + s.cl)
          )
        ),
      h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 24 } },
        h(PrimaryBtn, { onClick: props.onEnter }, 'Enter Fitz HR')
      )
    );
  }

  // ── Root flow ───────────────────────────────────────────────────────────────
  function App(props) {
    var reselect = !!props.reselect;

    var stepS = useState(reselect ? 1 : 0);
    var step = stepS[0], setStep = stepS[1];
    var venueS = useState(''); var venue = venueS[0], setVenue = venueS[1];
    var awardS = useState(null); var awardId = awardS[0], setAwardId = awardS[1];
    var settingS = useState(null); var setting = settingS[0], setSetting = settingS[1];
    var otherS = useState(''); var otherSetting = otherS[0], setOtherSetting = otherS[1];
    var teamS = useState(null); var team = teamS[0], setTeam = teamS[1];
    var stateS = useState(null); var stateVal = stateS[0], setStateVal = stateS[1];
    var helpS = useState(false); var showHelp = helpS[0], setShowHelp = helpS[1];

    var award = AWARDS.find(function (a) { return a.id === awardId; }) || null;

    // Venue options for the chosen award — real slugs the app understands.
    var venueOpts = (award && typeof window._orderedVenueOptionsForAward === 'function')
      ? window._orderedVenueOptionsForAward(award.award) : [];
    var commonOpts = venueOpts.slice(0, 4);
    var commonValues = commonOpts.map(function (o) { return o.value; });
    var restOpts = venueOpts.filter(function (o) { return commonValues.indexOf(o.value) === -1; });
    var effSetting = setting === '__other' ? otherSetting : setting;

    function go(n) { setStep(n); }
    function restart() {
      setStep(0); setVenue(''); setAwardId(null); setSetting(null);
      setOtherSetting(''); setTeam(null); setStateVal(null); setShowHelp(false);
    }

    // Human label for the chosen setting (for the Ready summary).
    var settingLabel = '';
    if (effSetting) {
      var found = venueOpts.find(function (o) { return o.value === effSetting; });
      settingLabel = found ? found.label : '';
    }

    function finish() {
      if (typeof window.fitzOnboardingComplete === 'function') {
        window.fitzOnboardingComplete({
          venueName: venue.trim(),
          primaryAward: award.award,
          venueType: effSetting,
          location: stateVal,
          staffCount: team
        });
      }
    }

    function confirmReselect() {
      if (typeof window.fitzOnboardingAwardReselect === 'function') {
        window.fitzOnboardingAwardReselect(award.award);
      }
    }

    var pct = [0, 15, 45, 72, 100, 100][step] != null ? [0, 15, 45, 72, 100, 100][step] : 100;
    var qTotal = 3;
    var stepLabel = (step >= 1 && step <= 3) ? ('Setup · ' + step + '/' + qTotal) : (step > 3 ? 'Ready' : 'Setup');

    // ---- header ----
    var header = h('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, padding: '18px 22px', zIndex: 5 } },
      h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } },
        h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 800, letterSpacing: '-0.05em', fontSize: '1.1rem' } },
          h(Mascot, { size: 26, mode: 'none' }),
          h('span', null,
            h('span', { style: { color: 'var(--amber)' } }, 'F'), 'itz',
            h('span', { style: { color: 'var(--amber)', marginLeft: '0.15em' } }, 'HR'))
        ),
        h('span', { style: { fontFamily: "'DM Mono',monospace", fontSize: '0.55rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--white-30)' } }, stepLabel)
      ),
      h(Progress, { pct: pct })
    );

    // ---- steps ----
    var content = null;

    if (step === 0) {
      var canStart = venue.trim();
      content = h('div', { style: { textAlign: 'center', maxWidth: 440, width: '100%', animation: 'fitzRise .5s ease both' } },
        h(Mascot, { size: 96, mode: 'float' }),
        h('h1', { style: { fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: '2.1rem', lineHeight: 1.08, margin: '18px 0 10px', color: '#fff' } },
          "Let's ground Fitz in ", h('span', { style: { color: 'var(--amber)', fontStyle: 'italic' } }, 'your'), ' world.'),
        h('p', { style: { color: 'var(--white-60)', fontSize: '1rem', lineHeight: 1.55, margin: '0 auto 22px', maxWidth: 360 } },
          'Three quick questions. After that, every answer, rate and document is grounded in your specific modern award — never a generic template.'),
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', marginBottom: 22 } },
          h('input', {
            type: 'text', value: venue, placeholder: 'Business name — e.g. The Golden Fork',
            onChange: function (e) { setVenue(e.target.value); },
            onKeyDown: function (e) { if (e.key === 'Enter' && canStart) go(1); },
            style: fieldStyle
          })
        ),
        h(PrimaryBtn, { disabled: !canStart, onClick: function () { go(1); } }, 'Get started · 90 seconds')
      );
    } else if (step === 1) {
      content = h('div', { style: { maxWidth: 560, width: '100%', animation: 'fitzRise .4s ease both' } },
        h(Eyebrow, null, reselect ? 'Re-select your award' : 'Question 1 of ' + qTotal),
        h(Title, null, 'Which award covers most of your staff?'),
        h(Sub, null, reselect
          ? 'Your previous award is no longer supported. Choose one below — Fitz needs it to give accurate, award-specific advice.'
          : 'This grounds everything Fitz tells you. Pick the closest — you can change it later.'),
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 } },
          AWARDS.map(function (a) {
            return h(Tile, {
              key: a.id, big: true, sel: awardId === a.id,
              onClick: function () { setAwardId(a.id); setSetting(null); setOtherSetting(''); setShowHelp(false); },
              title: a.ind, sub: a.code
            });
          }).concat([
            h(Tile, {
              key: '__notsure', big: true, sel: false,
              onClick: function () { setShowHelp(!showHelp); },
              title: "I'm not sure", sub: 'See what each award covers'
            })
          ])
        ),
        showHelp ? h('div', { style: { marginTop: 14, background: 'var(--navy-2)', border: '1px solid var(--white-08)', borderLeft: '3px solid var(--amber)', borderRadius: 8, padding: '13px 15px', fontSize: '0.83rem', color: '#e2e8f0', lineHeight: 1.6, animation: 'fitzRise .3s ease both' } },
          h('div', { style: { color: 'var(--amber)', fontWeight: 700, marginBottom: 6 } }, 'Match your business to an award:'),
          AWARD_HELP.map(function (row) {
            return h('div', { key: row[0], style: { marginBottom: 2 } },
              h('b', { style: { color: '#fff' } }, row[0]), ' — ' + row[1]);
          }),
          h('div', { style: { color: 'var(--white-60)', marginTop: 6 } }, 'Still unsure? Pick the closest match — you can change it anytime in Business Settings, and you can always ask Fitz.')
        ) : null,
        h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 } },
          reselect ? h('span', null) : h(BackBtn, { onClick: function () { go(0); } }),
          reselect
            ? h(PrimaryBtn, { disabled: !awardId, onClick: confirmReselect }, 'Confirm award')
            : h(PrimaryBtn, { disabled: !awardId, onClick: function () { go(2); } }, 'Continue')
        )
      );
    } else if (step === 2 && award) {
      var canContinue2 = setting && (setting !== '__other' || otherSetting);
      content = h('div', { style: { maxWidth: 520, width: '100%', animation: 'fitzRise .4s ease both' } },
        h(Eyebrow, null, 'Question 2 of 3 · ' + award.code),
        h(Title, null, "What's your setting?"),
        h(Sub, null, 'Fitz tailors classifications and examples to how ' + award.ind.toLowerCase() + ' businesses actually operate.'),
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 } },
          commonOpts.map(function (o) {
            return h(Tile, {
              key: o.value, big: true, sel: setting === o.value,
              onClick: function () { setSetting(o.value); setOtherSetting(''); },
              title: o.label
            });
          }).concat(restOpts.length ? [
            h(Tile, {
              key: '__other', big: true, sel: setting === '__other',
              onClick: function () { setSetting('__other'); },
              title: 'Other', sub: "My setting isn't listed"
            })
          ] : [])
        ),
        setting === '__other' ? h('div', { style: { marginTop: 14, animation: 'fitzRise .3s ease both' } },
          h('div', { style: { fontFamily: "'DM Mono',monospace", fontSize: '0.56rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--white-30)', marginBottom: 8 } }, 'Which best describes it?'),
          h('select', {
            value: otherSetting || '',
            onChange: function (e) { setOtherSetting(e.target.value || ''); },
            style: {
              width: '100%', appearance: 'none', WebkitAppearance: 'none',
              background: 'var(--navy-4)', border: '1px solid ' + (otherSetting ? 'var(--amber)' : '#334155'),
              borderRadius: 10, padding: '12px 14px', color: otherSetting ? '#fff' : 'var(--white-30)',
              fontSize: '0.92rem', fontFamily: "'Outfit',sans-serif", cursor: 'pointer', outline: 'none'
            }
          },
            [h('option', { key: '', value: '', disabled: true }, 'Choose a business type…')].concat(
              restOpts.map(function (o) { return h('option', { key: o.value, value: o.value, style: { color: '#111' } }, o.label); })
            )
          )
        ) : null,
        h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 } },
          h(BackBtn, { onClick: function () { go(1); } }),
          h(PrimaryBtn, { disabled: !canContinue2, onClick: function () { go(3); } }, 'Continue')
        )
      );
    } else if (step === 3) {
      var canBuild = team && stateVal;
      content = h('div', { style: { maxWidth: 520, width: '100%', animation: 'fitzRise .4s ease both' } },
        h(Eyebrow, null, 'Question ' + qTotal + ' of ' + qTotal),
        h(Title, null, 'Team size & location.'),
        h(Sub, null, 'Penalty rates and public holidays vary by state — this keeps Fitz accurate for you.'),
        h('div', { style: { fontFamily: "'DM Mono',monospace", fontSize: '0.56rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--white-30)', margin: '0 0 8px' } }, 'How many staff?'),
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 18 } },
          STAFF.map(function (sz) {
            return h(Tile, { key: sz.v, sel: team === sz.v, onClick: function () { setTeam(sz.v); }, title: sz.l });
          })
        ),
        h('div', { style: { fontFamily: "'DM Mono',monospace", fontSize: '0.56rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--white-30)', margin: '0 0 8px' } }, 'Which state?'),
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 8 } },
          STATES.map(function (st) {
            var sel = stateVal === st;
            return h('button', {
              key: st, onClick: function () { setStateVal(st); },
              style: {
                cursor: 'pointer', background: sel ? 'var(--amber)' : 'var(--navy-4)',
                color: sel ? 'var(--navy)' : '#e2e8f0', border: '1px solid ' + (sel ? 'var(--amber)' : '#334155'),
                borderRadius: 999, padding: '8px 15px', fontSize: '0.8rem', fontWeight: 600, fontFamily: "'Outfit',sans-serif"
              }
            }, st);
          })
        ),
        h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 } },
          h(BackBtn, { onClick: function () { go(2); } }),
          h(PrimaryBtn, { disabled: !canBuild, onClick: function () { go(4); } }, 'Build my profile')
        )
      );
    } else if (step === 4 && award) {
      content = h(Building, { award: award, onDone: function () { go(5); } });
    } else if (step === 5 && award) {
      content = h(Ready, {
        award: award, setting: settingLabel, team: (STAFF.find(function (s) { return s.v === team; }) || {}).l, state: stateVal,
        onEnter: finish, onRestart: restart
      });
    }

    return h('div', { style: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' } },
      h('div', { style: { position: 'absolute', width: 340, height: 340, borderRadius: '50%', filter: 'blur(90px)', background: 'rgba(245,158,11,0.07)', top: -100, right: -80, pointerEvents: 'none' } }),
      header,
      h('div', { style: box }, content)
    );
  }

  var fieldStyle = {
    width: '100%', background: 'var(--navy-4)', border: '1px solid #334155', borderRadius: 10,
    padding: '12px 14px', color: '#fff', fontSize: '0.95rem', fontFamily: "'Outfit',sans-serif", outline: 'none'
  };

  // ── Mount / unmount API ─────────────────────────────────────────────────────
  var _root = null;

  function getContainer() {
    var el = document.getElementById('fitzOnboardingRoot');
    if (!el) {
      el = document.createElement('div');
      el.id = 'fitzOnboardingRoot';
      document.body.appendChild(el);
    }
    return el;
  }

  window.mountFitzOnboarding = function (opts) {
    opts = opts || {};
    ensureStyles();
    var container = getContainer();
    container.style.display = 'block';
    if (!_root) _root = ReactDOM.createRoot(container);
    _root.render(h(App, { reselect: !!opts.reselect }));
  };

  window.__fitzOnboardingUnmount = function () {
    var container = document.getElementById('fitzOnboardingRoot');
    if (_root) { try { _root.unmount(); } catch (e) {} _root = null; }
    if (container) { container.style.display = 'none'; container.innerHTML = ''; }
  };
})();
