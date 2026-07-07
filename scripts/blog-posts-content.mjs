// Content model for the award blog-post generator (scripts/build-award-blog-posts.mjs).
// Each post: SEO meta + topic-specific body. Data tables/figures are pulled from
// the rates JSON at build time via the `h` helpers so figures stay accurate.

export const AWARD_META = {
  retail:        { code: 'MA000004', file: 'retail-award-rates.json',        short: 'Retail Award',                 vertical: 'retail' },
  manufacturing: { code: 'MA000010', file: 'manufacturing-award-rates.json', short: 'Manufacturing Award',           vertical: 'manufacturing' },
  schads:        { code: 'MA000100', file: 'schads-award-rates.json',        short: 'SCHADS Award',                 vertical: 'schads' },
  health:        { code: 'MA000027', file: 'health-award-rates.json',        short: 'Health Professionals Award',    vertical: 'health' },
  childrens:     { code: 'MA000120', file: 'childrens-award-rates.json',     short: "Children's Services Award",     vertical: 'childrens' },
};

const D = '1 Jul 2026', DP = '2026-07-01';

// Reusable casual-conversion body (national rules; award clause differs per post).
function casualConversionSections(awardShort, code, extra) {
  return () => [
    { h2: 'Who Can Request <em>Casual Conversion</em>', html: `
    <p>Since 26 February 2025, casual conversion under all modern awards — including the <strong>${awardShort} ${code}</strong> — is <strong>employee-initiated</strong>. The old employer-offer model is gone. A casual employee can give written notice asking to convert to permanent employment when:</p>
    <ul>
        <li>they have been employed for at least <strong>6 months</strong> (or <strong>12 months</strong> for a small business with fewer than 15 employees); and</li>
        <li>they no longer meet the definition of a casual employee under the Fair Work Act 2009 (Cth) — i.e. the employment relationship has become regular and systematic with a firm advance commitment to ongoing work.</li>
    </ul>` },
    { h2: 'How an Employer Must <em>Respond</em>', html: `
    <p>Once an employee gives written notice, the employer must respond <strong>in writing within 21 days</strong>, either accepting the conversion or refusing it on one of the permitted grounds (for example, that the employee still genuinely meets the casual definition, or that accepting would require a significant change to the role). A refusal must set out the reasons.</p>
    <p>Employers must also continue to provide the <strong>Casual Employment Information Statement</strong> to every casual at commencement and again at the relevant 6- or 12-month milestone. ${extra || ''}</p>` },
    { h2: 'What Changes on <em>Conversion</em>', html: `
    <p>On conversion, the employee moves to permanent full-time or part-time employment and <strong>loses the ${'25%'} casual loading</strong> — but gains paid annual leave, personal/carer's leave, notice of termination and (where applicable) redundancy entitlements. Their base classification rate under the ${awardShort} does not change; only the loading and leave treatment do.</p>` },
  ];
}

