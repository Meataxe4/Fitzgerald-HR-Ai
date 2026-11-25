#!/usr/bin/env node
// Browser test: untrusted content must never execute or become live HTML.
//
//   node tests/xss-rendering.test.js
//
// Loads the real app.html and js/ files in headless Chromium (Playwright),
// then pushes script payloads through each rendering path that shows content
// someone else controls: chat messages, restored history, the consultant
// review viewer, the admin conversation list, the Deputy roster list and the
// AI tool panels. A payload "fires" by setting window.__xss. The test fails if
// any payload fires, or if a payload ends up as a real element in the page.
//
// All network requests except the local files are blocked, so no analytics,
// Firebase, Stripe or CDN is contacted. Not part of test:ci (needs a browser).
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (err) {
  console.error('Playwright is not installed; cannot run the browser XSS test.');
  process.exit(2);
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, urlPath === '/app' ? 'app.html' : urlPath);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

// Each payload sets window.__xss to its own label if it ever runs.
const P = (label) => ({
  img: `<img src=x onerror="window.__xss='${label}-img'">`,
  svg: `<svg onload="window.__xss='${label}-svg'"></svg>`,
  script: `<script>window.__xss='${label}-script'</script>`,
  link: `<a href="javascript:window.__xss='${label}-href'" id="xss-link-${label}">click</a>`,
  attr: `" onmouseover="window.__xss='${label}-attr'" x="`,
  jsarg: `');window.__xss='${label}-jsarg';('`,
});
const all = (label) => Object.values(P(label)).join(' ');

