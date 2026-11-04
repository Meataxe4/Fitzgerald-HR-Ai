#!/usr/bin/env node
/**
 * Weekly SEO data pull: Google Search Console, GA4 and Bing Webmaster Tools.
 *
 * Replaces the manual weekly export set. Zero dependencies (Node 18+).
 *
 * Environment (set as environment variables in the cloud environment, never in the repo):
 *   GOOGLE_SERVICE_ACCOUNT_JSON  Service account key: the raw JSON, or the JSON base64-encoded.
 *   BING_WEBMASTER_API_KEY       Bing Webmaster Tools API key.
 *   GA4_PROPERTY_ID              Optional. Numeric GA4 property ID; auto-detected if the
 *                                service account can see exactly one property.
 *   GSC_SITE_URL                 Optional. e.g. "sc-domain:fitzhr.com" or "https://fitzhr.com/";
 *                                auto-detected from the properties the service account can see.
 *   BING_SITE_URL                Optional. Defaults to the fitzhr.com site in the Bing account.
 *
 * Usage:
 *   node scripts/seo-report.mjs              Markdown report to stdout + reports/ (gitignored)
 *   node scripts/seo-report.mjs --check      Only test credentials and access to each source
 *   node scripts/seo-report.mjs --end=2026-11-08   Report the 7 days ending on that date
 *
 * Windows: the output folder is reports\ in the repo root.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ARGS = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const CHECK_ONLY = !!ARGS.check;
const DOMAIN = 'fitzhr.com';

// Queries the weekly review tracks by name (substring match, case-insensitive).
const TRACKED = [
  'fitz hr',
  'hospitality award rates',
  'hospitality award guide',
  'restaurant award',
  'retail award',
  'schads',
  'manufacturing award',
  'health professionals award',
  "children's services award",
  'award interpretation software',
  'how many warnings',
  'public holiday',
  'hr software for small business',
];

// ---------- dates (Australia/Sydney) ----------
function sydneyToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date());
}
function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
// GSC data is ~2-3 days behind; default the window to end 3 days ago.
const END = ARGS.end || addDays(sydneyToday(), -3);
const WEEK = { start: addDays(END, -6), end: END };
const PREV = { start: addDays(END, -13), end: addDays(END, -7) };
const M28 = { start: addDays(END, -27), end: END };
const P28 = { start: addDays(END, -55), end: addDays(END, -28) };

// ---------- helpers ----------
const fmt = (n, dp = 0) => n == null || Number.isNaN(n) ? '–' : Number(n).toLocaleString('en-AU', { maximumFractionDigits: dp, minimumFractionDigits: dp });
const pct = (a, b) => (b ? ((a - b) / b) * 100 : null);
function delta(cur, prev, dp = 0, lowerIsBetter = false) {
  if (cur == null || prev == null) return '–';
  const d = cur - prev;
  const sign = d > 0 ? '+' : d < 0 ? '−' : '±';
  const p = pct(cur, prev);
  const arrow = d === 0 ? '' : (d > 0) !== lowerIsBetter ? ' ▲' : ' ▼';
  return `${sign}${fmt(Math.abs(d), dp)}${p != null && !lowerIsBetter ? ` (${p > 0 ? '+' : ''}${fmt(p, 0)}%)` : ''}${arrow}`;
}
const table = (head, rows) => [
  `| ${head.join(' | ')} |`,
  `| ${head.map((_, i) => (i === 0 ? '---' : '---:')).join(' | ')} |`,
  ...rows.map(r => `| ${r.join(' | ')} |`),
].join('\n');
const shortUrl = u => u.replace(/^https?:\/\/(www\.)?fitzhr\.com/, '') || '/';

async function http(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) {
    const msg = typeof body === 'object' ? (body.error?.message || body.error_description || body.Message || JSON.stringify(body)) : String(body).slice(0, 300);
    throw new Error(`${res.status} ${msg}`);
  }
  return body;
}

// ---------- Google auth (service account JWT, RS256) ----------
function loadServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  const sa = JSON.parse(text);
  if (!sa.client_email || !sa.private_key) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key');
  sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  return sa;
}
async function googleToken(sa) {
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key).toString('base64url');
  const body = await http('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  });
  return body.access_token;
}
const gget = (token, url) => http(url, { headers: { authorization: `Bearer ${token}` } });
const gpost = (token, url, json) => http(url, {
  method: 'POST',
  headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
  body: JSON.stringify(json),
});

// ---------- Search Console ----------
async function gscSite(token) {
  if (process.env.GSC_SITE_URL) return process.env.GSC_SITE_URL;
  const { siteEntry = [] } = await gget(token, 'https://searchconsole.googleapis.com/webmasters/v3/sites');
  const mine = siteEntry.filter(s => s.siteUrl.includes(DOMAIN) && s.permissionLevel !== 'siteUnverifiedUser');
  if (!mine.length) throw new Error(`service account has no access to a ${DOMAIN} property. Add its email as a user in Search Console > Settings > Users and permissions.`);
  return (mine.find(s => s.siteUrl.startsWith('sc-domain:')) || mine[0]).siteUrl;
}
async function gscQuery(token, site, range, dimensions, { country, rowLimit = 1000 } = {}) {
  const body = { startDate: range.start, endDate: range.end, dimensions, rowLimit };
  if (country) body.dimensionFilterGroups = [{ filters: [{ dimension: 'country', operator: 'equals', expression: country }] }];
  const res = await gpost(token, `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, body);
  return res.rows || [];
}
const totals = rows => rows[0] ? { clicks: rows[0].clicks, impressions: rows[0].impressions, ctr: rows[0].ctr * 100, position: rows[0].position } : { clicks: 0, impressions: 0, ctr: 0, position: null };

async function gscSection(token) {
  const site = await gscSite(token);
  if (CHECK_ONLY) return { ok: `Search Console OK (${site})` };
  const out = [`## Google Search Console\n\nProperty \`${site}\`. Week ${WEEK.start} to ${WEEK.end} vs ${PREV.start} to ${PREV.end}.`];

  const [allW, allP, auW, auP] = await Promise.all([
    gscQuery(token, site, WEEK, []), gscQuery(token, site, PREV, []),
    gscQuery(token, site, WEEK, [], { country: 'aus' }), gscQuery(token, site, PREV, [], { country: 'aus' }),
  ]);
  const row = (label, c, p) => [label, fmt(c.clicks), delta(c.clicks, p.clicks), fmt(c.impressions), delta(c.impressions, p.impressions), fmt(c.ctr, 1) + '%', fmt(c.position, 1), delta(c.position, p.position, 1, true)];
  out.push('### Totals\n\n' + table(['Scope', 'Clicks', 'Δ', 'Impr.', 'Δ', 'CTR', 'Pos.', 'Δ pos.'], [
    row('All countries', totals(allW), totals(allP)),
    row('Australia', totals(auW), totals(auP)),
  ]));

  // Weekly clicks trend, last 8 weeks (all countries)
  const daily = await gscQuery(token, site, { start: addDays(END, -55), end: END }, ['date']);
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const s = addDays(END, -7 * i - 6), e = addDays(END, -7 * i);
    const r = daily.filter(d => d.keys[0] >= s && d.keys[0] <= e);
    weeks.push([`w/e ${e}`, fmt(r.reduce((a, d) => a + d.clicks, 0)), fmt(r.reduce((a, d) => a + d.impressions, 0))]);
  }
  out.push('### 8-week trend (all countries)\n\n' + table(['Week', 'Clicks', 'Impr.'], weeks));

  // Queries, Australia
  const [qW, qP] = await Promise.all([
    gscQuery(token, site, WEEK, ['query'], { country: 'aus' }),
    gscQuery(token, site, PREV, ['query'], { country: 'aus' }),
  ]);
  const prevQ = new Map(qP.map(r => [r.keys[0], r]));
  const qRow = r => {
    const p = prevQ.get(r.keys[0]);
    return [r.keys[0], fmt(r.clicks), fmt(r.impressions), delta(r.impressions, p?.impressions ?? 0), fmt(r.position, 1), p ? delta(r.position, p.position, 1, true) : 'new'];
  };
  const tracked = qW.filter(r => TRACKED.some(t => r.keys[0].toLowerCase().includes(t)))
    .sort((a, b) => b.impressions - a.impressions).slice(0, 40);
  out.push('### Tracked queries (Australia)\n\n' + (tracked.length ? table(['Query', 'Clicks', 'Impr.', 'Δ impr.', 'Pos.', 'Δ pos.'], tracked.map(qRow)) : '_No tracked queries with impressions this week._'));
  out.push('### Top queries by impressions (Australia)\n\n' + table(['Query', 'Clicks', 'Impr.', 'Δ impr.', 'Pos.', 'Δ pos.'],
    [...qW].sort((a, b) => b.impressions - a.impressions).slice(0, 25).map(qRow)));
  const movers = qW.filter(r => prevQ.has(r.keys[0]) && r.impressions >= 20)
    .map(r => ({ r, d: r.position - prevQ.get(r.keys[0]).position }));
  out.push('### Biggest position moves (Australia, ≥20 impressions)\n\n' + table(['Query', 'Pos.', 'Δ pos.', 'Impr.'],
    [...movers.sort((a, b) => a.d - b.d).slice(0, 8), ...movers.sort((a, b) => b.d - a.d).slice(0, 8)]
      .map(({ r }) => [r.keys[0], fmt(r.position, 1), delta(r.position, prevQ.get(r.keys[0]).position, 1, true), fmt(r.impressions)])));

  // Pages, Australia, 28 days vs previous 28 (matches the old manual "compare" export)
  const [pW, pP] = await Promise.all([
    gscQuery(token, site, M28, ['page'], { country: 'aus' }),
    gscQuery(token, site, P28, ['page'], { country: 'aus' }),
  ]);
  const prevP = new Map(pP.map(r => [r.keys[0], r]));
  out.push(`### Pages, Australia, 28 days (${M28.start} to ${M28.end}) vs previous 28\n\n` + table(['Page', 'Clicks', 'Δ', 'Impr.', 'Δ', 'Pos.', 'Δ pos.'],
    pW.sort((a, b) => b.impressions - a.impressions).slice(0, 30).map(r => {
      const p = prevP.get(r.keys[0]);
      return [shortUrl(r.keys[0]), fmt(r.clicks), delta(r.clicks, p?.clicks ?? 0), fmt(r.impressions), delta(r.impressions, p?.impressions ?? 0), fmt(r.position, 1), p ? delta(r.position, p.position, 1, true) : 'new'];
    })));

  const cW = await gscQuery(token, site, WEEK, ['country'], { rowLimit: 8 });
  out.push('### Countries (week)\n\n' + table(['Country', 'Clicks', 'Impr.', 'Pos.'], cW.map(r => [r.keys[0].toUpperCase(), fmt(r.clicks), fmt(r.impressions), fmt(r.position, 1)])));
  return { md: out.join('\n\n') };
}

// ---------- GA4 ----------
async function gaProperty(token) {
  if (process.env.GA4_PROPERTY_ID) return process.env.GA4_PROPERTY_ID.replace(/^properties\//, '');
  const { accountSummaries = [] } = await gget(token, 'https://analyticsadmin.googleapis.com/v1beta/accountSummaries');
  const props = accountSummaries.flatMap(a => a.propertySummaries || []);
  if (props.length === 1) return props[0].property.replace('properties/', '');
  if (!props.length) throw new Error('service account can see no GA4 property. Add its email as a Viewer in GA4 > Admin > Property access management.');
  throw new Error(`service account sees ${props.length} GA4 properties; set GA4_PROPERTY_ID to one of: ${props.map(p => `${p.property.replace('properties/', '')} (${p.displayName})`).join(', ')}`);
}
async function gaReport(token, prop, dimensions, metrics, extra = {}) {
  return gpost(token, `https://analyticsdata.googleapis.com/v1beta/properties/${prop}:runReport`, {
    dateRanges: [{ ...{ startDate: WEEK.start, endDate: WEEK.end }, name: 'cur' }, { startDate: PREV.start, endDate: PREV.end, name: 'prev' }],
    dimensions: dimensions.map(name => ({ name })),
    metrics: metrics.map(name => ({ name })),
    limit: 100,
    ...extra,
  });
}
// Split a two-date-range report into Map(key -> {cur:[...], prev:[...]})
function gaSplit(rep) {
  const m = new Map();
  for (const r of rep.rows || []) {
    const dims = r.dimensionValues.map(d => d.value);
    const range = dims.pop(); // dateRange dimension is appended last
    const key = dims.join(' / ') || 'total';
    if (!m.has(key)) m.set(key, {});
    m.get(key)[range] = r.metricValues.map(v => Number(v.value));
  }
  return m;
}

async function gaSection(token) {
  const prop = await gaProperty(token);
  if (CHECK_ONLY) {
    await gaReport(token, prop, [], ['sessions']);
    return { ok: `GA4 OK (property ${prop})` };
  }
  const out = [`## Google Analytics 4\n\nProperty ${prop}. Same week vs previous week.`];
  const M = ['sessions', 'totalUsers', 'newUsers', 'engagementRate', 'keyEvents'];
  const tot = gaSplit(await gaReport(token, prop, [], M)).get('total') || {};
  const c = tot.cur || [], p = tot.prev || [];
  out.push('### Totals\n\n' + table(['Metric', 'Week', 'Prev.', 'Δ'], [
    ['Sessions', fmt(c[0]), fmt(p[0]), delta(c[0], p[0])],
    ['Users', fmt(c[1]), fmt(p[1]), delta(c[1], p[1])],
    ['New users', fmt(c[2]), fmt(p[2]), delta(c[2], p[2])],
    ['Engagement rate', fmt(c[3] * 100, 1) + '%', fmt(p[3] * 100, 1) + '%', delta(c[3] * 100, p[3] * 100, 1)],
    ['Key events', fmt(c[4]), fmt(p[4]), delta(c[4], p[4])],
  ]));

  const ch = gaSplit(await gaReport(token, prop, ['sessionDefaultChannelGroup'], ['sessions', 'keyEvents']));
  out.push('### Channels\n\n' + table(['Channel', 'Sessions', 'Δ', 'Key events'],
    [...ch].sort((a, b) => (b[1].cur?.[0] || 0) - (a[1].cur?.[0] || 0))
      .map(([k, v]) => [k, fmt(v.cur?.[0] ?? 0), delta(v.cur?.[0] ?? 0, v.prev?.[0] ?? 0), fmt(v.cur?.[1] ?? 0)])));

  const src = gaSplit(await gaReport(token, prop, ['sessionSource', 'sessionMedium'], ['sessions', 'keyEvents']));
  out.push('### Top sources (incl. AI assistants and partners)\n\n' + table(['Source / medium', 'Sessions', 'Δ', 'Key events'],
    [...src].sort((a, b) => (b[1].cur?.[0] || 0) - (a[1].cur?.[0] || 0)).slice(0, 20)
      .map(([k, v]) => [k, fmt(v.cur?.[0] ?? 0), delta(v.cur?.[0] ?? 0, v.prev?.[0] ?? 0), fmt(v.cur?.[1] ?? 0)])));

  const lp = gaSplit(await gaReport(token, prop, ['landingPage'], ['sessions', 'keyEvents']));
  out.push('### Landing pages\n\n' + table(['Landing page', 'Sessions', 'Δ', 'Key events'],
    [...lp].sort((a, b) => (b[1].cur?.[0] || 0) - (a[1].cur?.[0] || 0)).slice(0, 20)
      .map(([k, v]) => [k, fmt(v.cur?.[0] ?? 0), delta(v.cur?.[0] ?? 0, v.prev?.[0] ?? 0), fmt(v.cur?.[1] ?? 0)])));

  const ev = gaSplit(await gaReport(token, prop, ['eventName'], ['eventCount']));
  let keyEventNames = [];
  try {
    const { keyEvents = [] } = await gget(token, `https://analyticsadmin.googleapis.com/v1beta/properties/${prop}/keyEvents`);
    keyEventNames = keyEvents.map(k => k.eventName);
  } catch (e) { keyEventNames = null; }
  out.push('### Events\n\n' + (keyEventNames
    ? `Marked as key events in GA4: ${keyEventNames.length ? keyEventNames.map(n => `\`${n}\``).join(', ') : '**none**'}. \`sign_up\` is ${keyEventNames.includes('sign_up') ? '' : '**not** '}a key event.`
    : '_Could not read the key-event list (Admin API)._') + '\n\n' + table(['Event', 'Week', 'Prev.', 'Δ'],
    [...ev].sort((a, b) => (b[1].cur?.[0] || 0) - (a[1].cur?.[0] || 0)).slice(0, 20)
      .map(([k, v]) => [k + (keyEventNames?.includes(k) ? ' ★' : ''), fmt(v.cur?.[0] ?? 0), fmt(v.prev?.[0] ?? 0), delta(v.cur?.[0] ?? 0, v.prev?.[0] ?? 0)])));
  return { md: out.join('\n\n') };
}

// ---------- Bing Webmaster Tools ----------
const BING = 'https://ssl.bing.com/webmaster/api.svc/json';
const bingDate = s => {
  const m = /\/Date\((-?\d+)/.exec(s || '');
  return m ? new Date(Number(m[1])).toISOString().slice(0, 10) : null;
};
async function bing(method, params = {}) {
  const qs = new URLSearchParams({ apikey: process.env.BING_WEBMASTER_API_KEY, ...params });
  const body = await http(`${BING}/${method}?${qs}`);
  return body.d ?? body;
}
async function bingSection() {
  let site = process.env.BING_SITE_URL;
  if (!site) {
    const sites = await bing('GetUserSites');
    const s = (sites || []).find(x => (x.Url || '').includes(DOMAIN));
    if (!s) throw new Error(`no ${DOMAIN} site in this Bing Webmaster account`);
    site = s.Url;
  }
  if (CHECK_ONLY) return { ok: `Bing OK (${site})` };
  const out = [`## Bing Webmaster Tools\n\nSite \`${site}\`. Bing reports its own date buckets; the windows below are the same calendar weeks where daily data allows.`];

  const traffic = (await bing('GetRankAndTrafficStats', { siteUrl: site })).map(r => ({ date: bingDate(r.Date), clicks: r.Clicks, impressions: r.Impressions }));
  const sum = (rng) => traffic.filter(r => r.date >= rng.start && r.date <= rng.end).reduce((a, r) => ({ clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions }), { clicks: 0, impressions: 0 });
  const tw = sum(WEEK), tp = sum(PREV);
  out.push('### Totals\n\n' + table(['Metric', 'Week', 'Prev.', 'Δ'], [
    ['Clicks', fmt(tw.clicks), fmt(tp.clicks), delta(tw.clicks, tp.clicks)],
    ['Impressions', fmt(tw.impressions), fmt(tp.impressions), delta(tw.impressions, tp.impressions)],
  ]) + `\n\nLatest Bing traffic date: ${traffic.map(r => r.date).sort().pop() || '–'}.`);

  // Query and page stats come back as rows per query per period bucket.
  const bucketed = async (method, keyField) => {
    const rows = (await bing(method, { siteUrl: site })).map(r => ({ ...r, date: bingDate(r.Date) }));
    const dates = [...new Set(rows.map(r => r.date))].sort();
    const [prevD, curD] = dates.slice(-2);
    const by = d => new Map(rows.filter(r => r.date === d).map(r => [r[keyField], r]));
    return { cur: by(curD), prev: by(prevD), curD, prevD };
  };
  const q = await bucketed('GetQueryStats', 'Query');
  const qRows = [...q.cur.values()].sort((a, b) => b.Impressions - a.Impressions);
  const qLine = r => {
    const p = q.prev.get(r.Query);
    return [r.Query, fmt(r.Clicks), fmt(r.Impressions), delta(r.Impressions, p?.Impressions ?? 0), fmt(r.AvgImpressionPosition, 1), p ? delta(r.AvgImpressionPosition, p.AvgImpressionPosition, 1, true) : 'new'];
  };
  const head = ['Query', 'Clicks', 'Impr.', 'Δ impr.', 'Avg pos.', 'Δ pos.'];
  out.push(`### Queries (bucket ${q.curD} vs ${q.prevD})\n\n` + table(head, qRows.slice(0, 25).map(qLine)));
  const tq = qRows.filter(r => TRACKED.some(t => r.Query.toLowerCase().includes(t)));
  if (tq.length) out.push('### Tracked queries\n\n' + table(head, tq.slice(0, 30).map(qLine)));

  const pg = await bucketed('GetPageStats', 'Query');
  out.push(`### Pages (bucket ${pg.curD} vs ${pg.prevD})\n\n` + table(['Page', 'Clicks', 'Impr.', 'Δ impr.', 'Avg pos.'],
    [...pg.cur.values()].sort((a, b) => b.Impressions - a.Impressions).slice(0, 25).map(r => {
      const p = pg.prev.get(r.Query);
      return [shortUrl(r.Query), fmt(r.Clicks), fmt(r.Impressions), delta(r.Impressions, p?.Impressions ?? 0), fmt(r.AvgImpressionPosition, 1)];
    })));

  try {
    const links = await bing('GetLinkCounts', { siteUrl: site, page: '0' });
    const list = links?.Links || links || [];
    out.push('### Inbound links by page\n\n' + table(['Page', 'Links'], list.slice(0, 15).map(l => [shortUrl(l.Url), fmt(l.Count)])));
  } catch (e) { out.push(`_Inbound links unavailable: ${e.message}_`); }

  out.push('_Bing AI citations (AI Performance) are not exposed by the Webmaster API; that file stays a manual export._');
  return { md: out.join('\n\n') };
}

// ---------- main ----------
async function main() {
  const sections = [];
  const problems = [];
  let sa = null, token = null;
  try { sa = loadServiceAccount(); } catch (e) { problems.push(`Google: ${e.message}`); }
  if (sa) {
    try { token = await googleToken(sa); } catch (e) { problems.push(`Google auth: ${e.message}`); }
  } else if (!problems.length) problems.push('Google: GOOGLE_SERVICE_ACCOUNT_JSON is not set');

  const run = async (name, fn) => {
    try { const r = await fn(); sections.push(r.md || r.ok); } catch (e) {
      const blocked = /CONNECT tunnel|ENOTFOUND|fetch failed|403 .*proxy/i.test(e.message + (e.cause?.message || ''));
      problems.push(`${name}: ${blocked ? 'network blocked or unreachable (check the environment allowed domains). ' : ''}${e.message}${e.cause ? ` (${e.cause.message || e.cause.code})` : ''}`);
    }
  };
  if (token) {
    await run('Search Console', () => gscSection(token));
    await run('GA4', () => gaSection(token));
  }
  if (process.env.BING_WEBMASTER_API_KEY) await run('Bing', bingSection);
  else problems.push('Bing: BING_WEBMASTER_API_KEY is not set');

  const header = CHECK_ONLY
    ? `# Fitz HR data access check (${sydneyToday()})`
    : `# Fitz HR weekly search data, week ending ${END}\n\nGenerated ${new Date().toISOString()}. Current week ${WEEK.start} to ${WEEK.end}; previous ${PREV.start} to ${PREV.end}. Δ pos.: ▲ = moved up (better).`;
  const md = [header, problems.length ? '## Problems\n\n' + problems.map(p => `- ${p}`).join('\n') : null, ...sections].filter(Boolean).join('\n\n') + '\n';
  process.stdout.write(md);
  if (!CHECK_ONLY) {
    const dir = path.resolve('reports');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `seo-${END}.md`), md);
    process.stderr.write(`\nSaved reports/seo-${END}.md\n`);
  }
  process.exitCode = problems.length ? 1 : 0;
}
main();