export const POSTS = {
  // =====================================================================
  // GENERAL RETAIL INDUSTRY AWARD (MA000004)
  // =====================================================================
  retail: [
    {
      slug: 'retail-award-rates-2026',
      tag: 'Award Rates · Penalty Rates · 2026',
      cardTag: 'Pay Rates · MA000004',
      h1: 'Retail Award Rates 2026 — Pay &amp; <em>Penalty Rates</em>',
      cardTitle: 'Retail Award Rates 2026 — By Classification',
      title: 'Retail Award Rates 2026: Pay & Penalty Rates (MA000004)',
      metaDesc: 'General Retail Award MA000004 pay rates 2026 — Retail Employee Level 1–8 hourly rates, Saturday, Sunday and public holiday penalties, casual loading and evening loading.',
      keywords: 'retail award rates 2026, general retail industry award MA000004, retail penalty rates, retail employee level rates, casual loading retail, retail sunday penalty rate',
      blurb: 'Retail Employee Level 1–8 base rates, weekend and public holiday penalties, casual loading and the evening loading under MA000004.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 6,
      intro: 'Getting pay rates wrong under the <strong>General Retail Industry Award MA000004</strong> is one of the most common causes of underpayment claims in Australian retail. Eight classification levels, weekend and public holiday penalties, an evening loading and casual loading all have to line up. This guide sets out the 2026 rates and the rules behind them.',
      summary: 'Under the General Retail Industry Award MA000004 (2026), a Retail Employee Level 1 earns $27.81/hr full-time ($34.76/hr casual). Saturday is 125% (full-time/part-time) or 150% (casual); Sunday is 150% or 175%; public holidays are 225% or 250%. An evening loading of 25% applies to ordinary hours worked after 6pm Monday to Friday. The 25% casual loading is already built into the casual penalty percentages — do not stack it on top.',
      quickRefLabel: 'Quick Reference — Retail Award 2026',
      quickRef: [
        '<strong>Retail Employee Level 1:</strong> $27.81/hr full-time · $34.76/hr casual',
        '<strong>Saturday:</strong> 125% (full-time/part-time) · 150% (casual)',
        '<strong>Sunday:</strong> 150% (full-time/part-time) · 175% (casual)',
        '<strong>Public holiday:</strong> 225% (full-time/part-time) · 250% (casual)',
        '<strong>Evening loading (after 6pm Mon–Fri):</strong> +25% on ordinary hours',
        '<strong>Casual loading:</strong> 25% (already absorbed into the casual percentages above)',
      ],
      sections: (h) => [
        { h2: 'Retail Employee Rates by <em>Classification Level</em>', html:
`    <p>The Award runs from Retail Employee Level 1 (entry level) to Level 8 (the most senior in-store roles). Using the wrong level is itself a breach — a Level 3 employee paid at Level 1 is being systematically underpaid on every shift.</p>
${h.payTable(h.data, 8)}
    <p>Casual employees are paid the relevant level rate plus the <strong>25% casual loading</strong> — for a Level 1 that is <strong>$34.76/hr</strong>.</p>` },
        { h2: 'Penalty Rates — Weekends <em>&amp; Public Holidays</em>', html:
`    <p>Weekend and public holiday penalties are a percentage of the ordinary hourly rate. Casual percentages are <strong>all-inclusive</strong> of the 25% loading.</p>
${h.penaltyTable(h.data)}
    <p>For a Level 1 employee, Sunday is $41.71/hr (full-time/part-time) or $48.67/hr (casual); a public holiday is $69.52/hr for a casual.</p>` },
        { h2: 'Evening Loading <em>&amp; Overtime</em>', html:
`    <p>The retail evening loading is a common trap. Ordinary hours worked <strong>after 6:00pm Monday to Friday</strong> attract a <strong>25% loading</strong>. It applies to ordinary hours only — not to hours already paid at weekend or public holiday penalty rates.</p>
    <p>Overtime is paid at <strong>150%</strong> for the first 3 hours and <strong>200%</strong> after that. On a Sunday and on public holidays, overtime is paid at the higher applicable rate. The evening loading and overtime are not paid on top of each other for the same hour — the higher single entitlement applies.</p>` },
      ],
      mistakes: [
        '<strong>Defaulting everyone to Level 1.</strong> Retail classifications turn on the actual duties and responsibility level, not job title. A supervisor or a Level 3 employee on Level 1 rates is underpaid every shift.',
        '<strong>Applying the evening loading to penalty hours.</strong> The 25% evening loading applies to ordinary hours after 6pm Mon–Fri only — not on top of Saturday, Sunday or public holiday penalties.',
        '<strong>Stacking casual loading on the casual penalty rate.</strong> The casual weekend percentages (150%, 175%, 250%) already include the 25% loading. Adding it again is double-counting.',
        '<strong>Paying Sunday rates on a public holiday.</strong> Public holidays are 225% (FT/PT) or 250% (casual) — well above Sunday. Every public holiday shift paid at Sunday rates is immediate underpayment.',
        '<strong>Missing the minimum engagement.</strong> Part-time and casual retail employees must be paid for at least 3 hours each shift. See our <a href="/blog/retail-award-minimum-engagement-rules">minimum engagement guide</a>.',
      ],
      faqs: [
        { q: 'What is the base rate for a retail worker in 2026?', a: '<strong>A Retail Employee Level 1 earns $27.81/hr full-time or $34.76/hr casual under MA000004.</strong> Rates rise with each level up to Level 8 at $33.99/hr full-time. The correct level depends on the employee’s actual duties and responsibility, not their job title.' },
        { q: 'What are the Sunday penalty rates under the Retail Award?', a: '<strong>Sunday is 150% for full-time and part-time employees, and 175% for casuals</strong> (the casual rate already includes the 25% loading). For a Level 1 that is $41.71/hr and $48.67/hr respectively.' },
        { q: 'What is the retail evening loading?', a: '<strong>A 25% loading on ordinary hours worked after 6:00pm Monday to Friday.</strong> It does not apply on top of weekend or public holiday penalty rates, and it is not paid at the same time as overtime for the same hour — the higher single entitlement applies.' },
        { q: 'Is casual loading paid on top of weekend penalty rates in retail?', a: '<strong>No.</strong> The casual weekend and public holiday percentages under MA000004 are all-inclusive of the 25% casual loading. Adding the loading again is a common underpayment error found in Fair Work audits.' },
        { q: 'Is there an easy way to calculate Retail Award rates?', a: '<strong>Yes — Fitz HR calculates the exact MA000004 rate for any classification, day and shift type instantly.</strong> See the full <a href="/retail-award-pay-rates">Retail Award pay rates</a> or <a href="/app">ask Fitz free</a>.' },
      ],
      related: [
        { href: '/blog/retail-award-penalty-rates-sunday-public-holiday', label: 'Retail Award penalty rates — Sunday & public holidays' },
        { href: '/blog/retail-award-evening-loading-explained', label: 'Retail Award evening loading explained' },
        { href: '/blog/retail-award-minimum-engagement-rules', label: 'Retail Award minimum engagement rules' },
        { href: '/blog/retail-award-casual-conversion-rules-australia', label: 'Casual conversion under the Retail Award' },
        { href: '/retail-award-guide', label: 'General Retail Award guide (MA000004)' },
        { href: '/retail-award-pay-rates', label: 'Retail Award pay rates — full table' },
      ],
      ctaH3: 'Get Retail Award Rates Right — Instantly',
      ctaP: 'Stop guessing penalty rates. Fitz HR calculates the exact legal pay rate for any classification, day and shift under MA000004 — before the pay run.',
    },
    {
      slug: 'retail-award-penalty-rates-sunday-public-holiday',
      tag: 'Penalty Rates · MA000004',
      cardTag: 'Penalty Rates · MA000004',
      h1: 'Retail Award Penalty Rates — <em>Sunday &amp; Public Holidays</em>',
      cardTitle: 'Retail Award Penalty Rates — Sunday & Public Holidays',
      title: 'Retail Award Penalty Rates 2026: Sunday & Public Holiday',
      metaDesc: 'Retail Award MA000004 penalty rates 2026 — Saturday, Sunday and public holiday rates for full-time, part-time and casual retail employees, with worked examples.',
      keywords: 'retail award penalty rates, retail sunday rate, retail public holiday rate, MA000004 penalty rates, retail casual penalty rates 2026',
      blurb: 'Saturday, Sunday and public holiday penalty rates for retail staff — the exact percentages, casual all-inclusive rates and the substitute-day rule.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 5,
      intro: 'Weekend and public holiday penalty rates are where retail underpayment claims are won and lost. This guide sets out the exact <strong>General Retail Industry Award MA000004</strong> penalty rates for 2026 and how they apply to full-time, part-time and casual employees.',
      summary: 'Under MA000004, Saturday is 125% (full-time/part-time) or 150% (casual); Sunday is 150% or 175%; public holidays are 225% or 250%. Casual percentages already include the 25% casual loading. A retail employee who works a public holiday can be offered a substitute day only by agreement, and part-time/casual employees are still owed their minimum 3-hour engagement.',
      quickRefLabel: 'Retail Penalty Rates 2026',
      quickRef: [
        '<strong>Saturday:</strong> 125% (FT/PT) · 150% (casual)',
        '<strong>Sunday:</strong> 150% (FT/PT) · 175% (casual)',
        '<strong>Public holiday:</strong> 225% (FT/PT) · 250% (casual)',
        '<strong>Casual loading:</strong> 25%, already included above',
      ],
      sections: (h) => [
        { h2: 'The <em>Penalty Rate</em> Table', html:
`    <p>All percentages are of the ordinary hourly rate. Casual rates are all-inclusive of the 25% loading.</p>
${h.penaltyTable(h.data)}` },
        { h2: 'Worked <em>Examples</em>', html:
`    <p>For a <strong>Retail Employee Level 1</strong> on $27.81/hr:</p>
    <ul>
        <li>Saturday: $34.76/hr (FT/PT) · $41.71/hr (casual)</li>
        <li>Sunday: $41.71/hr (FT/PT) · $48.67/hr (casual)</li>
        <li>Public holiday: $62.57/hr (FT/PT) · $69.52/hr (casual)</li>
    </ul>
    <p>A single public holiday shift paid at Sunday rates instead of the correct public holiday rate is an underpayment on every hour worked.</p>` },
        { h2: 'Public Holiday <em>Rules</em>', html:
`    <p>Under the National Employment Standards, an employee can refuse to work a public holiday if the request is unreasonable or their refusal is reasonable. A part-time or casual employee who does work still receives their <strong>minimum 3-hour engagement</strong>. A substitute day can only replace a public holiday by genuine agreement.</p>` },
      ],
      mistakes: [
        '<strong>Paying Sunday rates on public holidays.</strong> Public holidays are 225%/250%, not 150%/175%.',
        '<strong>Stacking casual loading on the casual penalty rate.</strong> The casual percentages already include the 25% loading.',
        '<strong>Forgetting the minimum engagement on weekends.</strong> Part-time and casual employees are owed at least 3 hours per shift.',
      ],
      faqs: [
        { q: 'What is the Sunday rate for retail workers in 2026?', a: '<strong>150% for full-time and part-time employees, and 175% for casuals under MA000004.</strong> For a Level 1 that is $41.71/hr and $48.67/hr.' },
        { q: 'What is the public holiday rate under the Retail Award?', a: '<strong>225% for full-time and part-time, and 250% for casuals.</strong> The casual rate already includes the 25% loading.' },
        { q: 'Do retail casuals get penalty rates on top of casual loading?', a: '<strong>No — the casual penalty percentages are all-inclusive.</strong> The 25% loading is already built into 150% (Saturday), 175% (Sunday) and 250% (public holiday).' },
        { q: 'Can a retail employee refuse to work a public holiday?', a: '<strong>Yes, in the circumstances set out in the National Employment Standards</strong> — where the request to work is unreasonable, or the employee’s refusal is reasonable, taking into account their personal circumstances and the needs of the business.' },
        { q: 'What is the minimum shift on a weekend in retail?', a: '<strong>3 hours for part-time and casual employees</strong> — see our <a href="/blog/retail-award-minimum-engagement-rules">minimum engagement guide</a>.' },
      ],
      related: [
        { href: '/blog/retail-award-rates-2026', label: 'Retail Award rates 2026 — full breakdown' },
        { href: '/blog/retail-award-evening-loading-explained', label: 'Retail Award evening loading explained' },
        { href: '/blog/retail-award-minimum-engagement-rules', label: 'Retail Award minimum engagement rules' },
        { href: '/retail-award-guide', label: 'General Retail Award guide (MA000004)' },
      ],
    },
    {
      slug: 'retail-award-evening-loading-explained',
      tag: 'Evening Loading · MA000004',
      cardTag: 'Loadings · MA000004',
      h1: 'Retail Award <em>Evening Loading</em> Explained',
      cardTitle: 'Retail Award Evening Loading Explained',
      title: 'Retail Award Evening Loading 2026: The 25% After 6pm Rule',
      metaDesc: 'How the General Retail Award MA000004 evening loading works — the 25% loading on ordinary hours after 6pm Monday to Friday, when it applies, and the common mistakes.',
      keywords: 'retail evening loading, retail award after 6pm rate, MA000004 evening loading, retail ordinary hours loading, retail night shift retail award',
      blurb: 'The 25% loading on ordinary hours worked after 6pm Monday to Friday — when it applies, when it does not, and how it interacts with penalties and overtime.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 4,
      intro: 'The retail evening loading is one of the most misapplied provisions in the <strong>General Retail Industry Award MA000004</strong>. It is easy to forget for late-trading stores — and just as easy to double-count. Here is exactly how it works in 2026.',
      summary: 'Under MA000004, a 25% loading applies to ordinary hours worked after 6:00pm Monday to Friday. It applies to ordinary hours only — not to hours already paid at Saturday, Sunday or public holiday penalty rates, and not on top of overtime for the same hour. For a Retail Employee Level 1 on $27.81/hr, evening ordinary hours are paid at $34.76/hr.',
      quickRefLabel: 'Evening Loading — At a Glance',
      quickRef: [
        '<strong>Loading:</strong> +25% on the ordinary hourly rate',
        '<strong>When:</strong> ordinary hours after 6:00pm, Monday to Friday',
        '<strong>Level 1 example:</strong> $34.76/hr (from $27.81/hr)',
        '<strong>Does not stack</strong> with weekend/public holiday penalties or overtime',
      ],
      sections: () => [
        { h2: 'When the Loading <em>Applies</em>', html:
`    <p>The 25% evening loading applies to <strong>ordinary hours worked after 6:00pm, Monday to Friday</strong>. If a full-time or part-time employee is rostered until 9pm on a Wednesday, every ordinary hour from 6pm to 9pm attracts the loading.</p>
    <p>It does not apply on Saturdays, Sundays or public holidays — those days are covered by their own penalty rates instead. You never pay the evening loading and a weekend penalty on the same hour.</p>` },
        { h2: 'How It Interacts with <em>Overtime</em>', html:
`    <p>The evening loading applies to <strong>ordinary</strong> hours. Once an employee moves into overtime, overtime rates apply (150% for the first 3 hours, 200% after) and the evening loading is not added on top of overtime for the same hour — the higher single entitlement applies.</p>` },
        { h2: 'Why It Gets <em>Missed</em>', html:
`    <p>Late-trading stores often pay a flat hourly rate and forget the evening loading entirely, or apply it as a percentage of the wrong base. Because it only affects hours after 6pm, the underpayment can be small per shift but compounds quickly across a roster of evening staff.</p>` },
      ],
      mistakes: [
        '<strong>Ignoring the loading for late-trading stores.</strong> Every ordinary hour after 6pm Mon–Fri attracts 25%.',
        '<strong>Applying it on weekends.</strong> Saturday/Sunday/public holiday penalties replace the evening loading — never both on the same hour.',
        '<strong>Adding it on top of overtime.</strong> Once hours become overtime, the overtime rate applies, not the evening loading as well.',
      ],
      faqs: [
        { q: 'What is the retail evening loading in 2026?', a: '<strong>A 25% loading on ordinary hours worked after 6:00pm Monday to Friday under MA000004.</strong> For a Level 1 employee that lifts $27.81/hr to $34.76/hr.' },
        { q: 'Does the evening loading apply on weekends?', a: '<strong>No.</strong> Saturday, Sunday and public holiday penalty rates apply on those days instead — the evening loading is a Monday-to-Friday provision only.' },
        { q: 'Is the evening loading paid on top of overtime?', a: '<strong>No.</strong> The evening loading applies to ordinary hours; once hours become overtime, the overtime rate applies and the higher single entitlement is paid — not both.' },
        { q: 'Does the evening loading apply to casuals?', a: '<strong>Yes</strong> — casual employees receive the 25% evening loading on ordinary evening hours in addition to their casual loading, because they are different entitlements for different reasons.' },
      ],
      related: [
        { href: '/blog/retail-award-rates-2026', label: 'Retail Award rates 2026 — full breakdown' },
        { href: '/blog/retail-award-penalty-rates-sunday-public-holiday', label: 'Retail penalty rates — Sunday & public holidays' },
        { href: '/blog/retail-award-minimum-engagement-rules', label: 'Retail Award minimum engagement rules' },
        { href: '/retail-award-guide', label: 'General Retail Award guide (MA000004)' },
      ],
    },
    {
      slug: 'retail-award-minimum-engagement-rules',
      tag: 'Rostering · MA000004',
      cardTag: 'Rostering · MA000004',
      h1: 'Retail Award <em>Minimum Engagement</em> Rules',
      cardTitle: 'Retail Award Minimum Engagement & Rostering',
      title: 'Retail Award Minimum Engagement 2026: The 3-Hour Rule',
      metaDesc: 'The General Retail Award MA000004 minimum engagement — part-time and casual retail employees must be paid for at least 3 hours per shift. Rostering rules explained.',
      keywords: 'retail minimum engagement, retail award 3 hour minimum, MA000004 minimum shift, retail casual minimum hours, retail rostering rules',
      blurb: 'Part-time and casual retail employees must be paid for at least 3 hours per shift — how the minimum engagement works and how it interacts with rostering.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 4,
      intro: 'A short shift can still cost a full one. Under the <strong>General Retail Industry Award MA000004</strong>, part-time and casual employees are owed a minimum period of engagement every time they are rostered — even if the store is quiet and they are sent home early.',
      summary: 'Under MA000004, part-time and casual retail employees must be engaged and paid for a minimum of 3 hours on each shift, even if they work less. Rostering a casual for a 2-hour shift, or sending someone home after 90 minutes, still triggers the full 3-hour payment. Getting minimum engagement wrong is a frequent and easily-avoided source of underpayment.',
      quickRefLabel: 'Minimum Engagement — Retail',
      quickRef: [
        '<strong>Part-time:</strong> minimum 3 hours per shift',
        '<strong>Casual:</strong> minimum 3 hours per shift',
        '<strong>Applies even if</strong> the employee is sent home early',
      ],
      sections: () => [
        { h2: 'The <em>3-Hour</em> Minimum', html:
`    <p>Each time a part-time or casual retail employee is required to attend work, they must be engaged and paid for at least <strong>3 consecutive hours</strong>. If you roster a 2-hour shift, you still owe 3 hours. If trade is slow and you send someone home after one hour, you still owe the full 3.</p>` },
        { h2: 'How It Affects <em>Rostering</em>', html:
`    <p>The minimum engagement makes very short shifts uneconomic — a 90-minute shift costs the same as a 3-hour one. It also means "call-in" arrangements need care: asking a casual to come in for a quick job during a busy period still attracts the full minimum. Plan rosters around 3-hour blocks to avoid paying for hours not worked.</p>` },
        { h2: 'Junior and <em>Student</em> Employees', html:
`    <p>The 3-hour minimum applies to all part-time and casual retail employees. Where a secondary-school student works during school terms, some awards allow a shorter minimum in defined circumstances — always check the current Award text and any applicable agreement before rostering under 3 hours, and when in doubt, ask Fitz.</p>` },
      ],
      mistakes: [
        '<strong>Rostering 2-hour shifts.</strong> The minimum is 3 hours — a shorter roster still costs 3 hours’ pay.',
        '<strong>Sending staff home early without pay.</strong> If an employee attends, the minimum engagement is still owed.',
        '<strong>Confusing minimum engagement with breaks.</strong> They are separate rules — the 3-hour minimum is about the shift length you must pay, not rest breaks.',
      ],
      faqs: [
        { q: 'What is the minimum shift for a casual retail worker?', a: '<strong>3 hours under MA000004.</strong> A casual must be engaged and paid for at least 3 consecutive hours each time they attend work, even if they work less.' },
        { q: 'Can I roster a retail casual for 2 hours?', a: '<strong>You can roster it, but you must pay a minimum of 3 hours.</strong> The minimum engagement applies regardless of the rostered length.' },
        { q: 'If I send a retail employee home early, do I still pay them?', a: '<strong>Yes — you must pay at least the 3-hour minimum engagement</strong> for that shift, even if they are sent home after an hour.' },
        { q: 'Does the 3-hour minimum apply to part-time employees?', a: '<strong>Yes.</strong> Both part-time and casual retail employees are owed a minimum 3-hour engagement per shift under MA000004.' },
      ],
      related: [
        { href: '/blog/retail-award-rates-2026', label: 'Retail Award rates 2026 — full breakdown' },
        { href: '/blog/retail-award-penalty-rates-sunday-public-holiday', label: 'Retail penalty rates — Sunday & public holidays' },
        { href: '/blog/retail-award-casual-conversion-rules-australia', label: 'Casual conversion under the Retail Award' },
        { href: '/retail-award-guide', label: 'General Retail Award guide (MA000004)' },
      ],
    },
    {
      slug: 'retail-award-casual-conversion-rules-australia',
      tag: 'Casual Conversion · MA000004',
      cardTag: 'Casual · MA000004',
      h1: 'Casual Conversion Under the <em>Retail Award</em>',
      cardTitle: 'Casual Conversion Under the Retail Award',
      title: 'Retail Award Casual Conversion 2026: Employee-Initiated Rules',
      metaDesc: 'Casual conversion under the General Retail Award MA000004 — the employee-initiated rules from 26 February 2025, the 6/12-month milestones, and how employers must respond.',
      keywords: 'retail casual conversion, MA000004 casual conversion, retail permanent conversion, casual employment information statement retail, retail award casual rights',
      blurb: 'The employee-initiated casual conversion rules under MA000004 — eligibility, the 21-day response, and what changes on conversion.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 5,
      intro: 'Casual conversion changed fundamentally on 26 February 2025 — and retail, with its large casual workforce, is one of the most affected industries. Under the <strong>General Retail Industry Award MA000004</strong>, conversion is now driven by the employee, not the employer.',
      summary: 'Since 26 February 2025, casual conversion under MA000004 is employee-initiated: a casual can give written notice requesting permanent employment after 6 months (12 months in a small business), if they no longer meet the casual definition. The employer must respond in writing within 21 days. On conversion the employee loses the 25% loading but gains paid leave and notice entitlements.',
      quickRefLabel: 'Casual Conversion — Retail',
      quickRef: [
        '<strong>Who initiates:</strong> the employee (since 26 Feb 2025)',
        '<strong>Eligibility:</strong> 6 months (12 months for small business)',
        '<strong>Employer response:</strong> in writing within 21 days',
        '<strong>On conversion:</strong> lose 25% loading, gain paid leave & notice',
      ],
      sections: casualConversionSections('General Retail Industry Award', 'MA000004',
        'In retail, where rosters are often regular and systematic, many long-term casuals will meet the test — so it pays to have a clear internal process for handling requests.'),
      mistakes: [
        '<strong>Waiting for the employer to offer.</strong> The employer-offer model ended on 26 February 2025 — conversion is now employee-initiated, but the employer’s obligations to respond and to provide the Information Statement remain.',
        '<strong>Missing the 21-day written response.</strong> Failing to respond in writing, or refusing without valid reasons, is a separate contravention.',
        '<strong>Not providing the Casual Employment Information Statement.</strong> It must be given at commencement and again at the 6- or 12-month milestone.',
      ],
      faqs: [
        { q: 'Who initiates casual conversion in retail now?', a: '<strong>The employee.</strong> Since 26 February 2025, a casual gives written notice requesting conversion — the old employer-offer model no longer applies.' },
        { q: 'When can a retail casual request conversion?', a: '<strong>After 6 months of employment (12 months for a small business with fewer than 15 employees), if they no longer meet the casual definition</strong> — i.e. the work has become regular and systematic with a firm advance commitment.' },
        { q: 'How long does an employer have to respond?', a: '<strong>21 days, in writing</strong> — either accepting the conversion or refusing on valid grounds and setting out the reasons.' },
        { q: 'What does a retail casual lose on conversion?', a: '<strong>The 25% casual loading</strong> — but they gain paid annual and personal/carer’s leave, notice of termination and, where applicable, redundancy entitlements. The base classification rate does not change.' },
      ],
      related: [
        { href: '/blog/retail-award-rates-2026', label: 'Retail Award rates 2026 — full breakdown' },
        { href: '/blog/retail-award-minimum-engagement-rules', label: 'Retail Award minimum engagement rules' },
        { href: '/blog/casual-conversion-rules-hospitality-award-australia', label: 'Casual conversion under the Hospitality Award' },
        { href: '/retail-award-guide', label: 'General Retail Award guide (MA000004)' },
      ],
    },
  ],

  // =====================================================================
  // MANUFACTURING AND ASSOCIATED INDUSTRIES AWARD (MA000010)
  // =====================================================================
  manufacturing: [
    {
      slug: 'manufacturing-award-rates-2026',
      tag: 'Award Rates · Penalty Rates · 2026', cardTag: 'Pay Rates · MA000010',
      h1: 'Manufacturing Award Rates 2026 — <em>C-Level Pay Rates</em>',
      cardTitle: 'Manufacturing Award Rates 2026 — By C-Level',
      title: 'Manufacturing Award Rates 2026: C-Level Pay (MA000010)',
      metaDesc: 'Manufacturing Award MA000010 pay rates 2026 — the C14–C-level classification structure, hourly rates, weekend and shift penalties, overtime and casual loading.',
      keywords: 'manufacturing award rates 2026, MA000010 pay rates, C10 tradesperson rate, manufacturing classification C14 C10, manufacturing penalty rates, manufacturing casual loading',
      blurb: 'The C14–C-level classification rates, weekend penalties, afternoon and night shift loadings, overtime and casual loading under MA000010.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 6,
      intro: 'The <strong>Manufacturing and Associated Industries and Occupations Award MA000010</strong> uses a C-level classification structure (C14 through the trade and higher levels) that trips up a lot of employers. Get the level wrong and every hour is underpaid. This guide sets out the 2026 rates and how they fit together.',
      summary: 'Under the Manufacturing Award MA000010 (2026), a C14 engineering/manufacturing employee earns $25.74/hr full-time ($32.18/hr casual). Saturday is 150%, Sunday 200% and public holidays 250% of the ordinary rate. Afternoon and night shift loadings are 15% (30% for permanent night shift). Overtime is 150% for the first 3 hours and 200% after. The classification is set by the C-level, not the job title.',
      quickRefLabel: 'Quick Reference — Manufacturing 2026',
      quickRef: [
        '<strong>C14 (entry):</strong> $25.74/hr full-time · $32.18/hr casual',
        '<strong>Saturday:</strong> 150% · <strong>Sunday:</strong> 200% · <strong>Public holiday:</strong> 250%',
        '<strong>Afternoon / night shift:</strong> +15% · <strong>Permanent night:</strong> +30%',
        '<strong>Overtime:</strong> 150% (first 3 hrs) then 200%',
        '<strong>Casual loading:</strong> 25% on top of the ordinary rate',
      ],
      sections: (h) => [
        { h2: 'C-Level <em>Classification Rates</em>', html:
`    <p>Manufacturing classifications run from C14 (entry) up through C10 (trade level) and beyond. Each level is defined by skills, training and responsibility — not job title. A tradesperson paid at a lower C-level than their work is being systematically underpaid.</p>
${h.payTable(h.data, 12)}` },
        { h2: 'Weekend &amp; Public Holiday <em>Penalties</em>', html:
`    <p>Penalty rates are a percentage of the ordinary hourly rate:</p>
${h.penaltyTable(h.data)}
    <p>Casual employees receive the 25% casual loading in addition to the ordinary rate; overtime and penalty interactions can be complex, so confirm the exact rate for the shift before you run pay.</p>` },
        { h2: 'Shift Loadings <em>&amp; Overtime</em>', html:
`    <p>Afternoon and night shift work attracts a <strong>15%</strong> loading; a permanent (non-rotating) night shift attracts <strong>30%</strong>. Overtime is <strong>150%</strong> for the first 3 hours and <strong>200%</strong> after that. See our <a href="/blog/manufacturing-award-shift-loadings-afternoon-night">shift loadings guide</a> and <a href="/blog/manufacturing-award-overtime-rules">overtime guide</a> for the detail.</p>` },
      ],
      mistakes: [
        '<strong>Classifying by job title.</strong> The C-level is set by skills, training and responsibility. A C10 tradesperson on C13 rates is underpaid every hour.',
        '<strong>Treating shift loadings as optional.</strong> Afternoon and night shifts attract a 15% loading (30% permanent night) — it is not discretionary.',
        '<strong>Missing the 4-hour minimum engagement.</strong> Part-time and casual employees must be paid for at least 4 hours per shift.',
        '<strong>Under-paying Sunday work.</strong> Sunday is 200% and public holidays 250% — well above Saturday’s 150%.',
      ],
      faqs: [
        { q: 'What is the C10 rate under the Manufacturing Award in 2026?', a: '<strong>C10 is the trade level.</strong> Rates rise from C14 at $25.74/hr full-time up through the C-levels — see the classification table above, or the full <a href="/manufacturing-award-pay-rates">Manufacturing Award pay rates</a>.' },
        { q: 'What are the weekend penalty rates in manufacturing?', a: '<strong>Saturday is 150%, Sunday 200% and public holidays 250% of the ordinary rate under MA000010.</strong> Casual employees also receive the 25% casual loading.' },
        { q: 'What is the afternoon shift loading in manufacturing?', a: '<strong>15% on the ordinary rate for afternoon and night shifts, and 30% for a permanent (non-rotating) night shift.</strong> See our <a href="/blog/manufacturing-award-shift-loadings-afternoon-night">shift loadings guide</a>.' },
        { q: 'What is the minimum shift in manufacturing?', a: '<strong>4 hours for part-time and casual employees under MA000010.</strong> A shorter roster still attracts the 4-hour minimum payment.' },
        { q: 'How do I calculate a Manufacturing Award rate?', a: '<strong>Fitz HR calculates the exact MA000010 rate for any C-level, shift and day.</strong> See the <a href="/manufacturing-award-pay-rates">pay rates page</a> or <a href="/app">ask Fitz free</a>.' },
      ],
      related: [
        { href: '/blog/manufacturing-award-shift-loadings-afternoon-night', label: 'Manufacturing shift loadings — afternoon & night' },
        { href: '/blog/manufacturing-award-overtime-rules', label: 'Manufacturing Award overtime rules' },
        { href: '/blog/manufacturing-award-allowances-guide', label: 'Manufacturing Award allowances guide' },
        { href: '/blog/manufacturing-award-casual-conversion-rules-australia', label: 'Casual conversion under the Manufacturing Award' },
        { href: '/manufacturing-award-guide', label: 'Manufacturing Award guide (MA000010)' },
        { href: '/manufacturing-award-pay-rates', label: 'Manufacturing Award pay rates — full table' },
      ],
      ctaH3: 'Get Manufacturing Award Rates Right — Instantly',
    },
    {
      slug: 'manufacturing-award-shift-loadings-afternoon-night',
      tag: 'Shift Loadings · MA000010', cardTag: 'Loadings · MA000010',
      h1: 'Manufacturing Award <em>Shift Loadings</em> — Afternoon &amp; Night',
      cardTitle: 'Manufacturing Shift Loadings — Afternoon & Night',
      title: 'Manufacturing Award Shift Loadings 2026: Afternoon & Night',
      metaDesc: 'Manufacturing Award MA000010 shift loadings 2026 — the 15% afternoon and night shift loading, the 30% permanent night shift rate, and how they interact with penalties.',
      keywords: 'manufacturing shift loading, afternoon shift loading manufacturing, night shift loading MA000010, permanent night shift 30%, manufacturing award shift work',
      blurb: 'The 15% afternoon and night shift loading, the 30% permanent night rate, and how shift loadings interact with weekend penalties and overtime.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 5,
      intro: 'Shift work is the norm in manufacturing, and the shift loadings under <strong>MA000010</strong> are where a lot of pay errors live. This guide sets out the afternoon, night and permanent-night loadings for 2026 and how they combine with other entitlements.',
      summary: 'Under MA000010, afternoon and night shifts attract a 15% loading on the ordinary rate, and a permanent (non-rotating) night shift attracts 30%. Shift loadings apply to ordinary hours; on weekends and public holidays the penalty rate applies instead, and shift loadings are not stacked on top of overtime for the same hour.',
      quickRefLabel: 'Shift Loadings — Manufacturing',
      quickRef: [
        '<strong>Afternoon shift:</strong> +15%',
        '<strong>Night shift (rotating):</strong> +15%',
        '<strong>Permanent night shift:</strong> +30%',
        '<strong>Applies to</strong> ordinary hours — not stacked with weekend penalties or overtime',
      ],
      sections: () => [
        { h2: 'Afternoon and Night <em>Shifts</em>', html:
`    <p>An afternoon or (rotating) night shift attracts a <strong>15% loading</strong> on the ordinary hourly rate. A C10 tradesperson on $29.45/hr earns roughly $33.87/hr on an afternoon shift. The loading recognises the disruption of non-day work and is not discretionary.</p>` },
        { h2: 'Permanent Night <em>Shift</em>', html:
`    <p>Where an employee works a <strong>permanent (non-rotating) night shift</strong> — nights only, not part of a rotating roster — the loading rises to <strong>30%</strong>. Misclassifying a permanent night worker as rotating (and paying 15% instead of 30%) is a systematic underpayment.</p>` },
        { h2: 'How Loadings Interact with <em>Penalties &amp; Overtime</em>', html:
`    <p>Shift loadings apply to <strong>ordinary hours</strong>. On a Saturday, Sunday or public holiday, the weekend/public-holiday penalty applies instead — you do not pay the shift loading and the weekend penalty on the same hour. When hours become overtime, the overtime rate applies; the higher single entitlement is paid, not both.</p>` },
      ],
      mistakes: [
        '<strong>Paying 15% for a permanent night shift.</strong> Permanent (non-rotating) night shift is 30%, not 15%.',
        '<strong>Stacking the shift loading on weekend penalties.</strong> On weekends the penalty rate applies instead of the shift loading.',
        '<strong>Forgetting the loading on ordinary afternoon hours.</strong> Every ordinary afternoon/night hour attracts the loading.',
      ],
      faqs: [
        { q: 'What is the afternoon shift loading under MA000010?', a: '<strong>15% on the ordinary hourly rate.</strong> A C10 tradesperson on $29.45/hr earns about $33.87/hr on afternoon shift.' },
        { q: 'What is the permanent night shift rate in manufacturing?', a: '<strong>30% — double the rotating night loading.</strong> It applies where an employee works nights permanently rather than as part of a rotating roster.' },
        { q: 'Do shift loadings apply on weekends?', a: '<strong>No — the weekend or public holiday penalty applies instead.</strong> You never pay a shift loading and a weekend penalty on the same hour.' },
        { q: 'Are shift loadings paid on top of overtime?', a: '<strong>No.</strong> Shift loadings apply to ordinary hours; once hours become overtime, the overtime rate applies and the higher single entitlement is paid.' },
      ],
      related: [
        { href: '/blog/manufacturing-award-rates-2026', label: 'Manufacturing Award rates 2026 — full breakdown' },
        { href: '/blog/manufacturing-award-overtime-rules', label: 'Manufacturing Award overtime rules' },
        { href: '/blog/manufacturing-award-allowances-guide', label: 'Manufacturing Award allowances guide' },
        { href: '/manufacturing-award-guide', label: 'Manufacturing Award guide (MA000010)' },
      ],
    },
    {
      slug: 'manufacturing-award-overtime-rules',
      tag: 'Overtime · MA000010', cardTag: 'Overtime · MA000010',
      h1: 'Manufacturing Award <em>Overtime</em> Rules',
      cardTitle: 'Manufacturing Award Overtime Rules',
      title: 'Manufacturing Award Overtime 2026: Rates & Rules (MA000010)',
      metaDesc: 'Manufacturing Award MA000010 overtime 2026 — 150% for the first 3 hours and 200% after, Sunday overtime, the daily and weekly overtime triggers, and rest-break rules.',
      keywords: 'manufacturing overtime rates, MA000010 overtime, manufacturing award time and a half, double time manufacturing, overtime rest break manufacturing',
      blurb: 'When overtime applies under MA000010, the 150%/200% rates, Sunday overtime and the rest-break-after-overtime rule.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 5,
      intro: 'Overtime is common in manufacturing and one of the biggest sources of pay error. The <strong>Manufacturing Award MA000010</strong> sets clear triggers and rates — this guide covers when overtime applies and what you must pay in 2026.',
      summary: 'Under MA000010, overtime is paid at 150% for the first 3 hours and 200% after that. Overtime applies to hours worked beyond the ordinary daily or weekly hours, outside the span of ordinary hours, or contrary to the roster. Sunday overtime is paid at 200%. Employees who work significant overtime are also entitled to rest breaks before returning to work.',
      quickRefLabel: 'Overtime — Manufacturing',
      quickRef: [
        '<strong>First 3 hours:</strong> 150% of the ordinary rate',
        '<strong>After 3 hours:</strong> 200%',
        '<strong>Sunday overtime:</strong> 200%',
        '<strong>Rest break</strong> may apply after significant overtime',
      ],
      sections: () => [
        { h2: 'When Overtime <em>Applies</em>', html:
`    <p>Overtime under MA000010 is triggered when an employee works beyond their ordinary daily or weekly hours, outside the agreed span of ordinary hours, or otherwise contrary to the roster. Full-time ordinary hours are an average of 38 per week. Whether a shift is "overtime" turns on the roster and the span — not just the total hours in a day.</p>` },
        { h2: 'Overtime <em>Rates</em>', html:
`    <p>Overtime is paid at <strong>150% for the first 3 hours</strong> and <strong>200% thereafter</strong>. Overtime worked on a Sunday is paid at <strong>200%</strong>. Public holiday work is covered by the public holiday penalty. Overtime is calculated on the ordinary rate — shift loadings are not added on top of overtime for the same hour.</p>` },
        { h2: 'Rest Breaks After <em>Overtime</em>', html:
`    <p>Where an employee works substantial overtime, the Award provides for a rest break before they return to work, or payment at overtime rates until they have had the break. This protects fatigue-related safety and is easy to overlook when running back-to-back shifts.</p>` },
      ],
      mistakes: [
        '<strong>Averaging overtime away.</strong> Overtime is assessed against ordinary hours and the roster, not smoothed across a fortnight.',
        '<strong>Paying a flat rate for all extra hours.</strong> The first 3 hours are 150%; after that it is 200%.',
        '<strong>Ignoring the rest-break entitlement.</strong> After significant overtime, a rest break (or continued overtime pay) applies.',
      ],
      faqs: [
        { q: 'What are the overtime rates under the Manufacturing Award?', a: '<strong>150% for the first 3 hours and 200% after, under MA000010.</strong> Sunday overtime is 200%.' },
        { q: 'When does overtime apply in manufacturing?', a: '<strong>When an employee works beyond ordinary daily/weekly hours, outside the span of ordinary hours, or contrary to the roster.</strong> Ordinary full-time hours average 38 per week.' },
        { q: 'Is Sunday work in manufacturing overtime or a penalty?', a: '<strong>Ordinary Sunday hours are paid at the Sunday penalty (200%); Sunday overtime is also 200%.</strong> Confirm whether the hours are rostered ordinary hours or overtime.' },
        { q: 'Are shift loadings added to overtime?', a: '<strong>No.</strong> Overtime is calculated on the ordinary rate; the higher single entitlement applies rather than stacking a shift loading on top of overtime.' },
      ],
      related: [
        { href: '/blog/manufacturing-award-rates-2026', label: 'Manufacturing Award rates 2026 — full breakdown' },
        { href: '/blog/manufacturing-award-shift-loadings-afternoon-night', label: 'Manufacturing shift loadings — afternoon & night' },
        { href: '/blog/manufacturing-award-allowances-guide', label: 'Manufacturing Award allowances guide' },
        { href: '/manufacturing-award-guide', label: 'Manufacturing Award guide (MA000010)' },
      ],
    },
    {
      slug: 'manufacturing-award-allowances-guide',
      tag: 'Allowances · MA000010', cardTag: 'Allowances · MA000010',
      h1: 'Manufacturing Award <em>Allowances</em> Guide',
      cardTitle: 'Manufacturing Award Allowances Guide',
      title: 'Manufacturing Award Allowances 2026: Tool, Meal & More',
      metaDesc: 'Manufacturing Award MA000010 allowances 2026 — the tool allowance, meal allowance and other common allowances, what triggers them, and the current amounts.',
      keywords: 'manufacturing award allowances, tool allowance manufacturing, meal allowance MA000010, manufacturing award 2026 allowances, disability allowance manufacturing',
      blurb: 'The tool allowance, meal allowance and other frequently-applied allowances under MA000010 — what triggers each and the current figures.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 4,
      intro: 'Allowances are easy to forget and add up fast. The <strong>Manufacturing Award MA000010</strong> includes a range of allowances — tool, meal, disability and more — that must be paid when the trigger conditions are met. Here are the common ones for 2026.',
      summary: 'Under MA000010, common allowances include a tool allowance of $0.47 per hour for tradespeople who provide their own tools, and a meal allowance of $19.14 per meal when an employee works qualifying overtime. Allowances are paid on top of the base rate whenever the trigger condition is met — not absorbed into it.',
      quickRefLabel: 'Common Allowances — Manufacturing',
      quickRef: [
        '<strong>Tool allowance:</strong> $0.47 per hour (tradesperson supplying own tools)',
        '<strong>Meal allowance:</strong> $19.14 per meal (qualifying overtime)',
        '<strong>Plus</strong> disability, leading-hand and first-aid allowances where they apply',
      ],
      sections: (h) => [
        { h2: 'Common <em>Allowances</em> and Amounts', html:
`    <p>These are the allowances that apply most often. Each is paid when its trigger condition is met — always on top of the ordinary rate.</p>
${h.allowanceTable(h.data, 10)}` },
        { h2: 'How Allowances <em>Work</em>', html:
`    <p>Some allowances are per-hour (like the tool allowance), some are per-occasion (like the meal allowance), and some are weekly. A flat wage does not "cover" allowances unless it demonstrably exceeds the base rate plus every allowance actually triggered — most flat arrangements do not. When in doubt, pay the allowance separately and keep the record.</p>` },
      ],
      mistakes: [
        '<strong>Assuming a flat rate covers allowances.</strong> It only complies if it exceeds base plus every triggered allowance — most do not.',
        '<strong>Forgetting the tool allowance.</strong> Tradespeople who supply their own tools are owed the per-hour tool allowance.',
        '<strong>Missing the overtime meal allowance.</strong> Qualifying overtime triggers a meal allowance per meal.',
      ],
      faqs: [
        { q: 'What is the tool allowance under the Manufacturing Award?', a: '<strong>$0.47 per hour for tradespeople who are required to provide their own tools under MA000010.</strong> It is paid on top of the ordinary rate.' },
        { q: 'What is the meal allowance in manufacturing?', a: '<strong>$19.14 per meal where an employee works qualifying overtime</strong> without being given a meal or adequate notice.' },
        { q: 'Can a flat wage cover Manufacturing Award allowances?', a: '<strong>Only if it demonstrably exceeds the base rate plus every allowance actually triggered.</strong> Most flat arrangements fail this test and leave allowance underpayments.' },
        { q: 'Where can I see all Manufacturing Award allowances?', a: '<strong>The full list is on the <a href="/manufacturing-award-pay-rates">Manufacturing Award pay rates page</a>, or ask Fitz for the exact figure and trigger for any allowance.</strong>' },
      ],
      related: [
        { href: '/blog/manufacturing-award-rates-2026', label: 'Manufacturing Award rates 2026 — full breakdown' },
        { href: '/blog/manufacturing-award-overtime-rules', label: 'Manufacturing Award overtime rules' },
        { href: '/blog/manufacturing-award-casual-conversion-rules-australia', label: 'Casual conversion under the Manufacturing Award' },
        { href: '/manufacturing-award-guide', label: 'Manufacturing Award guide (MA000010)' },
      ],
    },
    {
      slug: 'manufacturing-award-casual-conversion-rules-australia',
      tag: 'Casual Conversion · MA000010', cardTag: 'Casual · MA000010',
      h1: 'Casual Conversion Under the <em>Manufacturing Award</em>',
      cardTitle: 'Casual Conversion Under the Manufacturing Award',
      title: 'Manufacturing Award Casual Conversion 2026: The Rules',
      metaDesc: 'Casual conversion under the Manufacturing Award MA000010 — the employee-initiated rules from 26 February 2025, the 6/12-month milestones, and how employers must respond.',
      keywords: 'manufacturing casual conversion, MA000010 casual conversion, manufacturing permanent conversion, casual employment information statement manufacturing',
      blurb: 'The employee-initiated casual conversion rules under MA000010 — eligibility, the 21-day response and what changes on conversion.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 5,
      intro: 'Casual conversion changed on 26 February 2025 — and with many production casuals working regular, systematic shifts, manufacturers need a clear process. Under the <strong>Manufacturing Award MA000010</strong>, conversion is now employee-initiated.',
      summary: 'Since 26 February 2025, casual conversion under MA000010 is employee-initiated: a casual can give written notice requesting permanent employment after 6 months (12 months in a small business), if they no longer meet the casual definition. The employer must respond in writing within 21 days. On conversion the employee loses the 25% loading but gains paid leave and notice entitlements.',
      quickRefLabel: 'Casual Conversion — Manufacturing',
      quickRef: [
        '<strong>Who initiates:</strong> the employee (since 26 Feb 2025)',
        '<strong>Eligibility:</strong> 6 months (12 months for small business)',
        '<strong>Employer response:</strong> in writing within 21 days',
        '<strong>On conversion:</strong> lose 25% loading, gain paid leave & notice',
      ],
      sections: casualConversionSections('Manufacturing and Associated Industries and Occupations Award', 'MA000010',
        'On a stable production line, many long-term casuals will meet the regular-and-systematic test — a documented conversion process avoids disputes.'),
      mistakes: [
        '<strong>Waiting for the employer to offer.</strong> Conversion is employee-initiated since 26 February 2025, but the duty to respond and to provide the Information Statement remains.',
        '<strong>Missing the 21-day written response.</strong> Failing to respond, or refusing without valid grounds, is a separate contravention.',
        '<strong>Not providing the Casual Employment Information Statement.</strong> Required at commencement and at the 6- or 12-month milestone.',
      ],
      faqs: [
        { q: 'Who initiates casual conversion in manufacturing?', a: '<strong>The employee, since 26 February 2025.</strong> The old employer-offer model no longer applies.' },
        { q: 'When can a manufacturing casual request conversion?', a: '<strong>After 6 months (12 months for a small business), if they no longer meet the casual definition</strong> — i.e. the work has become regular and systematic with a firm advance commitment.' },
        { q: 'How long does the employer have to respond?', a: '<strong>21 days, in writing</strong> — accepting the conversion or refusing on valid grounds with reasons.' },
        { q: 'What does a casual lose on conversion?', a: '<strong>The 25% casual loading</strong> — in exchange for paid annual and personal/carer’s leave, notice and, where applicable, redundancy entitlements.' },
      ],
      related: [
        { href: '/blog/manufacturing-award-rates-2026', label: 'Manufacturing Award rates 2026 — full breakdown' },
        { href: '/blog/manufacturing-award-overtime-rules', label: 'Manufacturing Award overtime rules' },
        { href: '/blog/casual-conversion-rules-hospitality-award-australia', label: 'Casual conversion under the Hospitality Award' },
        { href: '/manufacturing-award-guide', label: 'Manufacturing Award guide (MA000010)' },
      ],
    },
  ],

  // =====================================================================
  // SCHADS — SOCIAL, COMMUNITY, HOME CARE & DISABILITY SERVICES (MA000100)
  // =====================================================================
  schads: [
    {
      slug: 'schads-award-rates-2026',
      tag: 'Award Rates · Penalty Rates · 2026', cardTag: 'Pay Rates · MA000100',
      h1: 'SCHADS Award Rates 2026 — Pay &amp; <em>Penalty Rates</em>',
      cardTitle: 'SCHADS Award Rates 2026 — By Level',
      title: 'SCHADS Award Rates 2026: Pay & Penalty Rates (MA000100)',
      metaDesc: 'SCHADS Award MA000100 pay rates 2026 — social & community services and home care level rates, weekend and public holiday penalties, casual loading and shift loadings.',
      keywords: 'SCHADS award rates 2026, MA000100 pay rates, social community services rates, home care rates, disability support worker pay, SCHADS penalty rates NDIS',
      blurb: 'Social & community services and home care level rates, weekend and public holiday penalties, casual loading and shift loadings under MA000100.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 6,
      intro: 'The <strong>Social, Community, Home Care and Disability Services Industry Award MA000100</strong> covers a huge, NDIS-heavy workforce across several streams — and its pay-point structure, sleepovers and broken shifts make it one of the trickiest awards to run. This guide sets out the 2026 rates.',
      summary: 'Under the SCHADS Award MA000100 (2026), a Social & Community Services Level 1 pay point 1 employee earns $27.55/hr full-time. Saturday is 150% (175% casual), Sunday 200% (225% casual) and public holidays 250% (275% casual). Afternoon shifts attract 12.5% and night shifts 15%. Sleepovers, broken shifts and on-call are paid as separate allowances on top.',
      quickRefLabel: 'Quick Reference — SCHADS 2026',
      quickRef: [
        '<strong>SACS Level 1 (pp1):</strong> $27.55/hr full-time',
        '<strong>Saturday:</strong> 150% (FT/PT) · 175% (casual)',
        '<strong>Sunday:</strong> 200% (FT/PT) · 225% (casual)',
        '<strong>Public holiday:</strong> 250% (FT/PT) · 275% (casual)',
        '<strong>Afternoon shift:</strong> +12.5% · <strong>Night shift:</strong> +15%',
        '<strong>Sleepover / broken shift:</strong> paid as separate allowances',
      ],
      sections: (h) => [
        { h2: 'Rates by Stream <em>&amp; Level</em>', html:
`    <p>SCHADS runs across streams — social &amp; community services, home care, family day care and crisis accommodation — each with its own levels and pay points. Getting the stream and pay point right is essential.</p>
${h.payTable(h.data, 12)}` },
        { h2: 'Penalty Rates — Weekends <em>&amp; Public Holidays</em>', html:
`    <p>Penalties are a percentage of the minimum hourly rate; casual percentages already include the 25% loading:</p>
${h.penaltyTable(h.data)}` },
        { h2: 'Sleepovers, Broken Shifts <em>&amp; Shift Loadings</em>', html:
`    <p>Afternoon shifts attract <strong>12.5%</strong> and night shifts <strong>15%</strong>. A <strong>sleepover</strong> attracts an allowance of $62.87 per night on top of any active work, and a <strong>broken shift</strong> attracts $21.81 (one unpaid break) or $28.87 (two). See our <a href="/blog/schads-award-sleepover-allowance-explained">sleepover guide</a> and <a href="/blog/schads-award-broken-shift-rules">broken shift guide</a>.</p>` },
      ],
      mistakes: [
        '<strong>Using the wrong stream or pay point.</strong> SACS, home care and other streams have different rates — the pay point matters.',
        '<strong>Absorbing sleepovers into the hourly rate.</strong> A sleepover is a separate $62.87 allowance on top of any active work.',
        '<strong>Missing the broken-shift allowance.</strong> A broken shift attracts $21.81 or $28.87 depending on the number of unpaid breaks.',
        '<strong>Applying the wrong minimum engagement.</strong> SACS is 3 hours; other streams and casuals can be 2 — see our <a href="/blog/schads-award-broken-shift-rules">rostering notes</a>.',
      ],
      faqs: [
        { q: 'What is the SCHADS Level 1 rate in 2026?', a: '<strong>A Social & Community Services Level 1 pay point 1 employee earns $27.55/hr full-time under MA000100.</strong> Rates rise by pay point and level across each stream.' },
        { q: 'What are the SCHADS weekend penalty rates?', a: '<strong>Saturday 150% (175% casual), Sunday 200% (225% casual) and public holidays 250% (275% casual).</strong> Casual percentages already include the 25% loading.' },
        { q: 'How much is the SCHADS sleepover allowance?', a: '<strong>$62.87 per night, on top of pay for any active work performed.</strong> See our <a href="/blog/schads-award-sleepover-allowance-explained">sleepover allowance guide</a>.' },
        { q: 'What is the SCHADS afternoon shift loading?', a: '<strong>12.5% for afternoon shifts and 15% for night shifts</strong> under MA000100, where the higher of a penalty or shift loading applies for the same hours (not both).' },
        { q: 'How do I calculate a SCHADS rate?', a: '<strong>Fitz HR calculates the exact MA000100 rate by stream, level, pay point, day and shift.</strong> See the <a href="/schads-award-pay-rates">SCHADS pay rates</a> or <a href="/app">ask Fitz free</a>.' },
      ],
      related: [
        { href: '/blog/schads-award-sleepover-allowance-explained', label: 'SCHADS sleepover allowance explained' },
        { href: '/blog/schads-award-broken-shift-rules', label: 'SCHADS broken shift rules' },
        { href: '/blog/schads-award-penalty-rates-weekend-public-holiday', label: 'SCHADS penalty rates — weekend & public holidays' },
        { href: '/blog/schads-award-casual-conversion-rules-australia', label: 'Casual conversion under the SCHADS Award' },
        { href: '/schads-award-guide', label: 'SCHADS Award guide (MA000100)' },
        { href: '/schads-award-pay-rates', label: 'SCHADS Award pay rates — full table' },
      ],
      ctaH3: 'Get SCHADS Rates Right — Instantly',
    },
    {
      slug: 'schads-award-sleepover-allowance-explained',
      tag: 'Sleepovers · MA000100', cardTag: 'Allowances · MA000100',
      h1: 'SCHADS <em>Sleepover Allowance</em> Explained',
      cardTitle: 'SCHADS Sleepover Allowance Explained',
      title: 'SCHADS Sleepover Allowance 2026: Rules & Rate (MA000100)',
      metaDesc: 'The SCHADS Award MA000100 sleepover allowance 2026 — the $62.87 per night rate, what counts as a sleepover, and how active work during a sleepover is paid.',
      keywords: 'SCHADS sleepover allowance, sleepover rate MA000100, disability sleepover pay, SCHADS overnight allowance, sleepover active work SCHADS',
      blurb: 'The $62.87 per night sleepover allowance, what qualifies as a sleepover, and how active duty during the night is paid on top.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 4,
      intro: 'Sleepovers are a defining feature of disability and home-care rostering — and a frequent source of underpayment. This guide sets out how the <strong>SCHADS Award MA000100</strong> sleepover allowance works in 2026.',
      summary: 'Under MA000100, a sleepover attracts an allowance of $62.87 per night. The sleepover covers the requirement to be available overnight; any time the worker is woken to perform active duty is paid separately at the applicable rate, not absorbed by the allowance. A sleepover also carries minimum break and facility requirements.',
      quickRefLabel: 'Sleepover — At a Glance',
      quickRef: [
        '<strong>Sleepover allowance:</strong> $62.87 per night',
        '<strong>Active duty during the night:</strong> paid separately at the applicable rate',
        '<strong>Plus</strong> minimum break and suitable-facility requirements',
      ],
      sections: () => [
        { h2: 'What Counts as a <em>Sleepover</em>', html:
`    <p>A sleepover is where an employee is required to sleep at the workplace (for example, a group home) to be available for work if needed overnight. The <strong>$62.87 allowance</strong> compensates for that availability. The employer must provide a proper sleeping facility and the employee is entitled to a continuous break.</p>` },
        { h2: 'How Active Duty Is <em>Paid</em>', html:
`    <p>If the worker is woken to perform active duty during the sleepover, that time is <strong>paid separately at the applicable rate</strong> (including any weekend or public holiday penalty) — it is not covered by the sleepover allowance. Treating the flat allowance as covering call-outs is a common and costly error.</p>` },
        { h2: 'Sleepovers vs <em>Overnight Shifts</em>', html:
`    <p>A sleepover is different from a rostered overnight (active) shift, which is paid as ordinary or shift hours throughout. If the worker is expected to be awake and working for most of the night, that is a shift — not a sleepover — and must be paid accordingly.</p>` },
      ],
      mistakes: [
        '<strong>Treating the allowance as covering call-outs.</strong> Active duty during a sleepover is paid separately at the applicable rate.',
        '<strong>Calling an active overnight shift a "sleepover".</strong> If the worker is awake and working, it is a shift, not a sleepover.',
        '<strong>Skipping the facility and break requirements.</strong> A proper sleeping facility and a continuous break are part of the entitlement.',
      ],
      faqs: [
        { q: 'How much is the SCHADS sleepover allowance in 2026?', a: '<strong>$62.87 per night under MA000100</strong>, on top of pay for any active work performed during the night.' },
        { q: 'Is active work during a sleepover paid separately?', a: '<strong>Yes.</strong> Any time the worker is woken to perform duties is paid at the applicable rate — including weekend or public holiday penalties — not absorbed by the sleepover allowance.' },
        { q: 'What is the difference between a sleepover and an overnight shift?', a: '<strong>A sleepover is availability while asleep; an overnight shift is active work.</strong> If the worker is expected to be awake and working, it must be paid as a shift, not a sleepover.' },
        { q: 'Does an employer have to provide sleeping facilities?', a: '<strong>Yes — a suitable, separate sleeping facility, and the employee is entitled to a continuous break.</strong>' },
      ],
      related: [
        { href: '/blog/schads-award-rates-2026', label: 'SCHADS Award rates 2026 — full breakdown' },
        { href: '/blog/schads-award-broken-shift-rules', label: 'SCHADS broken shift rules' },
        { href: '/blog/schads-award-penalty-rates-weekend-public-holiday', label: 'SCHADS penalty rates — weekend & public holidays' },
        { href: '/schads-award-guide', label: 'SCHADS Award guide (MA000100)' },
      ],
    },
    {
      slug: 'schads-award-broken-shift-rules',
      tag: 'Broken Shifts · MA000100', cardTag: 'Rostering · MA000100',
      h1: 'SCHADS <em>Broken Shift</em> Rules',
      cardTitle: 'SCHADS Broken Shift Rules',
      title: 'SCHADS Broken Shift Allowance 2026: Rules (MA000100)',
      metaDesc: 'SCHADS Award MA000100 broken shifts 2026 — the $21.81 / $28.87 broken shift allowance, the maximum unpaid breaks, and the minimum engagement rules.',
      keywords: 'SCHADS broken shift, broken shift allowance MA000100, disability broken shift rules, SCHADS split shift, home care broken shift pay',
      blurb: 'The broken shift allowance ($21.81 / $28.87), the maximum number of unpaid breaks, and how minimum engagement applies to each portion.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 5,
      intro: 'Broken shifts — where a workday is split by one or more unpaid breaks — are common in home care and disability services. The <strong>SCHADS Award MA000100</strong> pays a specific allowance for them, with strict limits. Here is how it works in 2026.',
      summary: 'Under MA000100, a broken shift attracts an allowance of $21.81 (one unpaid break) or $28.87 (two unpaid breaks) per broken shift. A broken shift may contain at most two unpaid breaks, and each separate portion still attracts the applicable minimum engagement. Broken shifts cannot be used to avoid paying for short attendances.',
      quickRefLabel: 'Broken Shifts — SCHADS',
      quickRef: [
        '<strong>One unpaid break:</strong> $21.81 per broken shift',
        '<strong>Two unpaid breaks:</strong> $28.87 per broken shift',
        '<strong>Maximum:</strong> two unpaid breaks per broken shift',
        '<strong>Each portion</strong> still attracts its minimum engagement',
      ],
      sections: () => [
        { h2: 'What Is a <em>Broken Shift</em>', html:
`    <p>A broken shift is a single day’s work split by one or more <strong>unpaid</strong> breaks (longer than a normal meal break). It is common where a home-care worker sees clients morning and evening with a gap in between. The Award pays an allowance to recognise the disruption of the split.</p>` },
        { h2: 'The Broken Shift <em>Allowance</em>', html:
`    <p>The allowance is <strong>$21.81</strong> for a broken shift with one unpaid break and <strong>$28.87</strong> for two. A broken shift may contain a maximum of <strong>two</strong> unpaid breaks — you cannot split a day into three or more working portions to save cost.</p>` },
        { h2: 'Minimum Engagement <em>on Each Portion</em>', html:
`    <p>Each separate working portion of a broken shift still attracts the applicable <strong>minimum engagement</strong> (2 hours for most streams; 3 hours for social &amp; community services). So a 45-minute morning visit and a 45-minute evening visit are each paid at the minimum, plus the broken-shift allowance — not just the time worked.</p>` },
      ],
      mistakes: [
        '<strong>Using three or more portions.</strong> A broken shift can have at most two unpaid breaks.',
        '<strong>Paying only the time worked.</strong> Each portion attracts the minimum engagement, plus the broken-shift allowance.',
        '<strong>Forgetting the allowance entirely.</strong> Every broken shift attracts $21.81 or $28.87.',
      ],
      faqs: [
        { q: 'How much is the SCHADS broken shift allowance?', a: '<strong>$21.81 for a broken shift with one unpaid break, or $28.87 for two, under MA000100.</strong>' },
        { q: 'How many breaks can a SCHADS broken shift have?', a: '<strong>A maximum of two unpaid breaks.</strong> You cannot split a day into three or more separate working portions.' },
        { q: 'Does minimum engagement apply to each part of a broken shift?', a: '<strong>Yes.</strong> Each working portion attracts the applicable minimum engagement — 2 hours for most streams, 3 hours for social & community services — plus the broken-shift allowance.' },
        { q: 'Is a broken shift the same as a split shift?', a: '<strong>They are similar concepts, but the SCHADS broken-shift rules and allowance are specific to MA000100.</strong> Always apply the SCHADS figures and limits rather than another award’s split-shift rules.' },
      ],
      related: [
        { href: '/blog/schads-award-rates-2026', label: 'SCHADS Award rates 2026 — full breakdown' },
        { href: '/blog/schads-award-sleepover-allowance-explained', label: 'SCHADS sleepover allowance explained' },
        { href: '/blog/schads-award-casual-conversion-rules-australia', label: 'Casual conversion under the SCHADS Award' },
        { href: '/schads-award-guide', label: 'SCHADS Award guide (MA000100)' },
      ],
    },
    {
      slug: 'schads-award-penalty-rates-weekend-public-holiday',
      tag: 'Penalty Rates · MA000100', cardTag: 'Penalty Rates · MA000100',
      h1: 'SCHADS Award Penalty Rates — <em>Weekend &amp; Public Holidays</em>',
      cardTitle: 'SCHADS Penalty Rates — Weekend & Public Holidays',
      title: 'SCHADS Penalty Rates 2026: Weekend & Public Holiday',
      metaDesc: 'SCHADS Award MA000100 penalty rates 2026 — Saturday, Sunday and public holiday rates for full-time, part-time and casual employees, plus shift loadings and worked examples.',
      keywords: 'SCHADS penalty rates, SCHADS sunday rate, disability support public holiday rate, MA000100 penalty rates, SCHADS casual penalty rates',
      blurb: 'Saturday, Sunday and public holiday penalties for social, community, home care and disability staff — with casual all-inclusive rates and worked examples.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 5,
      intro: 'Weekend and public holiday work is constant in community and disability services. This guide sets out the exact <strong>SCHADS Award MA000100</strong> penalty rates for 2026 and how they apply across full-time, part-time and casual employees.',
      summary: 'Under MA000100, Saturday is 150% (175% casual), Sunday 200% (225% casual) and public holidays 250% (275% casual). Casual percentages already include the 25% loading. Afternoon (12.5%) and night (15%) shift loadings apply to ordinary hours, and the higher of a penalty rate or a shift loading applies for the same hours — never both.',
      quickRefLabel: 'SCHADS Penalty Rates 2026',
      quickRef: [
        '<strong>Saturday:</strong> 150% (FT/PT) · 175% (casual)',
        '<strong>Sunday:</strong> 200% (FT/PT) · 225% (casual)',
        '<strong>Public holiday:</strong> 250% (FT/PT) · 275% (casual)',
        '<strong>Shift loadings:</strong> afternoon +12.5%, night +15% (higher of penalty or loading, not both)',
      ],
      sections: (h) => [
        { h2: 'The <em>Penalty Rate</em> Table', html:
`    <p>Percentages are of the minimum hourly rate; casual rates are all-inclusive of the 25% loading.</p>
${h.penaltyTable(h.data)}` },
        { h2: 'Worked <em>Examples</em>', html:
`    <p>For a <strong>Social &amp; Community Services Level 1 pay point 1</strong> employee on $27.55/hr:</p>
    <ul>
        <li>Saturday: $41.33/hr (FT/PT) · $48.21/hr (casual)</li>
        <li>Sunday: $55.10/hr (FT/PT) · $61.99/hr (casual)</li>
        <li>Public holiday: $68.88/hr (FT/PT) · $75.76/hr (casual)</li>
    </ul>` },
        { h2: 'Penalties vs <em>Shift Loadings</em>', html:
`    <p>Afternoon (12.5%) and night (15%) shift loadings apply to ordinary hours. Where a penalty rate and a shift loading could both apply to the same hours, the <strong>higher of the two</strong> applies — not both. Sleepover, on-call and broken-shift payments are additional and are not affected by this rule.</p>` },
      ],
      mistakes: [
        '<strong>Paying Sunday rates on public holidays.</strong> Public holidays are 250%/275%, not 200%/225%.',
        '<strong>Stacking a shift loading on a weekend penalty.</strong> The higher of the two applies for the same hours, not both.',
        '<strong>Stacking casual loading on the casual penalty rate.</strong> The casual percentages already include the 25% loading.',
      ],
      faqs: [
        { q: 'What is the SCHADS Sunday rate in 2026?', a: '<strong>200% for full-time and part-time employees, and 225% for casuals under MA000100.</strong>' },
        { q: 'What is the SCHADS public holiday rate?', a: '<strong>250% for full-time and part-time, and 275% for casuals.</strong> The casual rate already includes the 25% loading.' },
        { q: 'Do SCHADS shift loadings stack with weekend penalties?', a: '<strong>No — the higher of a penalty rate or a shift loading applies for the same hours, not both.</strong> Sleepover and broken-shift allowances are separate and additional.' },
        { q: 'Are SCHADS casual penalty rates on top of casual loading?', a: '<strong>No — they are all-inclusive.</strong> The 25% loading is already built into the casual percentages.' },
      ],
      related: [
        { href: '/blog/schads-award-rates-2026', label: 'SCHADS Award rates 2026 — full breakdown' },
        { href: '/blog/schads-award-sleepover-allowance-explained', label: 'SCHADS sleepover allowance explained' },
        { href: '/blog/schads-award-broken-shift-rules', label: 'SCHADS broken shift rules' },
        { href: '/schads-award-guide', label: 'SCHADS Award guide (MA000100)' },
      ],
    },
    {
      slug: 'schads-award-casual-conversion-rules-australia',
      tag: 'Casual Conversion · MA000100', cardTag: 'Casual · MA000100',
      h1: 'Casual Conversion Under the <em>SCHADS Award</em>',
      cardTitle: 'Casual Conversion Under the SCHADS Award',
      title: 'SCHADS Casual Conversion 2026: The Rules (MA000100)',
      metaDesc: 'Casual conversion under the SCHADS Award MA000100 — the employee-initiated rules from 26 February 2025, the 6/12-month milestones, and how employers must respond.',
      keywords: 'SCHADS casual conversion, MA000100 casual conversion, disability support casual conversion, NDIS casual permanent, casual employment information statement SCHADS',
      blurb: 'The employee-initiated casual conversion rules under MA000100 — eligibility, the 21-day response and what changes on conversion.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 5,
      intro: 'With a large casual and NDIS-funded workforce, casual conversion is a live issue across community and disability services. Under the <strong>SCHADS Award MA000100</strong>, conversion has been employee-initiated since 26 February 2025.',
      summary: 'Since 26 February 2025, casual conversion under MA000100 is employee-initiated: a casual can give written notice requesting permanent employment after 6 months (12 months in a small business), if they no longer meet the casual definition. The employer must respond in writing within 21 days. On conversion the employee loses the 25% loading but gains paid leave and notice entitlements.',
      quickRefLabel: 'Casual Conversion — SCHADS',
      quickRef: [
        '<strong>Who initiates:</strong> the employee (since 26 Feb 2025)',
        '<strong>Eligibility:</strong> 6 months (12 months for small business)',
        '<strong>Employer response:</strong> in writing within 21 days',
        '<strong>On conversion:</strong> lose 25% loading, gain paid leave & notice',
      ],
      sections: casualConversionSections('SCHADS Award', 'MA000100',
        'Where NDIS funding assumes a casual workforce, plan for conversion requests from long-term regular workers rather than treating them as exceptions.'),
      mistakes: [
        '<strong>Assuming NDIS funding rules out conversion.</strong> Eligibility turns on the employment relationship, not the funding model.',
        '<strong>Missing the 21-day written response.</strong> A separate contravention.',
        '<strong>Not providing the Casual Employment Information Statement.</strong> Required at commencement and at the 6- or 12-month milestone.',
      ],
      faqs: [
        { q: 'Who initiates casual conversion under SCHADS?', a: '<strong>The employee, since 26 February 2025.</strong> The employer-offer model no longer applies.' },
        { q: 'When can a SCHADS casual request conversion?', a: '<strong>After 6 months (12 months for a small business), if they no longer meet the casual definition.</strong>' },
        { q: 'Does NDIS funding affect conversion rights?', a: '<strong>No — conversion eligibility depends on the employment relationship becoming regular and systematic, not on how the service is funded.</strong>' },
        { q: 'What changes on conversion?', a: '<strong>The employee loses the 25% casual loading and gains paid leave, notice and (where applicable) redundancy entitlements.</strong>' },
      ],
      related: [
        { href: '/blog/schads-award-rates-2026', label: 'SCHADS Award rates 2026 — full breakdown' },
        { href: '/blog/schads-award-broken-shift-rules', label: 'SCHADS broken shift rules' },
        { href: '/blog/casual-conversion-rules-hospitality-award-australia', label: 'Casual conversion under the Hospitality Award' },
        { href: '/schads-award-guide', label: 'SCHADS Award guide (MA000100)' },
      ],
    },
  ],

  // =====================================================================
  // HEALTH PROFESSIONALS AND SUPPORT SERVICES AWARD (MA000027)
  // =====================================================================
  health: [
    {
      slug: 'health-professionals-award-rates-2026',
      tag: 'Award Rates · Penalty Rates · 2026', cardTag: 'Pay Rates · MA000027',
      h1: 'Health Professionals Award Rates 2026 — Pay &amp; <em>Penalties</em>',
      cardTitle: 'Health Professionals Award Rates 2026',
      title: 'Health Professionals Award Rates 2026: Pay (MA000027)',
      metaDesc: 'Health Professionals & Support Services Award MA000027 pay rates 2026 — stream and level rates, weekend penalties, shift loading, casual loading and minimum engagement.',
      keywords: 'health professionals award rates 2026, MA000027 pay rates, dental assistant pay, pathology collector rate, allied health pay rates, health support services award',
      blurb: 'Stream and level rates for allied health, dental, pathology and support staff, weekend penalties, the Monday–Friday shift loading and casual loading under MA000027.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 6,
      intro: 'The <strong>Health Professionals and Support Services Award MA000027</strong> covers a wide private-sector workforce — allied health, dental assistants, pathology collectors and administration — across several streams. This guide sets out the 2026 rates and the rules behind them.',
      summary: 'Under the Health Professionals Award MA000027 (2026), a Support Services Level 1 employee earns $26.97/hr full-time. Saturday and Sunday are both 150% (175% casual) and public holidays 250% (275% casual). A 15% shift loading applies to certain Monday–Friday shifts. The casual minimum engagement is 3 hours, and the casual loading of 25% is already built into the casual penalty percentages.',
      quickRefLabel: 'Quick Reference — Health Professionals 2026',
      quickRef: [
        '<strong>Support Services Level 1:</strong> $26.97/hr full-time',
        '<strong>Saturday:</strong> 150% (FT/PT) · 175% (casual)',
        '<strong>Sunday:</strong> 150% (FT/PT) · 175% (casual)',
        '<strong>Public holiday:</strong> 250% (FT/PT) · 275% (casual)',
        '<strong>Shift loading (Mon–Fri):</strong> +15%',
        '<strong>Casual minimum engagement:</strong> 3 hours',
      ],
      sections: (h) => [
        { h2: 'Rates by Stream <em>&amp; Level</em>', html:
`    <p>MA000027 splits into streams — support services, dental assistants, pathology collectors and health professionals — each with its own levels and pay points. Health-professional streams reach much higher rates than support roles, so the stream and level both matter.</p>
${h.payTable(h.data, 12)}` },
        { h2: 'Penalty Rates <em>&amp; Shift Loading</em>', html:
`    <p>Weekend and public holiday penalties are a percentage of the minimum hourly rate; casual rates are all-inclusive of the 25% loading:</p>
${h.penaltyTable(h.data)}
    <p>A <strong>15% shift loading</strong> applies to defined Monday–Friday shifts. Overtime is 150% for the first 2 hours and 200% after.</p>` },
        { h2: 'Casual Loading <em>&amp; Minimum Engagement</em>', html:
`    <p>Casual employees receive a <strong>25% loading</strong> and a <strong>minimum engagement of 3 hours</strong> per shift. Many practices also use annualised wage arrangements for full-time professionals — see our <a href="/blog/health-professionals-award-annualised-wage-arrangements">annualised wage guide</a> for the strict conditions.</p>` },
      ],
      mistakes: [
        '<strong>Using the wrong stream.</strong> A dental assistant, pathology collector and health professional sit in different streams with different rates.',
        '<strong>Treating a salary as covering everything.</strong> Annualised wages have strict conditions and a mandatory reconciliation — see our <a href="/blog/health-professionals-award-annualised-wage-arrangements">annualised wage guide</a>.',
        '<strong>Rostering casuals under 3 hours.</strong> The casual minimum engagement is 3 hours.',
        '<strong>Paying Sunday rates on public holidays.</strong> Public holidays are 250%/275%.',
      ],
      faqs: [
        { q: 'What is the base rate for a health support worker in 2026?', a: '<strong>A Support Services Level 1 employee earns $26.97/hr full-time under MA000027.</strong> Health-professional streams (physiotherapy, etc.) reach much higher rates by level and pay point.' },
        { q: 'What are the weekend penalty rates under MA000027?', a: '<strong>Saturday and Sunday are both 150% (175% casual); public holidays are 250% (275% casual).</strong>' },
        { q: 'What is the casual minimum engagement under the Health Professionals Award?', a: '<strong>3 hours per shift.</strong> A casual must be paid for at least 3 hours each time they attend work.' },
        { q: 'Is there a shift loading under MA000027?', a: '<strong>Yes — a 15% loading applies to defined Monday–Friday shifts.</strong> Overtime is 150% for the first 2 hours and 200% after.' },
        { q: 'How do I calculate a Health Professionals Award rate?', a: '<strong>Fitz HR calculates the exact MA000027 rate by stream, level, day and shift.</strong> See the <a href="/health-award-pay-rates">pay rates page</a> or <a href="/app">ask Fitz free</a>.' },
      ],
      related: [
        { href: '/blog/health-professionals-award-annualised-wage-arrangements', label: 'Health Professionals Award annualised wage arrangements' },
        { href: '/blog/health-professionals-award-weekend-penalty-rates', label: 'Health Professionals Award weekend penalty rates' },
        { href: '/blog/health-professionals-award-allowances-guide', label: 'Health Professionals Award allowances guide' },
        { href: '/blog/health-professionals-award-casual-conversion-rules-australia', label: 'Casual conversion under the Health Professionals Award' },
        { href: '/health-award-guide', label: 'Health Professionals Award guide (MA000027)' },
        { href: '/health-award-pay-rates', label: 'Health Professionals Award pay rates — full table' },
      ],
      ctaH3: 'Get Health Professionals Award Rates Right — Instantly',
    },
    {
      slug: 'health-professionals-award-annualised-wage-arrangements',
      tag: 'Annualised Wages · MA000027', cardTag: 'Salaries · MA000027',
      h1: 'Health Professionals Award <em>Annualised Wage</em> Arrangements',
      cardTitle: 'Health Professionals Award Annualised Wages',
      title: 'Health Award Annualised Wages 2026: Clause 22 Rules',
      metaDesc: 'Annualised wage arrangements under the Health Professionals Award MA000027 (clause 22) — eligibility, outer-limit hours, the mandatory annual reconciliation and record-keeping.',
      keywords: 'health professionals award annualised wage, MA000027 clause 22, annualised salary health, salaried health professional reconciliation, annualised wage reconciliation',
      blurb: 'How annualised wages work under MA000027 (clause 22) — eligibility, outer-limit hours, and the mandatory annual reconciliation that catches out most salaried arrangements.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 6,
      intro: 'Paying a health professional a salary does not make Award obligations go away. The <strong>Health Professionals Award MA000027</strong> allows annualised wage arrangements under clause 22 — but only under strict conditions, with a reconciliation that trips up most practices.',
      summary: 'Under MA000027 clause 22, a full-time employee can be paid an annualised wage by written agreement that absorbs specified Award entitlements (such as penalties and overtime). The arrangement must set outer-limit hours, and the employer must reconcile the salary against what the Award would have paid at least every 12 months (and on termination), paying any shortfall within 14 days. Records of start, finish and unpaid-break times must be kept and signed.',
      quickRefLabel: 'Annualised Wages — Clause 22',
      quickRef: [
        '<strong>Who:</strong> full-time employees, by written agreement',
        '<strong>Outer-limit hours:</strong> must be specified; excess is paid separately',
        '<strong>Reconciliation:</strong> at least every 12 months and on termination',
        '<strong>Shortfall:</strong> paid within 14 days',
        '<strong>Records:</strong> start/finish and unpaid breaks, signed each pay period',
      ],
      sections: () => [
        { h2: 'What an Annualised Wage <em>Can Do</em>', html:
`    <p>Under clause 22, a written annualised wage can absorb specified Award entitlements — such as minimum weekly wages, penalty rates, overtime and allowances — into a single salary. The agreement must identify which provisions are absorbed and how the annualised wage was calculated.</p>` },
        { h2: 'Outer-Limit <em>Hours</em>', html:
`    <p>The arrangement must set <strong>outer limits</strong> on the number of penalty and overtime hours the salary covers in a pay period. Hours worked beyond those limits are <strong>not</strong> covered by the salary and must be paid separately at the applicable Award rate. Treating a salary as covering unlimited hours is the single biggest compliance failure here.</p>` },
        { h2: 'The Mandatory <em>Reconciliation</em>', html:
`    <p>At least once every 12 months — and when the arrangement ends or the employee leaves — the employer must <strong>reconcile</strong> the annualised wage against what the employee would have earned under the Award for the hours actually worked. Any shortfall must be paid <strong>within 14 days</strong>. To do this, the employer must keep a record of start times, finish times and unpaid breaks, and have the employee sign it each pay period or roster cycle.</p>` },
      ],
      mistakes: [
        '<strong>Assuming a salary covers unlimited hours.</strong> Hours beyond the outer limits must be paid separately.',
        '<strong>Skipping the annual reconciliation.</strong> It is mandatory, and any shortfall must be paid within 14 days.',
        '<strong>Not keeping signed time records.</strong> Start, finish and unpaid-break records must be kept and signed — without them, the arrangement is not compliant.',
      ],
      faqs: [
        { q: 'Can a health professional be paid an annualised salary?', a: '<strong>Yes — under clause 22 of MA000027, by written agreement, for full-time employees.</strong> The salary can absorb specified Award entitlements but must meet strict conditions.' },
        { q: 'What is the annualised wage reconciliation?', a: '<strong>At least every 12 months (and on termination), the employer compares the salary to what the Award would have paid for the hours actually worked, and pays any shortfall within 14 days.</strong>' },
        { q: 'What records must be kept for an annualised wage?', a: '<strong>Start times, finish times and any unpaid breaks — recorded and signed by the employee each pay period or roster cycle.</strong> Without them the arrangement is non-compliant.' },
        { q: 'What happens if the salary does not cover the hours worked?', a: '<strong>The employer must pay the shortfall within 14 days of the reconciliation.</strong> Hours beyond the outer limits must also be paid separately at the applicable rate.' },
      ],
      related: [
        { href: '/blog/health-professionals-award-rates-2026', label: 'Health Professionals Award rates 2026 — full breakdown' },
        { href: '/blog/health-professionals-award-weekend-penalty-rates', label: 'Health Professionals Award weekend penalty rates' },
        { href: '/blog/annualised-wage-arrangements-restaurant-award-australia', label: 'Annualised wage arrangements (Restaurant Award)' },
        { href: '/health-award-guide', label: 'Health Professionals Award guide (MA000027)' },
      ],
    },
    {
      slug: 'health-professionals-award-weekend-penalty-rates',
      tag: 'Penalty Rates · MA000027', cardTag: 'Penalty Rates · MA000027',
      h1: 'Health Professionals Award <em>Weekend Penalty Rates</em>',
      cardTitle: 'Health Professionals Award Weekend Penalty Rates',
      title: 'Health Award Penalty Rates 2026: Weekend & Public Holiday',
      metaDesc: 'Health Professionals Award MA000027 penalty rates 2026 — Saturday, Sunday and public holiday rates for full-time, part-time and casual staff, plus the shift loading and overtime.',
      keywords: 'health professionals award penalty rates, MA000027 sunday rate, dental assistant weekend pay, allied health public holiday rate, health award shift loading',
      blurb: 'Saturday, Sunday and public holiday penalties for health professionals and support staff, the 15% Monday–Friday shift loading, and worked examples.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 5,
      intro: 'Weekend and after-hours work is common in private health. This guide sets out the exact <strong>Health Professionals Award MA000027</strong> penalty rates for 2026 and how the shift loading and overtime fit around them.',
      summary: 'Under MA000027, Saturday and Sunday are both 150% (175% casual) and public holidays 250% (275% casual). Casual percentages already include the 25% loading. A 15% shift loading applies to defined Monday–Friday shifts, and overtime is 150% for the first 2 hours and 200% after.',
      quickRefLabel: 'Health Penalty Rates 2026',
      quickRef: [
        '<strong>Saturday:</strong> 150% (FT/PT) · 175% (casual)',
        '<strong>Sunday:</strong> 150% (FT/PT) · 175% (casual)',
        '<strong>Public holiday:</strong> 250% (FT/PT) · 275% (casual)',
        '<strong>Shift loading (Mon–Fri):</strong> +15%',
        '<strong>Overtime:</strong> 150% (first 2 hrs) then 200%',
      ],
      sections: (h) => [
        { h2: 'The <em>Penalty Rate</em> Table', html:
`    <p>Percentages are of the minimum hourly rate; casual rates are all-inclusive of the 25% loading.</p>
${h.penaltyTable(h.data)}` },
        { h2: 'Worked <em>Examples</em>', html:
`    <p>For a <strong>Support Services Level 1</strong> employee on $26.97/hr:</p>
    <ul>
        <li>Saturday: $40.46/hr (FT/PT) · $47.20/hr (casual)</li>
        <li>Sunday: $40.46/hr (FT/PT) · $47.20/hr (casual)</li>
        <li>Public holiday: $67.43/hr (FT/PT) · $74.17/hr (casual)</li>
    </ul>
    <p>Note that Saturday and Sunday are the same rate under MA000027 — unlike many awards where Sunday is higher.</p>` },
        { h2: 'Shift Loading <em>&amp; Overtime</em>', html:
`    <p>A <strong>15% shift loading</strong> applies to defined Monday–Friday shifts (for example, shifts finishing late). Overtime is <strong>150%</strong> for the first 2 hours and <strong>200%</strong> after. The shift loading is not paid on top of a weekend penalty or overtime for the same hour — the higher single entitlement applies.</p>` },
      ],
      mistakes: [
        '<strong>Assuming Sunday is higher than Saturday.</strong> Under MA000027 they are the same (150%/175%).',
        '<strong>Paying Sunday rates on public holidays.</strong> Public holidays are 250%/275%.',
        '<strong>Stacking the shift loading on penalties or overtime.</strong> The higher single entitlement applies, not both.',
      ],
      faqs: [
        { q: 'What is the Sunday rate under the Health Professionals Award?', a: '<strong>150% for full-time and part-time, and 175% for casuals — the same as Saturday under MA000027.</strong>' },
        { q: 'What is the public holiday rate under MA000027?', a: '<strong>250% for full-time and part-time, and 275% for casuals.</strong>' },
        { q: 'Is there a shift loading under the Health Professionals Award?', a: '<strong>Yes — 15% on defined Monday–Friday shifts.</strong> It is not paid on top of a weekend penalty or overtime for the same hour.' },
        { q: 'What are the overtime rates under MA000027?', a: '<strong>150% for the first 2 hours and 200% after.</strong>' },
      ],
      related: [
        { href: '/blog/health-professionals-award-rates-2026', label: 'Health Professionals Award rates 2026 — full breakdown' },
        { href: '/blog/health-professionals-award-annualised-wage-arrangements', label: 'Health Professionals Award annualised wages' },
        { href: '/blog/health-professionals-award-allowances-guide', label: 'Health Professionals Award allowances guide' },
        { href: '/health-award-guide', label: 'Health Professionals Award guide (MA000027)' },
      ],
    },
    {
      slug: 'health-professionals-award-allowances-guide',
      tag: 'Allowances · MA000027', cardTag: 'Allowances · MA000027',
      h1: 'Health Professionals Award <em>Allowances</em> Guide',
      cardTitle: 'Health Professionals Award Allowances Guide',
      title: 'Health Award Allowances 2026: Uniform, Tools & More',
      metaDesc: 'Health Professionals Award MA000027 allowances 2026 — the uniform allowance, tool allowance and other common allowances, what triggers them, and current amounts.',
      keywords: 'health professionals award allowances, uniform allowance MA000027, health award tool allowance, dental assistant allowances, health support allowances 2026',
      blurb: 'The uniform allowance, tool allowance and other frequently-applied allowances under MA000027 — what triggers each and the current figures.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 4,
      intro: 'Allowances in private health are easy to overlook — uniforms, tools, first aid and more. The <strong>Health Professionals Award MA000027</strong> requires them to be paid when triggered. Here are the common ones for 2026.',
      summary: 'Under MA000027, common allowances include a uniform allowance of $1.26 per shift where the employer requires a uniform but does not launder it, and a range of role-specific allowances. Allowances are paid on top of the base rate whenever the trigger condition is met — not absorbed into the hourly rate or a salary unless the arrangement expressly and adequately covers them.',
      quickRefLabel: 'Common Allowances — Health',
      quickRef: [
        '<strong>Uniform allowance:</strong> $1.26 per shift (uniform required, not laundered)',
        '<strong>Plus</strong> first-aid, tool and role-specific allowances where they apply',
        '<strong>Paid on top</strong> of the base rate whenever triggered',
      ],
      sections: (h) => [
        { h2: 'Common <em>Allowances</em> and Amounts', html:
`    <p>These allowances apply most often. Each is paid when its trigger condition is met, on top of the ordinary rate.</p>
${h.allowanceTable(h.data, 10)}` },
        { h2: 'How Allowances Interact with <em>Salaries</em>', html:
`    <p>An annualised salary only "covers" allowances if the written arrangement expressly absorbs them and the salary demonstrably exceeds base plus every triggered allowance. Otherwise, allowances must be paid separately — see our <a href="/blog/health-professionals-award-annualised-wage-arrangements">annualised wage guide</a>.</p>` },
      ],
      mistakes: [
        '<strong>Assuming a salary covers allowances.</strong> Only if expressly absorbed and adequately funded — otherwise pay them separately.',
        '<strong>Forgetting the uniform allowance.</strong> Where a uniform is required but not laundered by the employer, the allowance applies.',
        '<strong>Missing first-aid allowances.</strong> Employees who hold and use a first-aid qualification at the employer’s request are owed the allowance.',
      ],
      faqs: [
        { q: 'What is the uniform allowance under the Health Professionals Award?', a: '<strong>$1.26 per shift where the employer requires a uniform but does not launder it, under MA000027.</strong>' },
        { q: 'Are allowances covered by an annualised salary?', a: '<strong>Only if the written annualised wage arrangement expressly absorbs them and the salary exceeds base plus every triggered allowance.</strong> Otherwise they are paid separately.' },
        { q: 'Where can I see all Health Professionals Award allowances?', a: '<strong>The full list is on the <a href="/health-award-pay-rates">Health Professionals Award pay rates page</a>, or ask Fitz for the exact figure and trigger.</strong>' },
        { q: 'Is the first-aid allowance payable to health staff?', a: '<strong>Yes — where an employee holds a current first-aid qualification and is required to use it, the first-aid allowance applies.</strong>' },
      ],
      related: [
        { href: '/blog/health-professionals-award-rates-2026', label: 'Health Professionals Award rates 2026 — full breakdown' },
        { href: '/blog/health-professionals-award-weekend-penalty-rates', label: 'Health Professionals Award weekend penalty rates' },
        { href: '/blog/health-professionals-award-casual-conversion-rules-australia', label: 'Casual conversion under the Health Professionals Award' },
        { href: '/health-award-guide', label: 'Health Professionals Award guide (MA000027)' },
      ],
    },
    {
      slug: 'health-professionals-award-casual-conversion-rules-australia',
      tag: 'Casual Conversion · MA000027', cardTag: 'Casual · MA000027',
      h1: 'Casual Conversion Under the <em>Health Professionals Award</em>',
      cardTitle: 'Casual Conversion Under the Health Professionals Award',
      title: 'Health Award Casual Conversion 2026: The Rules',
      metaDesc: 'Casual conversion under the Health Professionals Award MA000027 — the employee-initiated rules from 26 February 2025, the 6/12-month milestones, and how employers respond.',
      keywords: 'health professionals casual conversion, MA000027 casual conversion, dental assistant permanent, casual employment information statement health',
      blurb: 'The employee-initiated casual conversion rules under MA000027 — eligibility, the 21-day response and what changes on conversion.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 5,
      intro: 'Private practices lean heavily on casuals for reception, support and after-hours cover. Under the <strong>Health Professionals Award MA000027</strong>, casual conversion has been employee-initiated since 26 February 2025.',
      summary: 'Since 26 February 2025, casual conversion under MA000027 is employee-initiated: a casual can give written notice requesting permanent employment after 6 months (12 months in a small business), if they no longer meet the casual definition. The employer must respond in writing within 21 days. On conversion the employee loses the 25% loading but gains paid leave and notice entitlements.',
      quickRefLabel: 'Casual Conversion — Health',
      quickRef: [
        '<strong>Who initiates:</strong> the employee (since 26 Feb 2025)',
        '<strong>Eligibility:</strong> 6 months (12 months for small business)',
        '<strong>Employer response:</strong> in writing within 21 days',
        '<strong>On conversion:</strong> lose 25% loading, gain paid leave & notice',
      ],
      sections: casualConversionSections('Health Professionals and Support Services Award', 'MA000027',
        'Reception and support roles that settle into a regular weekly pattern are the most likely to meet the test.'),
      mistakes: [
        '<strong>Waiting for the employer to offer.</strong> Conversion is employee-initiated, but the duty to respond and to provide the Information Statement remains.',
        '<strong>Missing the 21-day written response.</strong> A separate contravention.',
        '<strong>Not providing the Casual Employment Information Statement.</strong> Required at commencement and at the 6- or 12-month milestone.',
      ],
      faqs: [
        { q: 'Who initiates casual conversion in a health practice?', a: '<strong>The employee, since 26 February 2025.</strong> The employer-offer model no longer applies.' },
        { q: 'When can a health casual request conversion?', a: '<strong>After 6 months (12 months for a small business), if they no longer meet the casual definition.</strong>' },
        { q: 'How long does the employer have to respond?', a: '<strong>21 days, in writing</strong> — accepting or refusing on valid grounds with reasons.' },
        { q: 'What changes on conversion?', a: '<strong>The employee loses the 25% casual loading and gains paid leave, notice and (where applicable) redundancy entitlements.</strong>' },
      ],
      related: [
        { href: '/blog/health-professionals-award-rates-2026', label: 'Health Professionals Award rates 2026 — full breakdown' },
        { href: '/blog/health-professionals-award-annualised-wage-arrangements', label: 'Health Professionals Award annualised wages' },
        { href: '/blog/casual-conversion-rules-hospitality-award-australia', label: 'Casual conversion under the Hospitality Award' },
        { href: '/health-award-guide', label: 'Health Professionals Award guide (MA000027)' },
      ],
    },
  ],

  // =====================================================================
  // CHILDREN'S SERVICES AWARD (MA000120)
  // =====================================================================
  childrens: [
    {
      slug: 'childrens-services-award-rates-2026',
      tag: 'Award Rates · Penalty Rates · 2026', cardTag: 'Pay Rates · MA000120',
      h1: "Children's Services Award Rates 2026 — Pay &amp; <em>Penalties</em>",
      cardTitle: "Children's Services Award Rates 2026",
      title: "Children's Services Award Rates 2026: Pay (MA000120)",
      metaDesc: "Children's Services Award MA000120 pay rates 2026 — educator and director level rates, weekend penalties, shift loadings, the educational leader allowance and casual loading.",
      keywords: 'childrens services award rates 2026, MA000120 pay rates, early childhood educator pay, childcare award rates, OSHC pay rates, educational leader allowance',
      blurb: 'Educator and director level rates, weekend penalties, shift loadings, the educational leader allowance and casual loading under MA000120.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 6,
      intro: "The <strong>Children's Services Award MA000120</strong> covers long day care, preschools, kindergartens and outside-school-hours care. Between classification levels, the educational leader allowance and broken shifts, there is plenty to get wrong. This guide sets out the 2026 rates.",
      summary: "Under the Children's Services Award MA000120 (2026), a Support Worker Level 1.1 earns $26.44/hr full-time. Saturday is 150% (175% casual), Sunday 200% (225% casual) and public holidays 250% (275% casual). An educational leader appointed 5+ days a week is paid an allowance of $4,784.28 per year, and a broken shift attracts $21.38 per day. The 25% casual loading is already built into the casual penalty percentages.",
      quickRefLabel: "Quick Reference — Children's Services 2026",
      quickRef: [
        '<strong>Support Worker Level 1.1:</strong> $26.44/hr full-time',
        '<strong>Saturday:</strong> 150% (FT/PT) · 175% (casual)',
        '<strong>Sunday:</strong> 200% (FT/PT) · 225% (casual)',
        '<strong>Public holiday:</strong> 250% (FT/PT) · 275% (casual)',
        '<strong>Educational leader (5+ days):</strong> $4,784.28 per year',
        '<strong>Broken shift:</strong> $21.38 per day',
      ],
      sections: (h) => [
        { h2: 'Rates by <em>Classification Level</em>', html:
`    <p>The Award runs from support-worker levels up to the director levels. Level and stream both matter — an employee performing higher-level educator work on a support-worker rate is underpaid.</p>
${h.payTable(h.data, 12)}` },
        { h2: 'Penalty Rates <em>&amp; Shift Loadings</em>', html:
`    <p>Weekend and public holiday penalties are a percentage of the ordinary hourly rate; casual rates are all-inclusive of the 25% loading:</p>
${h.penaltyTable(h.data)}
    <p>Shift loadings apply for early-morning (10%), afternoon (15%), rotating night (17.5%) and permanent night (30%) work.</p>` },
        { h2: 'Educational Leader <em>&amp; Broken Shifts</em>', html:
`    <p>An <strong>educational leader</strong> appointed 5 or more days a week is paid an allowance of <strong>$4,784.28 per year</strong> (a pro-rata amount applies for fewer days). A <strong>broken shift</strong> attracts <strong>$21.38</strong> for each day one is worked. See our <a href="/blog/childrens-services-award-educational-leader-allowance">educational leader guide</a> and <a href="/blog/childrens-services-award-broken-shift-allowance">broken shift guide</a>.</p>` },
      ],
      mistakes: [
        '<strong>Paying educator work at support-worker rates.</strong> The classification turns on the work performed, not the roster label.',
        '<strong>Forgetting the educational leader allowance.</strong> An appointed educational leader is owed the allowance — $4,784.28/year for 5+ days.',
        '<strong>Missing the broken-shift allowance.</strong> $21.38 for each day a broken shift is worked.',
        '<strong>Paying Sunday rates on public holidays.</strong> Public holidays are 250%/275%, not 200%/225%.',
      ],
      faqs: [
        { q: 'What is the base rate for an early childhood educator in 2026?', a: "<strong>A Support Worker Level 1.1 earns $26.44/hr full-time under MA000120.</strong> Rates rise by level up to the director levels; the correct level depends on the work performed." },
        { q: "What are the Children's Services Award weekend rates?", a: '<strong>Saturday 150% (175% casual), Sunday 200% (225% casual) and public holidays 250% (275% casual).</strong>' },
        { q: 'How much is the educational leader allowance?', a: '<strong>$4,784.28 per year for an educational leader appointed 5 or more days a week</strong> (pro-rata for fewer days). See our <a href="/blog/childrens-services-award-educational-leader-allowance">educational leader guide</a>.' },
        { q: "What is the broken shift allowance under MA000120?", a: '<strong>$21.38 for each day a broken shift is worked.</strong>' },
        { q: "How do I calculate a Children's Services Award rate?", a: '<strong>Fitz HR calculates the exact MA000120 rate by level, day and shift.</strong> See the <a href="/childrens-award-pay-rates">pay rates page</a> or <a href="/app">ask Fitz free</a>.' },
      ],
      related: [
        { href: '/blog/childrens-services-award-educational-leader-allowance', label: 'Educational leader allowance explained' },
        { href: '/blog/childrens-services-award-broken-shift-allowance', label: "Children's Services broken shift allowance" },
        { href: '/blog/childrens-services-award-penalty-rates', label: "Children's Services penalty rates" },
        { href: '/blog/childrens-services-award-casual-conversion-rules-australia', label: "Casual conversion under the Children's Services Award" },
        { href: '/childrens-award-guide', label: "Children's Services Award guide (MA000120)" },
        { href: '/childrens-award-pay-rates', label: "Children's Services Award pay rates — full table" },
      ],
      ctaH3: "Get Children's Services Rates Right — Instantly",
    },
    {
      slug: 'childrens-services-award-educational-leader-allowance',
      tag: 'Allowances · MA000120', cardTag: 'Allowances · MA000120',
      h1: '<em>Educational Leader</em> Allowance Explained',
      cardTitle: 'Educational Leader Allowance Explained',
      title: 'Educational Leader Allowance 2026: Rules (MA000120)',
      metaDesc: "The Children's Services Award MA000120 educational leader allowance 2026 — the $4,784.28 per year rate, when it applies, and how it is pro-rated for fewer days.",
      keywords: 'educational leader allowance, MA000120 educational leader, childcare educational leader pay, early childhood educational leader, NQF educational leader allowance',
      blurb: 'The educational leader allowance ($4,784.28/year for 5+ days), how it is pro-rated, and how it fits with the National Quality Framework requirement.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 4,
      intro: "Every approved service must designate an educational leader under the National Quality Framework — and the <strong>Children's Services Award MA000120</strong> requires that role to be paid an allowance. It is one of the most commonly missed payments in the sector.",
      summary: "Under MA000120, an employee appointed as the educational leader for 5 or more days a week is paid an allowance of $4,784.28 per year, with a pro-rata amount for fewer days. The allowance is on top of the employee's classification rate and recognises the additional responsibility of the educational-leader role required under the National Quality Framework.",
      quickRefLabel: 'Educational Leader — At a Glance',
      quickRef: [
        '<strong>5+ days a week:</strong> $4,784.28 per year',
        '<strong>Fewer days:</strong> pro-rata',
        '<strong>Paid on top</strong> of the classification rate',
      ],
      sections: () => [
        { h2: 'Who Gets the <em>Allowance</em>', html:
`    <p>Approved education and care services must designate a suitably-qualified <strong>educational leader</strong> to lead the development and implementation of the educational program. Where an employee is appointed to that role, MA000120 requires the allowance to be paid — on top of their ordinary classification rate.</p>` },
        { h2: 'How Much and <em>How It Is Pro-Rated</em>', html:
`    <p>For an educational leader appointed <strong>5 or more days a week</strong>, the allowance is <strong>$4,784.28 per year</strong>. Where the role is performed for fewer days, a <strong>pro-rata</strong> amount applies based on the number of days. It is an annual allowance, typically apportioned across pay periods.</p>` },
        { h2: 'Why It Gets <em>Missed</em>', html:
`    <p>Because the educational-leader duty is a regulatory requirement, services often appoint someone without adjusting their pay. The allowance is separate from any higher classification and must be paid whenever the role is held — backdating missed payments is a common remediation.</p>` },
      ],
      mistakes: [
        '<strong>Appointing an educational leader without paying the allowance.</strong> The role attracts the allowance whenever it is held.',
        '<strong>Not pro-rating correctly.</strong> Fewer than 5 days a week means a pro-rata amount, not nothing.',
        '<strong>Assuming a higher classification covers it.</strong> The allowance is separate from the classification rate.',
      ],
      faqs: [
        { q: 'How much is the educational leader allowance in 2026?', a: '<strong>$4,784.28 per year for an educational leader appointed 5 or more days a week under MA000120</strong>, with a pro-rata amount for fewer days.' },
        { q: 'Is the educational leader allowance on top of the base rate?', a: '<strong>Yes — it is paid in addition to the employee’s classification rate</strong>, recognising the extra responsibility of the role.' },
        { q: 'Does every childcare service need an educational leader?', a: '<strong>Yes — the National Quality Framework requires approved services to designate an educational leader</strong>, and MA000120 requires that role to be paid the allowance.' },
        { q: 'How is the allowance pro-rated for part-time leaders?', a: '<strong>Based on the number of days a week the educational-leader role is performed</strong>, scaled from the 5-day figure of $4,784.28 per year.' },
      ],
      related: [
        { href: '/blog/childrens-services-award-rates-2026', label: "Children's Services Award rates 2026 — full breakdown" },
        { href: '/blog/childrens-services-award-broken-shift-allowance', label: "Children's Services broken shift allowance" },
        { href: '/blog/childrens-services-award-penalty-rates', label: "Children's Services penalty rates" },
        { href: '/childrens-award-guide', label: "Children's Services Award guide (MA000120)" },
      ],
    },
    {
      slug: 'childrens-services-award-broken-shift-allowance',
      tag: 'Broken Shifts · MA000120', cardTag: 'Rostering · MA000120',
      h1: "Children's Services <em>Broken Shift</em> Allowance",
      cardTitle: "Children's Services Broken Shift Allowance",
      title: "Children's Services Broken Shift 2026: Rules (MA000120)",
      metaDesc: "Children's Services Award MA000120 broken shifts 2026 — the $21.38 per day broken shift allowance, common in OSHC, and how minimum engagement applies to each portion.",
      keywords: 'childrens services broken shift, broken shift allowance MA000120, OSHC split shift, childcare broken shift pay, before after school care rostering',
      blurb: 'The $21.38 per day broken shift allowance — common in outside-school-hours care — and how the minimum engagement applies to each portion of the day.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 4,
      intro: "Outside-school-hours care runs on split days — a morning session and an afternoon session with a gap in between. The <strong>Children's Services Award MA000120</strong> pays a broken shift allowance for exactly this pattern. Here is how it works in 2026.",
      summary: "Under MA000120, a broken shift attracts an allowance of $21.38 for each day one is worked. A broken shift is a day split by an unpaid break longer than a normal meal break — common in OSHC. Each working portion still attracts the minimum engagement (2 hours for part-time and casual employees), so short before- and after-school sessions are each paid at the minimum, plus the allowance.",
      quickRefLabel: 'Broken Shifts — Children’s Services',
      quickRef: [
        '<strong>Broken shift allowance:</strong> $21.38 per day worked',
        '<strong>Each portion:</strong> minimum 2 hours (part-time / casual)',
        '<strong>Common in:</strong> outside-school-hours care (OSHC)',
      ],
      sections: () => [
        { h2: 'What Is a <em>Broken Shift</em>', html:
`    <p>A broken shift is a day of work split by an <strong>unpaid</strong> break longer than a normal meal break. In OSHC this is the standard pattern: a before-school session, a long gap, then an after-school session. The Award pays an allowance to recognise the disruption.</p>` },
        { h2: 'The Broken Shift <em>Allowance</em>', html:
`    <p>The allowance is <strong>$21.38 for each day</strong> a broken shift is worked, on top of the pay for the hours themselves. It applies per day, not per break.</p>` },
        { h2: 'Minimum Engagement <em>on Each Session</em>', html:
`    <p>Each separate session still attracts the <strong>minimum engagement of 2 hours</strong> for part-time and casual employees. A 1.5-hour before-school session and a 2.5-hour after-school session are paid as 2 hours + 2.5 hours, plus the $21.38 broken-shift allowance — not just the time worked.</p>` },
      ],
      mistakes: [
        '<strong>Paying only the hours worked.</strong> Each session attracts the 2-hour minimum, plus the broken-shift allowance.',
        '<strong>Forgetting the allowance.</strong> $21.38 applies for each day a broken shift is worked.',
        '<strong>Rostering under the minimum.</strong> A 90-minute session still costs the 2-hour minimum for part-time and casual staff.',
      ],
      faqs: [
        { q: "How much is the Children's Services broken shift allowance?", a: '<strong>$21.38 for each day a broken shift is worked under MA000120.</strong>' },
        { q: 'Does the minimum engagement apply to each OSHC session?', a: '<strong>Yes — each session attracts a minimum of 2 hours for part-time and casual employees</strong>, plus the broken-shift allowance.' },
        { q: 'Is a broken shift common in outside-school-hours care?', a: '<strong>Yes — it is the standard OSHC pattern</strong> (before-school and after-school sessions split by a gap), which is exactly what the broken-shift allowance is for.' },
        { q: 'Is the broken shift allowance per break or per day?', a: '<strong>Per day — $21.38 for each day a broken shift is worked</strong>, regardless of the length of the gap.' },
      ],
      related: [
        { href: '/blog/childrens-services-award-rates-2026', label: "Children's Services Award rates 2026 — full breakdown" },
        { href: '/blog/childrens-services-award-educational-leader-allowance', label: 'Educational leader allowance explained' },
        { href: '/blog/childrens-services-award-casual-conversion-rules-australia', label: "Casual conversion under the Children's Services Award" },
        { href: '/childrens-award-guide', label: "Children's Services Award guide (MA000120)" },
      ],
    },
    {
      slug: 'childrens-services-award-penalty-rates',
      tag: 'Penalty Rates · MA000120', cardTag: 'Penalty Rates · MA000120',
      h1: "Children's Services Award <em>Penalty Rates</em>",
      cardTitle: "Children's Services Penalty Rates",
      title: "Children's Services Penalty Rates 2026 (MA000120)",
      metaDesc: "Children's Services Award MA000120 penalty rates 2026 — Saturday, Sunday and public holiday rates for full-time, part-time and casual staff, plus shift loadings and examples.",
      keywords: 'childrens services penalty rates, MA000120 sunday rate, childcare public holiday pay, early childhood weekend rates, OSHC penalty rates',
      blurb: 'Saturday, Sunday and public holiday penalties for early childhood and OSHC staff, the early-morning/afternoon/night shift loadings, and worked examples.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 5,
      intro: "Weekend and public holiday work is less common in early childhood than hospitality, but it happens — and the rates are high. This guide sets out the exact <strong>Children's Services Award MA000120</strong> penalty rates for 2026.",
      summary: "Under MA000120, Saturday is 150% (175% casual), Sunday 200% (225% casual) and public holidays 250% (275% casual). Casual percentages already include the 25% loading. Shift loadings apply for early-morning (10%), afternoon (15%), rotating night (17.5%) and permanent night (30%) work.",
      quickRefLabel: "Children's Services Penalty Rates 2026",
      quickRef: [
        '<strong>Saturday:</strong> 150% (FT/PT) · 175% (casual)',
        '<strong>Sunday:</strong> 200% (FT/PT) · 225% (casual)',
        '<strong>Public holiday:</strong> 250% (FT/PT) · 275% (casual)',
        '<strong>Shift loadings:</strong> early-morning +10%, afternoon +15%, night +17.5% / +30%',
      ],
      sections: (h) => [
        { h2: 'The <em>Penalty Rate</em> Table', html:
`    <p>Percentages are of the ordinary hourly rate; casual rates are all-inclusive of the 25% loading.</p>
${h.penaltyTable(h.data)}` },
        { h2: 'Worked <em>Examples</em>', html:
`    <p>For a <strong>Support Worker Level 1.1</strong> on $26.44/hr:</p>
    <ul>
        <li>Saturday: $39.66/hr (FT/PT) · $46.27/hr (casual)</li>
        <li>Sunday: $52.88/hr (FT/PT) · $59.49/hr (casual)</li>
        <li>Public holiday: $66.10/hr (FT/PT) · $72.71/hr (casual)</li>
    </ul>` },
        { h2: 'Shift <em>Loadings</em>', html:
`    <p>Shift loadings apply to ordinary hours: <strong>early-morning 10%</strong>, <strong>afternoon 15%</strong>, <strong>rotating night 17.5%</strong> and <strong>permanent night 30%</strong>. On weekends and public holidays the penalty rate applies instead — the higher single entitlement, not both.</p>` },
      ],
      mistakes: [
        '<strong>Paying Sunday rates on public holidays.</strong> Public holidays are 250%/275%.',
        '<strong>Stacking casual loading on the casual penalty rate.</strong> The casual percentages already include the 25% loading.',
        '<strong>Stacking a shift loading on a weekend penalty.</strong> The higher single entitlement applies, not both.',
      ],
      faqs: [
        { q: "What is the Sunday rate under the Children's Services Award?", a: '<strong>200% for full-time and part-time, and 225% for casuals under MA000120.</strong>' },
        { q: 'What is the public holiday rate for childcare staff?', a: '<strong>250% for full-time and part-time, and 275% for casuals.</strong>' },
        { q: 'What shift loadings apply under MA000120?', a: '<strong>Early-morning 10%, afternoon 15%, rotating night 17.5% and permanent night 30%</strong> — on ordinary hours, not stacked with weekend penalties.' },
        { q: 'Are casual penalty rates on top of casual loading?', a: '<strong>No — the casual percentages are all-inclusive of the 25% loading.</strong>' },
      ],
      related: [
        { href: '/blog/childrens-services-award-rates-2026', label: "Children's Services Award rates 2026 — full breakdown" },
        { href: '/blog/childrens-services-award-educational-leader-allowance', label: 'Educational leader allowance explained' },
        { href: '/blog/childrens-services-award-broken-shift-allowance', label: "Children's Services broken shift allowance" },
        { href: '/childrens-award-guide', label: "Children's Services Award guide (MA000120)" },
      ],
    },
    {
      slug: 'childrens-services-award-casual-conversion-rules-australia',
      tag: 'Casual Conversion · MA000120', cardTag: 'Casual · MA000120',
      h1: "Casual Conversion Under the <em>Children's Services Award</em>",
      cardTitle: "Casual Conversion Under the Children's Services Award",
      title: "Children's Services Casual Conversion 2026: The Rules",
      metaDesc: "Casual conversion under the Children's Services Award MA000120 — the employee-initiated rules from 26 February 2025, the 6/12-month milestones, and how employers respond.",
      keywords: 'childrens services casual conversion, MA000120 casual conversion, childcare casual permanent, early childhood casual conversion, casual employment information statement childcare',
      blurb: 'The employee-initiated casual conversion rules under MA000120 — eligibility, the 21-day response and what changes on conversion.',
      datePublished: DP, dateModified: DP, datePublishedLabel: D, dateModifiedLabel: D, readMin: 5,
      intro: "Early childhood services use casuals for relief and to cover ratios — and many settle into regular patterns. Under the <strong>Children's Services Award MA000120</strong>, casual conversion has been employee-initiated since 26 February 2025.",
      summary: "Since 26 February 2025, casual conversion under MA000120 is employee-initiated: a casual can give written notice requesting permanent employment after 6 months (12 months in a small business), if they no longer meet the casual definition. The employer must respond in writing within 21 days. On conversion the employee loses the 25% loading but gains paid leave and notice entitlements.",
      quickRefLabel: "Casual Conversion — Children's Services",
      quickRef: [
        '<strong>Who initiates:</strong> the employee (since 26 Feb 2025)',
        '<strong>Eligibility:</strong> 6 months (12 months for small business)',
        '<strong>Employer response:</strong> in writing within 21 days',
        '<strong>On conversion:</strong> lose 25% loading, gain paid leave & notice',
      ],
      sections: casualConversionSections("Children's Services Award", 'MA000120',
        'A casual who reliably covers the same room or ratio each week is a strong candidate to meet the regular-and-systematic test.'),
      mistakes: [
        '<strong>Waiting for the employer to offer.</strong> Conversion is employee-initiated, but the duty to respond and to provide the Information Statement remains.',
        '<strong>Missing the 21-day written response.</strong> A separate contravention.',
        '<strong>Not providing the Casual Employment Information Statement.</strong> Required at commencement and at the 6- or 12-month milestone.',
      ],
      faqs: [
        { q: 'Who initiates casual conversion in childcare?', a: '<strong>The employee, since 26 February 2025.</strong> The employer-offer model no longer applies.' },
        { q: 'When can a childcare casual request conversion?', a: '<strong>After 6 months (12 months for a small business), if they no longer meet the casual definition.</strong>' },
        { q: 'How long does the employer have to respond?', a: '<strong>21 days, in writing</strong> — accepting or refusing on valid grounds with reasons.' },
        { q: 'What changes on conversion?', a: '<strong>The employee loses the 25% casual loading and gains paid leave, notice and (where applicable) redundancy entitlements.</strong>' },
      ],
      related: [
        { href: '/blog/childrens-services-award-rates-2026', label: "Children's Services Award rates 2026 — full breakdown" },
        { href: '/blog/childrens-services-award-educational-leader-allowance', label: 'Educational leader allowance explained' },
        { href: '/blog/casual-conversion-rules-hospitality-award-australia', label: 'Casual conversion under the Hospitality Award' },
        { href: '/childrens-award-guide', label: "Children's Services Award guide (MA000120)" },
      ],
    },
  ],
};