(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  // Local files only: never contact analytics, Firebase, Stripe or a CDN.
  await page.route('**/*', (route) => (route.request().url().startsWith(origin) ? route.continue() : route.abort()));
  page.on('dialog', (d) => d.dismiss());
  await page.goto(`${origin}/app`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof addMessage === 'function' && typeof sanitizeHTML === 'function', null, { timeout: 15000 });

  const results = [];
  const run = async (name, fn, arg) => {
    await page.evaluate(() => { window.__xss = null; });
    let error = null;
    try { await page.evaluate(fn, arg); } catch (err) { error = err.message.split('\n')[0]; }
    // Give onerror/onload handlers time to fire, then click any surviving links.
    await page.waitForTimeout(400);
    await page.evaluate(() => document.querySelectorAll('[id^="xss-link-"]').forEach((a) => a.click()));
    // Fire the inline handlers a real user would trigger.
    await page.evaluate(() => document.querySelectorAll('#xssTestHost [onclick], #xssTestHost [onmouseover]').forEach((el) => {
      try { el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); } catch (e) {}
    }));
    await page.waitForTimeout(100);
    const state = await page.evaluate(() => ({
      fired: window.__xss,
      // An <img> with no handler is inert; one that kept its onerror is not.
      liveImg: document.querySelectorAll('img[onerror]').length,
      liveSvg: document.querySelectorAll('svg[onload]').length,
      handlers: [...document.querySelectorAll('*')].filter((el) => [...el.attributes].some((a) => /^on/i.test(a.name) && /__xss/.test(a.value) && !/^(viewAdminDocument|deleteAdminDocument|openReviewFromAdmin|updateReviewStatus|emailReviewUser|downloadReviewDocument)\('/.test(a.value))).length,
    }));
    const ok = !error && !state.fired && !state.liveImg && !state.liveSvg && !state.handlers;
    results.push({ name, ok, error, ...state });
    await page.evaluate(() => {
      document.querySelectorAll('img[src="x"], svg').forEach((el) => { if (el.closest('.fade-in, #xssTestHost')) el.remove(); });
      document.querySelectorAll('.fade-in').forEach((el) => el.remove());
      const host = document.getElementById('xssTestHost'); if (host) host.innerHTML = '';
      const modal = document.getElementById('reviewViewerModal'); if (modal) modal.remove();
    });
  };

  // A scratch container for functions that render into a fixed element id.
  await page.evaluate(() => {
    const host = document.createElement('div'); host.id = 'xssTestHost'; document.body.appendChild(host);
    window.__mount = (id) => { let el = document.getElementById(id); if (!el) { el = document.createElement('div'); el.id = id; } document.getElementById('xssTestHost').appendChild(el); return el; };
  });

  await run('helpers: escapeHtml escapes quotes and tags', () => {
    const out = escapeHtml(`<b a="1" b='2'>&`);
    if (out !== '&lt;b a=&quot;1&quot; b=&#39;2&#39;&gt;&amp;') throw new Error('escapeHtml output: ' + out);
    if (escapeHtml(null) !== '' || escapeHtml(undefined) !== '' || escapeHtml(5) !== '5') throw new Error('escapeHtml edge cases');
  });

  await run('helpers: sanitizeHTML keeps formatting, drops scripts', () => {
    const out = sanitizeHTML('<p><strong>Bold</strong> <a href="https://example.com">ok</a><script>window.__xss="s"</script><img src=x onerror="window.__xss=1"><button onclick="x()">b</button></p>');
    if (!/<strong>Bold<\/strong>/.test(out) || !/href="https:\/\/example.com"/.test(out)) throw new Error('formatting lost: ' + out);
    if (/script|onerror|onclick|<button/i.test(out)) throw new Error('unsafe content kept: ' + out);
    if (typeof DOMPurify === 'undefined') throw new Error('DOMPurify did not load');
  });

  await run('chat: user message is shown as text', (payload) => { addMessage('user', payload); }, all('chatuser'));
  await run('chat: assistant/model output is sanitised', (payload) => { addMessage('assistant', 'Here is **advice**.\n\n' + payload); }, all('chatai'));
  await run('chat: restored history (both roles)', (payload) => {
    [{ role: 'user', content: payload }, { role: 'assistant', content: payload }].forEach((m) => addMessage(m.role, m.content));
  }, all('history'));
  await run('chat: trusted app HTML still keeps its buttons', () => {
    addMessage('assistant', '<button id="trustedBtn" onclick="window.__trusted=1">Open tool</button>' + sanitizeHTML('<img src=x onerror="window.__xss=1">text'), { trusted: true });
    if (!document.getElementById('trustedBtn')) throw new Error('trusted button was stripped');
    document.getElementById('trustedBtn').remove();
  });

  await run('review viewer: every user-supplied field', (p) => {
    showReviewViewerModal({
      docName: p, refNumber: 'REV-1' + p, status: p, employeeName: p, employeeRole: p, venueName: p, userName: p,
      userEmail: p, signInEmail: 'x' + p, phoneNumber: p, issueDescription: p, previousWarnings: p, employeeResponse: p,
      documentContent: '# Heading\n\n' + p,
    });
    // The download button carries refNumber and docName as handler arguments.
    document.querySelectorAll('#reviewViewerModal button[onclick^="downloadReviewDocument"]').forEach((b) => {
      window.downloadReviewDocument = () => {}; b.click();
    });
  }, all('review'));

  await run('admin: all-conversations list', async (p) => {
    __mount('conversationsList');
    const docs = (items) => ({ size: items.length, docs: items, forEach: (f) => items.forEach(f) });
    const conv = { data: () => ({ title: p, timestamp: Date.now(), messages: [{ role: 'user', content: p }, { role: 'assistant', content: p }] }) };
    const user = { id: 'uid12345678', data: () => ({ displayName: p, email: p }) };
    db = { collection: () => ({
      get: async () => docs([user]),
      doc: () => ({ collection: () => ({ limit: () => ({ get: async () => docs([conv]) }), get: async () => docs([conv]) }) }),
    }) };
    await loadConversationsAdmin();
    if (!/chats|User:/.test(document.getElementById('conversationsList').textContent)) throw new Error('admin list did not render');
  }, all('admin'));

  await run('deputy roster list', (p) => {
    ['rosterList', 'totalShifts', 'compliantShifts', 'issueShifts', 'totalCost'].forEach(__mount);
    updateRosterDashboard([{ employee: { name: p }, position: p, date: p, startTime: p, endTime: p,
      compliance: { isCompliant: false, totalCost: 10, warnings: [{ type: p, message: p }] } }]);
    if (!document.getElementById('rosterList').textContent.includes('Issue')) throw new Error('roster did not render');
  }, all('roster'));

  await run('AI tool panels', (p) => {
    ['aiInsightsBox', 'aiInsightsContent', 'trainingAIContent'].forEach(__mount);
    displayAIInsights('Line one\n' + p);
    displayTrainingInsights('Line one\n' + p);
    showAIThinking(p);
  }, all('tools'));

  await browser.close();
  server.close();

  let failed = 0;
  for (const r of results) {
    if (r.ok) { console.log(`  ok    ${r.name}`); continue; }
    failed++;
    console.log(`  FAIL  ${r.name}`);
    if (r.error) console.log(`        error: ${r.error}`);
    if (r.fired) console.log(`        payload executed: ${r.fired}`);
    if (r.liveImg || r.liveSvg || r.handlers) console.log(`        live injected elements: img=${r.liveImg} svg=${r.liveSvg} handlers=${r.handlers}`);
  }
  console.log(`\n${results.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((err) => { console.error(err); server.close(); process.exit(2); });
